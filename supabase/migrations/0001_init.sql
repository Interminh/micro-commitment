-- Micro-Commitment V1 schema
-- Entities per spec section 4: profiles, groups, group_members, commitments, check_ins, streaks

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles (mirrors auth.users, populated via trigger on signup)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

-- ---------------------------------------------------------------------------
-- group_members
-- ---------------------------------------------------------------------------
create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('organizer', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

alter table public.group_members enable row level security;

-- Helper: group ids the current user belongs to. security definer so it can
-- be used inside RLS policies without recursive-policy issues.
create function public.my_group_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select group_id from public.group_members where user_id = auth.uid();
$$;

-- Secure invite-code lookup: lets a signed-in, not-yet-a-member user resolve
-- an invite code to a group without granting broad read access to the
-- groups table (which would let members enumerate other groups' codes).
create function public.get_group_by_invite_code(code text)
returns table (id uuid, name text)
language sql
security definer
set search_path = public
stable
as $$
  select id, name from public.groups where invite_code = code;
$$;

-- ---------------------------------------------------------------------------
-- commitments
-- ---------------------------------------------------------------------------
create table public.commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  label text not null,
  schedule text not null default 'daily' check (schedule in ('daily', 'weekdays')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- One active commitment per user per group (spec 2.1: "one active
-- commitment per user to start").
create unique index commitments_one_active_per_user_group
  on public.commitments (user_id, group_id)
  where active;

alter table public.commitments enable row level security;

-- ---------------------------------------------------------------------------
-- check_ins
-- ---------------------------------------------------------------------------
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  commitment_id uuid not null references public.commitments (id) on delete cascade,
  date date not null,
  status text not null check (status in ('done', 'missed', 'pending')),
  submitted_at timestamptz,
  unique (commitment_id, date)
);

alter table public.check_ins enable row level security;

-- ---------------------------------------------------------------------------
-- streaks (derived aggregate, written only by the trigger below)
-- ---------------------------------------------------------------------------
create table public.streaks (
  id uuid primary key default gen_random_uuid(),
  commitment_id uuid not null unique references public.commitments (id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_updated timestamptz not null default now()
);

alter table public.streaks enable row level security;

-- Recompute streak whenever a check-in is written server-side, so streaks
-- can't be gamed by client-side manipulation (spec 5.3).
create function public.handle_check_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'done' then
    insert into public.streaks (commitment_id, current_streak, longest_streak, last_updated)
    values (new.commitment_id, 1, 1, now())
    on conflict (commitment_id) do update
      set current_streak = public.streaks.current_streak + 1,
          longest_streak = greatest(public.streaks.longest_streak, public.streaks.current_streak + 1),
          last_updated = now();
  elsif new.status = 'missed' then
    insert into public.streaks (commitment_id, current_streak, longest_streak, last_updated)
    values (new.commitment_id, 0, 0, now())
    on conflict (commitment_id) do update
      set current_streak = 0,
          last_updated = now();
  end if;
  return new;
end;
$$;

create trigger on_check_in_insert
after insert on public.check_ins
for each row execute function public.handle_check_in();

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

-- profiles: readable by group-mates, writable by self only
create policy "profiles are readable by group-mates"
  on public.profiles for select
  using (
    id = auth.uid()
    or id in (
      select gm.user_id from public.group_members gm
      where gm.group_id in (select public.my_group_ids())
    )
  );

create policy "users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- groups: readable by members; insertable by any signed-in user (creator);
-- updatable by the organizer only
create policy "groups are readable by members"
  on public.groups for select
  using (id in (select public.my_group_ids()));

create policy "any signed-in user can create a group"
  on public.groups for insert
  with check (created_by = auth.uid());

create policy "organizer can update their group"
  on public.groups for update
  using (
    id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'organizer'
    )
  );

-- group_members: readable by fellow members; a user can insert their own
-- membership row (join flow) but not act on behalf of others
create policy "group members are readable by group-mates"
  on public.group_members for select
  using (group_id in (select public.my_group_ids()));

create policy "users can add themselves to a group"
  on public.group_members for insert
  with check (user_id = auth.uid());

-- commitments: readable by group-mates; writable by the owner only
create policy "commitments are readable by group-mates"
  on public.commitments for select
  using (group_id in (select public.my_group_ids()));

create policy "users can create their own commitments"
  on public.commitments for insert
  with check (user_id = auth.uid() and group_id in (select public.my_group_ids()));

create policy "users can update their own commitments"
  on public.commitments for update
  using (user_id = auth.uid());

-- check_ins: readable by group-mates (miss visibility is the core
-- mechanic); insertable only by the commitment owner, only for today
create policy "check-ins are readable by group-mates"
  on public.check_ins for select
  using (
    commitment_id in (
      select id from public.commitments where group_id in (select public.my_group_ids())
    )
  );

create policy "owner can submit today's check-in"
  on public.check_ins for insert
  with check (
    status in ('done', 'missed')
    and date = current_date
    and commitment_id in (select id from public.commitments where user_id = auth.uid())
  );

-- streaks: readable by group-mates; no client-side insert/update policy —
-- only the security-definer trigger (owned by the table owner) writes here.
create policy "streaks are readable by group-mates"
  on public.streaks for select
  using (
    commitment_id in (
      select id from public.commitments where group_id in (select public.my_group_ids())
    )
  );
