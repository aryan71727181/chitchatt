import bLate from "@/assets/room-latenight.jpg";
import bAnime from "@/assets/room-anime.jpg";
import bHeart from "@/assets/room-heart.jpg";
import bGame from "@/assets/room-gaming.jpg";
import bChill from "@/assets/room-chill.jpg";
import bFunny from "@/assets/room-funny.jpg";

export const CATEGORIES = [
  "Late Night Talks",
  "Relationship",
  "Gaming",
  "Anime",
  "Funny",
  "Music",
  "Chill",
  "Heartbreak",
  "General",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const BANNER_PRESETS: { id: string; label: string; url: string }[] = [
  { id: "late",  label: "Midnight",  url: bLate  },
  { id: "anime", label: "Anime",     url: bAnime },
  { id: "heart", label: "Heart",     url: bHeart },
  { id: "game",  label: "Gaming",    url: bGame  },
  { id: "chill", label: "Chill",     url: bChill },
  { id: "funny", label: "Funny",     url: bFunny },
];

const BANNER_ID_MAP: Record<string, string> = Object.fromEntries(
  BANNER_PRESETS.map((b) => [b.id, b.url])
);

/** Resolve a stored banner value (preset ID or raw URL) to a displayable URL */
export function resolveBanner(banner: string | null | undefined): string {
  if (!banner) return BANNER_PRESETS[0].url;
  if (BANNER_ID_MAP[banner]) return BANNER_ID_MAP[banner];
  return banner;
}

export type DBRoom = {
  id: string;
  owner_id: string;
  owner_username: string;
  name: string;
  category: string;
  description: string | null;
  banner: string | null;
  privacy: "public" | "private";
  password_hash: string | null;
  status: "active" | "closed";
  listener_count: number;
  created_at: string;
  // Extended fields (migration 20260519000002)
  welcome_message?: string | null;
  allow_chat?: boolean;
  allow_gifts?: boolean;
  allow_music?: boolean;
  join_mode?: "public" | "followers" | "owner_following" | "private";
  seat_mode?: "everyone" | "followers" | "admin_approval";
  mic_mode?: "open" | "host_approval" | "locked";
};

export type DBSeat = {
  room_id: string;
  seat_index: number;
  user_id: string | null;
  username: string | null;
  avatar: string | null;
  muted: boolean;
  locked: boolean;
  joined_at: string | null;
};

export type DBMember = {
  room_id: string;
  user_id: string;
  username: string;
  avatar: string | null;
  role: "owner" | "co_owner" | "admin" | "host" | "vip" | "member";
  joined_at: string;
};

export type DBMessage = {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  avatar: string | null;
  text: string | null;
  kind: "text" | "gift";
  gift_emoji: string | null;
  created_at: string;
};

export type DBBan = {
  room_id: string;
  user_id: string;
  banned_by: string;
  reason: string | null;
  created_at: string;
};

export const ROLE_META: Record<string, { icon: string; label: string; color: string; bg: string; order: number }> = {
  owner:    { icon: "👑", label: "Host",      color: "text-yellow-400",  bg: "bg-yellow-400/15",  order: 0 },
  co_owner: { icon: "⭐", label: "Co-owner",  color: "text-purple-300",  bg: "bg-purple-300/15",  order: 1 },
  admin:    { icon: "🛡️", label: "Admin",     color: "text-blue-300",    bg: "bg-blue-300/15",    order: 2 },
  host:     { icon: "🎤", label: "Host",      color: "text-pink-300",    bg: "bg-pink-300/15",    order: 3 },
  vip:      { icon: "💎", label: "VIP",       color: "text-cyan-300",    bg: "bg-cyan-300/15",    order: 4 },
  member:   { icon: "👤", label: "Listener",  color: "text-white/60",    bg: "bg-white/10",       order: 5 },
};

// stable numeric uid for Agora from auth user id
export function uidFromUserId(uid: string): number {
  let h = 5381;
  for (let i = 0; i < uid.length; i++) h = ((h << 5) + h + uid.charCodeAt(i)) >>> 0;
  return (h & 0x7fffffff) || 1;
}

// unique permanent SID for a user (deterministic, no DB needed)
export function sidFromUserId(uid: string): string {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  return "CHT" + String(h % 1000000).padStart(6, "0");
}

/** Get a stable DM conversation ID for two users (order-independent) */
export function dmConversationId(userIdA: string, userIdB: string): string {
  const [a, b] = [userIdA, userIdB].sort();
  let h = 5381;
  const key = `${a}__${b}`;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h + key.charCodeAt(i)) >>> 0;
  return "dm_" + h.toString(16).padStart(8, "0");
}
