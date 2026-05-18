-- Follows table for user follow relationships
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "Follows viewable by authenticated"
  on public.follows for select to authenticated using (true);

create policy "Users can manage own follows"
  on public.follows for insert to authenticated
  with check (auth.uid() = follower_id);

create policy "Users can delete own follows"
  on public.follows for delete to authenticated
  using (auth.uid() = follower_id);

-- Security definer function to toggle follow and update counts atomically
create or replace function public.toggle_follow(target_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  already_following boolean;
  result_action text;
begin
  if target_id = auth.uid() then
    return jsonb_build_object('error', 'Cannot follow yourself');
  end if;

  select exists(
    select 1 from public.follows
    where follower_id = auth.uid() and following_id = target_id
  ) into already_following;

  if already_following then
    delete from public.follows
      where follower_id = auth.uid() and following_id = target_id;
    update public.profiles set following = greatest(0, following - 1) where id = auth.uid();
    update public.profiles set followers = greatest(0, followers - 1) where id = target_id;
    result_action := 'unfollowed';
  else
    insert into public.follows (follower_id, following_id) values (auth.uid(), target_id);
    update public.profiles set following = following + 1 where id = auth.uid();
    update public.profiles set followers = followers + 1 where id = target_id;
    result_action := 'followed';
  end if;

  return jsonb_build_object('action', result_action);
end;
$$;

-- Check if current user follows a specific user
create or replace function public.is_following(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.follows
    where follower_id = auth.uid() and following_id = target_id
  );
$$;

revoke execute on function public.toggle_follow(uuid) from public, anon;
grant execute on function public.toggle_follow(uuid) to authenticated;

revoke execute on function public.is_following(uuid) from public, anon;
grant execute on function public.is_following(uuid) to authenticated;

-- Direct messages table for DM system
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  sender_username text not null,
  sender_avatar text,
  text text,
  kind text not null default 'text' check (kind in ('text', 'gift', 'image')),
  gift_emoji text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.direct_messages enable row level security;

create policy "Users can view their messages"
  on public.direct_messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on public.direct_messages for insert to authenticated
  with check (auth.uid() = sender_id);

create policy "Users can mark messages as read"
  on public.direct_messages for update to authenticated
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- Index for conversation lookups
create index if not exists dm_conversation_idx
  on public.direct_messages (
    least(sender_id::text, receiver_id::text),
    greatest(sender_id::text, receiver_id::text),
    created_at desc
  );
