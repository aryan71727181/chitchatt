import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, TrendingUp, Moon, Gamepad2, Sparkles, Heart, Smile, Flame } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { rooms, avatars } from "@/lib/mock";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover Rooms — ChitChat" },
      { name: "description", content: "Discover live premium party rooms and people matching your vibe." },
    ],
  }),
  component: Discover,
});

const cats = [
  { label: "Trending", icon: TrendingUp },
  { label: "Late Night", icon: Moon },
  { label: "Gaming", icon: Gamepad2 },
  { label: "Anime", icon: Sparkles },
  { label: "Relationship", icon: Heart },
  { label: "Funny", icon: Smile },
];

function Discover() {
  const [active, setActive] = useState("Trending");
  return (
    <AppShell>
      <header className="px-5 pt-12 pb-2 animate-fade-up">
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="text-xs text-muted-foreground mt-1">Find rooms that match your energy</p>
      </header>

      <div className="px-5 mt-4">
        <div className="glass rounded-2xl flex items-center gap-2 px-4 h-12">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input placeholder="Search rooms, vibes, people…" className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground" />
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar px-5 pb-1">
        {cats.map((c) => {
          const Icon = c.icon;
          const sel = active === c.label;
          return (
            <button
              key={c.label}
              onClick={() => setActive(c.label)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-xs font-medium transition-all active:scale-95 ${
                sel
                  ? "gradient-electric text-white shadow-glow-soft"
                  : "glass text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Featured big card */}
      <section className="px-5 mt-5 animate-fade-up">
        <Link to="/rooms" className="relative block overflow-hidden rounded-3xl h-56 glass-strong shadow-card active:scale-[0.99] transition-transform">
          <img src={rooms[0].banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full gradient-electric text-white text-[10px] font-bold flex items-center gap-1 shadow-glow-soft">
            <Flame className="h-3 w-3" /> TRENDING #1
          </span>
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/50 backdrop-blur text-[11px] flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.2_150)] animate-pulse" /> 2.3K live
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h2 className="text-2xl font-bold">{rooms[0].name}</h2>
            <p className="text-xs text-muted-foreground mt-1">Talk. Share. Vibe. — {rooms[0].category}</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex -space-x-2">
                {avatars.slice(0, 4).map((a, i) => (
                  <img key={i} src={a} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-black" />
                ))}
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur text-xs font-semibold">Join →</span>
            </div>
          </div>
        </Link>
      </section>

      {/* Grid */}
      <section className="px-5 mt-5 grid grid-cols-2 gap-3 pb-6">
        {rooms.slice(1).map((r) => (
          <Link key={r.id} to="/rooms" className="relative block h-52 rounded-3xl overflow-hidden glass shadow-card active:scale-[0.98] transition-transform animate-fade-up">
            <img src={r.banner} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
            {r.trending && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-electric/90 text-[9px] font-bold text-white">HOT</span>
            )}
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur text-[9px] flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-[oklch(0.7_0.2_150)]" /> {(r.listeners / 1000).toFixed(1)}K
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="font-bold text-sm leading-tight">{r.name}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">{r.category}</p>
            </div>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
