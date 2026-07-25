-- Table-level DELETE grants already exist from 0002_grants.sql, but no
-- policy permits any DELETE yet, so RLS blocks it outright. Add policies
-- for leaving a group (any member, their own row) and deleting a group
-- (organizer only; cascades to members, commitments, check-ins, streaks).

create policy "members can leave a group"
  on public.group_members for delete
  using (user_id = auth.uid());

create policy "organizer can delete their group"
  on public.groups for delete
  using (
    id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'organizer'
    )
  );
