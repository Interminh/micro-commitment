-- Supabase normally grants base table privileges to `anon`/`authenticated`
-- automatically, but that didn't take effect for tables created via the SQL
-- editor here ("permission denied for table groups" on insert). RLS
-- policies from 0001_init.sql still govern which *rows* are visible/
-- writable — these grants just allow the roles to touch the tables at all.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.groups,
  public.group_members,
  public.commitments,
  public.check_ins,
  public.streaks
to authenticated;

-- anon needs to read groups indirectly via the security-definer
-- get_group_by_invite_code() function (for the pre-sign-in invite preview),
-- which runs as the function owner regardless of table grants, so no
-- direct table grant to anon is needed here.

grant execute on function public.get_group_by_invite_code(text) to anon, authenticated;
