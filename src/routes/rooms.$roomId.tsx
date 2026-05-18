import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Crown,
  Mic,
  MicOff,
  Plus,
  Lock,
  Unlock,
  Send,
  Gift,
  Smile,
  Users,
  LogOut,
  MoreVertical,
  Shield,
  UserMinus,
  Trash2,
  Eye,
  VolumeX,
  Volume2,
  BellRing,
  Menu,
} from "lucide-react";
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
import { MembersSheet } from "@/components/MembersSheet";
import { UserProfilePopup } from "@/components/UserProfilePopup";
import { RoomInfoPanel } from "@/components/RoomInfoPanel";

export const Route = createFileRoute("/rooms/$roomId")({
  component: RoomPage,
});

const GIFTS = [
  { name: "Rose",   emoji: "🌹" },
  { name: "Coffee", emoji: "☕" },
  { name: "Heart",  emoji: "💖" },
  { name: "Mic",    emoji: "🎤" },
  { name: "Crown",  emoji: "👑" },
];

function RoomPage() {
  const { roomId } = Route.useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const mintToken = useServerFn(getAgoraToken);

  const [room, setRoom]         = useState<DBRoom | null>(null);
  const [seats, setSeats]       = useState<DBSeat[]>([]);
  const [members, setMembers]   = useState<DBMember[]>([]);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [joined, setJoined]     = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pwInput, setPwInput]   = useState("");
  const [text, setText]         = useState("");
  const [showGifts, setShowGifts]     = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [selectedMember, setSelectedMember] = useState<DBMember | null>(null);
  const [floatGift, setFloatGift]   = useState<string | null>(null);
  const [speakingUids, setSpeakingUids] = useState<Set<number>>(new Set());
  const [micOn, setMicOn]       = useState(true);
  const [actingOn, setActingOn] = useState<DBSeat | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [joinNotif, setJoinNotif] = useState<string | null>(null);

  const prevMemberIds = useRef<Set<string>>(new Set());
  const chatEnd       = useRef<HTMLDivElement>(null);

  const meMember = useMemo(
    () => members.find((m) => m.user_id === user?.id),
    [members, user?.id],
  );
  const mySeat = useMemo(
    () => seats.find((s) => s.user_id === user?.id),
    [seats, user?.id],
  );
  const isOwner = meMember?.role === "owner";
  const isMod   = meMember && ["owner", "co_owner", "admin"].includes(meMember.role);

  const clientRef   = useRef<any>(null);
  const localTrackRef = useRef<any>(null);
  const micPermRef  = useRef<MediaStream | null>(null);

  // ── Load room + privacy check ──────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle();
      if (!alive) return;
      if (error || !data) { toast.error("Room not found"); navigate({ to: "/rooms" }); return; }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user?.id]);

  // ── Load + subscribe seats / members / messages ────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const loadAll = async () => {
      const [{ data: s }, { data: mb }, { data: ms }] = await Promise.all([
        supabase.from("room_seats").select("*").eq("room_id", roomId).order("seat_index"),
        supabase.from("room_members").select("*").eq("room_id", roomId),
        supabase.from("room_messages").select("*").eq("room_id", roomId)
          .order("created_at", { ascending: true }).limit(80),
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
      .on("postgres_changes", { event: "*", schema: "public", table: "room_seats",   filter: `room_id=eq.${roomId}` }, () => loadAll())
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

  // Auto-scroll chat
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, room?.id, !!mySeat, user?.id]);

  // ── Actions ────────────────────────────────────────────────────────────
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
    const body = text.trim(); setText("");
    await supabase.from("room_messages").insert({
      room_id: roomId, user_id: user.id, username: profile.username,
      avatar: profile.profile_image ?? defaultAvatar(profile.username),
      text: body, kind: "text",
    });
  };

  const sendGift = async (emoji: string) => {
    if (!user || !profile) return;
    setShowGifts(false); setFloatGift(emoji);
    setTimeout(() => setFloatGift(null), 2000);
    await supabase.from("room_messages").insert({
      room_id: roomId, user_id: user.id, username: profile.username,
      avatar: profile.profile_image ?? defaultAvatar(profile.username),
      kind: "gift", gift_emoji: emoji, text: null,
    });
  };

  // Mod actions
  const kickSeat      = async (seat: DBSeat) => {
    await supabase.from("room_seats")
      .update({ user_id: null, username: null, avatar: null, joined_at: null, muted: false })
      .eq("room_id", roomId).eq("seat_index", seat.seat_index);
    setActingOn(null);
  };
  const muteSeat      = async (seat: DBSeat) => {
    await supabase.from("room_seats").update({ muted: !seat.muted })
      .eq("room_id", roomId).eq("seat_index", seat.seat_index);
    setActingOn(null);
  };
  const lockSeat      = async (seat: DBSeat) => {
    await supabase.from("room_seats").update({ locked: !seat.locked })
      .eq("room_id", roomId).eq("seat_index", seat.seat_index);
    setActingOn(null);
  };
  const kickFromRoom  = async (seat: DBSeat) => {
    if (!seat.user_id) return;
    await kickSeat(seat);
    await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", seat.user_id);
    setActingOn(null);
  };
  const promote       = async (seat: DBSeat, role: "co_owner" | "admin") => {
    if (!seat.user_id) return;
    await supabase.from("room_members").update({ role }).eq("room_id", roomId).eq("user_id", seat.user_id);
    toast.success(`Promoted to ${role.replace("_", "-")}`);
    setActingOn(null);
  };
  const muteAll       = async () => {
    const occ = seats.filter((s) => s.user_id && s.user_id !== user?.id);
    await Promise.all(occ.map((s) =>
      supabase.from("room_seats").update({ muted: true }).eq("room_id", roomId).eq("seat_index", s.seat_index)
    ));
    toast.success("All users muted");
  };
  const deleteRoom    = async () => {
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
  const handleMemberPromote = async (member: DBMember, role: "co_owner" | "admin") => {
    await supabase.from("room_members").update({ role }).eq("room_id", roomId).eq("user_id", member.user_id);
    toast.success(`Promoted to ${role.replace("_", "-")}`);
  };
  const handleMemberDemote  = async (member: DBMember) => {
    await supabase.from("room_members").update({ role: "member" }).eq("room_id", roomId).eq("user_id", member.user_id);
    toast.success(`${member.username} role removed`);
  };

  const openProfileForUserId = (userId: string) => {
    const member = members.find((m) => m.user_id === userId);
    if (member) setSelectedMember(member);
  };

  // ── Render gates ───────────────────────────────────────────────────────
  if (!room) {
    return (
      <AppShell>
        <div className="pt-24 text-center text-sm text-muted-foreground">Loading room…</div>
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
          </div>
        </div>
      </AppShell>
    );
  }

  const hostSeat = seats.find((s) => s.seat_index === 0);
  const restSeats = seats.filter((s) => s.seat_index !== 0).sort((a, b) => a.seat_index - b.seat_index);
  const bannerUrl = resolveBanner(room.banner);

  return (
    <AppShell hideNav>
      {/* Join notification */}
      {joinNotif && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] animate-fade-up pointer-events-none">
          <div className="glass-strong rounded-full px-4 py-2 flex items-center gap-2 shadow-card">
            <BellRing className="h-3.5 w-3.5 text-electric animate-pulse" />
            <span className="text-xs font-medium">{joinNotif} joined the room</span>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="px-4 pt-12 pb-3 flex items-start gap-2.5 animate-fade-up">
        <button onClick={() => setConfirmLeave(true)}
          className="h-10 w-10 rounded-full glass grid place-items-center active:scale-95" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-[1.1rem] leading-tight truncate">{room.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="glass rounded-full px-2.5 py-1">{room.category}</span>
            <button
              onClick={() => setShowMembers(true)}
              className="glass rounded-full px-2.5 py-1 flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <Eye className="h-3 w-3 text-electric" />
              <span className="text-electric font-semibold">{members.length}</span>
              <span>Members</span>
            </button>
            <span className="glass rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.2_150)] animate-pulse" />
              Live
            </span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowRoomInfo(true)}
            className="h-10 w-10 rounded-full glass grid place-items-center active:scale-95"
            title="Room info"
          >
            <Users className="h-4 w-4 text-electric" />
          </button>
        </div>
      </header>

      {/* Stage */}
      <section className="relative px-4 mt-3">
        <div className="relative rounded-[2rem] border border-white/8 overflow-hidden shadow-card">
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

          {/* Decorative rings */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,oklch(0.62_0.26_255/.22),transparent_72%)]" />
            <div className="absolute left-1/2 top-[7.4rem] h-[11rem] w-[18rem] -translate-x-1/2 rounded-[50%] border border-electric/14" />
            <div className="absolute left-1/2 top-[8.9rem] h-[14rem] w-[21rem] -translate-x-1/2 rounded-[50%] border border-electric/10" />
            <div className="absolute left-1/2 top-[10.5rem] h-[17rem] w-[24rem] -translate-x-1/2 rounded-[50%] border border-electric/6" />
          </div>

          <div className="relative px-4 pt-6 pb-7">
            {/* Host seat */}
            <div className="flex justify-center mb-7">
              {hostSeat && (
                <SeatView
                  seat={hostSeat}
                  host
                  speaking={!!hostSeat.user_id && speakingUids.has(uidFromUserId(hostSeat.user_id))}
                  onTake={() => takeSeat(hostSeat)}
                  onSelf={leaveSeat}
                  isMe={hostSeat.user_id === user?.id}
                  onProfile={hostSeat.user_id && hostSeat.user_id !== user?.id
                    ? () => openProfileForUserId(hostSeat.user_id!)
                    : undefined}
                  onModerate={isMod && hostSeat.user_id && hostSeat.user_id !== user?.id
                    ? () => setActingOn(hostSeat) : undefined}
                />
              )}
            </div>

            {/* Other seats grid */}
            <div className="relative grid grid-cols-3 gap-y-6 gap-x-2 place-items-center">
              {restSeats.map((s) => (
                <SeatView
                  key={s.seat_index}
                  seat={s}
                  speaking={!!s.user_id && speakingUids.has(uidFromUserId(s.user_id))}
                  onTake={() => takeSeat(s)}
                  onSelf={leaveSeat}
                  isMe={s.user_id === user?.id}
                  onProfile={s.user_id && s.user_id !== user?.id
                    ? () => openProfileForUserId(s.user_id!)
                    : undefined}
                  onModerate={isMod && s.user_id && s.user_id !== user?.id
                    ? () => setActingOn(s) : undefined}
                  onLockToggle={isMod && !s.user_id ? () => lockSeat(s) : undefined}
                />
              ))}
            </div>

            {/* Floating gifts */}
            {floatGift && (
              <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-10">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="absolute text-4xl animate-float-up"
                    style={{ left: `${40 + i * 8}%`, animationDelay: `${i * 0.2}s` }}
                  >
                    {floatGift}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Chat */}
      <section className="px-5 mt-5 space-y-2 max-h-52 overflow-y-auto no-scrollbar pb-2">
        {messages.length === 0 && (
          <p className="text-center text-[11px] text-muted-foreground py-3">Say hi to start the vibe ✨</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-2 animate-fade-up">
            <img
              src={m.avatar ?? defaultAvatar(m.username)}
              alt=""
              className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0 cursor-pointer"
              onClick={() => {
                const mem = members.find((mb) => mb.user_id === m.user_id);
                if (mem) setSelectedMember(mem);
              }}
            />
            <div className="glass rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
              <button
                className="text-[10px] text-electric font-semibold hover:underline"
                onClick={() => {
                  const mem = members.find((mb) => mb.user_id === m.user_id);
                  if (mem) setSelectedMember(mem);
                }}
              >
                {m.username}
              </button>
              {m.kind === "gift" ? (
                <p className="text-2xl leading-snug">{m.gift_emoji}</p>
              ) : (
                <p className="text-sm leading-snug break-words">{m.text}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEnd} />
      </section>

      {/* Gift picker */}
      {showGifts && (
        <div className="fixed bottom-36 left-0 right-0 z-40 px-5 animate-fade-up">
          <div className="mx-auto max-w-md glass-strong rounded-3xl p-4 shadow-card">
            <p className="text-sm font-bold mb-3">Send a Gift</p>
            <div className="grid grid-cols-5 gap-2">
              {GIFTS.map((g) => (
                <button key={g.name} onClick={() => sendGift(g.emoji)}
                  className="glass rounded-2xl py-3 flex flex-col items-center gap-1 active:scale-95">
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{g.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Composer + bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pb-safe">
        <div className="px-4 pb-5 pt-2">
          <div className="mx-auto max-w-md glass-strong rounded-full pl-2 pr-1 h-12 flex items-center gap-1.5 shadow-card border border-white/8">
            {/* Mic toggle if on seat, else emoji */}
            {mySeat ? (
              <button onClick={toggleMic}
                className={`h-10 w-10 rounded-full grid place-items-center active:scale-95 flex-shrink-0 ${
                  micOn ? "gradient-electric shadow-glow-soft" : "bg-white/10"
                }`}
              >
                {micOn ? <Mic className="h-4 w-4 text-white" /> : <MicOff className="h-4 w-4 text-muted-foreground" />}
              </button>
            ) : (
              <button className="h-10 w-10 rounded-full glass grid place-items-center flex-shrink-0">
                <Smile className="h-4 w-4 text-muted-foreground" />
              </button>
            )}

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMsg()}
              placeholder="Say something nice…"
              className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />

            {/* Gift */}
            <button onClick={() => setShowGifts((s) => !s)}
              className="h-9 w-9 rounded-full bg-[oklch(0.7_0.27_350)]/20 text-[oklch(0.8_0.2_350)] grid place-items-center active:scale-95 flex-shrink-0">
              <Gift className="h-4 w-4" />
            </button>

            {/* ☰ Room Info — key feature button */}
            <button
              onClick={() => setShowRoomInfo(true)}
              className="h-9 w-9 rounded-full glass grid place-items-center active:scale-95 flex-shrink-0"
              title="Room info & settings"
            >
              <Menu className="h-4 w-4 text-electric" />
            </button>

            {/* Send */}
            <button onClick={sendMsg}
              className="h-10 w-10 rounded-full gradient-electric grid place-items-center shadow-glow-soft active:scale-95 flex-shrink-0">
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Seat moderation sheet */}
      {actingOn && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md flex items-end justify-center animate-fade-up"
          onClick={() => setActingOn(null)}>
          <div className="w-full max-w-md glass-strong rounded-t-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={actingOn.avatar ?? defaultAvatar(actingOn.username ?? "u")}
                alt="" className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-bold">{actingOn.username ?? "Empty seat"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {actingOn.seat_index === 0 ? "Host seat" : `Seat ${actingOn.seat_index}`}
                  {actingOn.user_id && (() => {
                    const m = members.find((mb) => mb.user_id === actingOn.user_id);
                    if (!m) return "";
                    const labels: Record<string, string> = { co_owner: " · Co-owner", admin: " · Admin", member: "" };
                    return labels[m.role] ?? "";
                  })()}
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

      {/* Members sheet */}
      {showMembers && (
        <MembersSheet
          members={members}
          onClose={() => setShowMembers(false)}
          currentUserId={user?.id}
          onSelectUser={(member) => { setShowMembers(false); setSelectedMember(member); }}
        />
      )}

      {/* User profile popup */}
      {selectedMember && (
        <UserProfilePopup
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          isCurrentUser={selectedMember.user_id === user?.id}
          canModerate={!!isMod}
          currentUserRole={meMember?.role}
          onKick={isMod && selectedMember.role !== "owner" ? () => handleMemberKick(selectedMember) : undefined}
          onMute={isMod && selectedMember.role !== "owner" ? () => handleMemberMute(selectedMember) : undefined}
          onPromote={(isOwner || meMember?.role === "co_owner") && selectedMember.role === "member"
            ? (role) => handleMemberPromote(selectedMember, role) : undefined}
          onDemote={(isOwner || meMember?.role === "co_owner") &&
            (selectedMember.role === "admin" || (isOwner && selectedMember.role === "co_owner"))
            ? () => handleMemberDemote(selectedMember) : undefined}
        />
      )}

      {/* Room info panel — opened from ☰ button */}
      {showRoomInfo && (
        <RoomInfoPanel
          room={room}
          members={members}
          memberCount={members.length}
          isMod={!!isMod}
          isOwner={isOwner}
          onClose={() => setShowRoomInfo(false)}
          onDelete={deleteRoom}
          onMuteAll={muteAll}
        />
      )}

      {/* Leave confirm */}
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

// ── Sub-components ─────────────────────────────────────────────────────────────

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

function SeatView({
  seat, host, speaking, isMe, onTake, onSelf, onProfile, onModerate, onLockToggle,
}: {
  seat: DBSeat;
  host?: boolean;
  speaking?: boolean;
  isMe?: boolean;
  onTake: () => void;
  onSelf: () => void;
  onProfile?: () => void;
  onModerate?: () => void;
  onLockToggle?: () => void;
}) {
  const size = host ? "h-28 w-28" : "h-[5.35rem] w-[5.35rem]";
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
            <span className="absolute -top-2 h-8 w-8 rounded-full grid place-items-center bg-electric text-background shadow-glow-soft">
              <Crown className="h-4 w-4" />
            </span>
          )}
          {seat.locked ? (
            <div className="flex flex-col items-center gap-1">
              <Lock className="h-4 w-4 text-muted-foreground" />
              {!host && <div className="flex gap-0.5">{[0,1,2].map(i => <span key={i} className="h-1 w-3 rounded-full bg-white/15" />)}</div>}
            </div>
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
        {/* Avatar / icon — tappable for profile */}
        <button
          onClick={isMe ? onSelf : (onProfile ?? onModerate)}
          className={`relative ${size} rounded-full p-[3px] ${
            speaking ? "gradient-electric shadow-glow" : "bg-[linear-gradient(180deg,oklch(0.72_0.22_255),oklch(0.5_0.17_255))]"
          } active:scale-95`}
        >
          {host ? (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,oklch(0.2_0.06_255),oklch(0.1_0.025_270))] text-electric">
              <Crown className="h-8 w-8" />
            </div>
          ) : (
            <img src={seat.avatar ?? defaultAvatar(seat.username ?? "u")} alt=""
              className="h-full w-full rounded-full object-cover" />
          )}
        </button>

        {/* Crown badge for host */}
        {host && (
          <span className="absolute -top-2 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full grid place-items-center bg-electric text-background shadow-glow-soft">
            <Crown className="h-4 w-4" />
          </span>
        )}

        {/* Mic indicator */}
        <span className={`absolute bottom-0 right-0 h-6 w-6 rounded-full grid place-items-center ${
          seat.muted ? "bg-[oklch(0.36_0.18_20)]" : "bg-electric"
        } ring-2 ring-background`}>
          {seat.muted ? <MicOff className="h-2.5 w-2.5 text-muted-foreground" /> : <Mic className="h-2.5 w-2.5 text-white" />}
        </span>

        {/* Mod ⋮ button */}
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
  );
}
