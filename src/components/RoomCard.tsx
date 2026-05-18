import { Link } from "@tanstack/react-router";
import { Lock, Users } from "lucide-react";
import type { DBRoom } from "@/lib/rooms";
import { resolveBanner } from "@/lib/rooms";

export function RoomCard({ room, large }: { room: DBRoom; large?: boolean }) {
  const bannerUrl = resolveBanner(room.banner);

  return (
    <Link
      to="/rooms/$roomId"
      params={{ roomId: room.id }}
      className={`relative block overflow-hidden rounded-3xl glass shadow-card active:scale-[0.98] transition-transform animate-fade-up ${
        large ? "h-56" : "h-52"
      }`}
    >
      <img
        src={bannerUrl}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          const target = e.currentTarget;
          // cycle through presets until one loads
          import("@/lib/rooms").then(({ BANNER_PRESETS }) => {
            const idx = BANNER_PRESETS.findIndex((b) => b.url === target.src);
            const next = BANNER_PRESETS[(idx + 1) % BANNER_PRESETS.length];
            if (next.url !== target.src) target.src = next.url;
          });
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
      {room.privacy === "private" && (
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-[10px] font-bold flex items-center gap-1">
          <Lock className="h-2.5 w-2.5" /> PRIVATE
        </span>
      )}
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.2_150)] animate-pulse" />
        <Users className="h-2.5 w-2.5" /> {room.listener_count}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className={`font-bold leading-tight ${large ? "text-xl" : "text-sm"}`}>{room.name}</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">{room.category} · @{room.owner_username}</p>
      </div>
    </Link>
  );
}
