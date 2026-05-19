<<<<<<< HEAD
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ArrowLeft, Crown, Mic, MicOff, Plus, Lock, Unlock,
  Send, Gift, Users, LogOut, MoreVertical, Shield,
  UserMinus, Eye, VolumeX, Volume2, Menu, Share2,
  Hand, Megaphone, Trophy, ChevronDown, ChevronUp, X,
  Smile,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, defaultAvatar } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { getAgoraToken } from "@/lib/agora.functions";
import {
  type DBRoom, type DBSeat, type DBMember, type DBMessage, type DBBan,
  uidFromUserId, resolveBanner, ROLE_META,
} from "@/lib/rooms";
import { toast } from "sonner";
import { MembersSheet } from "@/components/MembersSheet";
import { UserProfilePopup } from "@/components/UserProfilePopup";
import { RoomInfoPanel } from "@/components/RoomInfoPanel";
import { SeatRequestsPanel, type SeatRequest } from "@/components/SeatRequestsPanel";
import { GiftFullscreenAnim } from "@/components/GiftFullscreenAnim";
import { FloatingReactions } from "@/components/FloatingReactions";
=======
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
>>>>>>> 2b86bdf694afc9a39da1ec01f7bb0e0f16362545

export const Route = createFileRoute("/rooms/$roomId")({
  component: VoiceRoomPage,
});

<<<<<<< HEAD
// ── Gifts catalogue ──────────────────────────────────────────────────────────
const GIFTS = [
  { name: "Rose",       emoji: "🌹",  coins: 10  },
  { name: "Coffee",     emoji: "☕",   coins: 20  },
  { name: "Heart",      emoji: "💖",  coins: 30  },
  { name: "Mic",        emoji: "🎤",  coins: 50  },
  { name: "Crown",      emoji: "👑",  coins: 100 },
  { name: "Fire",       emoji: "🔥",  coins: 50  },
  { name: "Star",       emoji: "⭐",  coins: 30  },
  { name: "Cake",       emoji: "🎂",  coins: 80  },
  { name: "Diamond",    emoji: "💎",  coins: 200 },
  { name: "Rocket",     emoji: "🚀",  coins: 150 },
];

// ── Gift leaderboard helper ───────────────────────────────────────────────────
function calcLeaderboard(messages: DBMessage[]) {
  const map: Record<string, { username: string; avatar: string | null; count: number; coins: number }> = {};
  messages.forEach((m) => {
    if (m.kind !== "gift" || !m.user_id) return;
    const gift = GIFTS.find((g) => g.emoji === m.gift_emoji);
    if (!map[m.user_id]) map[m.user_id] = { username: m.username, avatar: m.avatar ?? null, count: 0, coins: 0 };
    map[m.user_id].count += 1;
    map[m.user_id].coins += gift?.coins ?? 10;
  });
  return Object.entries(map).sort((a, b) => b[1].coins - a[1].coins).slice(0, 5);
}

