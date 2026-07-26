-- Tables created via the SQL editor didn't pick up Supabase's usual default
-- grants to anon/authenticated, so inserts were failing with "permission
-- denied." RLS still decides which rows are visible or writable; these
-- grants just let the roles touch the tables at all.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.groups,
  public.group_members,
  public.commitments,
  public.check_ins,
  public.streaks
to authenticated;

-- anon reads groups indirectly through get_group_by_invite_code(), which
-- runs as the function owner regardless of table grants, so it doesn't need
-- a direct grant of its own.

grant execute on function public.get_group_by_invite_code(text) to anon, authenticated;
