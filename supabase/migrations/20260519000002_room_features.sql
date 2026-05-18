-- Extended room settings columns
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS welcome_message TEXT,
  ADD COLUMN IF NOT EXISTS allow_chat BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_gifts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_music BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS join_mode TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS seat_mode TEXT NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS mic_mode TEXT NOT NULL DEFAULT 'open';

ALTER TABLE public.rooms
  DROP CONSTRAINT IF EXISTS rooms_join_mode_check,
  DROP CONSTRAINT IF EXISTS rooms_seat_mode_check,
  DROP CONSTRAINT IF EXISTS rooms_mic_mode_check;

ALTER TABLE public.rooms
  ADD CONSTRAINT rooms_join_mode_check CHECK (join_mode IN ('public','followers','owner_following','private')),
  ADD CONSTRAINT rooms_seat_mode_check CHECK (seat_mode IN ('everyone','followers','admin_approval')),
  ADD CONSTRAINT rooms_mic_mode_check  CHECK (mic_mode  IN ('open','host_approval','locked'));

-- Expand room_members role to include host and vip
ALTER TABLE public.room_members
  DROP CONSTRAINT IF EXISTS room_members_role_check;

ALTER TABLE public.room_members
  ADD CONSTRAINT room_members_role_check
  CHECK (role IN ('owner','co_owner','admin','host','vip','member'));

-- Room bans table
CREATE TABLE IF NOT EXISTS public.room_bans (
  room_id    UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  banned_by  UUID NOT NULL REFERENCES auth.users(id),
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

ALTER TABLE public.room_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bans viewable by mods"
  ON public.room_bans FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_members m
      WHERE m.room_id = room_bans.room_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','co_owner','admin')
    )
  );

CREATE POLICY "Mods can ban users"
  ON public.room_bans FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = banned_by AND
    EXISTS (
      SELECT 1 FROM public.room_members m
      WHERE m.room_id = room_bans.room_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','co_owner','admin')
    )
  );

CREATE POLICY "Owners and co-owners can unban"
  ON public.room_bans FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_members m
      WHERE m.room_id = room_bans.room_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','co_owner')
    )
  );
