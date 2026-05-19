-- ══════════════════════════════════════════════════════════════════
-- ChitChat — Complete Schema Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ── STEP 1: Delete all test rooms ─────────────────────────────────
DELETE FROM public.rooms;

-- ── STEP 2: Follows table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='follows' AND policyname='Follows viewable by authenticated') THEN
    CREATE POLICY "Follows viewable by authenticated" ON public.follows FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='follows' AND policyname='Users can manage own follows') THEN
    CREATE POLICY "Users can manage own follows" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='follows' AND policyname='Users can delete own follows') THEN
    CREATE POLICY "Users can delete own follows" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.toggle_follow(target_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE already_following boolean; result_action text;
BEGIN
  IF target_id = auth.uid() THEN RETURN jsonb_build_object('error','Cannot follow yourself'); END IF;
  SELECT EXISTS(SELECT 1 FROM public.follows WHERE follower_id=auth.uid() AND following_id=target_id) INTO already_following;
  IF already_following THEN
    DELETE FROM public.follows WHERE follower_id=auth.uid() AND following_id=target_id;
    UPDATE public.profiles SET following=GREATEST(0,following-1) WHERE id=auth.uid();
    UPDATE public.profiles SET followers=GREATEST(0,followers-1) WHERE id=target_id;
    result_action:='unfollowed';
  ELSE
    INSERT INTO public.follows(follower_id,following_id) VALUES(auth.uid(),target_id);
    UPDATE public.profiles SET following=following+1 WHERE id=auth.uid();
    UPDATE public.profiles SET followers=followers+1 WHERE id=target_id;
    result_action:='followed';
  END IF;
  RETURN jsonb_build_object('action',result_action);
END; $$;

CREATE OR REPLACE FUNCTION public.is_following(target_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.follows WHERE follower_id=auth.uid() AND following_id=target_id);
$$;

REVOKE EXECUTE ON FUNCTION public.toggle_follow(uuid) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.toggle_follow(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_following(uuid)  FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.is_following(uuid)  TO authenticated;

-- ── STEP 3: Direct messages ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_username text NOT NULL,
  sender_avatar   text,
  text            text,
  kind            text NOT NULL DEFAULT 'text' CHECK (kind IN ('text','gift','image')),
  gift_emoji      text,
  read            boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='direct_messages' AND policyname='Users can view their messages') THEN
    CREATE POLICY "Users can view their messages" ON public.direct_messages FOR SELECT TO authenticated
      USING (auth.uid()=sender_id OR auth.uid()=receiver_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='direct_messages' AND policyname='Users can send messages') THEN
    CREATE POLICY "Users can send messages" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK (auth.uid()=sender_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='direct_messages' AND policyname='Users can mark messages as read') THEN
    CREATE POLICY "Users can mark messages as read" ON public.direct_messages FOR UPDATE TO authenticated
      USING (auth.uid()=receiver_id) WITH CHECK (auth.uid()=receiver_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS dm_conversation_idx ON public.direct_messages (
  LEAST(sender_id::text,receiver_id::text),
  GREATEST(sender_id::text,receiver_id::text),
  created_at DESC
);

-- ── STEP 4: Extended room columns ─────────────────────────────────
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS welcome_message text,
  ADD COLUMN IF NOT EXISTS allow_chat  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_gifts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_music boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS join_mode   text    NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS seat_mode   text    NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS mic_mode    text    NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS announcement text DEFAULT NULL;

ALTER TABLE public.rooms
  DROP CONSTRAINT IF EXISTS rooms_join_mode_check,
  DROP CONSTRAINT IF EXISTS rooms_seat_mode_check,
  DROP CONSTRAINT IF EXISTS rooms_mic_mode_check;
ALTER TABLE public.rooms
  ADD CONSTRAINT rooms_join_mode_check CHECK (join_mode IN ('public','followers','owner_following','private')),
  ADD CONSTRAINT rooms_seat_mode_check CHECK (seat_mode IN ('everyone','followers','admin_approval')),
  ADD CONSTRAINT rooms_mic_mode_check  CHECK (mic_mode  IN ('open','host_approval','locked'));

-- ── STEP 5: Room members role update ──────────────────────────────
ALTER TABLE public.room_members DROP CONSTRAINT IF EXISTS room_members_role_check;
ALTER TABLE public.room_members
  ADD CONSTRAINT room_members_role_check
  CHECK (role IN ('owner','co_owner','admin','host','vip','member'));

-- ── STEP 6: Room bans ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.room_bans (
  room_id    uuid NOT NULL REFERENCES public.rooms(id)   ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  banned_by  uuid NOT NULL REFERENCES auth.users(id),
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);
ALTER TABLE public.room_bans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='room_bans' AND policyname='Bans viewable by mods') THEN
    CREATE POLICY "Bans viewable by mods" ON public.room_bans FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id=room_bans.room_id AND m.user_id=auth.uid() AND m.role IN ('owner','co_owner','admin')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='room_bans' AND policyname='Mods can ban users') THEN
    CREATE POLICY "Mods can ban users" ON public.room_bans FOR INSERT TO authenticated
      WITH CHECK (auth.uid()=banned_by AND EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id=room_bans.room_id AND m.user_id=auth.uid() AND m.role IN ('owner','co_owner','admin')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='room_bans' AND policyname='Owners and co-owners can unban') THEN
    CREATE POLICY "Owners and co-owners can unban" ON public.room_bans FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id=room_bans.room_id AND m.user_id=auth.uid() AND m.role IN ('owner','co_owner')));
  END IF;
END $$;

-- ── STEP 7: Seat requests ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seat_requests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    uuid NOT NULL REFERENCES public.rooms(id)   ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  username   text NOT NULL,
  avatar     text,
  status     text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);
ALTER TABLE public.seat_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='seat_requests' AND policyname='anyone can read seat_requests') THEN
    CREATE POLICY "anyone can read seat_requests" ON public.seat_requests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='seat_requests' AND policyname='user can insert own request') THEN
    CREATE POLICY "user can insert own request" ON public.seat_requests FOR INSERT WITH CHECK (auth.uid()=user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='seat_requests' AND policyname='mods and owner can update requests') THEN
    CREATE POLICY "mods and owner can update requests" ON public.seat_requests FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='seat_requests' AND policyname='user or mod can delete request') THEN
    CREATE POLICY "user or mod can delete request" ON public.seat_requests FOR DELETE USING (true);
  END IF;
END $$;

-- ── STEP 8: Profile columns (level, likes, coins) ─────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS likes integer NOT NULL DEFAULT 0;

-- Reset all existing profiles to a clean starting state
UPDATE public.profiles
  SET coins     = 0,
      level     = 1,
      likes     = 0,
      followers = 0,
      following = 0,
      vibe_score = 0;

-- ── STEP 9: Update handle_new_user trigger ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uname TEXT; base TEXT; suffix INT := 0;
BEGIN
  base := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1));
  base := regexp_replace(base,'[^a-zA-Z0-9_.]','','g');
  IF base='' OR base IS NULL THEN base:='user'; END IF;
  uname := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username=uname) LOOP
    suffix := suffix+1;
    uname  := base || suffix::text;
  END LOOP;
  INSERT INTO public.profiles
    (id, email, username, age, gender, location, vibe_score, level, likes, coins, followers, following)
  VALUES (
    NEW.id, NEW.email, uname,
    NULLIF((NEW.raw_user_meta_data->>'age'),'')::INT,
    NEW.raw_user_meta_data->>'gender',
    NEW.raw_user_meta_data->>'location',
    0, 1, 0, 0, 0, 0
  );
  RETURN NEW;
END; $$;
