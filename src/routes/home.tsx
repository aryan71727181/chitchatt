import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Bell, Gift, Flame, Sparkles, Users, ChevronRight, Heart, Moon, Cloud, Smile, Lock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { rooms, avatars } from "@/lib/mock";
import heroImg from "@/assets/hero-night.jpg";
import { defaultAvatar, greetingFor, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "ChitChat — Home" },
      { name: "description", content: "Premium GenZ social rooms. Meet your people tonight." },
    ],
  }),
  component: Home,
});

const moodCats = [
  { icon: Moon, label: "Deep Talks", count: "1.6K", color: "oklch(0.7 0.22 255)" },
  { icon: Lock, label: "Confessions", count: "1.2K", color: "oklch(0.7 0.27 350)" },
  { icon: Heart, label: "Relationship", count: "980", color: "oklch(0.65 0.27 20)" },
  { icon: Cloud, label: "Overthinking", count: "1.1K", color: "oklch(0.6 0.2 250)" },
  { icon: Smile, label: "Funny Zone", count: "1.3K", color: "oklch(0.82 0.16 85)" },
];

function Home() {
  const { profile, user } = useAuth();
  const username = profile?.username ?? user?.email?.split("@")[0] ?? "you";
  const avatarUrl = profile?.profile_image || defaultAvatar(profile?.id ?? username);
  const score = profile?.vibe_score ?? 0;

  return (
    <AppShell>
      <header className="px-5 pt-12 pb-3 flex items-center gap-3 animate-fade-up">
        <div className="relative">
          <span className="absolute inset-0 rounded-full gradient-electric blur-md opacity-70" />
          <img
            src={avatarUrl}
            alt={username}
            className="relative h-12 w-12 rounded-full object-cover ring-2 ring-[oklch(0.72_0.22_255)] ring-offset-2 ring-offset-background bg-white/5"
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[oklch(0.7_0.2_150)] ring-2 ring-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{greetingFor()},</p>
          <h1 className="text-2xl font-bold flex items-center gap-1.5 leading-tight truncate">
            <span className="truncate">{username}</span> <Sparkles className="h-5 w-5 text-electric shrink-0" />
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Who matches <span className="text-electric font-medium">your energy</span> tonight?
          </p>
        </div>
        <button aria-label="Search" className="h-10 w-10 grid place-items-center rounded-full glass active:scale-95 transition-transform">
          <Search className="h-4.5 w-4.5" />
        </button>
        <button aria-label="Notifications" className="relative h-10 w-10 grid place-items-center rounded-full glass active:scale-95 transition-transform">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-electric text-[9px] font-bold text-primary-foreground grid place-items-center">8</span>
        </button>
      </header>

      <section className="px-5 mt-4 animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl glass-strong shadow-card">
          <img src={heroImg} alt="" width={1024} height={768} className="absolute inset-0 h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/60 to-transparent" />
          <div className="relative p-5">
            <p className="text-[10px] tracking-[0.18em] text-muted-foreground font-medium">TONIGHT'S ENERGY</p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-2xl font-bold leading-tight">Late Night<br />Chaos <span className="inline-block">⚡</span></h2>
                <p className="mt-2 text-xs text-muted-foreground max-w-[180px]">Where real vibes meet after dark.</p>
              </div>
              <div className="relative h-24 w-24 shrink-0 grid place-items-center">
                <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                  <circle cx="50" cy="50" r="44" stroke="oklch(1 0 0 / 0.1)" strokeWidth="6" fill="none" />
                  <circle cx="50" cy="50" r="44" stroke="url(#g1)" strokeWidth="6" fill="none"
                    strokeDasharray="276" strokeDashoffset={Math.max(0, 276 - (276 * score) / 100)} strokeLinecap="round" />
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="oklch(0.72 0.22 255)" />
                      <stop offset="1" stopColor="oklch(0.6 0.28 295)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gradient leading-none">{score}</div>
                  <div className="text-[8px] tracking-widest text-muted-foreground mt-1">VIBE SCORE</div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {avatars.slice(0, 4).map((a, i) => (
                    <img key={i} src={a} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-background" />
                  ))}
                  <div className="h-7 w-7 rounded-full grid place-items-center bg-[oklch(0.25_0.06_270)] ring-2 ring-background text-[9px] font-bold">+98</div>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.2_150)] animate-pulse" />
                  2.4K vibing
                </div>
              </div>
              <Link
                to="/rooms"
                className="group relative inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl gradient-electric text-white text-xs font-semibold shadow-glow active:scale-95 transition-transform"
              >
                <Users className="h-3.5 w-3.5" />
                Join a Room
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-7 animate-fade-up">
        <div className="px-5 flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-[oklch(0.7_0.2_30)]" /> Trending Tonight
          </h3>
          <Link to="/discover" className="text-xs text-muted-foreground flex items-center gap-0.5">See all <ChevronRight className="h-3 w-3" /></Link>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2">
          {rooms.slice(0, 5).map((r, i) => (
            <Link
              key={r.id}
              to="/rooms"
              className="group relative shrink-0 w-44 h-56 rounded-3xl overflow-hidden glass shadow-card active:scale-[0.98] transition-transform"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <img src={r.banner} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
              {r.tag && (
                <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold rounded-full gradient-electric text-white shadow-glow-soft">
                  ● {r.tag}
                </span>
              )}
              <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.2_150)] animate-pulse" />
                {(r.listeners / 1000).toFixed(1)}K
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex -space-x-1.5 mb-1.5">
                  {avatars.slice(0, 3).map((a, idx) => (
                    <img key={idx} src={a} alt="" className="h-5 w-5 rounded-full ring-2 ring-black/60 object-cover" />
                  ))}
                </div>
                <h4 className="font-bold text-sm leading-tight">{r.name}</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">{r.category}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 animate-fade-up">
        <div className="px-5 flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <Moon className="h-4 w-4 text-electric" /> Late Night Vibes
          </h3>
          <Link to="/discover" className="text-xs text-muted-foreground flex items-center gap-0.5">See all <ChevronRight className="h-3 w-3" /></Link>
        </div>
        <div className="mt-3 flex gap-2.5 overflow-x-auto no-scrollbar px-5 pb-2">
          {moodCats.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="shrink-0 w-24 h-28 rounded-2xl glass flex flex-col items-center justify-center gap-1.5 p-2">
                <span className="h-11 w-11 rounded-2xl grid place-items-center" style={{ background: `radial-gradient(circle, ${m.color}40, transparent 70%)` }}>
                  <Icon className="h-5 w-5" style={{ color: m.color }} />
                </span>
                <p className="text-[11px] font-semibold leading-tight text-center">{m.label}</p>
                <p className="text-[9px] text-muted-foreground">● {m.count}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-5 mt-6 animate-fade-up">
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl gradient-electric grid place-items-center shadow-glow-soft">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Daily Check-In</p>
            <p className="text-[11px] text-muted-foreground">Collect 120 coins today</p>
          </div>
          <button className="px-3 py-1.5 rounded-xl bg-electric/15 text-electric text-xs font-semibold active:scale-95 transition-transform">Claim</button>
        </div>
      </section>
    </AppShell>
  );
}