// ── Main Component ───────────────────────────────────────────────────────────
function RoomPage() {
  const { roomId } = Route.useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const mintToken = useServerFn(getAgoraToken);

  // Core state
  const [room, setRoom]           = useState<DBRoom | null>(null);
  const [seats, setSeats]         = useState<DBSeat[]>([]);
  const [members, setMembers]     = useState<DBMember[]>([]);
  const [messages, setMessages]   = useState<DBMessage[]>([]);
  const [bannedIds, setBannedIds] = useState<Set<string>>(new Set());
  const [joined, setJoined]       = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pwInput, setPwInput]     = useState("");

  // UI panels
  const [text, setText]                       = useState("");
  const [showGifts, setShowGifts]             = useState(false);
  const [showMembers, setShowMembers]         = useState(false);
  const [showRoomInfo, setShowRoomInfo]       = useState(false);
  const [showRequests, setShowRequests]       = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showReactions, setShowReactions]     = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [selectedMember, setSelectedMember]   = useState<DBMember | null>(null);
  const [actingOn, setActingOn]               = useState<DBSeat | null>(null);
  const [confirmLeave, setConfirmLeave]       = useState(false);

  // Gift animation
  const [activeGiftAnim, setActiveGiftAnim] = useState<{ emoji: string; name: string; sender: string } | null>(null);

  // Reactions broadcast
  const [incomingReaction, setIncomingReaction] = useState<string | null>(null);

  // Seat requests
  const [seatRequests, setSeatRequests] = useState<SeatRequest[]>([]);
  const [myRequestStatus, setMyRequestStatus] = useState<"none" | "pending" | "approved" | "denied">("none");

  // Join notification
  const [joinNotif, setJoinNotif] = useState<{ username: string; role: string } | null>(null);

  // Announcement input
  const [announcementText, setAnnouncementText] = useState("");

  // Coins
  const [myCoins, setMyCoins] = useState<number>(500);

  // Agora
  const [speakingUids, setSpeakingUids] = useState<Set<number>>(new Set());
  const [micOn, setMicOn]               = useState(true);

  const prevMemberIds  = useRef<Set<string>>(new Set());
  const chatEnd        = useRef<HTMLDivElement>(null);
  const didShowWelcome = useRef(false);
  const clientRef      = useRef<any>(null);
  const localTrackRef  = useRef<any>(null);
  const micPermRef     = useRef<MediaStream | null>(null);
  const reactionChRef  = useRef<any>(null);

  const meMember = useMemo(() => members.find((m) => m.user_id === user?.id), [members, user?.id]);
  const mySeat   = useMemo(() => seats.find((s) => s.user_id === user?.id), [seats, user?.id]);
  const isOwner  = meMember?.role === "owner";
  const isMod    = meMember && ["owner", "co_owner", "admin"].includes(meMember.role);

  const pendingRequests  = seatRequests.filter((r) => r.status === "pending");
  const giftLeaderboard  = useMemo(() => calcLeaderboard(messages), [messages]);

  // ── Load coins ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data && (data as any).coins != null) setMyCoins((data as any).coins);
    });
  }, [user]);

  // ── Load room + privacy + ban check ─────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle();
      if (!alive) return;
      if (error || !data) { toast.error("Room not found"); navigate({ to: "/rooms" }); return; }
      setRoom(data as DBRoom);
      if ((data as any).announcement) setAnnouncementText((data as any).announcement ?? "");
      if (user) {
        const { data: ban } = await (supabase as any)
          .from("room_bans").select("user_id").eq("room_id", roomId).eq("user_id", user.id).maybeSingle();
        if (ban) { toast.error("You are banned from this room"); navigate({ to: "/rooms" }); return; }
        const { data: m } = await supabase
          .from("room_members").select("*").eq("room_id", roomId).eq("user_id", user.id).maybeSingle();
        if (m) { setJoined(true); }
        else if ((data as DBRoom).privacy === "private") { setNeedsPassword(true); }
        else { await joinRoom(undefined, data as DBRoom); }
      }
    })();
    return () => { alive = false; };
  }, [roomId, user?.id]);

  // Welcome toast
  useEffect(() => {
    if (joined && room?.welcome_message && !didShowWelcome.current) {
      didShowWelcome.current = true;
      setTimeout(() => toast(room.welcome_message!, { icon: "👋", duration: 5000 }), 800);
    }
  }, [joined, room?.welcome_message]);

  // ── Load + subscribe all realtime data ─────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    const loadAll = async () => {
      const [{ data: s }, { data: mb }, { data: ms }, { data: bns }, { data: reqs }] = await Promise.all([
        supabase.from("room_seats").select("*").eq("room_id", roomId).order("seat_index"),
        supabase.from("room_members").select("*").eq("room_id", roomId),
        supabase.from("room_messages").select("*").eq("room_id", roomId)
          .order("created_at", { ascending: true }).limit(120),
        (supabase as any).from("room_bans").select("user_id").eq("room_id", roomId),
        (supabase as any).from("seat_requests").select("*").eq("room_id", roomId).order("created_at"),
      ]);

      // Auto-init seats if room has none (e.g. old rooms created before fix)
      let seatRows = (s ?? []) as DBSeat[];
      if (seatRows.length === 0) {
        const toInsert = Array.from({ length: 8 }, (_, i) => ({ room_id: roomId, seat_index: i }));
        const { data: newSeats } = await supabase.from("room_seats").insert(toInsert).select();
        seatRows = (newSeats ?? []) as DBSeat[];
      }
      setSeats(seatRows);
      setBannedIds(new Set(((bns ?? []) as Array<{ user_id: string }>).map((b) => b.user_id)));
      setSeatRequests((reqs ?? []) as SeatRequest[]);

      const myReq = (reqs ?? [] as SeatRequest[]).find((r: SeatRequest) => r.user_id === user?.id);
      setMyRequestStatus(myReq ? (myReq.status as any) : "none");

      const newMembers = (mb ?? []) as DBMember[];
      setMembers((prev) => {
        const prevIds = prevMemberIds.current;
        const newJoiners = newMembers.filter((m) => !prevIds.has(m.user_id) && m.user_id !== user?.id);
        if (newJoiners.length > 0 && prevIds.size > 0) {
          const joiner = newJoiners[0];
          setJoinNotif({ username: joiner.username, role: joiner.role });
          setTimeout(() => setJoinNotif(null), 4000);
        }
        prevMemberIds.current = new Set(newMembers.map((m) => m.user_id));
        return newMembers;
      });
      setMessages((ms ?? []) as DBMessage[]);
    };

    loadAll();

    const ch = supabase
      .channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_seats",    filter: `room_id=eq.${roomId}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members",  filter: `room_id=eq.${roomId}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "seat_requests", filter: `room_id=eq.${roomId}` }, loadAll)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` }, (payload) => {
        const msg = payload.new as DBMessage;
        setMessages((prev) => [...prev, msg].slice(-200));
        // Trigger gift fullscreen animation for others (not sender)
        if (msg.kind === "gift" && msg.user_id !== user?.id && msg.gift_emoji) {
          const gift = GIFTS.find((g) => g.emoji === msg.gift_emoji);
          setActiveGiftAnim({ emoji: msg.gift_emoji, name: gift?.name ?? "Gift", sender: msg.username });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "room_bans",    filter: `room_id=eq.${roomId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          const ban = payload.new as DBBan;
          setBannedIds((prev) => new Set([...prev, ban.user_id]));
          if (ban.user_id === user?.id) { toast.error("You have been banned from this room"); navigate({ to: "/rooms" }); }
        }
        if (payload.eventType === "DELETE") {
          const ban = payload.old as Partial<DBBan>;
          if (ban.user_id) setBannedIds((prev) => { const s = new Set(prev); s.delete(ban.user_id!); return s; });
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, (payload) => {
        setRoom(payload.new as DBRoom);
        if ((payload.new as any).announcement !== undefined) {
          setAnnouncementText((payload.new as any).announcement ?? "");
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, () => {
        toast("Room closed by owner"); navigate({ to: "/rooms" });
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [roomId, navigate, user?.id]);

  // ── Realtime reactions broadcast channel ────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const ch = supabase
      .channel(`reactions:${roomId}`)
      .on("broadcast", { event: "react" }, (payload) => {
        if (payload.payload?.userId !== user?.id) {
          setIncomingReaction(payload.payload?.emoji ?? "❤️");
          setTimeout(() => setIncomingReaction(null), 100);
        }
      })
      .subscribe();
    reactionChRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [roomId, user?.id]);

  // Auto-scroll chat
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // Kicked detection
  useEffect(() => {
    if (!joined || !user) return;
    if (members.length > 0 && !members.find((m) => m.user_id === user.id)) {
      toast("You left the room"); navigate({ to: "/rooms" });
    }
  }, [members, joined, user, navigate]);

  // ── Agora voice ──────────────────────────────────────────────────────────────
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
          if (mediaType === "audio") remoteUser.audioTrack?.play();
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
  }, [joined, room?.id, !!mySeat, user?.id]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const joinRoom = async (pw?: string, targetRoom: DBRoom | null = room) => {
    if (!user || !profile || !targetRoom) return;
    if (targetRoom.privacy === "private" && targetRoom.password_hash && pw !== targetRoom.password_hash) {
      toast.error("Wrong password"); return;
    }
    const { error } = await supabase.from("room_members").insert({
      room_id: roomId, user_id: user.id, username: profile.username,
      avatar: profile.profile_image ?? defaultAvatar(profile.username), role: "member",
    });
    if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
    setJoined(true); setNeedsPassword(false);
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
    if (room?.seat_mode === "admin_approval" && !isMod) {
      return toast("This room requires admin approval — use Raise Hand");
    }
    if (!joined) await joinRoom(undefined, room);
    try {
      if (!micPermRef.current) micPermRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e: any) {
      toast.error(e?.name === "NotAllowedError" ? "Mic permission denied." : "Microphone unavailable");
      return;
    }
    if (mySeat) {
      await supabase.from("room_seats")
        .update({ user_id: null, username: null, avatar: null, joined_at: null, muted: false })
        .eq("room_id", roomId).eq("seat_index", mySeat.seat_index);
    }
    const muted = room?.mic_mode === "locked" || room?.mic_mode === "host_approval";
    const { error } = await supabase.from("room_seats")
      .update({
        user_id: user.id, username: profile.username,
        avatar: profile.profile_image ?? defaultAvatar(profile.username),
        joined_at: new Date().toISOString(), muted,
      })
      .eq("room_id", roomId).eq("seat_index", seat.seat_index);
    if (error) { toast.error(error.message); return; }
    toast.success(seat.seat_index === 0 ? "You took the host seat" : "Seat joined");
    if (muted && room?.mic_mode === "host_approval") toast("Mic off — waiting for host approval");
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
    if (mySeat) await supabase.from("room_seats").update({ muted: !newOn })
      .eq("room_id", roomId).eq("seat_index", mySeat.seat_index);
  };

  const sendMsg = async () => {
    if (!text.trim() || !user || !profile) return;
    if (room?.allow_chat === false) return toast("Chat is disabled");
    const body = text.trim(); setText("");
    await supabase.from("room_messages").insert({
      room_id: roomId, user_id: user.id, username: profile.username,
      avatar: profile.profile_image ?? defaultAvatar(profile.username),
      text: body, kind: "text",
    });
  };

  const sendGift = async (gift: typeof GIFTS[0]) => {
    if (!user || !profile) return;
    if (room?.allow_gifts === false) return toast("Gifts are disabled");
    if (myCoins < gift.coins) { toast.error(`Not enough coins! You need ${gift.coins} coins`); return; }
    setShowGifts(false);

    // Deduct coins
    const newCoins = myCoins - gift.coins;
    setMyCoins(newCoins);
    await supabase.from("profiles").update({ coins: newCoins } as any).eq("id", user.id);

    // Show fullscreen anim for sender
    setActiveGiftAnim({ emoji: gift.emoji, name: gift.name, sender: profile.username });

    await supabase.from("room_messages").insert({
      room_id: roomId, user_id: user.id, username: profile.username,
      avatar: profile.profile_image ?? defaultAvatar(profile.username),
      kind: "gift", gift_emoji: gift.emoji, text: null,
    });
  };

  const sendReaction = async (emoji: string) => {
    if (!reactionChRef.current) return;
    await reactionChRef.current.send({
      type: "broadcast", event: "react", payload: { emoji, userId: user?.id },
    });
  };

  const shareRoom = () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: room?.name ?? "ChitChat Room", url }).catch(() => {});
    else navigator.clipboard.writeText(url).then(() => toast.success("Room link copied!"));
  };

  // ── Seat request actions ──────────────────────────────────────────────────
  const raiseHand = async () => {
    if (!user || !profile || myRequestStatus === "pending") return;
    if (mySeat) return toast("You already have a seat");
    const { error } = await (supabase as any).from("seat_requests").insert({
      room_id: roomId, user_id: user.id, username: profile.username,
      avatar: profile.profile_image ?? defaultAvatar(profile.username),
      status: "pending",
    }).select().single();
    if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
    setMyRequestStatus("pending");
    toast("🙋 Request sent — waiting for host approval");
  };

  const cancelRequest = async () => {
    if (!user) return;
    await (supabase as any).from("seat_requests").delete()
      .eq("room_id", roomId).eq("user_id", user.id);
    setMyRequestStatus("none");
    toast("Request cancelled");
  };

  const approveSeatRequest = async (req: SeatRequest) => {
    // Place user on first available unlocked seat
    const emptyUnlocked = seats.filter((s) => !s.user_id && !s.locked).sort((a, b) => a.seat_index - b.seat_index);
    if (!emptyUnlocked.length) { toast.error("No empty seats available"); return; }
    const seat = emptyUnlocked[0];
    await supabase.from("room_seats").update({
      user_id: req.user_id, username: req.username, avatar: req.avatar,
      joined_at: new Date().toISOString(),
      muted: room?.mic_mode === "locked",
    }).eq("room_id", roomId).eq("seat_index", seat.seat_index);
    await (supabase as any).from("seat_requests").update({ status: "approved" })
      .eq("room_id", roomId).eq("user_id", req.user_id);
    toast.success(`@${req.username} approved to seat ${seat.seat_index}`);
  };

  const denySeatRequest = async (req: SeatRequest) => {
    await (supabase as any).from("seat_requests").update({ status: "denied" })
      .eq("room_id", roomId).eq("user_id", req.user_id);
    toast(`@${req.username} request denied`);
  };

  // ── Announcement ─────────────────────────────────────────────────────────
  const saveAnnouncement = async () => {
    await supabase.from("rooms").update({ announcement: announcementText.trim() || null } as any)
      .eq("id", roomId);
    setShowAnnouncement(false);
    toast.success(announcementText.trim() ? "Announcement updated" : "Announcement cleared");
  };

  // ── Mod actions ────────────────────────────────────────────────────────────
  const kickSeat     = async (seat: DBSeat) => {
    await supabase.from("room_seats")
      .update({ user_id: null, username: null, avatar: null, joined_at: null, muted: false })
      .eq("room_id", roomId).eq("seat_index", seat.seat_index);
    setActingOn(null);
  };
  const muteSeat     = async (seat: DBSeat) => {
    await supabase.from("room_seats").update({ muted: !seat.muted })
      .eq("room_id", roomId).eq("seat_index", seat.seat_index);
    setActingOn(null);
  };
  const lockSeat     = async (seat: DBSeat) => {
    await supabase.from("room_seats").update({ locked: !seat.locked })
      .eq("room_id", roomId).eq("seat_index", seat.seat_index);
    setActingOn(null);
  };
  const kickFromRoom = async (seat: DBSeat) => {
    if (!seat.user_id) return;
    await kickSeat(seat);
    await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", seat.user_id);
  };
  const promote      = async (seat: DBSeat, role: "co_owner" | "admin") => {
    if (!seat.user_id) return;
    await supabase.from("room_members").update({ role }).eq("room_id", roomId).eq("user_id", seat.user_id);
    toast.success(`Promoted to ${role.replace("_", "-")}`);
    setActingOn(null);
  };
  const muteAll      = async () => {
    const occ = seats.filter((s) => s.user_id && s.user_id !== user?.id);
    await Promise.all(occ.map((s) =>
      supabase.from("room_seats").update({ muted: true }).eq("room_id", roomId).eq("seat_index", s.seat_index)
    ));
    toast.success("All users muted");
  };
  const deleteRoom   = async () => {
    if (!isOwner) return;
    await supabase.from("rooms").delete().eq("id", roomId);
    navigate({ to: "/rooms" });
  };

  // Profile popup helpers
  const getMemberSeat       = (userId: string) => seats.find((s) => s.user_id === userId);
  const handleMemberKick    = (member: DBMember) => {
    const seat = getMemberSeat(member.user_id);
    if (seat) kickSeat(seat);
    supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", member.user_id);
    toast.success(`${member.username} was removed`);
  };
  const handleMemberMute    = (member: DBMember) => {
    const seat = getMemberSeat(member.user_id);
    if (seat) muteSeat(seat); else toast("User is not on a seat");
  };
  const handleMemberPromote = async (member: DBMember, role: "co_owner" | "admin" | "vip") => {
    await supabase.from("room_members").update({ role }).eq("room_id", roomId).eq("user_id", member.user_id);
    toast.success(`Promoted to ${ROLE_META[role]?.label ?? role}`);
  };
  const handleMemberDemote  = async (member: DBMember) => {
    await supabase.from("room_members").update({ role: "member" }).eq("room_id", roomId).eq("user_id", member.user_id);
    toast.success(`${member.username} role removed`);
  };
  const handleBanUser = async (member: DBMember, reason?: string) => {
    if (!user) return;
    const seat = getMemberSeat(member.user_id);
    if (seat) await kickSeat(seat);
    await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", member.user_id);
    const { error } = await (supabase as any).from("room_bans").insert({
      room_id: roomId, user_id: member.user_id, banned_by: user.id, reason: reason ?? null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`@${member.username} banned from room`);
  };
  const handleInviteToSeat = async (member: DBMember, seatIndex: number) => {
    if (!profile) return;
    const { error } = await supabase.from("room_seats")
      .update({
        user_id: member.user_id, username: member.username, avatar: member.avatar,
        joined_at: new Date().toISOString(), muted: room?.mic_mode === "locked",
      })
      .eq("room_id", roomId).eq("seat_index", seatIndex);
    if (error) { toast.error(error.message); return; }
    toast.success(`@${member.username} invited to seat ${seatIndex === 0 ? "(host)" : seatIndex}`);
  };

  const openProfileForUserId = useCallback((userId: string) => {
    const member = members.find((m) => m.user_id === userId);
    if (member) setSelectedMember(member);
  }, [members]);

  // ── Render gates ─────────────────────────────────────────────────────────────
  if (!room) {
    return (
      <AppShell>
        <div className="pt-24 flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-full gradient-electric animate-glow-pulse" />
          <p className="text-sm text-muted-foreground">Loading room…</p>
        </div>
      </AppShell>
    );
  }

  if (needsPassword) {
    return (
      <AppShell>
        <div className="pt-24 px-5 max-w-md mx-auto animate-fade-up">
          <div className="glass-strong rounded-3xl p-6 text-center">
            <Lock className="h-8 w-8 mx-auto text-electric mb-3" />
            <h2 className="text-lg font-bold">{room.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">Private room · enter password</p>
            <input
              value={pwInput} onChange={(e) => setPwInput(e.target.value)}
              type="password"
              className="mt-4 w-full glass rounded-2xl h-11 px-4 text-sm outline-none focus:ring-1 focus:ring-electric text-center"
              placeholder="••••••"
            />
            <button onClick={() => joinRoom(pwInput)}
              className="mt-3 w-full h-11 rounded-2xl gradient-electric text-white font-semibold shadow-glow active:scale-[0.98]">
              Enter Room
            </button>
            <button onClick={() => navigate({ to: "/rooms" })} className="mt-3 text-xs text-muted-foreground">
              Cancel
            </button>
=======
// Lazy load the entire content to avoid framer-motion SSR issues
const VoiceRoomContent = lazy(() => import("@/components/voice-room/VoiceRoomContent"));

function VoiceRoomPage() {
  // Client-side only detection
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Render a simple loading state during SSR
  if (!isClient) {
    return (
      <AppShell hideNav>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-electric" />
            <p className="text-sm text-muted-foreground mt-4">Loading room...</p>
>>>>>>> 2b86bdf694afc9a39da1ec01f7bb0e0f16362545
          </div>
        </div>
      </AppShell>
    );
  }
<<<<<<< HEAD

  const hostSeat    = seats.find((s) => s.seat_index === 0);
  const restSeats   = seats.filter((s) => s.seat_index !== 0).sort((a, b) => a.seat_index - b.seat_index);
  const bannerUrl   = resolveBanner(room.banner);
  const giftsEnabled = room.allow_gifts !== false;
  const announcementToShow = (room as any).announcement as string | null | undefined;

  return (
    <AppShell hideNav>
      {/* ── Gift fullscreen animation ──────────────────────────────────────────── */}
      {activeGiftAnim && (
        <GiftFullscreenAnim
          emoji={activeGiftAnim.emoji}
          giftName={activeGiftAnim.name}
          senderName={activeGiftAnim.sender}
          onDone={() => setActiveGiftAnim(null)}
        />
      )}

      {/* ── Join notification ─────────────────────────────────────────────────── */}
      {joinNotif && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] animate-fade-up pointer-events-none">
          {joinNotif.role === "vip" || joinNotif.role === "owner" || joinNotif.role === "co_owner" ? (
            // VIP entrance — special banner
            <div className="glass-strong rounded-2xl px-5 py-3 flex items-center gap-3 shadow-glow border border-electric/30">
              <span className="text-2xl">{joinNotif.role === "owner" ? "👑" : joinNotif.role === "vip" ? "💎" : "⭐"}</span>
              <div>
                <p className="text-xs font-bold text-electric">
                  {joinNotif.role === "owner" ? "Owner" : joinNotif.role === "vip" ? "VIP Guest" : "Co-owner"} Entered
                </p>
                <p className="text-sm font-bold">@{joinNotif.username}</p>
              </div>
            </div>
          ) : (
            // Regular join
            <div className="glass-strong rounded-full px-4 py-2 flex items-center gap-2 shadow-card">
              <span className="h-1.5 w-1.5 live-dot" />
              <span className="text-xs font-medium">@{joinNotif.username} joined</span>
            </div>
          )}
        </div>
      )}

      {/* ── Top bar ────────────────────────────────────────────────────────────── */}
      <header className="px-4 pt-12 pb-3 flex items-start gap-2.5 animate-fade-up">
        <button onClick={() => setConfirmLeave(true)}
          className="h-10 w-10 rounded-full glass grid place-items-center active:scale-95 flex-shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-[1.1rem] leading-tight truncate">{room.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="glass rounded-full px-2.5 py-1">{room.category}</span>
            <button
              onClick={() => setShowMembers(true)}
              className="glass rounded-full px-2.5 py-1 flex items-center gap-1.5 active:scale-95"
            >
              <Eye className="h-3 w-3 text-electric" />
              <span className="text-electric font-semibold">{members.length}</span>
              <span>Online</span>
            </button>
            <span className="glass rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 live-dot" /> Live
            </span>
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {/* Seat requests badge for mods */}
          {isMod && pendingRequests.length > 0 && (
            <button
              onClick={() => setShowRequests(true)}
              className="relative h-10 w-10 rounded-full gradient-electric grid place-items-center active:scale-95 shadow-glow-soft animate-pulse-ring"
            >
              <Hand className="h-4 w-4 text-white" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">
                {pendingRequests.length}
              </span>
            </button>
          )}
          <button onClick={shareRoom} className="h-10 w-10 rounded-full glass grid place-items-center active:scale-95">
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => setShowRoomInfo(true)} className="h-10 w-10 rounded-full glass grid place-items-center active:scale-95">
            <Menu className="h-4 w-4 text-electric" />
          </button>
        </div>
      </header>

      {/* ── Announcement banner ────────────────────────────────────────────────── */}
      {announcementToShow && (
        <div className="mx-4 mb-2 glass rounded-2xl px-4 py-2.5 flex items-start gap-2 border border-electric/20">
          <Megaphone className="h-4 w-4 text-electric flex-shrink-0 mt-0.5" />
          <p className="text-xs text-white/80 flex-1 leading-relaxed">{announcementToShow}</p>
          {isMod && (
            <button
              onClick={() => { setAnnouncementText(announcementToShow ?? ""); setShowAnnouncement(true); }}
              className="text-[10px] text-muted-foreground flex-shrink-0"
            >
              Edit
            </button>
          )}
        </div>
      )}

      {/* ── Stage ─────────────────────────────────────────────────────────────── */}
      <section className="relative px-4 mt-1">
        <div className="relative rounded-[2rem] border border-white/8 overflow-hidden shadow-card">
          <div className="absolute inset-0">
            <img src={bannerUrl} alt="" className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80"; }} />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.08_0.03_270/0.55),oklch(0.06_0.02_270/0.88))]" />
          </div>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,oklch(0.74_0.27_350/0.18),transparent_72%)]" />
            <div className="absolute left-1/2 top-[7.4rem] h-[11rem] w-[18rem] -translate-x-1/2 rounded-[50%] border border-electric/14" />
            <div className="absolute left-1/2 top-[8.9rem] h-[14rem] w-[21rem] -translate-x-1/2 rounded-[50%] border border-electric/10" />
            <div className="absolute left-1/2 top-[10.5rem] h-[17rem] w-[24rem] -translate-x-1/2 rounded-[50%] border border-electric/6" />
          </div>

          <div className="relative px-4 pt-6 pb-7">
            {/* Host seat */}
            <div className="flex justify-center mb-7">
              {hostSeat && (
                <SeatView
                  seat={hostSeat} host
                  speaking={!!hostSeat.user_id && speakingUids.has(uidFromUserId(hostSeat.user_id))}
                  onTake={() => takeSeat(hostSeat)} onSelf={leaveSeat}
                  isMe={hostSeat.user_id === user?.id}
                  onProfile={hostSeat.user_id && hostSeat.user_id !== user?.id ? () => openProfileForUserId(hostSeat.user_id!) : undefined}
                  onModerate={isMod && hostSeat.user_id && hostSeat.user_id !== user?.id ? () => setActingOn(hostSeat) : undefined}
                />
              )}
            </div>

            {/* Other seats */}
            <div className="relative grid grid-cols-3 gap-y-6 gap-x-2 place-items-center">
              {restSeats.map((s) => (
                <SeatView
                  key={s.seat_index} seat={s}
                  speaking={!!s.user_id && speakingUids.has(uidFromUserId(s.user_id))}
                  onTake={() => takeSeat(s)} onSelf={leaveSeat}
                  isMe={s.user_id === user?.id}
                  onProfile={s.user_id && s.user_id !== user?.id ? () => openProfileForUserId(s.user_id!) : undefined}
                  onModerate={isMod && s.user_id && s.user_id !== user?.id ? () => setActingOn(s) : undefined}
                  onLockToggle={isMod && !s.user_id ? () => lockSeat(s) : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Leaderboard + Reactions strip ─────────────────────────────────────── */}
      <div className="px-4 mt-3 flex gap-2">
        {/* Top gifters mini-strip */}
        {giftLeaderboard.length > 0 && (
          <button
            onClick={() => setShowLeaderboard((s) => !s)}
            className="flex-1 glass rounded-2xl px-3 py-2 flex items-center gap-2"
          >
            <Trophy className="h-3.5 w-3.5 text-gold flex-shrink-0" />
            <div className="flex -space-x-2 flex-shrink-0">
              {giftLeaderboard.slice(0, 3).map(([uid, info]) => (
                <img key={uid} src={info.avatar ?? defaultAvatar(info.username)}
                  alt="" className="h-6 w-6 rounded-full ring-2 ring-background object-cover" />
              ))}
            </div>
            <span className="text-[11px] text-gold font-semibold">Top Gifters</span>
            {showLeaderboard ? <ChevronUp className="h-3 w-3 ml-auto text-muted-foreground" /> : <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />}
          </button>
        )}

        {/* Reactions */}
        <button
          onClick={() => setShowReactions((s) => !s)}
          className={`h-10 px-3 rounded-2xl flex items-center gap-1.5 text-xs font-semibold transition-all ${
            showReactions ? "gradient-electric text-white shadow-glow-soft" : "glass text-muted-foreground"
          }`}
        >
          <Smile className="h-4 w-4" /> React
        </button>

        {/* Mod: announcement button */}
        {isMod && (
          <button
            onClick={() => setShowAnnouncement(true)}
            className="h-10 px-3 rounded-2xl glass flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
          >
            <Megaphone className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Gift leaderboard expanded ─────────────────────────────────────────── */}
      {showLeaderboard && giftLeaderboard.length > 0 && (
        <div className="mx-4 mt-2 glass-strong rounded-2xl p-3 animate-scale-in">
          <p className="text-[10px] font-bold text-gold tracking-widest mb-2">🏆 TOP GIFTERS</p>
          {giftLeaderboard.map(([uid, info], i) => (
            <div key={uid} className="flex items-center gap-2 py-1">
              <span className={`text-xs font-bold w-5 ${i === 0 ? "text-gold" : "text-muted-foreground"}`}>
                {i === 0 ? "👑" : `#${i + 1}`}
              </span>
              <img src={info.avatar ?? defaultAvatar(info.username)} alt=""
                className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
              <span className="text-xs font-medium flex-1 truncate">@{info.username}</span>
              <span className="text-[10px] text-gold font-bold">{info.coins} 🪙</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Reactions bar ─────────────────────────────────────────────────────── */}
      {showReactions && (
        <div className="px-4 mt-2 animate-scale-in">
          <FloatingReactions
            incomingEmoji={incomingReaction}
            onReact={sendReaction}
          />
        </div>
      )}

      {/* ── Chat ──────────────────────────────────────────────────────────────── */}
      <section className="px-4 mt-3 space-y-2 max-h-44 overflow-y-auto no-scrollbar pb-2">
        {messages.length === 0 && (
          <p className="text-center text-[11px] text-muted-foreground py-3">Say hi to start the vibe ✨</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-2 animate-fade-up">
            <img
              src={m.avatar ?? defaultAvatar(m.username)} alt=""
              className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0 cursor-pointer"
              onClick={() => { const mem = members.find((mb) => mb.user_id === m.user_id); if (mem) setSelectedMember(mem); }}
            />
            {m.kind === "gift" ? (
              <div className="glass rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-2">
                <span className="text-2xl">{m.gift_emoji}</span>
                <div>
                  <p className="text-[10px] text-electric font-semibold">{m.username}</p>
                  <p className="text-[10px] text-muted-foreground">sent a gift</p>
                </div>
              </div>
            ) : (
              <div className="glass rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
                <button
                  className="text-[10px] text-electric font-semibold"
                  onClick={() => { const mem = members.find((mb) => mb.user_id === m.user_id); if (mem) setSelectedMember(mem); }}
                >
                  {m.username}
                </button>
                <p className="text-sm leading-snug break-words">{m.text}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEnd} />
      </section>

      {/* ── Gift picker ───────────────────────────────────────────────────────── */}
      {showGifts && giftsEnabled && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4 animate-fade-up">
          <div className="mx-auto max-w-md glass-strong rounded-3xl p-4 shadow-card border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm">🎁 Send a Gift</p>
              <div className="glass-gold rounded-full px-3 h-7 flex items-center gap-1.5">
                <span className="text-xs">🪙</span>
                <span className="text-xs font-bold text-gold">{myCoins.toLocaleString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {GIFTS.map((g) => (
                <button
                  key={g.name}
                  onClick={() => sendGift(g)}
                  disabled={myCoins < g.coins}
                  className={`glass rounded-2xl py-2.5 flex flex-col items-center gap-1 active:scale-95 transition-transform disabled:opacity-40 ${
                    myCoins >= g.coins ? "hover:border-electric/40" : ""
                  }`}
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-[9px] text-muted-foreground">{g.name}</span>
                  <span className="text-[9px] text-gold font-bold">🪙{g.coins}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom composer ───────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pb-safe">
        <div className="px-4 pb-5 pt-2">
          <div className="mx-auto max-w-md glass-strong rounded-full pl-2 pr-1 h-12 flex items-center gap-1.5 shadow-card border border-white/8">
            {/* Mic / Raise Hand */}
            {mySeat ? (
              <button onClick={toggleMic}
                className={`h-10 w-10 rounded-full grid place-items-center active:scale-95 flex-shrink-0 ${
                  micOn ? "gradient-electric shadow-glow-soft" : "bg-white/10"
                }`}>
                {micOn ? <Mic className="h-4 w-4 text-white" /> : <MicOff className="h-4 w-4 text-muted-foreground" />}
              </button>
            ) : (
              <button
                onClick={myRequestStatus === "pending" ? cancelRequest : raiseHand}
                className={`h-10 w-10 rounded-full grid place-items-center active:scale-95 flex-shrink-0 transition-all ${
                  myRequestStatus === "pending"
                    ? "gradient-electric shadow-glow-soft animate-pulse"
                    : "glass"
                }`}
                title={myRequestStatus === "pending" ? "Cancel request" : "Raise hand to join stage"}
              >
                <Hand className={`h-4 w-4 ${myRequestStatus === "pending" ? "text-white" : "text-muted-foreground"}`} />
              </button>
            )}

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMsg()}
              placeholder={
                room.allow_chat === false
                  ? "Chat disabled"
                  : myRequestStatus === "pending"
                    ? "Waiting for host approval…"
                    : "Say something nice…"
              }
              disabled={room.allow_chat === false}
              className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-40"
            />

            {/* Gift */}
            {giftsEnabled && (
              <button onClick={() => setShowGifts((s) => !s)}
                className={`h-9 w-9 rounded-full grid place-items-center active:scale-95 flex-shrink-0 ${
                  showGifts ? "gradient-electric text-white shadow-glow-soft" : "bg-electric/15 text-electric"
                }`}>
                <Gift className="h-4 w-4" />
              </button>
            )}

            {/* Members */}
            <button
              onClick={() => setShowMembers(true)}
              className="h-9 w-9 rounded-full glass grid place-items-center active:scale-95 flex-shrink-0"
            >
              <Users className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Send */}
            <button onClick={sendMsg}
              className="h-10 w-10 rounded-full gradient-electric grid place-items-center shadow-glow-soft active:scale-95 flex-shrink-0">
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Seat mod sheet ─────────────────────────────────────────────────────── */}
      {actingOn && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md flex items-end justify-center animate-fade-up"
          onClick={() => setActingOn(null)}>
          <div className="w-full max-w-md glass-strong rounded-t-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <img src={actingOn.avatar ?? defaultAvatar(actingOn.username ?? "u")} alt=""
                className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="font-bold">{actingOn.username ?? "Empty seat"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {actingOn.seat_index === 0 ? "Host seat" : `Seat ${actingOn.seat_index}`}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {actingOn.user_id && (
                <>
                  <ModBtn icon={actingOn.muted ? Volume2 : VolumeX} label={actingOn.muted ? "Unmute" : "Mute"} onClick={() => muteSeat(actingOn)} />
                  <ModBtn icon={UserMinus} label="Remove seat" onClick={() => kickSeat(actingOn)} />
                  <ModBtn icon={LogOut} label="Kick from room" onClick={() => kickFromRoom(actingOn)} danger />
                  {isOwner && (
                    <>
                      <ModBtn icon={Crown} label="Make co-owner" onClick={() => promote(actingOn, "co_owner")} />
                      <ModBtn icon={Shield} label="Make admin" onClick={() => promote(actingOn, "admin")} />
                    </>
                  )}
                </>
              )}
              <ModBtn icon={actingOn.locked ? Unlock : Lock}
                label={actingOn.locked ? "Unlock seat" : "Lock seat"}
                onClick={() => lockSeat(actingOn)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Announcement editor ────────────────────────────────────────────────── */}
      {showAnnouncement && isMod && (
        <div className="fixed inset-0 z-[85] bg-black/75 backdrop-blur-md flex items-center justify-center px-4 animate-fade-up"
          onClick={() => setShowAnnouncement(false)}>
          <div className="w-full max-w-md glass-strong rounded-3xl p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="h-5 w-5 text-electric" />
              <h3 className="font-bold">Room Announcement</h3>
            </div>
            <textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="Type a pinned announcement for all members…"
              rows={3}
              className="w-full glass rounded-2xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-electric resize-none placeholder:text-muted-foreground"
            />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={() => { setAnnouncementText(""); saveAnnouncement(); }}
                className="h-11 rounded-2xl glass text-sm font-semibold text-muted-foreground active:scale-95">
                Clear
              </button>
              <button onClick={saveAnnouncement}
                className="h-11 rounded-2xl gradient-electric text-white text-sm font-bold shadow-glow-soft active:scale-95">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Panels / sheets ────────────────────────────────────────────────────── */}
      {showRequests && (
        <SeatRequestsPanel
          requests={seatRequests}
          onApprove={approveSeatRequest}
          onDeny={denySeatRequest}
          onClose={() => setShowRequests(false)}
        />
      )}

      {showMembers && (
        <MembersSheet
          members={members} seats={seats}
          onClose={() => setShowMembers(false)}
          currentUserId={user?.id}
          onSelectUser={(member) => { setShowMembers(false); setSelectedMember(member); }}
        />
      )}

      {selectedMember && (
        <UserProfilePopup
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          isCurrentUser={selectedMember.user_id === user?.id}
          canModerate={!!isMod}
          currentUserRole={meMember?.role}
          availableSeats={seats}
          onKick={isMod && selectedMember.role !== "owner" ? () => handleMemberKick(selectedMember) : undefined}
          onMute={isMod && selectedMember.role !== "owner" ? () => handleMemberMute(selectedMember) : undefined}
          onPromote={(isOwner || meMember?.role === "co_owner") && selectedMember.role !== "owner" && selectedMember.role !== "co_owner"
            ? (role) => handleMemberPromote(selectedMember, role) : undefined}
          onDemote={(isOwner || meMember?.role === "co_owner") &&
            (selectedMember.role === "admin" || selectedMember.role === "vip" || (isOwner && selectedMember.role === "co_owner"))
            ? () => handleMemberDemote(selectedMember) : undefined}
          onBan={(isOwner || meMember?.role === "co_owner") && selectedMember.role !== "owner"
            ? (reason) => handleBanUser(selectedMember, reason) : undefined}
          onInviteToSeat={isMod ? (seatIndex) => handleInviteToSeat(selectedMember, seatIndex) : undefined}
        />
      )}

      {showRoomInfo && (
        <RoomInfoPanel
          room={room} members={members} memberCount={members.length}
          isMod={!!isMod} isOwner={isOwner} currentUserRole={meMember?.role}
          onClose={() => setShowRoomInfo(false)}
          onDelete={deleteRoom} onMuteAll={muteAll}
        />
      )}

      {/* ── Leave confirm ──────────────────────────────────────────────────────── */}
      {confirmLeave && (
        <div className="fixed inset-0 z-[95] bg-black/75 backdrop-blur-md grid place-items-center px-6 animate-fade-up"
          onClick={() => setConfirmLeave(false)}>
          <div className="w-full max-w-sm glass-strong rounded-3xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto h-12 w-12 rounded-full gradient-electric grid place-items-center shadow-glow mb-3">
              <LogOut className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-lg">Leave Room?</h3>
            <p className="text-xs text-muted-foreground mt-1">The vibe will miss you.</p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button onClick={() => setConfirmLeave(false)}
                className="h-11 rounded-2xl glass text-sm font-semibold active:scale-95">Stay</button>
              <button onClick={leaveRoom}
                className="h-11 rounded-2xl bg-[oklch(0.3_0.15_25)] text-[oklch(0.9_0.18_30)] text-sm font-semibold active:scale-95">Leave</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ModBtn({ icon: Icon, label, onClick, danger }: {
  icon: any; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`glass rounded-2xl py-3 flex flex-col items-center gap-1 active:scale-95 ${danger ? "text-[oklch(0.8_0.2_25)]" : ""}`}>
      <Icon className="h-4 w-4" />
      <span className="text-[11px]">{label}</span>
    </button>
  );
}

function SeatView({ seat, host, speaking, isMe, onTake, onSelf, onProfile, onModerate, onLockToggle }: {
  seat: DBSeat; host?: boolean; speaking?: boolean; isMe?: boolean;
  onTake: () => void; onSelf: () => void;
  onProfile?: () => void; onModerate?: () => void; onLockToggle?: () => void;
}) {
  const size   = host ? "h-28 w-28" : "h-[5.35rem] w-[5.35rem]";
  const seatNum = `NO.${seat.seat_index}`;

  if (!seat.user_id) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={seat.locked ? onLockToggle : onTake}
          className={`relative ${size} rounded-full grid place-items-center border transition-transform active:scale-95 ${
            host
              ? "border-electric/60 bg-[radial-gradient(circle_at_center,oklch(0.2_0.07_260),oklch(0.11_0.025_270))] shadow-glow"
              : "border-electric/30 bg-[linear-gradient(180deg,oklch(0.17_0.045_270),oklch(0.11_0.02_270))]"
          } ${seat.locked ? "opacity-55" : ""}`}
        >
          {host && (
            <span className="absolute -top-2 h-8 w-8 rounded-full grid place-items-center gradient-electric text-background shadow-glow-soft">
              <Crown className="h-4 w-4" />
            </span>
          )}
          {seat.locked ? (
            <Lock className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Plus className={`${host ? "h-7 w-7 text-electric" : "h-5 w-5 text-electric"}`} />
          )}
        </button>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] ${
          host ? "border-electric/40 text-electric" : "border-white/8 text-muted-foreground"
        }`}>
          {seat.locked ? "LOCKED" : host ? "HOST SEAT" : seatNum}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        {speaking && <span className="absolute -inset-1.5 rounded-full animate-pulse-ring" />}
        <button
          onClick={isMe ? onSelf : (onProfile ?? onModerate)}
          className={`relative ${size} rounded-full p-[3px] ${
            speaking ? "gradient-electric shadow-glow" : "bg-[linear-gradient(180deg,oklch(0.74_0.27_350),oklch(0.55_0.22_295))]"
          } active:scale-95`}
        >
          {host ? (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,oklch(0.2_0.06_280),oklch(0.1_0.025_270))] text-electric">
              <Crown className="h-8 w-8" />
            </div>
          ) : (
            <img src={seat.avatar ?? defaultAvatar(seat.username ?? "u")} alt=""
              className="h-full w-full rounded-full object-cover" />
          )}
        </button>

        {host && (
          <span className="absolute -top-2 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full grid place-items-center gradient-electric text-background shadow-glow-soft">
            <Crown className="h-4 w-4" />
          </span>
        )}

        <span className={`absolute bottom-0 right-0 h-6 w-6 rounded-full grid place-items-center ${
          seat.muted ? "bg-[oklch(0.36_0.18_20)]" : "gradient-electric"
        } ring-2 ring-background`}>
          {seat.muted ? <MicOff className="h-2.5 w-2.5 text-muted-foreground" /> : <Mic className="h-2.5 w-2.5 text-white" />}
        </span>

        {onModerate && !isMe && (
          <button
            onClick={(e) => { e.stopPropagation(); onModerate(); }}
            className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-black/70 grid place-items-center z-10"
          >
            <MoreVertical className="h-3 w-3" />
          </button>
        )}
      </div>

      {!host && (
        <span className="text-xs font-medium leading-none truncate max-w-[84px] text-center">
          {seat.username}{isMe ? " (you)" : ""}
        </span>
      )}
      {host && <span className="text-[10px] tracking-[0.16em] text-electric font-semibold">HOST</span>}
    </div>
=======
  
  return (
    <Suspense fallback={
      <AppShell hideNav>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-electric" />
            <p className="text-sm text-muted-foreground mt-4">Loading room...</p>
          </div>
        </div>
      </AppShell>
    }>
      <VoiceRoomContent />
    </Suspense>
>>>>>>> 2b86bdf694afc9a39da1ec01f7bb0e0f16362545
  );
}
