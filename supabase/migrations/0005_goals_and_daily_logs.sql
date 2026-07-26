-- Reworks the single-commitment-per-group model into multiple goals per
-- person per group, each with its own day-of-week schedule and streak, plus
-- a calendar heatmap. Only test data exists so far, so this drops and
-- rebuilds instead of migrating old rows.

drop table if exists public.streaks cascade;
drop table if exists public.check_ins cascade;
drop table if exists public.commitments cascade;
drop function if exists public.handle_check_in();

-- Timezone lets the missed-day cron know what "today" and "yesterday" mean
-- for this group.
alter table public.groups add column timezone text not null default 'UTC';

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  name text not null,
  active_days int[] not null,
  archived boolean not null default false,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  created_at timestamptz not null default now(),
  constraint active_days_valid check (
    active_days <@ array[0, 1, 2, 3, 4, 5, 6]
    and array_length(active_days, 1) > 0
  )
);

alter table public.goals enable row level security;

-- No stored "pending" state. A row only gets written once a day is
-- resolved, either by the owner checking in or by the cron job below
-- marking a scheduled day nobody touched as missed. The UI figures out
-- "pending" on the fly when today has no row yet.
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  date date not null,
  status text not null check (status in ('done', 'missed')),
  completed_at timestamptz,
  unique (goal_id, date)
);

alter table public.daily_logs enable row level security;

-- Same idea as the old handle_check_in trigger: since daily_logs rows only
-- ever exist for scheduled days, a plain increment-on-done, reset-on-missed
-- already tracks consecutive scheduled days completed correctly.
create function public.handle_daily_log_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'done' then
    update public.goals
      set current_streak = current_streak + 1,
          longest_streak = greatest(longest_streak, current_streak + 1)
      where id = new.goal_id;
  elsif new.status = 'missed' then
    update public.goals
      set current_streak = 0
      where id = new.goal_id;
  end if;
  return new;
end;
$$;

create trigger on_daily_log_insert
after insert on public.daily_logs
for each row execute function public.handle_daily_log_insert();

-- RLS policies

create policy "goals are readable by group-mates"
  on public.goals for select
  using (group_id in (select public.my_group_ids()));

create policy "users can create their own goals"
  on public.goals for insert
  with check (user_id = auth.uid() and group_id in (select public.my_group_ids()));

create policy "users can update their own goals"
  on public.goals for update
  using (user_id = auth.uid());

create policy "daily logs are readable by group-mates"
  on public.daily_logs for select
  using (
    goal_id in (
      select id from public.goals where group_id in (select public.my_group_ids())
    )
  );

create policy "owner can submit today's log"
  on public.daily_logs for insert
  with check (
    date = current_date
    and goal_id in (select id from public.goals where user_id = auth.uid())
  );

-- Grants (same pattern as 0002_grants.sql for the two new tables)
grant select, insert, update on public.goals to authenticated;
grant select, insert on public.daily_logs to authenticated;
