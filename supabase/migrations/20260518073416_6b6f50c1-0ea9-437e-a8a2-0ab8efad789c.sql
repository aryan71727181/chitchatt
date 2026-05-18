CREATE OR REPLACE FUNCTION public.handle_new_room()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  o_username text;
  o_avatar text;
begin
  select username, profile_image into o_username, o_avatar from public.profiles where id = new.owner_id;

  insert into public.room_seats(room_id, seat_index)
    select new.id, gs from generate_series(0,6) gs;

  insert into public.room_members(room_id, user_id, username, avatar, role)
    values (new.id, new.owner_id, coalesce(o_username, new.owner_username), o_avatar, 'owner');

  return new;
end
$$;

GRANT EXECUTE ON FUNCTION public.is_room_mod(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can take their own seat" ON public.room_seats;

CREATE POLICY "Users can take their own seat"
ON public.room_seats
FOR UPDATE
TO authenticated
USING (
  ((room_seats.user_id IS NULL) AND (NOT room_seats.locked))
  OR (auth.uid() = room_seats.user_id)
  OR EXISTS (
    SELECT 1
    FROM public.room_members m
    WHERE m.room_id = room_seats.room_id
      AND m.user_id = auth.uid()
      AND m.role = ANY (ARRAY['owner'::text, 'co_owner'::text, 'admin'::text])
  )
)
WITH CHECK (
  (room_seats.user_id IS NULL)
  OR (auth.uid() = room_seats.user_id)
  OR EXISTS (
    SELECT 1
    FROM public.room_members m
    WHERE m.room_id = room_seats.room_id
      AND m.user_id = auth.uid()
      AND m.role = ANY (ARRAY['owner'::text, 'co_owner'::text, 'admin'::text])
  )
);

UPDATE public.room_seats rs
SET user_id = NULL,
    username = NULL,
    avatar = NULL,
    joined_at = NULL,
    muted = false
FROM public.rooms r
WHERE rs.room_id = r.id
  AND rs.seat_index = 0
  AND rs.user_id = r.owner_id;