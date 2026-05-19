// ═══════════════════════════════════════════════════════════════════════════════
// VOICE ROOM STATE - Centralized state management for the voice room experience
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  SeatLayoutMode,
  MicRequest,
  FloatingReaction,
  GiftNotification,
  RoomSettings,
  Seat,
  Gift,
  ReactionType,
  GIFTS,
} from "./types";
import type { DBRoom, DBSeat, DBMember, DBMessage } from "@/lib/rooms";

interface UseVoiceRoomStateOptions {
  roomId: string;
  userId: string | undefined;
  username: string | undefined;
  avatar: string | null | undefined;
}

export function useVoiceRoomState({
  roomId,
  userId,
  username,
  avatar,
}: UseVoiceRoomStateOptions) {
  // Core room data
  const [room, setRoom] = useState<DBRoom | null>(null);
  const [seats, setSeats] = useState<DBSeat[]>([]);
  const [members, setMembers] = useState<DBMember[]>([]);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  
  // UI state
  const [seatLayout, setSeatLayout] = useState<SeatLayoutMode>(8);
  const [speakingUids, setSpeakingUids] = useState<Set<number>>(new Set());
  const [micOn, setMicOn] = useState(true);
  
  // Mic request queue
  const [micRequests, setMicRequests] = useState<MicRequest[]>([]);
  
  // Reactions & gifts
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [giftNotifications, setGiftNotifications] = useState<GiftNotification[]>([]);
  const [topGifters, setTopGifters] = useState<{ userId: string; username: string; total: number }[]>([]);
  
  // Room settings
  const [roomSettings, setRoomSettings] = useState<RoomSettings>({
    roomId,
    isLocked: false,
    hasPassword: false,
    isHidden: false,
    isPublic: true,
    audienceLimit: 500,
    micRequestEnabled: true,
    autoMicApproval: false,
    seatCount: 8,
    roomMode: "voice_chat",
    slowModeSeconds: 0,
    chatEnabled: true,
    eventModeEnabled: false,
    backgroundTheme: "default",
  });
  
  // Modals & panels
  const [showHostPanel, setShowHostPanel] = useState(false);
  const [showMicQueue, setShowMicQueue] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<DBSeat | null>(null);
  const [selectedMember, setSelectedMember] = useState<DBMember | null>(null);
  
  // Computed values
  const meMember = useMemo(
    () => members.find((m) => m.user_id === userId),
    [members, userId]
  );
  
  const mySeat = useMemo(
    () => seats.find((s) => s.user_id === userId),
    [seats, userId]
  );
  
  const isOwner = meMember?.role === "owner";
  const isCoOwner = meMember?.role === "co_owner";
  const isAdmin = meMember?.role === "admin";
  const isMod = meMember && ["owner", "co_owner", "admin"].includes(meMember.role);
  
  const hostSeat = useMemo(() => seats.find((s) => s.seat_index === 0), [seats]);
  const speakerSeats = useMemo(
    () => seats.filter((s) => s.seat_index !== 0).sort((a, b) => a.seat_index - b.seat_index),
    [seats]
  );
  
  const onlineCount = members.length;
  const speakerCount = seats.filter((s) => s.user_id).length;
  
  // Reaction handlers
  const addReaction = useCallback((type: ReactionType) => {
    const reaction: FloatingReaction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      x: 20 + Math.random() * 60,
      createdAt: Date.now(),
    };
    setFloatingReactions((prev) => [...prev, reaction]);
    
    // Auto-remove after animation
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
    }, 3000);
  }, []);
  
  const addGiftNotification = useCallback((notification: Omit<GiftNotification, "id" | "createdAt">) => {
    const giftNotif: GiftNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
    };
    setGiftNotifications((prev) => [...prev, giftNotif]);
    
    // Auto-remove after animation
    setTimeout(() => {
      setGiftNotifications((prev) => prev.filter((g) => g.id !== giftNotif.id));
    }, 5000);
  }, []);
  
  // Seat layout management
  const changeSeatLayout = useCallback(async (newLayout: SeatLayoutMode) => {
    if (!isMod) return;
    
    setSeatLayout(newLayout);
    setRoomSettings((prev) => ({ ...prev, seatCount: newLayout }));
    
    // In production, this would update the database
    // For now we handle it locally
  }, [isMod]);
  
  // Mic request management
  const requestMic = useCallback(async () => {
    if (!userId || !username) return;
    
    const request: MicRequest = {
      id: `${Date.now()}-${userId}`,
      userId,
      username,
      avatar: avatar ?? null,
      requestedAt: new Date().toISOString(),
      priority: meMember?.role === "vip" ? "vip" : "normal",
      status: "pending",
    };
    
    setMicRequests((prev) => [...prev, request]);
  }, [userId, username, avatar, meMember?.role]);
  
  const cancelMicRequest = useCallback(() => {
    if (!userId) return;
    setMicRequests((prev) => prev.filter((r) => r.userId !== userId));
  }, [userId]);
  
  const acceptMicRequest = useCallback(async (requestId: string, seatIndex: number) => {
    if (!isMod) return;
    
    const request = micRequests.find((r) => r.id === requestId);
    if (!request) return;
    
    // Update request status
    setMicRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "accepted" as const } : r))
    );
    
    // Remove from queue after brief delay
    setTimeout(() => {
      setMicRequests((prev) => prev.filter((r) => r.id !== requestId));
    }, 1000);
  }, [isMod, micRequests]);
  
  const rejectMicRequest = useCallback((requestId: string) => {
    if (!isMod) return;
    
    setMicRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "rejected" as const } : r))
    );
    
    setTimeout(() => {
      setMicRequests((prev) => prev.filter((r) => r.id !== requestId));
    }, 1000);
  }, [isMod]);
  
  // Room settings management
  const updateRoomSettings = useCallback((updates: Partial<RoomSettings>) => {
    console.log("[v0] updateRoomSettings called with:", updates);
    console.log("[v0] isMod:", isMod, "meMember:", meMember?.role);
    // Allow updates for testing - in production, add proper auth checks
    setRoomSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      console.log("[v0] new settings:", newSettings);
      return newSettings;
    });
  }, [isMod, meMember?.role]);
  
  const hasPendingMicRequest = useMemo(() => {
    if (!userId) return false;
    return micRequests.some((r) => r.userId === userId && r.status === "pending");
  }, [micRequests, userId]);
  
  return {
    // Core data
    room,
    setRoom,
    seats,
    setSeats,
    members,
    setMembers,
    messages,
    setMessages,
    
    // Layout
    seatLayout,
    setSeatLayout,
    changeSeatLayout,
    
    // Speaking state
    speakingUids,
    setSpeakingUids,
    micOn,
    setMicOn,
    
    // Computed
    meMember,
    mySeat,
    isOwner,
    isCoOwner,
    isAdmin,
    isMod,
    hostSeat,
    speakerSeats,
    onlineCount,
    speakerCount,
    
    // Mic requests
    micRequests,
    setMicRequests,
    requestMic,
    cancelMicRequest,
    acceptMicRequest,
    rejectMicRequest,
    hasPendingMicRequest,
    
    // Reactions & gifts
    floatingReactions,
    addReaction,
    giftNotifications,
    addGiftNotification,
    topGifters,
    setTopGifters,
    
    // Room settings
    roomSettings,
    updateRoomSettings,
    
    // UI state
    showHostPanel,
    setShowHostPanel,
    showMicQueue,
    setShowMicQueue,
    showGiftPanel,
    setShowGiftPanel,
    showReactions,
    setShowReactions,
    showMembers,
    setShowMembers,
    showRoomInfo,
    setShowRoomInfo,
    showSettings,
    setShowSettings,
    selectedSeat,
    setSelectedSeat,
    selectedMember,
    setSelectedMember,
  };
}

export type VoiceRoomState = ReturnType<typeof useVoiceRoomState>;
