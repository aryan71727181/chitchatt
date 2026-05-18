import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell, Gift, Flame, Sparkles, Users, ChevronRight,
  Mic, Star, TrendingUp, Music, Heart, Gamepad2,
  Moon, MessageCircle, Crown, Plus,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { rooms, avatars } from "@/lib/mock";
import heroImg from "@/assets/hero-night.jpg";
import { defaultAvatar, greetingFor, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "ChitChat — Home" },
      { name: "description", content: "Premium party rooms — meet your people tonight." },
    ],
  }),
  component: Home,
});

const CATEGORIES = [
  { icon: Flame,      label: "Hot",          color: "oklch(0.72 0.22 30)",  bg: "oklch(0.72 0.22 30 / 0.15)",  count: "2.4K" },
  { icon: Heart,      label: "Relationship", color: "oklch(0.74 0.27 350)", bg: "oklch(0.74 0.27 350 / 0.15)", count: "1.8K" },
  { icon: Music,      label: "Music",        color: "oklch(0.62 0.28 295)", bg: "oklch(0.62 0.28 295 / 0.15)", count: "1.5K" },
  { icon: Moon,       label: "Late Night",   color: "oklch(0.72 0.22 255)", bg: "oklch(0.72 0.22 255 / 0.15)", count: "1.2K" },
  { icon: Gamepad2,   label: "Gaming",       color: "oklch(0.72 0.18 195)", bg: "oklch(0.72 0.18 195 / 0.15)", count: "980"  },
  { icon: MessageCircle, label: "Deep Talk", color: "oklch(0.82 0.16 78)",  bg: "oklch(0.82 0.16 78 / 0.15)",  count: "860"  },
];

