import { supabase } from "@/integrations/supabase/client";
import { defaultAvatar } from "@/lib/auth";

export type DMMessage = {
  id: string;
  sender_id: string;
  sender_username: string;
  sender_avatar: string | null;
  text: string | null;
  kind: string;
  created_at: string;
};

export type DMConversation = {
  userId: string;
  username: string;
  avatar: string | null;
  lastMessage: string | null;
  lastTime: string | null;
  unread: number;
};

/** Returns a stable DM room name for two users */
function dmRoomName(idA: string, idB: string): string {
  const [a, b] = [idA, idB].sort();
  return `__dm__${a}__${b}`;
}

/** Find existing DM room ID or create one, returns room ID */
export async function getOrCreateDmRoom(
  myId: string,
  myUsername: string,
  theirId: string,
  theirUsername: string
): Promise<string | null> {
  const name = dmRoomName(myId, theirId);

  // Try to find existing
  const { data: existing } = await supabase
    .from("rooms")
    .select("id")
    .eq("name", name)
    .eq("category", "DM")
    .maybeSingle();

  if (existing?.id) return existing.id;

  // Create new DM room
  const { data: newRoom, error } = await supabase
    .from("rooms")
    .insert({
      owner_id: myId,
      owner_username: myUsername,
      name,
      category: "DM",
      privacy: "private",
      description: `Direct message`,
      status: "active",
      listener_count: 2,
    })
    .select("id")
    .single();

  if (error || !newRoom) {
    console.error("Failed to create DM room:", error);
    return null;
  }

  // Add both users as members
  await supabase.from("room_members").insert([
    {
      room_id: newRoom.id,
      user_id: myId,
      username: myUsername,
      avatar: defaultAvatar(myUsername),
      role: "owner",
    },
    {
      room_id: newRoom.id,
      user_id: theirId,
      username: theirUsername,
      avatar: defaultAvatar(theirUsername),
      role: "member",
    },
  ]);

  return newRoom.id;
}

/** Load messages for a DM room */
export async function loadDmMessages(roomId: string): Promise<DMMessage[]> {
  const { data } = await supabase
    .from("room_messages")
    .select("id, user_id, username, avatar, text, kind, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(200);

  return (data ?? []).map((m) => ({
    id: m.id,
    sender_id: m.user_id,
    sender_username: m.username,
    sender_avatar: m.avatar,
    text: m.text,
    kind: m.kind,
    created_at: m.created_at,
  }));
}

/** Send a DM message */
export async function sendDmMessage(
  roomId: string,
  senderId: string,
  senderUsername: string,
  senderAvatar: string | null,
  text: string
): Promise<boolean> {
  const { error } = await supabase.from("room_messages").insert({
    room_id: roomId,
    user_id: senderId,
    username: senderUsername,
    avatar: senderAvatar,
    text: text.trim(),
    kind: "text",
  });
  return !error;
}

/** List DM conversations the current user is in */
export async function listDmConversations(myId: string): Promise<
  Array<{
    roomId: string;
    userId: string;
    username: string;
    avatar: string | null;
    lastMessage: string | null;
    lastTime: string | null;
  }>
> {
  // Get all DM room memberships for current user
  const { data: myMemberships } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("user_id", myId);

  if (!myMemberships?.length) return [];

  const roomIds = myMemberships.map((m) => m.room_id);

  // Get DM rooms from that list
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name")
    .in("id", roomIds)
    .eq("category", "DM");

  if (!rooms?.length) return [];

  const results: Array<{
    roomId: string;
    userId: string;
    username: string;
    avatar: string | null;
    lastMessage: string | null;
    lastTime: string | null;
  }> = [];

  for (const room of rooms) {
    // Get the other member
    const { data: members } = await supabase
      .from("room_members")
      .select("user_id, username, avatar")
      .eq("room_id", room.id)
      .neq("user_id", myId)
      .limit(1);

    const other = members?.[0];
    if (!other) continue;

    // Get last message
    const { data: lastMsg } = await supabase
      .from("room_messages")
      .select("text, created_at")
      .eq("room_id", room.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    results.push({
      roomId: room.id,
      userId: other.user_id,
      username: other.username,
      avatar: other.avatar,
      lastMessage: lastMsg?.text ?? null,
      lastTime: lastMsg?.created_at ?? null,
    });
  }

  return results.sort((a, b) => {
    if (!a.lastTime && !b.lastTime) return 0;
    if (!a.lastTime) return 1;
    if (!b.lastTime) return -1;
    return new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime();
  });
}
