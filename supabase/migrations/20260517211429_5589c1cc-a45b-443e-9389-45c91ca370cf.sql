
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE NOT NULL,
  age INTEGER,
  gender TEXT,
  location TEXT,
  bio TEXT DEFAULT '',
  profile_image TEXT,
  cover_image TEXT,
  followers INTEGER NOT NULL DEFAULT 0,
  following INTEGER NOT NULL DEFAULT 0,
  vibe_score INTEGER NOT NULL DEFAULT 50,
  vip_status BOOLEAN NOT NULL DEFAULT false,
  noble_status BOOLEAN NOT NULL DEFAULT false,
  last_check_in TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uname TEXT;
  base TEXT;
  suffix INT := 0;
BEGIN
  base := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  base := regexp_replace(base, '[^a-zA-Z0-9_.]', '', 'g');
  IF base = '' OR base IS NULL THEN base := 'user'; END IF;
  uname := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = uname) LOOP
    suffix := suffix + 1;
    uname := base || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, email, username, age, gender, location, vibe_score)
  VALUES (
    NEW.id,
    NEW.email,
    uname,
    NULLIF((NEW.raw_user_meta_data->>'age'), '')::INT,
    NEW.raw_user_meta_data->>'gender',
    NEW.raw_user_meta_data->>'location',
    50 + floor(random() * 40)::int
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
