-- createGroup() does insert(...).select().single(), and the RETURNING
-- clause gets filtered through the SELECT policy same as any read. The old
-- policy only allowed rows in my_group_ids(), but the creator's
-- group_members row doesn't exist yet at that point, so Postgres reported
-- the whole insert as an RLS violation. Let the creator see their own group
-- right away, regardless of when the membership row lands.

alter policy "any signed-in user can create a group"
  on public.groups
  with check (created_by = auth.uid());

drop policy "groups are readable by members" on public.groups;

create policy "groups are readable by members"
  on public.groups for select
  using (id in (select public.my_group_ids()) or created_by = auth.uid());
