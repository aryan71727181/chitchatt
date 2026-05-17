import { createFileRoute } from "@tanstack/react-router";
import { Share2, MoreHorizontal, ArrowLeft, Camera, Pencil, BadgeCheck, Calendar, Gift, Wallet, Crown, Shield, Heart, Music, Moon, Gamepad2, MapPin, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { avatars } from "@/lib/mock";
import cover from "@/assets/profile-cover.jpg";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — ChitChat" },
      { name: "description", content: "Your premium ChitChat profile." },
    ],
  }),
  component: Profile,
});

const rewards = [
  { label: "Daily Check-in", sub: "Collect rewards", action: "Check In", icon: Calendar, color: "oklch(0.7 0.22 255)" },
  { label: "Free Gift", sub: "Get free gifts", action: "Claim", icon: Gift, color: "oklch(0.7 0.27 350)" },
  { label: "Recharge", sub: "Top up coins", action: "Top Up", icon: Wallet, color: "oklch(0.82 0.16 85)" },
  { label: "VIP", sub: "Unlock premium", action: "Go VIP", icon: Crown, color: "oklch(0.82 0.16 60)" },
  { label: "Noble", sub: "Exclusive badge", action: "View", icon: Shield, color: "oklch(0.6 0.28 295)" },
];

function Profile() {
  return (
    <AppShell>
      {/* Cover */}
      <div className="relative h-56 overflow-hidden">
        <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background" />
        <div className="relative px-4 pt-12 flex items-center justify-between">
          <button className="h-10 w-10 rounded-full glass grid place-items-center"><ArrowLeft className="h-4.5 w-4.5" /></button>
          <div className="flex items-center gap-2">
            <button className="h-10 w-10 rounded-full glass grid place-items-center"><Share2 className="h-4.5 w-4.5" /></button>
            <button className="h-10 w-10 rounded-full glass grid place-items-center"><MoreHorizontal className="h-4.5 w-4.5" /></button>
          </div>
        </div>
        <button className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-full glass text-xs font-medium">
          <Camera className="h-3.5 w-3.5" /> Edit Cover
        </button>
      </div>

      {/* Identity */}
      <section className="px-5 -mt-14 relative">
        <div className="flex items-end gap-4">
          <div className="relative">
            <span className="absolute -inset-1 rounded-full gradient-electric blur-md opacity-80" />
            <img src={avatars[1]} alt="Prince" className="relative h-24 w-24 rounded-full object-cover ring-4 ring-background" />
            <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full gradient-electric grid place-items-center ring-2 ring-background">
              <Pencil className="h-3 w-3 text-white" />
            </button>
          </div>
          <div className="pb-1 flex-1 min-w-0">
            <h1 className="text-2xl font-bold flex items-center gap-1.5">
              Prince <BadgeCheck className="h-5 w-5 text-electric" />
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
              @prince.vibes
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[oklch(0.3_0.15_290)] text-[oklch(0.85_0.18_295)] text-[10px] font-bold">
                <Crown className="h-2.5 w-2.5" /> Lv.24
              </span>
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm">Late night thinker 🌙 <span className="text-muted-foreground">· Talks, vibes & chaos.</span></p>
        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Mumbai, India</p>

        {/* Vibe Score */}
        <div className="mt-4 glass-strong rounded-2xl p-4 flex items-center gap-4 shadow-card">
          <div className="flex-1">
            <p className="text-[10px] tracking-widest text-muted-foreground">VIBE SCORE</p>
            <div className="text-3xl font-bold text-gradient mt-1">87</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Top 8% this week</p>
          </div>
          <div className="flex items-end gap-1 h-12">
            {[6,9,5,11,8,12,9,12].map((h,i)=>(<span key={i} className="w-1.5 rounded-full gradient-electric" style={{height:`${h*4}px`}} />))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 glass rounded-2xl p-4 grid grid-cols-4 gap-1">
          {[
            { v: "12.4K", l: "Followers" },
            { v: "320", l: "Following" },
            { v: "3.4K", l: "Vibes" },
            { v: "562", l: "Likes" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-bold text-base">{s.v}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="h-11 rounded-2xl gradient-electric text-white font-semibold text-sm shadow-glow-soft active:scale-95 transition-transform">Edit Profile</button>
          <button className="h-11 rounded-2xl glass-strong font-semibold text-sm active:scale-95 transition-transform">Share Profile</button>
        </div>

        {/* Rewards */}
        <div className="mt-6 flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
          {rewards.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.label} className="shrink-0 w-28 glass rounded-2xl p-3 flex flex-col items-center text-center gap-1.5">
                <div className="relative h-12 w-12 rounded-2xl grid place-items-center" style={{ background: `radial-gradient(circle, ${r.color}40, transparent 70%)` }}>
                  <Icon className="h-6 w-6" style={{ color: r.color }} />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[oklch(0.7_0.25_25)]" />
                </div>
                <p className="text-[11px] font-semibold leading-tight">{r.label}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">{r.sub}</p>
                <button className="mt-1 w-full h-7 rounded-lg text-[10px] font-semibold" style={{ background: `${r.color}25`, color: r.color }}>{r.action}</button>
              </div>
            );
          })}
        </div>

        {/* Interests */}
        <div className="mt-6 glass rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-[oklch(0.7_0.27_350)]" /> Interests</p>
          <div className="flex flex-wrap gap-2">
            {[
              { l: "Anime", i: Star, c: "oklch(0.6 0.28 295)" },
              { l: "Music", i: Music, c: "oklch(0.7 0.22 255)" },
              { l: "Late Night", i: Moon, c: "oklch(0.7 0.18 270)" },
              { l: "Gaming", i: Gamepad2, c: "oklch(0.65 0.2 240)" },
            ].map((t) => {
              const I = t.i;
              return (
                <span key={t.l} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: `${t.c}22`, color: t.c }}>
                  <I className="h-3 w-3" /> {t.l}
                </span>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 glass rounded-2xl p-3">
          <div className="flex gap-1 text-xs">
            {["Posts", "Rooms", "Gifts", "Moments"].map((t, i) => (
              <button key={t} className={`flex-1 h-9 rounded-xl font-medium transition-all ${i === 0 ? "gradient-electric text-white shadow-glow-soft" : "text-muted-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[avatars[0], avatars[2], avatars[4], avatars[5], avatars[3], avatars[1]].map((a, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                <img src={a} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
