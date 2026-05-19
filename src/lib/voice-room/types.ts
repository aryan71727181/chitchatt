// ═══════════════════════════════════════════════════════════════════════════════
// VOICE ROOM TYPES - Core type definitions for the live voice room system
// ═══════════════════════════════════════════════════════════════════════════════

export type SeatLayoutMode = 8 | 12 | 16;

export type SeatType = 
  | "host" 
  | "co_host" 
  | "speaker" 
  | "locked" 
  | "audience";

export type MemberRole = 
  | "owner" 
  | "co_owner" 
  | "admin" 
  | "moderator"
  | "vip" 
  | "member";

export type RoomMode = 
  | "chill" 
  | "voice_chat" 
  | "gaming" 
  | "dating" 
  | "podcast" 
  | "event" 
  | "battle";

export type ReactionType = 
  | "heart" 
  | "fire" 
  | "clap" 
  | "laugh" 
  | "star"
  | "wow"
  | "sad";

export type GiftTier = "basic" | "premium" | "legendary";

export interface Gift {
  id: string;
  name: string;
  emoji: string;
  tier: GiftTier;
  coins: number;
  animationType: "float" | "burst" | "rain" | "spotlight";
}

export interface MicRequest {
  id: string;
  userId: string;
  username: string;
  avatar: string | null;
  requestedAt: string;
  priority: "normal" | "vip" | "high";
  status: "pending" | "accepted" | "rejected";
}

export interface RoomSettings {
  roomId: string;
  isLocked: boolean;
  hasPassword: boolean;
  isHidden: boolean;
  isPublic: boolean;
  audienceLimit: number;
  micRequestEnabled: boolean;
  autoMicApproval: boolean;
  seatCount: SeatLayoutMode;
  roomMode: RoomMode;
  slowModeSeconds: number;
  chatEnabled: boolean;
  eventModeEnabled: boolean;
  backgroundTheme: string;
}

export interface SpeakerState {
  seatIndex: number;
  isSpeaking: boolean;
  micOn: boolean;
  volume: number;
  isVip: boolean;
  levelBadge: number;
  hasHandRaised: boolean;
  isMuted: boolean;
}

export interface FloatingReaction {
  id: string;
  type: ReactionType;
  x: number;
  createdAt: number;
}

export interface GiftNotification {
  id: string;
  gift: Gift;
  senderUsername: string;
  senderAvatar: string | null;
  recipientUsername?: string;
  comboCount: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  avatar: string | null;
  text: string | null;
  kind: "text" | "gift" | "system" | "pinned";
  giftEmoji?: string | null;
  replyTo?: string | null;
  mentions?: string[];
  isPinned?: boolean;
  createdAt: string;
}

export interface RoomMember {
  roomId: string;
  odId: string;
  username: string;
  avatar: string | null;
  role: MemberRole;
  isVip: boolean;
  isMuted: boolean;
  isBanned: boolean;
  joinedAt: string;
  levelBadge?: number;
}

export interface Seat {
  roomId: string;
  seatIndex: number;
  seatType: SeatType;
  userId: string | null;
  username: string | null;
  avatar: string | null;
  muted: boolean;
  locked: boolean;
  joinedAt: string | null;
  isVip?: boolean;
  levelBadge?: number;
}

export interface Room {
  id: string;
  ownerId: string;
  ownerUsername: string;
  name: string;
  category: string;
  description: string | null;
  banner: string | null;
  privacy: "public" | "private";
  passwordHash: string | null;
  status: "active" | "closed";
  listenerCount: number;
  seatLayout: SeatLayoutMode;
  roomMode: RoomMode;
  settings: RoomSettings;
  createdAt: string;
}

