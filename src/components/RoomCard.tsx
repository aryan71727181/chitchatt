import { Link } from "@tanstack/react-router";
import { Lock, Mic } from "lucide-react";
import type { DBRoom } from "@/lib/rooms";
import { resolveBanner } from "@/lib/rooms";

const CATEGORY_COLORS: Record<string, string> = {
  "Late Night Talks": "oklch(0.62 0.28 295)",
  "Relationship":     "oklch(0.72 0.27 350)",
  "Gaming":           "oklch(0.72 0.22 255)",
  "Anime":            "oklch(0.72 0.25 310)",
  "Funny":            "oklch(0.82 0.16 78)",
  "Music":            "oklch(0.74 0.27 350)",
  "Chill":            "oklch(0.72 0.18 195)",
  "Heartbreak":       "oklch(0.65 0.25 25)",
  "General":          "oklch(0.65 0.025 275)",
};

export function RoomCard({ room, large }: { room: DBRoom; large?: boolean }) {
  const bannerUrl = resolveBanner(room.banner);
  const catColor  = CATEGORY_COLORS[room.category] ?? "oklch(0.74 0.27 350)";

  return (
    <Link
      to="/rooms/$roomId"
      params={{ roomId: room.id }}
      className={`relative flex flex-col overflow-hidden rounded-3xl shadow-card active:scale-[0.97] transition-transform animate-fade-up ${
        large ? "h-52" : "h-48"
      }`}
    >
      {/* Banner */}
      <img
        src={bannerUrl}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          import("@/lib/rooms").then(({ BANNER_PRESETS }) => {
            const t = e.currentTarget;
            const idx = BANNER_PRESETS.findIndex((b) => b.url === t.src);
            const next = BANNER_PRESETS[(idx + 1) % BANNER_PRESETS.length];
            if (next.url !== t.src) t.src = next.url;
          });
        }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10" />

      {/* Coloured top-edge glow for category */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-80"
        style={{ background: catColor }}
      />

      {/* Top badges */}
      <div className="relative flex items-center justify-between px-3 pt-3">
        {/* LIVE badge */}
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] font-bold">
          <span className="h-1.5 w-1.5 live-dot" />
          LIVE
        </span>

        {/* Listener count */}
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] font-medium">
          <Mic className="h-2.5 w-2.5 text-electric" />
          <span className="text-electric font-bold">{room.listener_count}</span>
        </span>
      </div>

      {/* Bottom content */}
      <div className="relative mt-auto px-3 pb-3">
        {/* Category chip */}
        <span
          className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mb-1.5"
          style={{ background: `${catColor}30`, color: catColor, border: `1px solid ${catColor}40` }}
        >
          {room.category}
        </span>

        <h3 className={`font-bold leading-tight truncate ${large ? "text-base" : "text-sm"}`}>
          {room.name}
        </h3>

        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] text-white/50 truncate">@{room.owner_username}</p>
          {room.privacy === "private" && (
            <span className="flex items-center gap-0.5 text-[9px] text-white/40">
              <Lock className="h-2.5 w-2.5" /> Private
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
