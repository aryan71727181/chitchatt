import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Share2, Users, Crown, Mic, MicOff, Plus, Lock, Smile, Gift, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { avatars } from "@/lib/mock";

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Late Night Talks — ChitChat" },
      { name: "description", content: "Live 7-seater voice room. Premium GenZ party room." },
    ],
  }),
  component: RoomPage,
});

type Seat =
  | { kind: "host"; name: string; avatar: string; speaking?: boolean; muted?: boolean }
  | { kind: "user"; name: string; avatar: string; speaking?: boolean; muted?: boolean }
  | { kind: "empty" }
  | { kind: "locked" };

const seats: Seat[] = [
  { kind: "host", name: "Riya", avatar: avatars[0], speaking: true },
  { kind: "user", name: "Veer", avatar: avatars[1], speaking: true },
  { kind: "user", name: "Anaya", avatar: avatars[2], muted: true },
  { kind: "user", name: "Kai", avatar: avatars[5], speaking: false },
  { kind: "user", name: "Aarav", avatar: avatars[3], muted: true },
  { kind: "empty" },
  { kind: "locked" },
];

const gifts = [
  { name: "Rose", emoji: "🌹", price: 5 },
  { name: "Coffee", emoji: "☕", price: 10 },
  { name: "Heart", emoji: "💖", price: 25 },
  { name: "Mic", emoji: "🎤", price: 50 },
  { name: "Crown", emoji: "👑", price: 200 },
];

const initialMessages = [
  { id: 1, name: "Veer", avatar: avatars[1], text: "yo this room is fire 🔥" },
  { id: 2, name: "Anaya", avatar: avatars[2], text: "literally my whole mood rn" },
  { id: 3, name: "Kai", avatar: avatars[5], text: "send the playlist pls 🎧" },
];

function SeatTile({ seat, host }: { seat: Seat; host?: boolean }) {
  const size = host ? "h-24 w-24" : "h-16 w-16";
  if (seat.kind === "empty") {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <button className={`${size} rounded-full glass grid place-items-center border-2 border-dashed border-white/15 active:scale-95 transition-transform`}>
          <Plus className="h-5 w-5 text-muted-foreground" />
        </button>
        <span className="text-[10px] text-muted-foreground">Empty</span>
      </div>
    );
  }
  if (seat.kind === "locked") {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className={`${size} rounded-full glass grid place-items-center opacity-60`}>
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-[10px] text-muted-foreground">Locked</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        {seat.speaking && (
          <span className={`absolute -inset-1.5 rounded-full animate-pulse-ring`} />
        )}
        <div className={`relative ${size} rounded-full p-[2px] ${seat.speaking ? "gradient-electric" : "bg-white/10"}`}>
          <img src={seat.avatar} alt={seat.name} className="h-full w-full rounded-full object-cover" />
        </div>
        {seat.kind === "host" && (
          <span className="absolute -top-1 -right-1 h-7 w-7 rounded-full grid place-items-center bg-gradient-to-br from-[oklch(0.85_0.18_85)] to-[oklch(0.7_0.18_60)] shadow-glow-soft">
            <Crown className="h-3.5 w-3.5 text-black" />
          </span>
        )}
        <span className={`absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full grid place-items-center ${seat.muted ? "bg-[oklch(0.25_0.05_270)]" : "bg-electric"} ring-2 ring-background`}>
          {seat.muted ? <MicOff className="h-3 w-3 text-muted-foreground" /> : <Mic className="h-3 w-3 text-white" />}
        </span>
      </div>
      <span className={`${host ? "text-sm" : "text-xs"} font-medium leading-none`}>{seat.name}</span>
      {host && <span className="text-[9px] tracking-wider text-electric font-semibold">HOST</span>}
    </div>
  );
}

