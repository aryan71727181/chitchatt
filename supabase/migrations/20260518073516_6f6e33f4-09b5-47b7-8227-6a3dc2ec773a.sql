REVOKE ALL ON FUNCTION public.is_room_mod(uuid, uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.is_room_mod(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_room_mod(uuid, uuid) FROM public;