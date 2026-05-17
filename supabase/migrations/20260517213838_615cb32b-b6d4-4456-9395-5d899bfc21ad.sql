
-- enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- ROOMS
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_username text not null,
  name text not null,
  category text not null,
  description text default '',
  banner text,
  privacy text not null default 'public' check (privacy in ('public','private')),
  password_hash text,
  status text not null default 'active' check (status in ('active','closed')),
  listener_count int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.rooms enable row level security;

create policy "Rooms viewable by authenticated"
  on public.rooms for select to authenticated using (true);
create policy "Users can create rooms"
  on public.rooms for insert to authenticated with check (auth.uid() = owner_id);
create policy "Owners can update rooms"
  on public.rooms for update to authenticated using (auth.uid() = owner_id);
create policy "Owners can delete rooms"
  on public.rooms for delete to authenticated using (auth.uid() = owner_id);

create trigger rooms_updated_at before update on public.rooms
  for each row execute function public.set_updated_at();

-- SEATS (7 per room)
create table public.room_seats (
  room_id uuid not null references public.rooms(id) on delete cascade,
  seat_index int not null check (seat_index between 0 and 6),
  user_id uuid references auth.users(id) on delete set null,
  username text,
  avatar text,
  muted boolean not null default false,
  locked boolean not null default false,
  joined_at timestamptz,
  primary key (room_id, seat_index)
);
create unique index room_seats_unique_user on public.room_seats(room_id, user_id) where user_id is not null;
alter table public.room_seats enable row level security;

create policy "Seats viewable by authenticated"
  on public.room_seats for select to authenticated using (true);

-- MEMBERS
create table public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  avatar text,
  role text not null default 'member' check (role in ('owner','co_owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
alter table public.room_members enable row level security;

create policy "Members viewable by authenticated"
  on public.room_members for select to authenticated using (true);
create policy "Users can join rooms"
  on public.room_members for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can leave rooms"
  on public.room_members for delete to authenticated using (
    auth.uid() = user_id
    or exists (
      select 1 from public.room_members m
      where m.room_id = room_members.room_id and m.user_id = auth.uid()
        and m.role in ('owner','co_owner','admin')
    )
  );
create policy "Mods can update roles"
  on public.room_members for update to authenticated using (
    exists (
      select 1 from public.room_members m
      where m.room_id = room_members.room_id and m.user_id = auth.uid()
        and m.role in ('owner','co_owner')
    )
  );

-- Helper: is user a mod of a room?
create or replace function public.is_room_mod(_room uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.room_members
    where room_id = _room and user_id = _user and role in ('owner','co_owner','admin')
  );
$$;

-- Seat policies (need helper)
create policy "Users can take their own seat"
  on public.room_seats for update to authenticated using (
    (user_id is null and not locked) -- claim empty
    or auth.uid() = user_id          -- update own
    or public.is_room_mod(room_id, auth.uid()) -- mods manage any
  ) with check (
    user_id is null
    or auth.uid() = user_id
    or public.is_room_mod(room_id, auth.uid())
  );

-- MESSAGES
create table public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  avatar text,
  text text,
  kind text not null default 'text' check (kind in ('text','gift')),
  gift_emoji text,
  created_at timestamptz not null default now()
);
create index room_messages_room_idx on public.room_messages(room_id, created_at);
alter table public.room_messages enable row level security;

create policy "Messages viewable by authenticated"
  on public.room_messages for select to authenticated using (true);
create policy "Members can post messages"
  on public.room_messages for insert to authenticated with check (
    auth.uid() = user_id
    and exists (select 1 from public.room_members m where m.room_id = room_messages.room_id and m.user_id = auth.uid())
  );

-- Trigger: when a room is inserted, create 7 seats, seat owner at 0, add owner as member
create or replace function public.handle_new_room()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  o_username text;
  o_avatar text;
begin
  select username, profile_image into o_username, o_avatar from public.profiles where id = new.owner_id;
  -- seats
  insert into public.room_seats(room_id, seat_index) 
    select new.id, gs from generate_series(0,6) gs;
  update public.room_seats
    set user_id = new.owner_id, username = o_username, avatar = o_avatar, joined_at = now()
    where room_id = new.id and seat_index = 0;
  -- member
  insert into public.room_members(room_id, user_id, username, avatar, role)
    values (new.id, new.owner_id, o_username, o_avatar, 'owner');
  return new;
end $$;
create trigger on_room_created after insert on public.rooms
  for each row execute function public.handle_new_room();

-- Trigger: keep listener_count in sync with room_members
create or replace function public.sync_listener_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  rid := coalesce(new.room_id, old.room_id);
  update public.rooms set listener_count = (
    select count(*) from public.room_members where room_id = rid
  ) where id = rid;
  return null;
end $$;
create trigger room_members_count_ai after insert on public.room_members
  for each row execute function public.sync_listener_count();
create trigger room_members_count_ad after delete on public.room_members
  for each row execute function public.sync_listener_count();

-- Realtime
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_seats;
alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.room_messages;
alter table public.room_seats replica identity full;
alter table public.room_members replica identity full;