function RoomPage() {
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState(initialMessages);
  const [showGifts, setShowGifts] = useState(false);
  const [floatGift, setFloatGift] = useState<string | null>(null);

  const sendMsg = () => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { id: Date.now(), name: "You", avatar: avatars[1], text }]);
    setText("");
  };

  const sendGift = (g: typeof gifts[number]) => {
    setFloatGift(g.emoji);
    setShowGifts(false);
    setTimeout(() => setFloatGift(null), 2000);
  };

  return (
    <AppShell>
      {/* Top bar */}
      <header className="px-4 pt-12 pb-3 flex items-center gap-2.5 animate-fade-up">
        <Link to="/discover" className="h-10 w-10 rounded-full glass grid place-items-center active:scale-95 transition-transform">
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base leading-tight truncate">Late Night Talks</h1>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.2_150)] animate-pulse" />
            <Users className="h-3 w-3" /> 2,340 listening
          </p>
        </div>
        <button aria-label="Share" className="h-10 w-10 rounded-full glass grid place-items-center active:scale-95 transition-transform">
          <Share2 className="h-4.5 w-4.5" />
        </button>
        <button className="px-3.5 h-10 rounded-full bg-[oklch(0.3_0.15_25)] text-[oklch(0.85_0.18_30)] text-xs font-semibold active:scale-95 transition-transform">
          Leave
        </button>
      </header>

      {/* Stage */}
      <section className="relative px-5 mt-3">
        <div className="relative glass-strong rounded-3xl p-6 shadow-card overflow-hidden">
          {/* glow blobs */}
          <div className="absolute -top-20 -left-10 h-48 w-48 rounded-full bg-electric/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-[oklch(0.6_0.28_295)]/25 blur-3xl" />

          {/* Host */}
          <div className="relative flex justify-center mb-6">
            <SeatTile seat={seats[0]} host />
          </div>

          {/* 2 rows of 3 */}
          <div className="relative grid grid-cols-3 gap-y-5 gap-x-2 place-items-center">
            {seats.slice(1).map((s, i) => (
              <SeatTile key={i} seat={s} />
            ))}
          </div>

          {/* Floating gift animation */}
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
      <section className="px-5 mt-5 space-y-2 max-h-56 overflow-y-auto no-scrollbar">
        {msgs.map((m) => (
          <div key={m.id} className="flex items-start gap-2 animate-fade-up">
            <img src={m.avatar} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10" />
            <div className="glass rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
              <p className="text-[10px] text-electric font-semibold">{m.name}</p>
              <p className="text-sm leading-snug">{m.text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Gifts popover */}
      {showGifts && (
        <div className="fixed bottom-36 left-0 right-0 z-40 px-5 animate-fade-up">
          <div className="mx-auto max-w-md glass-strong rounded-3xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold">Send a Gift</p>
              <p className="text-[10px] text-muted-foreground">Balance: 1,240 💎</p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {gifts.map((g) => (
                <button
                  key={g.name}
                  onClick={() => sendGift(g)}
                  className="glass rounded-2xl py-3 flex flex-col items-center gap-1 active:scale-95 transition-transform hover:shadow-glow-soft"
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{g.price}💎</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="fixed bottom-24 left-0 right-0 z-30 px-4">
        <div className="mx-auto max-w-md glass-strong rounded-full pl-4 pr-1 h-12 flex items-center gap-2 shadow-card">
          <button className="text-muted-foreground active:scale-90 transition-transform">
            <Smile className="h-5 w-5" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMsg()}
            placeholder="Say something nice…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button onClick={() => setShowGifts((s) => !s)} className="h-9 w-9 rounded-full bg-[oklch(0.7_0.27_350)]/20 text-[oklch(0.8_0.2_350)] grid place-items-center active:scale-95 transition-transform">
            <Gift className="h-4 w-4" />
          </button>
          <button onClick={sendMsg} className="h-10 w-10 rounded-full gradient-electric grid place-items-center shadow-glow-soft active:scale-95 transition-transform">
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
