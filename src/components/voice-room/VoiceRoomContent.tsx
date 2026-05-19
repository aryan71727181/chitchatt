// VoiceRoomContent - Premium Live Voice Room Experience
// Separated from route for lazy loading to avoid framer-motion SSR issues

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, BellRing, Lock } from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, defaultAvatar } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { getAgoraToken } from "@/lib/agora.functions";
import {
  type DBRoom,
  type DBSeat,
  type DBMember,
  type DBMessage,
  uidFromUserId,
  resolveBanner,
} from "@/lib/rooms";
import { toast } from "sonner";
import { useVoiceRoomState, type ReactionType, type Gift } from "@/lib/voice-room";
import {
  RoomHeader,
  SeatGrid,
  HostControlPanel,
  SeatModerationSheet,
  LiveChat,
  StageReactions,
  MicRequestQueue,
  GiftPanel,
  GiftAnimation,
  FloatingGifts,
  BottomControlBar,
} from "@/components/voice-room";
import { UserProfilePopup } from "@/components/UserProfilePopup";
import { MembersSheet } from "@/components/MembersSheet";

export default function VoiceRoomContent() {
  const { roomId } = useParams({ from: "/rooms/$roomId" });
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const mintToken = useServerFn(getAgoraToken);

  // Core state from hook
  const state = useVoiceRoomState({
    roomId,
    userId: user?.id,
    username: profile?.username,
    avatar: profile?.profile_image,
  });

  // Local UI state
  const [joined, setJoined] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [text, setText] = useState("");
  const [joinNotif, setJoinNotif] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);

  const prevMemberIds = useRef<Set<string>>(new Set());
  const clientRef = useRef<any>(null);
  const localTrackRef = useRef<any>(null);
  const micPermRef = useRef<MediaStream | null>(null);

  const {
    room, setRoom,
    seats, setSeats,
    members, setMembers,
    messages, setMessages,
    seatLayout,
    speakingUids, setSpeakingUids,
    micOn, setMicOn,
    meMember, mySeat, isOwner, isCoOwner, isMod,
    micRequests, requestMic, cancelMicRequest, acceptMicRequest, rejectMicRequest, hasPendingMicRequest,
    floatingReactions, addReaction,
    giftNotifications, addGiftNotification,
    roomSettings,
    showHostPanel, setShowHostPanel,
    showMicQueue, setShowMicQueue,
    showGiftPanel, setShowGiftPanel,
    showMembers, setShowMembers,
    showRoomInfo, setShowRoomInfo,
    selectedSeat, setSelectedSeat,
    selectedMember, setSelectedMember,
    changeSeatLayout,
    updateRoomSettings,
  } = state;

  // ── Load room + privacy check ──────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle();
      if (!alive) return;
      if (error || !data) {
        toast.error("Room not found");
        navigate({ to: "/rooms" });
        return;
      }
      setRoom(data as DBRoom);
      if (user) {
        const { data: m } = await supabase
          .from("room_members").select("*")
          .eq("room_id", roomId).eq("user_id", user.id).maybeSingle();
        if (m) {
          setJoined(true);
        } else if ((data as DBRoom).privacy === "private") {
          setNeedsPassword(true);
        } else {
          await joinRoom(undefined, data as DBRoom);
        }
      }
    })();
    return () => { alive = false; };
  }, [roomId, user?.id]);

  // ── Load + subscribe seats / members / messages ────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const loadAll = async () => {
      const [{ data: s }, { data: mb }, { data: ms }] = await Promise.all([
        supabase.from("room_seats").select("*").eq("room_id", roomId).order("seat_index"),
        supabase.from("room_members").select("*").eq("room_id", roomId),
        supabase.from("room_messages").select("*").eq("room_id", roomId)
          .order("created_at", { ascending: true }).limit(100),
      ]);
      setSeats((s ?? []) as DBSeat[]);
      const newMembers = (mb ?? []) as DBMember[];
      setMembers((prev) => {
        const prevIds = prevMemberIds.current;
        const newJoiners = newMembers.filter((m) => !prevIds.has(m.user_id) && m.user_id !== user?.id);
        if (newJoiners.length > 0 && prevIds.size > 0) {
          setJoinNotif(newJoiners[0].username);
          setTimeout(() => setJoinNotif(null), 3500);
        }
        prevMemberIds.current = new Set(newMembers.map((m) => m.user_id));
        return newMembers;
      });
      setMessages((ms ?? []) as DBMessage[]);
    };
    loadAll();

    const ch = supabase
      .channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_seats", filter: `room_id=eq.${roomId}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` }, () => loadAll())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as DBMessage].slice(-200));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, (payload) => {
        setRoom(payload.new as DBRoom);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, () => {
        toast("Room closed by owner");
        navigate({ to: "/rooms" });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId, navigate, user?.id]);

  // Kicked / left detection
  useEffect(() => {
    if (!joined || !user) return;
    if (members.length > 0 && !members.find((m) => m.user_id === user.id)) {
      toast("You left the room");
      navigate({ to: "/rooms" });
    }
  }, [members, joined, user, navigate]);

  // ── Agora voice ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!joined || !user || !room) return;
    let cancelled = false;
    let client: any;
    (async () => {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(3);
      client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;
      const uid = uidFromUserId(user.id);
      const publisher = !!mySeat;
      try {
        const { token, appId } = await mintToken({ data: { channel: room.id, uid, publisher } });
        await client.join(appId, room.id, token, uid);
        client.on("user-published", async (remoteUser: any, mediaType: string) => {
          await client.subscribe(remoteUser, mediaType);
          if (mediaType === "audio" && !speakerMuted) remoteUser.audioTrack?.play();
        });
        client.enableAudioVolumeIndicator();
        client.on("volume-indicator", (vols: any[]) => {
          const speaking = new Set<number>();
          vols.forEach((v) => { if (v.level > 5) speaking.add(Number(v.uid)); });
          setSpeakingUids(speaking);
        });
        if (publisher) {
          const track = await AgoraRTC.createMicrophoneAudioTrack();
          localTrackRef.current = track;
          await client.publish(track);
          setMicOn(true);
        }
      } catch (e: any) {
        if (!cancelled) toast.error("Voice connect failed: " + (e?.message ?? "unknown"));
      }
    })();
    return () => {
      cancelled = true;
      try { localTrackRef.current?.stop(); localTrackRef.current?.close(); } catch {}
      try { client?.leave(); } catch {}
      localTrackRef.current = null;
      clientRef.current = null;
      setSpeakingUids(new Set());
    };
  }, [joined, room?.id, !!mySeat, user?.id, speakerMuted]);

  // ── Actions ────────────────────────────────────────────────────────────
  const joinRoom = async (pw?: string, targetRoom: DBRoom | null = room) => {
    if (!user || !profile || !targetRoom) return;
    if (targetRoom.privacy === "private" && targetRoom.password_hash && pw !== targetRoom.password_hash) {
      toast.error("Wrong password");
      return;
    }
    const { error } = await supabase.from("room_members").insert({
      room_id: roomId, user_id: user.id, username: profile.username,
      avatar: profile.profile_image ?? defaultAvatar(profile.username), role: "member",
    });
    if (error && !error.message.includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    setJoined(true);
    setNeedsPassword(false);
  };

  const leaveRoom = async () => {
    if (!user) return;
    if (mySeat) {
      await supabase.from("room_seats")
        .update({ user_id: null, username: null, avatar: null, joined_at: null, muted: false })
        .eq("room_id", roomId).eq("seat_index", mySeat.seat_index);
    }
    await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", user.id);
    navigate({ to: "/rooms" });
  };

  const takeSeat = async (seat: DBSeat) => {
    if (!user || !profile) return;
    if (seat.user_id) return;
    if (seat.locked) return toast("Seat is locked");
    if (mySeat?.seat_index === seat.seat_index) return;
    if (!joined) await joinRoom(undefined, room);
    try {
      if (!micPermRef.current) {
        micPermRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (e: any) {
      toast.error(e?.name === "NotAllowedError"
        ? "Mic permission denied. Enable it in browser settings."
        : "Microphone unavailable");
      return;
    }
    if (mySeat) {
      const { error: clearError } = await supabase.from("room_seats")
        .update({ user_id: null, username: null, avatar: null, joined_at: null, muted: false })
        .eq("room_id", roomId).eq("seat_index", mySeat.seat_index);
      if (clearError) { toast.error(clearError.message); return; }
    }
    const { error } = await supabase.from("room_seats")
      .update({
        user_id: user.id, username: profile.username,
        avatar: profile.profile_image ?? defaultAvatar(profile.username),
        joined_at: new Date().toISOString(), muted: false,
      })
      .eq("room_id", roomId).eq("seat_index", seat.seat_index);
    if (error) { toast.error(error.message); return; }
    toast.success(seat.seat_index === 0 ? "You took the host seat" : "Seat joined");
  };

  const leaveSeat = async () => {
    if (!mySeat) return;
    await supabase.from("room_seats")
      .update({ user_id: null, username: null, avatar: null, joined_at: null, muted: false })
      .eq("room_id", roomId).eq("seat_index", mySeat.seat_index);
    try { micPermRef.current?.getTracks().forEach((t) => t.stop()); micPermRef.current = null; } catch {}
  };

  const toggleMic = async () => {
    if (!localTrackRef.current) return;
    const newOn = !micOn;
    await localTrackRef.current.setEnabled(newOn);
    setMicOn(newOn);
    if (mySeat) {
      await supabase.from("room_seats").update({ muted: !newOn })
        .eq("room_id", roomId).eq("seat_index", mySeat.seat_index);
    }
  };

  const sendMsg = async () => {
    if (!text.trim() || !user || !profile) return;
    const body = text.trim();
    setText("");
    await supabase.from("room_messages").insert({
      room_id: roomId, user_id: user.id, username: profile.username,
      avatar: profile.profile_image ?? defaultAvatar(profile.username),
      text: body, kind: "text",
    });
  };

  const sendGift = async (gift: Gift) => {
    if (!user || !profile) return;
    setShowGiftPanel(false);
    
    addGiftNotification({
      gift,
      senderUsername: profile.username,
      senderAvatar: profile.profile_image,
      comboCount: 1,
    });
    
    await supabase.from("room_messages").insert({
      room_id: roomId, user_id: user.id, username: profile.username,
      avatar: profile.profile_image ?? defaultAvatar(profile.username),
      kind: "gift", gift_emoji: gift.emoji, text: null,
    });
  };

  const handleReaction = (type: ReactionType) => {
    addReaction(type);
  };

  // Mod actions
  const kickSeat = async (seat: DBSeat) => {
    await supabase.from("room_seats")
      .update({ user_id: null, username: null, avatar: null, joined_at: null, muted: false })
      .eq("room_id", roomId).eq("seat_index", seat.seat_index);
    setSelectedSeat(null);
  };

  const muteSeat = async (seat: DBSeat) => {
    await supabase.from("room_seats").update({ muted: !seat.muted })
      .eq("room_id", roomId).eq("seat_index", seat.seat_index);
    setSelectedSeat(null);
  };

  const lockSeat = async (seat: DBSeat) => {
    await supabase.from("room_seats").update({ locked: !seat.locked })
      .eq("room_id", roomId).eq("seat_index", seat.seat_index);
    setSelectedSeat(null);
  };

  const kickFromRoom = async (seat: DBSeat) => {
    if (!seat.user_id) return;
    await kickSeat(seat);
    await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", seat.user_id);
    setSelectedSeat(null);
  };

  const promote = async (userId: string, role: "co_owner" | "admin") => {
    await supabase.from("room_members").update({ role }).eq("room_id", roomId).eq("user_id", userId);
    toast.success(`Promoted to ${role.replace("_", "-")}`);
  };

  const demote = async (userId: string) => {
    await supabase.from("room_members").update({ role: "member" }).eq("room_id", roomId).eq("user_id", userId);
    toast.success("Role removed");
  };

  const muteAll = async () => {
    const occ = seats.filter((s) => s.user_id && s.user_id !== user?.id);
    await Promise.all(occ.map((s) =>
      supabase.from("room_seats").update({ muted: true }).eq("room_id", roomId).eq("seat_index", s.seat_index)
    ));
    toast.success("All users muted");
  };

  const deleteRoom = async () => {
    if (!isOwner) return;
    await supabase.from("rooms").delete().eq("id", roomId);
    navigate({ to: "/rooms" });
  };

  const kickUser = async (userId: string) => {
    await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", userId);
    const seat = seats.find(s => s.user_id === userId);
    if (seat) {
      await supabase.from("room_seats")
        .update({ user_id: null, username: null, avatar: null, joined_at: null, muted: false })
        .eq("room_id", roomId).eq("seat_index", seat.seat_index);
    }
    toast.success("User kicked");
  };

  const banUser = async (userId: string) => {
    await kickUser(userId);
    toast.success("User banned");
  };

  const openProfileForUserId = (userId: string) => {
    const member = members.find((m) => m.user_id === userId);
    if (member) setSelectedMember(member);
  };

  const availableSeats = useMemo(() => 
    seats.filter(s => !s.user_id && !s.locked && s.seat_index !== 0).map(s => s.seat_index),
    [seats]
  );

  const speakerCount = seats.filter(s => s.user_id).length;

  // ── Render gates ───────────────────────────────────────────────────────
  if (!room) {
    return (
      <AppShell>
        <div className="pt-24 text-center">
          <motion.div
            className="h-8 w-8 mx-auto rounded-full border-2 border-electric border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
          <p className="text-sm text-muted-foreground mt-4">Loading room...</p>
        </div>
      </AppShell>
    );
  }

  if (needsPassword) {
    return (
      <AppShell>
        <div className="pt-24 px-5 max-w-md mx-auto">
          <motion.div
            className="glass-strong rounded-3xl p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="h-14 w-14 mx-auto rounded-2xl gradient-electric grid place-items-center shadow-glow mb-4">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-lg font-bold">{room.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">Private room - enter password</p>
            <input
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              type="password"
              className="mt-4 w-full glass rounded-2xl h-12 px-4 text-sm outline-none focus:ring-1 focus:ring-electric text-center"
              placeholder="Enter password"
            />
            <motion.button
              onClick={() => joinRoom(pwInput)}
              className="mt-3 w-full h-12 rounded-2xl gradient-electric text-white font-semibold shadow-glow"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Enter Room
            </motion.button>
            <button
              onClick={() => navigate({ to: "/rooms" })}
              className="mt-3 text-xs text-muted-foreground hover:text-white transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  const bannerUrl = resolveBanner(room.banner);

  return (
    <AppShell hideNav>
      {/* Join notification */}
      <AnimatePresence>
        {joinNotif && (
          <motion.div
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="glass-strong rounded-full px-4 py-2 flex items-center gap-2 shadow-card">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <BellRing className="h-3.5 w-3.5 text-electric" />
              </motion.div>
              <span className="text-xs font-medium">{joinNotif} joined the room</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift animations */}
      <GiftAnimation notifications={giftNotifications} />

      {/* Room Header */}
      <RoomHeader
        room={room}
        members={members}
        speakerCount={speakerCount}
        onBack={() => setConfirmLeave(true)}
        onShare={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Room link copied!");
          } catch {
            // Fallback for environments where clipboard API is blocked
            toast.info("Share this room link with friends!");
          }
        }}
        onInvite={() => toast("Invite feature coming soon")}
        onOpenMembers={() => setShowMembers(true)}
        onOpenInfo={() => setShowRoomInfo(true)}
        isMuted={speakerMuted}
        onToggleMute={() => setSpeakerMuted(!speakerMuted)}
      />

      {/* Stage Area */}
      <section className="relative px-4 mt-3">
        <motion.div
          className="relative rounded-[2rem] border border-white/8 overflow-hidden shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Banner background */}
          <div className="absolute inset-0">
            <img
              src={bannerUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.1_0.04_270/0.88),oklch(0.08_0.025_270/0.96))]" />
          </div>

          {/* Floating reactions on stage */}
          <StageReactions reactions={floatingReactions} />

          {/* Floating gifts on stage */}
          <FloatingGifts notifications={giftNotifications} />

          {/* Seat Grid */}
          <SeatGrid
            seats={seats}
            seatLayout={seatLayout}
            speakingUids={speakingUids}
            currentUserId={user?.id}
            isMod={!!isMod}
            onTakeSeat={takeSeat}
            onLeaveSeat={leaveSeat}
            onOpenProfile={openProfileForUserId}
            onModerate={(seat) => setSelectedSeat(seat)}
            onLockToggle={(seat) => lockSeat(seat)}
          />
        </motion.div>
      </section>

      {/* Chat */}
      <section className="mt-5">
        <LiveChat
          messages={messages}
          members={members}
          currentUserId={user?.id}
          onOpenProfile={openProfileForUserId}
        />
      </section>

      {/* Bottom Control Bar */}
      <BottomControlBar
        isOnSeat={!!mySeat}
        micOn={micOn}
        onToggleMic={toggleMic}
        speakerMuted={speakerMuted}
        onToggleSpeaker={() => setSpeakerMuted(!speakerMuted)}
        chatText={text}
        onChatTextChange={setText}
        onSendChat={sendMsg}
        onReact={handleReaction}
        onOpenGifts={() => setShowGiftPanel(true)}
        hasHandRaised={hasPendingMicRequest}
        onToggleHandRaise={() => {
          if (hasPendingMicRequest) {
            cancelMicRequest();
          } else {
            requestMic();
            toast("Mic request sent to host");
          }
        }}
        micRequestEnabled={roomSettings.micRequestEnabled}
        isHost={!!isMod}
        onOpenHostPanel={() => setShowHostPanel(true)}
        micRequestCount={micRequests.filter(r => r.status === "pending").length}
        onInvite={() => toast("Invite feature coming soon")}
        onLeave={() => setConfirmLeave(true)}
      />

      {/* Host Control Panel */}
      <HostControlPanel
        isOpen={showHostPanel}
        onClose={() => setShowHostPanel(false)}
        settings={roomSettings}
        onUpdateSettings={updateRoomSettings}
        isOwner={isOwner}
        isCoOwner={isCoOwner}
        members={members}
        onMuteAll={muteAll}
        onKickUser={kickUser}
        onBanUser={banUser}
        onPromoteUser={promote}
        onDemoteUser={demote}
        onDeleteRoom={deleteRoom}
        onChangeSeatLayout={changeSeatLayout}
      />

      {/* Seat Moderation Sheet */}
      <SeatModerationSheet
        seat={selectedSeat}
        member={selectedSeat ? members.find(m => m.user_id === selectedSeat.user_id) : null}
        isOpen={!!selectedSeat}
        onClose={() => setSelectedSeat(null)}
        isOwner={isOwner}
        isCoOwner={isCoOwner}
        currentUserId={user?.id}
        onMute={() => selectedSeat && muteSeat(selectedSeat)}
        onKickSeat={() => selectedSeat && kickSeat(selectedSeat)}
        onKickRoom={() => selectedSeat && kickFromRoom(selectedSeat)}
        onLock={() => selectedSeat && lockSeat(selectedSeat)}
        onPromote={(role) => selectedSeat?.user_id && promote(selectedSeat.user_id, role)}
        availableSeats={availableSeats}
      />

      {/* Mic Request Queue */}
      <MicRequestQueue
        isOpen={showMicQueue}
        onClose={() => setShowMicQueue(false)}
        requests={micRequests}
        onAccept={acceptMicRequest}
        onReject={rejectMicRequest}
        availableSeats={availableSeats}
      />

      {/* Gift Panel */}
      <GiftPanel
        isOpen={showGiftPanel}
        onClose={() => setShowGiftPanel(false)}
        onSendGift={sendGift}
        userCoins={1000}
        topGifters={state.topGifters}
      />

      {/* User Profile Popup */}
      {selectedMember && (
        <UserProfilePopup
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          isCurrentUser={selectedMember.user_id === user?.id}
          canModerate={!!isMod}
          currentUserRole={meMember?.role}
          onKick={isMod && selectedMember.role !== "owner" ? () => {
            kickUser(selectedMember.user_id);
            setSelectedMember(null);
          } : undefined}
          onMute={isMod && selectedMember.role !== "owner" ? () => {
            const seat = seats.find(s => s.user_id === selectedMember.user_id);
            if (seat) muteSeat(seat);
          } : undefined}
          onPromote={(isOwner || isCoOwner) && selectedMember.role === "member"
            ? (role) => promote(selectedMember.user_id, role) : undefined}
          onDemote={(isOwner || isCoOwner) &&
            (selectedMember.role === "admin" || (isOwner && selectedMember.role === "co_owner"))
            ? () => demote(selectedMember.user_id) : undefined}
        />
      )}

      {/* Leave Confirmation */}
      <AnimatePresence>
        {confirmLeave && (
          <motion.div
            className="fixed inset-0 z-[95] bg-black/75 backdrop-blur-md grid place-items-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmLeave(false)}
          >
            <motion.div
              className="w-full max-w-sm glass-strong rounded-3xl p-6 text-center"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto h-14 w-14 rounded-2xl gradient-electric grid place-items-center shadow-glow mb-4">
                <LogOut className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-lg">Leave Room?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                The vibe will miss you.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-5">
                <motion.button
                  onClick={() => setConfirmLeave(false)}
                  className="h-12 rounded-2xl glass text-sm font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Stay
                </motion.button>
                <motion.button
                  onClick={leaveRoom}
                  className="h-12 rounded-2xl bg-[oklch(0.3_0.15_25)] text-[oklch(0.9_0.18_30)] text-sm font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Leave
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
