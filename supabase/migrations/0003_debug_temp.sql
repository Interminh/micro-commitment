-- TEMPORARY diagnostic function — remove once the RLS issue is resolved.
create or replace function public.debug_auth_uid()
returns uuid
language sql
security invoker
stable
as $$
  select auth.uid();
$$;

grant execute on function public.debug_auth_uid() to authenticated;
