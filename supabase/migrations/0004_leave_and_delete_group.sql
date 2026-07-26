-- The DELETE grants from 0002 exist, but there's no policy allowing one
-- yet, so RLS blocks every delete. Add leaving a group (any member removes
-- their own row) and deleting a group (organizer only, cascades to
-- everything in it).

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
