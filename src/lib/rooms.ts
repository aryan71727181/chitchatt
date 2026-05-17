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
  { id: "late", label: "Midnight", url: bLate },
  { id: "anime", label: "Anime", url: bAnime },
  { id: "heart", label: "Heart", url: bHeart },
  { id: "game", label: "Gaming", url: bGame },
  { id: "chill", label: "Chill", url: bChill },
  { id: "funny", label: "Funny", url: bFunny },
];

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
  role: "owner" | "co_owner" | "admin" | "member";
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

// stable numeric uid for Agora from auth user id
export function uidFromUserId(uid: string): number {
  let h = 5381;
  for (let i = 0; i < uid.length; i++) h = ((h << 5) + h + uid.charCodeAt(i)) >>> 0;
  return (h & 0x7fffffff) || 1;
}
