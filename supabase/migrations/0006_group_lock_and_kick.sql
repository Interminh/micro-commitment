-- Host controls: lock/unlock joining, and kick a member out.

alter table public.groups add column joining_locked boolean not null default false;

-- get_group_by_invite_code now also returns lock state so the join flow can
-- tell a not-yet-member "this group isn't accepting new members" instead of
-- letting the insert silently fail against RLS. The return type is changing
-- (new out column), so a plain CREATE OR REPLACE won't do here — Postgres
-- requires the old signature to be dropped first.
drop function public.get_group_by_invite_code(text);

create function public.get_group_by_invite_code(code text)
returns table (id uuid, name text, joining_locked boolean)
language sql
security definer
set search_path = public
stable
as $$
  select id, name, joining_locked from public.groups where invite_code = code;
$$;

-- Dropping the function above also dropped its grants (0002_grants.sql),
-- so anon/authenticated need it back.
grant execute on function public.get_group_by_invite_code(text) to anon, authenticated;

-- Security definer for the same reason as my_group_ids(): lets the delete
-- policy below check organizer status without recursing into group_members'
-- own RLS.
create function public.my_organizer_group_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select group_id from public.group_members where user_id = auth.uid() and role = 'organizer';
$$;

-- Organizer can remove any member's row. Members can already remove their
-- own via "members can leave a group" — policies for the same command are
-- OR'd together, so this just adds another way in.
create policy "organizer can remove members"
  on public.group_members for delete
  using (group_id in (select public.my_organizer_group_ids()));
