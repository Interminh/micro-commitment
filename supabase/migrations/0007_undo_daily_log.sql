-- Lets the owner undo today's log (done or missed) within the same day it
-- was submitted, keeping current_streak correct when they do. Scoped to
-- today only — undoing an older day would need to re-derive more history
-- than this simple trigger tracks.

create policy "owner can undo today's log"
  on public.daily_logs for delete
  using (
    date = current_date
    and goal_id in (select id from public.goals where user_id = auth.uid())
  );

grant delete on public.daily_logs to authenticated;

create function public.handle_daily_log_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  restored_streak int;
begin
  if old.status = 'done' then
    -- The insert did current_streak + 1; undo just reverses that.
    update public.goals
      set current_streak = greatest(current_streak - 1, 0)
      where id = old.goal_id;
    return old;
  end if;

  -- old.status = 'missed': the insert reset current_streak to 0. Restore
  -- whatever run of consecutive 'done' days existed right before it.
  with ordered as (
    select status, row_number() over (order by date desc) as rn
    from public.daily_logs
    where goal_id = old.goal_id and date < old.date
  ),
  break_point as (
    select min(rn) as rn from ordered where status <> 'done'
  )
  select count(*) into restored_streak
  from ordered, break_point
  where ordered.rn < coalesce(break_point.rn, 2147483647);

  update public.goals
    set current_streak = coalesce(restored_streak, 0)
    where id = old.goal_id;

  return old;
end;
$$;

create trigger on_daily_log_delete
after delete on public.daily_logs
for each row execute function public.handle_daily_log_delete();
