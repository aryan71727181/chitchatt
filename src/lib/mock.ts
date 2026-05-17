import a1 from "@/assets/avatar-1.jpg";
import a2 from "@/assets/avatar-2.jpg";
import a3 from "@/assets/avatar-3.jpg";
import a4 from "@/assets/avatar-4.jpg";
import a5 from "@/assets/avatar-5.jpg";
import a6 from "@/assets/avatar-6.jpg";
import bLate from "@/assets/room-latenight.jpg";
import bAnime from "@/assets/room-anime.jpg";
import bHeart from "@/assets/room-heart.jpg";
import bGame from "@/assets/room-gaming.jpg";
import bChill from "@/assets/room-chill.jpg";
import bFunny from "@/assets/room-funny.jpg";

export const avatars = [a1, a2, a3, a4, a5, a6];

export type Room = {
  id: string;
  name: string;
  category: string;
  listeners: number;
  banner: string;
  trending?: boolean;
  tag?: string;
};

export const rooms: Room[] = [
  { id: "late", name: "Late Night Talks", category: "Late Night", listeners: 2340, banner: bLate, trending: true, tag: "LIVE" },
  { id: "anime", name: "Anime Club", category: "Anime & Manga", listeners: 1820, banner: bAnime, trending: true },
  { id: "heart", name: "Heartbreak Cafe", category: "Relationship", listeners: 1640, banner: bHeart },
  { id: "game", name: "Gaming Lounge", category: "Gaming", listeners: 1420, banner: bGame },
  { id: "chill", name: "Chill Zone", category: "Lofi & Chill", listeners: 980, banner: bChill },
  { id: "funny", name: "Funny Zone", category: "Comedy", listeners: 1230, banner: bFunny },
  { id: "mid", name: "Midnight Vibes", category: "Late Night", listeners: 1750, banner: bLate, trending: true },
];

export const users = [
  { name: "Riya", age: 22, city: "Mumbai", tag: "Night Owl", match: 92, avatar: a1 },
  { name: "Veer", age: 21, city: "Delhi", tag: "Chaotic", match: 89, avatar: a2 },
  { name: "Anaya", age: 20, city: "Pune", tag: "Soft Heart", match: 94, avatar: a3 },
  { name: "Zoya", age: 21, city: "Bangalore", tag: "Music Lover", match: 91, avatar: a5 },
];

export const chats = [
  { id: "1", name: "Riya", avatar: a1, last: "you're literally my vibe rn 🌙", time: "2m", unread: 3, online: true },
  { id: "2", name: "Veer", avatar: a2, last: "join the late night room?", time: "12m", unread: 1, online: true },
  { id: "3", name: "Anaya", avatar: a3, last: "haha that was wild 💀", time: "1h", unread: 0, online: false },
  { id: "4", name: "Aarav", avatar: a4, last: "voice note", time: "3h", unread: 0, online: true },
  { id: "5", name: "Zoya", avatar: a5, last: "playlist incoming 🎧", time: "5h", unread: 2, online: false },
  { id: "6", name: "Kai", avatar: a6, last: "wyd tonight?", time: "1d", unread: 0, online: false },
];
