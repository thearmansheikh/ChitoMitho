-- is_admin() is only needed by signed-in users (RLS policies for admins).
-- Stop anonymous callers using it through the public API.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
