-- Root cause of "new row violates row-level security policy for table
-- groups": our createGroup() code does insert(...).select().single(), which
-- RETURNING-filters the new row through the SELECT policy. The old SELECT
-- policy only allowed rows in my_group_ids(), but the creator's
-- group_members row doesn't exist yet at the moment the group is inserted.
-- The brand-new row failed visibility, and Postgres reported it as an
-- RLS violation. Let the creator see their own group directly, regardless
-- of membership timing.

alter policy "any signed-in user can create a group"
  on public.groups
  with check (created_by = auth.uid());

drop policy "groups are readable by members" on public.groups;

create policy "groups are readable by members"
  on public.groups for select
  using (id in (select public.my_group_ids()) or created_by = auth.uid());
