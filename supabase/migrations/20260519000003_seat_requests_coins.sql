-- Seat Requests table
CREATE TABLE IF NOT EXISTS seat_requests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username   text NOT NULL,
  avatar     text,
  status     text NOT NULL DEFAULT 'pending',  -- pending | approved | denied
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

ALTER TABLE seat_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read seat_requests"
  ON seat_requests FOR SELECT USING (true);
CREATE POLICY "user can insert own request"
  ON seat_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mods and owner can update requests"
  ON seat_requests FOR UPDATE USING (true);
CREATE POLICY "user or mod can delete request"
  ON seat_requests FOR DELETE USING (true);

-- Coins on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 500;

-- Room announcements column
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS announcement text DEFAULT NULL;
