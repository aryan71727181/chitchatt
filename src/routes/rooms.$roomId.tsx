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
  Settings,
  LogOut,
  MoreVertical,
  Shield,
  UserMinus,
  Trash2,
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
} from "@/lib/rooms";
import { toast } from "sonner";

export const Route = createFileRoute("/rooms/$roomId")({
  component: RoomPage,
});

const GIFTS = [
  { name: "Rose", emoji: "🌹" },
  { name: "Coffee", emoji: "☕" },
  { name: "Heart", emoji: "💖" },
  { name: "Mic", emoji: "🎤" },
  { name: "Crown", emoji: "👑" },
];

function RoomPage() {
  const { roomId } = Route.useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const mintToken = useServerFn(getAgoraToken);

  const [room, setRoom] = useState<DBRoom | null>(null);
  const [seats, setSeats] = useState<DBSeat[]>([]);
  const [members, setMembers] = useState<DBMember[]>([]);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [joined, setJoined] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [text, setText] = useState("");
  const [showGifts, setShowGifts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [floatGift, setFloatGift] = useState<string | null>(null);
  const [speakingUids, setSpeakingUids] = useState<Set<number>>(new Set());
  const [micOn, setMicOn] = useState(true);
  const [actingOn, setActingOn] = useState<DBSeat | null>(null);

  const meMember = useMemo(
    () => members.find((m) => m.user_id === user?.id),
    [members, user?.id],
  );
  const mySeat = useMemo(
    () => seats.find((s) => s.user_id === user?.id),
    [seats, user?.id],
  );
  const isOwner = meMember?.role === "owner";
  const isMod = meMember && ["owner", "co_owner", "admin"].includes(meMember.role);
  const chatEnd = useRef<HTMLDivElement>(null);

  // Agora refs
  const clientRef = useRef<any>(null);
  const localTrackRef = useRef<any>(null);

  // ---------- Load room + check privacy ----------
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
      // already member?
      if (user) {
        const { data: m } = await supabase
          .from("room_members")
          .select("*")
          .eq("room_id", roomId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (m) {
          setJoined(true);
        } else if ((data as DBRoom).privacy === "private") {
          setNeedsPassword(true);
        } else {
          await joinRoom();
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user?.id]);

  // ---------- Load + subscribe to seats / members / messages ----------
  useEffect(() => {
    if (!roomId) return;
    const loadAll = async () => {
      const [{ data: s }, { data: mb }, { data: ms }] = await Promise.all([
        supabase.from("room_seats").select("*").eq("room_id", roomId).order("seat_index"),
        supabase.from("room_members").select("*").eq("room_id", roomId),
        supabase
          .from("room_messages")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true })
          .limit(80),
      ]);
      setSeats((s ?? []) as DBSeat[]);
      setMembers((mb ?? []) as DBMember[]);
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

    return () => {
      supabase.removeChannel(ch);
    };
  }, [roomId, navigate]);

  // Auto-scroll chat
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // Detect if I got kicked / left
  useEffect(() => {
    if (!joined || !user) return;
    if (members.length > 0 && !members.find((m) => m.user_id === user.id)) {
      toast("You left the room");
      navigate({ to: "/rooms" });
    }
  }, [members, joined, user, navigate]);

  // ---------- Agora voice ----------
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
        const { token, appId } = await mintToken({
          data: { channel: room.id, uid, publisher },
        });
        await client.join(appId, room.id, token, uid);

        client.on("user-published", async (remoteUser: any, mediaType: string) => {
          await client.subscribe(remoteUser, mediaType);
          if (mediaType === "audio") remoteUser.audioTrack?.play();
        });

        client.enableAudioVolumeIndicator();
        client.on("volume-indicator", (vols: any[]) => {
          const speaking = new Set<number>();
          vols.forEach((v) => {
            if (v.level > 5) speaking.add(Number(v.uid));
          });
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
      try {
        localTrackRef.current?.stop();
        localTrackRef.current?.close();
      } catch {}
      try {
        client?.leave();
      } catch {}
      localTrackRef.current = null;
      clientRef.current = null;
      setSpeakingUids(new Set());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, room?.id, !!mySeat, user?.id]);

  // ---------- Actions ----------
  const joinRoom = async (pw?: string) => {
    if (!user || !profile) return;
    if (!room) return;
    if (room.privacy === "private" && room.password_hash && pw !== room.password_hash) {
      toast.error("Wrong password");
      return;
    }
    const { error } = await supabase.from("room_members").insert({
      room_id: roomId,
      user_id: user.id,
      username: profile.username,
      avatar: profile.profile_image ?? defaultAvatar(profile.username),
      role: "member",
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
    // free seat first
    if (mySeat) {
      await supabase
        .from("room_seats")
        .update({ user_id: null, username: null, avatar: null, joined_at: null, muted: false })
        .eq("room_id", roomId)
        .eq("seat_index", mySeat.seat_index);
    }
    await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", user.id);
    navigate({ to: "/rooms" });
  };

  const takeSeat = async (seat: DBSeat) => {
    if (!user || !profile) return;
    if (seat.user_id) return;
    if (seat.locked) return toast("Seat is locked");
    if (mySeat) {
      // move: free old, claim new in two ops
      await supabase
        .from("room_seats")
        .update({ user_id: null, username: null, avatar: null, joined_at: null, muted: false })
        .eq("room_id", roomId)
        .eq("seat_index", mySeat.seat_index);
    }
    const { error } = await supabase
      .from("room_seats")
      .update({
        user_id: user.id,
        username: profile.username,
        avatar: profile.profile_image ?? defaultAvatar(profile.username),
        joined_at: new Date().toISOString(),
        muted: false,
      })
      .eq("room_id", roomId)
      .eq("seat_index", seat.seat_index);
    if (error) toast.error(error.message);
  };

  const leaveSeat = async () => {
    if (!mySeat) return;
    await supabase
      .from("room_seats")
      .update({ user_id: null, username: null, avatar: null, joined_at: null, muted: false })
      .eq("room_id", roomId)
      .eq("seat_index", mySeat.seat_index);
  };

  const toggleMic = async () => {
    if (!localTrackRef.current) return;
    const newOn = !micOn;
    await localTrackRef.current.setEnabled(newOn);
    setMicOn(newOn);
    if (mySeat) {
      await supabase
        .from("room_seats")
        .update({ muted: !newOn })
        .eq("room_id", roomId)
        .eq("seat_index", mySeat.seat_index);
    }
  };

  const sendMsg = async () => {
    if (!text.trim() || !user || !profile) return;
    const body = text.trim();
    setText("");
    await supabase.from("room_messages").insert({
      room_id: roomId,
      user_id: user.id,
      username: profile.username,
      avatar: profile.profile_image ?? defaultAvatar(profile.username),
      text: body,
      kind: "text",
    });
  };

  const sendGift = async (emoji: string) => {
    if (!user || !profile) return;
    setShowGifts(false);
    setFloatGift(emoji);
    setTimeout(() => setFloatGift(null), 2000);
    await supabase.from("room_messages").insert({
      room_id: roomId,
      user_id: user.id,
      username: profile.username,
      avatar: profile.profile_image ?? defaultAvatar(profile.username),
      kind: "gift",
      gift_emoji: emoji,
      text: null,
    });
  };

  // Owner / mod actions
  const kickSeat = async (seat: DBSeat) => {
    await supabase
      .from("room_seats")
      .update({ user_id: null, username: null, avatar: null, joined_at: null, muted: false })
      .eq("room_id", roomId)
      .eq("seat_index", seat.seat_index);
    setActingOn(null);
  };
  const muteSeat = async (seat: DBSeat) => {
    await supabase.from("room_seats").update({ muted: !seat.muted }).eq("room_id", roomId).eq("seat_index", seat.seat_index);
    setActingOn(null);
  };
  const lockSeat = async (seat: DBSeat) => {
    await supabase.from("room_seats").update({ locked: !seat.locked }).eq("room_id", roomId).eq("seat_index", seat.seat_index);
    setActingOn(null);
  };
  const kickFromRoom = async (seat: DBSeat) => {
    if (!seat.user_id) return;
    await kickSeat(seat);
    await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", seat.user_id);
    setActingOn(null);
  };
  const promote = async (seat: DBSeat, role: "co_owner" | "admin") => {
    if (!seat.user_id) return;
    await supabase.from("room_members").update({ role }).eq("room_id", roomId).eq("user_id", seat.user_id);
    toast.success(`Promoted to ${role.replace("_", "-")}`);
    setActingOn(null);
  };
  const deleteRoom = async () => {
    if (!isOwner) return;
    await supabase.from("rooms").delete().eq("id", roomId);
    navigate({ to: "/rooms" });
  };

  // ---------- Render gates ----------
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
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              type="password"
              className="mt-4 w-full glass rounded-2xl h-11 px-4 text-sm outline-none focus:ring-1 focus:ring-electric text-center"
              placeholder="••••••"
            />
            <button
              onClick={() => joinRoom(pwInput)}
              className="mt-3 w-full h-11 rounded-2xl gradient-electric text-white font-semibold shadow-glow active:scale-[0.98]"
            >
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

  const owner = seats.find((s) => s.seat_index === 0);
  const rest = seats.filter((s) => s.seat_index !== 0).sort((a, b) => a.seat_index - b.seat_index);

  return (
    <AppShell>
      {/* Top bar */}
      <header className="px-4 pt-12 pb-3 flex items-center gap-2.5 animate-fade-up">
        <button
          onClick={leaveRoom}
          className="h-10 w-10 rounded-full glass grid place-items-center active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base leading-tight truncate">{room.name}</h1>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.2_150)] animate-pulse" />
            <Users className="h-3 w-3" /> {room.listener_count} · {room.category}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowSettings(true)}
            className="h-10 w-10 rounded-full glass grid place-items-center active:scale-95"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={leaveRoom}
          className="px-3.5 h-10 rounded-full bg-[oklch(0.3_0.15_25)] text-[oklch(0.85_0.18_30)] text-xs font-semibold active:scale-95"
        >
          Leave
        </button>
      </header>

      {/* Stage */}
      <section className="relative px-5 mt-3">
        <div className="relative glass-strong rounded-3xl p-6 shadow-card overflow-hidden">
          <div className="absolute -top-20 -left-10 h-48 w-48 rounded-full bg-electric/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-[oklch(0.6_0.28_295)]/25 blur-3xl" />

          {/* Owner seat */}
          <div className="relative flex justify-center mb-6">
            {owner && (
              <SeatView
                seat={owner}
                host
                speaking={!!owner.user_id && speakingUids.has(uidFromUserId(owner.user_id))}
                onTake={() => takeSeat(owner)}
                onSelf={leaveSeat}
                isMe={owner.user_id === user?.id}
                onModerate={isMod && owner.user_id !== user?.id ? () => setActingOn(owner) : undefined}
              />
            )}
          </div>

          <div className="relative grid grid-cols-3 gap-y-5 gap-x-2 place-items-center">
            {rest.map((s) => (
              <SeatView
                key={s.seat_index}
                seat={s}
                speaking={!!s.user_id && speakingUids.has(uidFromUserId(s.user_id))}
                onTake={() => takeSeat(s)}
                onSelf={leaveSeat}
                isMe={s.user_id === user?.id}
                onModerate={isMod && s.user_id && s.user_id !== user?.id ? () => setActingOn(s) : undefined}
                onLockToggle={isMod && !s.user_id ? () => lockSeat(s) : undefined}
              />
            ))}
          </div>

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
      </section>

      {/* Chat */}
      <section className="px-5 mt-5 space-y-2 max-h-56 overflow-y-auto no-scrollbar pb-2">
        {messages.length === 0 && (
          <p className="text-center text-[11px] text-muted-foreground py-3">Say hi to start the vibe ✨</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-2 animate-fade-up">
            <img
              src={m.avatar ?? defaultAvatar(m.username)}
              alt=""
              className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10"
            />
            <div className="glass rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
              <p className="text-[10px] text-electric font-semibold">{m.username}</p>
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

      {/* Gifts */}
      {showGifts && (
        <div className="fixed bottom-36 left-0 right-0 z-40 px-5 animate-fade-up">
          <div className="mx-auto max-w-md glass-strong rounded-3xl p-4 shadow-card">
            <p className="text-sm font-bold mb-3">Send a Gift</p>
            <div className="grid grid-cols-5 gap-2">
              {GIFTS.map((g) => (
                <button
                  key={g.name}
                  onClick={() => sendGift(g.emoji)}
                  className="glass rounded-2xl py-3 flex flex-col items-center gap-1 active:scale-95"
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{g.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="fixed bottom-24 left-0 right-0 z-30 px-4">
        <div className="mx-auto max-w-md glass-strong rounded-full pl-2 pr-1 h-12 flex items-center gap-2 shadow-card">
          {mySeat && (
            <button
              onClick={toggleMic}
              className={`h-10 w-10 rounded-full grid place-items-center active:scale-95 ${
                micOn ? "gradient-electric shadow-glow-soft" : "bg-white/10"
              }`}
            >
              {micOn ? <Mic className="h-4 w-4 text-white" /> : <MicOff className="h-4 w-4 text-muted-foreground" />}
            </button>
          )}
          {!mySeat && (
            <button className="h-10 w-10 rounded-full glass grid place-items-center">
              <Smile className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMsg()}
            placeholder="Say something nice…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => setShowGifts((s) => !s)}
            className="h-9 w-9 rounded-full bg-[oklch(0.7_0.27_350)]/20 text-[oklch(0.8_0.2_350)] grid place-items-center active:scale-95"
          >
            <Gift className="h-4 w-4" />
          </button>
          <button
            onClick={sendMsg}
            className="h-10 w-10 rounded-full gradient-electric grid place-items-center shadow-glow-soft active:scale-95"
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Moderation sheet */}
      {actingOn && (
        <div
          className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md flex items-end justify-center animate-fade-up"
          onClick={() => setActingOn(null)}
        >
          <div
            className="w-full max-w-md glass-strong rounded-t-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <img
                src={actingOn.avatar ?? defaultAvatar(actingOn.username ?? "u")}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-bold">{actingOn.username ?? "Empty seat"}</p>
                <p className="text-[11px] text-muted-foreground">Seat {actingOn.seat_index}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {actingOn.user_id && (
                <>
                  <ModBtn icon={actingOn.muted ? Mic : MicOff} label={actingOn.muted ? "Unmute" : "Mute"} onClick={() => muteSeat(actingOn)} />
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
              <ModBtn
                icon={actingOn.locked ? Unlock : Lock}
                label={actingOn.locked ? "Unlock seat" : "Lock seat"}
                onClick={() => lockSeat(actingOn)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      {showSettings && isOwner && (
        <RoomSettings room={room} onClose={() => setShowSettings(false)} onDelete={deleteRoom} />
      )}
    </AppShell>
  );
}

function ModBtn({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`glass rounded-2xl py-3 flex flex-col items-center gap-1 active:scale-95 ${
        danger ? "text-[oklch(0.8_0.2_25)]" : ""
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-[11px]">{label}</span>
    </button>
  );
}

function SeatView({
  seat,
  host,
  speaking,
  isMe,
  onTake,
  onSelf,
  onModerate,
  onLockToggle,
}: {
  seat: DBSeat;
  host?: boolean;
  speaking?: boolean;
  isMe?: boolean;
  onTake: () => void;
  onSelf: () => void;
  onModerate?: () => void;
  onLockToggle?: () => void;
}) {
  const size = host ? "h-24 w-24" : "h-16 w-16";

  if (!seat.user_id) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={seat.locked ? onLockToggle : onTake}
          className={`${size} rounded-full glass grid place-items-center border-2 border-dashed border-white/15 active:scale-95 ${
            seat.locked ? "opacity-60" : ""
          }`}
        >
          {seat.locked ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Plus className="h-5 w-5 text-muted-foreground" />}
        </button>
        <span className="text-[10px] text-muted-foreground">{seat.locked ? "Locked" : "Empty"}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        {speaking && <span className="absolute -inset-1.5 rounded-full animate-pulse-ring" />}
        <button
          onClick={isMe ? onSelf : onModerate}
          className={`relative ${size} rounded-full p-[2px] ${
            speaking ? "gradient-electric" : "bg-white/10"
          } active:scale-95`}
        >
          <img src={seat.avatar ?? defaultAvatar(seat.username ?? "u")} alt="" className="h-full w-full rounded-full object-cover" />
        </button>
        {host && (
          <span className="absolute -top-1 -right-1 h-7 w-7 rounded-full grid place-items-center bg-gradient-to-br from-[oklch(0.85_0.18_85)] to-[oklch(0.7_0.18_60)] shadow-glow-soft">
            <Crown className="h-3.5 w-3.5 text-black" />
          </span>
        )}
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full grid place-items-center ${
            seat.muted ? "bg-[oklch(0.25_0.05_270)]" : "bg-electric"
          } ring-2 ring-background`}
        >
          {seat.muted ? <MicOff className="h-3 w-3 text-muted-foreground" /> : <Mic className="h-3 w-3 text-white" />}
        </span>
        {onModerate && !isMe && (
          <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-black/60 grid place-items-center">
            <MoreVertical className="h-3 w-3" />
          </span>
        )}
      </div>
      <span className={`${host ? "text-sm" : "text-xs"} font-medium leading-none truncate max-w-[80px]`}>
        {seat.username}
        {isMe ? " (you)" : ""}
      </span>
      {host && <span className="text-[9px] tracking-wider text-electric font-semibold">OWNER</span>}
    </div>
  );
}

function RoomSettings({ room, onClose, onDelete }: { room: DBRoom; onClose: () => void; onDelete: () => void }) {
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? "");
  const [privacy, setPrivacy] = useState(room.privacy);
  const [password, setPassword] = useState(room.password_hash ?? "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("rooms")
      .update({
        name: name.trim(),
        description: description.trim(),
        privacy,
        password_hash: privacy === "private" ? password.trim() : null,
      })
      .eq("id", room.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-md flex items-end justify-center animate-fade-up" onClick={onClose}>
      <div className="w-full max-w-md glass-strong rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg mb-4">Room Settings</h2>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full glass rounded-2xl h-11 px-4 text-sm outline-none" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full glass rounded-2xl p-3 text-sm outline-none resize-none" />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPrivacy("public")} className={`h-11 rounded-2xl text-sm font-medium ${privacy === "public" ? "gradient-electric text-white" : "glass text-muted-foreground"}`}>Public</button>
            <button onClick={() => setPrivacy("private")} className={`h-11 rounded-2xl text-sm font-medium ${privacy === "private" ? "gradient-electric text-white" : "glass text-muted-foreground"}`}>Private</button>
          </div>
          {privacy === "private" && (
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full glass rounded-2xl h-11 px-4 text-sm outline-none" />
          )}
          <button onClick={save} disabled={loading} className="w-full h-12 rounded-2xl gradient-electric text-white font-semibold shadow-glow active:scale-[0.98] disabled:opacity-60">
            {loading ? "Saving…" : "Save"}
          </button>
          <button onClick={onDelete} className="w-full h-12 rounded-2xl bg-[oklch(0.3_0.15_25)] text-[oklch(0.85_0.18_30)] font-semibold active:scale-95 flex items-center justify-center gap-2">
            <Trash2 className="h-4 w-4" /> Delete Room
          </button>
        </div>
      </div>
    </div>
  );
}