function Home() {
  const { profile, user } = useAuth();
  const username = profile?.username ?? user?.email?.split("@")[0] ?? "you";
  const avatarUrl = profile?.profile_image || defaultAvatar(profile?.id ?? username);
  const score = profile?.vibe_score ?? 0;
  const coins = 1_240;

  return (
    <AppShell>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="px-5 pt-12 pb-4 flex items-center gap-3 animate-fade-up">
        <Link to="/profile" className="relative flex-shrink-0">
          {/* glow ring */}
          <span className="absolute inset-0 rounded-full gradient-electric blur-[10px] opacity-60" />
          <img
            src={avatarUrl}
            alt={username}
            className="relative h-11 w-11 rounded-full object-cover ring-2 ring-electric ring-offset-1 ring-offset-background"
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[oklch(0.72_0.18_195)] ring-2 ring-background" />
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground leading-none">{greetingFor()}</p>
          <h1 className="text-lg font-bold leading-tight truncate flex items-center gap-1">
            {username}
            {profile?.vip_status && <Crown className="h-3.5 w-3.5 text-gold flex-shrink-0" />}
          </h1>
        </div>

        {/* Coins */}
        <div className="glass-gold rounded-full px-3 h-8 flex items-center gap-1.5 flex-shrink-0">
          <span className="text-sm">🪙</span>
          <span className="text-xs font-bold text-gold">{coins.toLocaleString()}</span>
        </div>

        {/* Bell */}
        <button className="relative h-9 w-9 rounded-full glass grid place-items-center active:scale-95 flex-shrink-0">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-0.5 rounded-full gradient-electric text-[9px] font-bold text-white grid place-items-center">3</span>
        </button>
      </header>

      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <section className="px-4 animate-fade-up">
        <div className="relative h-48 rounded-3xl overflow-hidden shadow-card">
          <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.25_0.2_295/0.92)] via-[oklch(0.15_0.1_280/0.75)] to-transparent" />

          {/* Vibe ring */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="relative h-20 w-20 grid place-items-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90 h-full w-full">
                <circle cx="50" cy="50" r="44" stroke="oklch(1 0 0 / 0.12)" strokeWidth="6" fill="none" />
                <circle cx="50" cy="50" r="44" stroke="url(#vg)" strokeWidth="6" fill="none"
                  strokeDasharray="276" strokeDashoffset={Math.max(0, 276 - (276 * score) / 100)} strokeLinecap="round" />
                <defs>
                  <linearGradient id="vg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="oklch(0.74 0.27 350)" />
                    <stop offset="1" stopColor="oklch(0.62 0.28 295)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="text-center">
                <div className="text-xl font-bold text-gradient leading-none">{score}</div>
                <div className="text-[8px] tracking-widest text-white/50 mt-0.5">VIBE</div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="h-1.5 w-1.5 live-dot" />
              <span className="text-[10px] font-semibold tracking-wider text-white/70">TONIGHT'S PARTY</span>
            </div>
            <h2 className="text-2xl font-bold leading-tight">Late Night<br />Chaos ⚡</h2>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  {avatars.slice(0, 4).map((a, i) => (
                    <img key={i} src={a} alt="" className="h-6 w-6 rounded-full object-cover ring-2 ring-black/60" />
                  ))}
                </div>
                <span className="text-[10px] text-white/60">2.4K vibing</span>
              </div>
              <Link
                to="/rooms"
                className="flex items-center gap-1.5 px-4 h-9 rounded-full gradient-electric text-white text-xs font-bold shadow-glow active:scale-95"
              >
                <Users className="h-3.5 w-3.5" /> Join Party
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Online Friends ──────────────────────────────────────────── */}
      <section className="mt-5 animate-fade-up">
        <div className="px-5 flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            <span className="h-2 w-2 live-dot" /> Online Now
          </h3>
          <button className="text-[11px] text-electric flex items-center gap-0.5">
            See all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-5">
          {/* Add new friend button */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="h-14 w-14 rounded-full glass border-2 border-dashed border-white/20 grid place-items-center">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground">Invite</span>
          </div>
          {avatars.slice(0, 7).map((a, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="relative">
                <div className="h-14 w-14 rounded-full p-[2px] gradient-electric shadow-glow-soft">
                  <img src={a} alt="" className="h-full w-full rounded-full object-cover" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[oklch(0.72_0.18_195)] ring-2 ring-background" />
              </div>
              <span className="text-[10px] text-white/60 max-w-[52px] truncate text-center">
                user{i + 1}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Hot Rooms ────────────────────────────────────────────────── */}
      <section className="mt-6 animate-fade-up">
        <div className="px-5 flex items-center justify-between mb-3">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-[oklch(0.72_0.22_30)]" /> Hot Rooms
          </h3>
          <Link to="/discover" className="text-[11px] text-electric flex items-center gap-0.5">
            See all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
          {rooms.slice(0, 6).map((r, i) => (
            <Link
              key={r.id}
              to="/rooms"
              className="relative shrink-0 w-40 h-52 rounded-3xl overflow-hidden shadow-card active:scale-[0.97] transition-transform"
              style={{ animationDelay: `${i * 55}ms` }}
            >
              <img src={r.banner} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

              {/* Live */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur text-[9px] font-bold">
                <span className="h-1.5 w-1.5 live-dot" /> LIVE
              </div>

              {/* Listeners */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full gradient-electric text-[9px] font-bold text-white shadow-glow-soft">
                <Mic className="h-2.5 w-2.5" />
                {r.tag}
              </div>

              {/* Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex -space-x-1.5 mb-2">
                  {avatars.slice(i % 3, (i % 3) + 3).map((a, idx) => (
                    <img key={idx} src={a} alt="" className="h-5 w-5 rounded-full ring-2 ring-black/60 object-cover" />
                  ))}
                  <div className="h-5 w-5 rounded-full grid place-items-center bg-white/10 ring-2 ring-black/60 text-[8px] font-bold">
                    +{Math.floor(r.listeners / 100)}
                  </div>
                </div>
                <h4 className="font-bold text-sm leading-tight">{r.name}</h4>
                <p className="text-[10px] text-white/50 mt-0.5">{r.category}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Category Grid ────────────────────────────────────────────── */}
      <section className="mt-6 px-4 animate-fade-up">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <Star className="h-4 w-4 text-gold" /> Categories
          </h3>
          <Link to="/discover" className="text-[11px] text-electric flex items-center gap-0.5">
            Browse <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.label}
                to="/discover"
                className="flex flex-col items-center gap-2 glass rounded-2xl py-4 active:scale-95 transition-transform"
              >
                <span
                  className="h-10 w-10 rounded-xl grid place-items-center"
                  style={{ background: c.bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: c.color }} />
                </span>
                <p className="text-[11px] font-semibold leading-tight text-center">{c.label}</p>
                <p className="text-[9px]" style={{ color: c.color }}>● {c.count}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Top Hosts ────────────────────────────────────────────────── */}
      <section className="mt-6 animate-fade-up">
        <div className="px-5 flex items-center justify-between mb-3">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-electric" /> Top Hosts
          </h3>
        </div>
        <div className="px-4 space-y-2">
          {avatars.slice(0, 4).map((a, i) => (
            <div key={i} className="glass rounded-2xl px-3 py-3 flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="h-11 w-11 rounded-full p-[2px] gradient-electric shadow-glow-soft">
                  <img src={a} alt="" className="h-full w-full rounded-full object-cover" />
                </div>
                <span
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full grid place-items-center text-[10px] font-bold"
                  style={{ background: i === 0 ? "oklch(0.83 0.16 78)" : "oklch(0.65 0.025 275 / 0.5)" }}
                >
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">host_user_{i + 1}</p>
                <p className="text-[11px] text-muted-foreground">
                  {(12000 - i * 1500).toLocaleString()} listeners
                </p>
              </div>
              <span
                className="px-3 py-1 rounded-full text-[10px] font-bold"
                style={{
                  background: i === 0 ? "oklch(0.83 0.16 78 / 0.2)" : "oklch(0.74 0.27 350 / 0.15)",
                  color: i === 0 ? "oklch(0.83 0.16 78)" : "oklch(0.74 0.27 350)",
                }}
              >
                {i === 0 ? "👑 #1" : `Top ${i + 1}`}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Daily Bonus ──────────────────────────────────────────────── */}
      <section className="px-4 mt-6 mb-2 animate-fade-up">
        <div className="relative overflow-hidden glass-gold rounded-3xl p-4 flex items-center gap-4">
          <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10"
            style={{ background: "radial-gradient(circle at 80% 50%, oklch(0.83 0.16 78), transparent 70%)" }} />
          <div className="h-12 w-12 rounded-2xl gradient-gold grid place-items-center shadow-gold flex-shrink-0">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-gold">Daily Bonus</p>
            <p className="text-[11px] text-white/60 mt-0.5">Claim 120 coins · streak 🔥 7 days</p>
          </div>
          <button className="px-4 h-9 rounded-full gradient-gold text-white text-xs font-bold shadow-gold active:scale-95 flex-shrink-0">
            Claim
          </button>
        </div>
      </section>
    </AppShell>
  );
}
