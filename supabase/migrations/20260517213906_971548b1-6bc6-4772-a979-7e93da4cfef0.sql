
revoke execute on function public.handle_new_user() from public, authenticated, anon;
revoke execute on function public.handle_new_room() from public, authenticated, anon;
revoke execute on function public.sync_listener_count() from public, authenticated, anon;
revoke execute on function public.set_updated_at() from public, authenticated, anon;
revoke execute on function public.is_room_mod(uuid, uuid) from public, authenticated, anon;