// Host Control Panel Permission Matrix
export const ROLE_PERMISSIONS: Record<MemberRole, {
  canInviteMic: boolean;
  canMute: boolean;
  canKick: boolean;
  canBan: boolean;
  canModerateChat: boolean;
  canChangeSettings: boolean;
  canAssignRoles: boolean;
  canCloseRoom: boolean;
}> = {
  owner: {
    canInviteMic: true,
    canMute: true,
    canKick: true,
    canBan: true,
    canModerateChat: true,
    canChangeSettings: true,
    canAssignRoles: true,
    canCloseRoom: true,
  },
  co_owner: {
    canInviteMic: true,
    canMute: true,
    canKick: true,
    canBan: true,
    canModerateChat: true,
    canChangeSettings: true,
    canAssignRoles: true,
    canCloseRoom: false,
  },
  admin: {
    canInviteMic: true,
    canMute: true,
    canKick: true,
    canBan: false,
    canModerateChat: true,
    canChangeSettings: false,
    canAssignRoles: false,
    canCloseRoom: false,
  },
  moderator: {
    canInviteMic: false,
    canMute: true,
    canKick: false,
    canBan: false,
    canModerateChat: true,
    canChangeSettings: false,
    canAssignRoles: false,
    canCloseRoom: false,
  },
  vip: {
    canInviteMic: false,
    canMute: false,
    canKick: false,
    canBan: false,
    canModerateChat: false,
    canChangeSettings: false,
    canAssignRoles: false,
    canCloseRoom: false,
  },
  member: {
    canInviteMic: false,
    canMute: false,
    canKick: false,
    canBan: false,
    canModerateChat: false,
    canChangeSettings: false,
    canAssignRoles: false,
    canCloseRoom: false,
  },
};

// Room mode configurations
export const ROOM_MODES: Record<RoomMode, {
  label: string;
  icon: string;
  description: string;
  defaultSeatCount: SeatLayoutMode;
}> = {
  chill: {
    label: "Chill Music",
    icon: "music",
    description: "Relaxed vibes and good music",
    defaultSeatCount: 8,
  },
  voice_chat: {
    label: "Voice Chat",
    icon: "mic",
    description: "Open conversation for everyone",
    defaultSeatCount: 12,
  },
  gaming: {
    label: "Gaming",
    icon: "gamepad",
    description: "Talk while you play",
    defaultSeatCount: 8,
  },
  dating: {
    label: "Dating",
    icon: "heart",
    description: "Find your match",
    defaultSeatCount: 8,
  },
  podcast: {
    label: "Podcast",
    icon: "radio",
    description: "Professional discussions",
    defaultSeatCount: 8,
  },
  event: {
    label: "Event",
    icon: "calendar",
    description: "Special occasions",
    defaultSeatCount: 16,
  },
  battle: {
    label: "Battle",
    icon: "swords",
    description: "Compete and show off",
    defaultSeatCount: 8,
  },
};

// Gift definitions
export const GIFTS: Gift[] = [
  { id: "rose", name: "Rose", emoji: "🌹", tier: "basic", coins: 10, animationType: "float" },
  { id: "coffee", name: "Coffee", emoji: "☕", tier: "basic", coins: 20, animationType: "float" },
  { id: "heart", name: "Heart", emoji: "💖", tier: "basic", coins: 30, animationType: "burst" },
  { id: "star", name: "Star", emoji: "⭐", tier: "basic", coins: 50, animationType: "rain" },
  { id: "mic", name: "Mic", emoji: "🎤", tier: "premium", coins: 100, animationType: "spotlight" },
  { id: "crown", name: "Crown", emoji: "👑", tier: "premium", coins: 200, animationType: "spotlight" },
  { id: "diamond", name: "Diamond", emoji: "💎", tier: "premium", coins: 500, animationType: "rain" },
  { id: "rocket", name: "Rocket", emoji: "🚀", tier: "legendary", coins: 1000, animationType: "burst" },
  { id: "castle", name: "Castle", emoji: "🏰", tier: "legendary", coins: 2000, animationType: "spotlight" },
  { id: "universe", name: "Universe", emoji: "🌌", tier: "legendary", coins: 5000, animationType: "rain" },
];

// Reaction definitions
export const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "heart", emoji: "❤️", label: "Love" },
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "clap", emoji: "👏", label: "Clap" },
  { type: "laugh", emoji: "😂", label: "Haha" },
  { type: "star", emoji: "⭐", label: "Star" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Sad" },
];
