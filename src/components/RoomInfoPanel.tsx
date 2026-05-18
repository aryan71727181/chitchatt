import type { DBRoom } from "@/lib/rooms";
import { X, Users, Crown, Calendar, Tag, Globe, Lock, FileText } from "lucide-react";

export function RoomInfoPanel({
  room,
  memberCount,
  onClose,
}: {
  room: DBRoom;
  memberCount: number;
  onClose: () => void;
}) {
  const createdDate = new Date(room.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const rows = [
    { icon: Crown,    label: "Owner",    value: room.owner_username },
    { icon: Calendar, label: "Created",  value: createdDate },
    { icon: Users,    label: "Members",  value: `${memberCount} online` },
    { icon: Tag,      label: "Category", value: room.category },
    { icon: room.privacy === "public" ? Globe : Lock, label: "Privacy", value: room.privacy === "public" ? "Public" : "Private" },
  ];

  return (
    <div
      className="fixed inset-0 z-[85] bg-black/70 backdrop-blur-md flex items-end justify-center animate-fade-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass-strong rounded-t-3xl pb-8 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Banner */}
        {room.banner && (
          <div className="mx-5 mt-2 h-28 rounded-2xl overflow-hidden">
            <img src={room.banner} alt="" className="h-full w-full object-cover" />
            <div className="h-full w-full bg-gradient-to-t from-black/60 to-transparent -mt-28" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="font-bold text-xl leading-tight">{room.name}</h2>
            <p className="text-[11px] text-electric mt-1 font-semibold uppercase tracking-wider">{room.category}</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full glass grid place-items-center active:scale-95 flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="h-px bg-white/8 mx-5 mb-4" />

        {/* Info rows */}
        <div className="px-5 space-y-2.5">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 glass rounded-2xl px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-electric/15 grid place-items-center flex-shrink-0">
                <Icon className="h-3.5 w-3.5 text-electric" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold mt-0.5 truncate">{value}</p>
              </div>
            </div>
          ))}

          {/* Description */}
          {room.description && (
            <div className="glass rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-3.5 w-3.5 text-electric" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Description</p>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">{room.description}</p>
            </div>
          )}

          {/* Room ID */}
          <div className="flex items-center justify-between glass rounded-2xl px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Room ID</p>
            <p className="text-xs font-mono text-electric">{room.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
