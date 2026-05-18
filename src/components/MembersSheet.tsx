import { type DBMember, type DBSeat, ROLE_META, sidFromUserId } from "@/lib/rooms";
import { defaultAvatar } from "@/lib/auth";
import { Crown, Shield, Star, User, Diamond, Mic, X } from "lucide-react";

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner:    <Crown    className="h-4 w-4 text-yellow-400 flex-shrink-0" />,
  co_owner: <Star     className="h-4 w-4 text-purple-300 flex-shrink-0" />,
  admin:    <Shield   className="h-4 w-4 text-blue-300 flex-shrink-0" />,
  vip:      <Diamond  className="h-4 w-4 text-cyan-300 flex-shrink-0" />,
  member:   <User     className="h-3.5 w-3.5 text-white/20 flex-shrink-0" />,
};

export function MembersSheet({
  members,
  seats,
  onClose,
  onSelectUser,
  currentUserId,
}: {
  members: DBMember[];
  seats?: DBSeat[];
  onClose: () => void;
  onSelectUser: (member: DBMember) => void;
  currentUserId?: string;
}) {
  const sorted = [...members].sort((a, b) => {
    const order = { owner: 0, co_owner: 1, admin: 2, host: 3, vip: 4, member: 5 };
    return (order[a.role as keyof typeof order] ?? 6) - (order[b.role as keyof typeof order] ?? 6);
  });

  // Map userId → seat for quick lookup
  const seatMap = new Map<string, DBSeat>();
  seats?.forEach((s) => { if (s.user_id) seatMap.set(s.user_id, s); });

  return (
    <div
      className="fixed inset-0 z-[85] bg-black/70 backdrop-blur-md flex items-end justify-center animate-fade-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass-strong rounded-t-3xl pb-8 shadow-card"
        style={{ maxHeight: "78vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <div>
            <h2 className="font-bold text-base">Live Members</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse align-middle" />
              {members.length} online now
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full glass grid place-items-center active:scale-95"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="h-px bg-white/8 mx-5 flex-shrink-0" />

        {/* List */}
        <div className="overflow-y-auto flex-1 px-5 pt-3 space-y-2 no-scrollbar">
          {sorted.map((m) => {
            const meta   = ROLE_META[m.role] ?? ROLE_META.member;
            const isMe   = m.user_id === currentUserId;
            const seat   = seatMap.get(m.user_id);
            const sid    = sidFromUserId(m.user_id);

            return (
              <button
                key={m.user_id}
                onClick={() => onSelectUser(m)}
                className="w-full flex items-center gap-3 glass rounded-2xl px-3 py-3 active:scale-[0.98] transition-transform text-left"
              >
                {/* Avatar with online dot */}
                <div className="relative flex-shrink-0">
                  <img
                    src={m.avatar ?? defaultAvatar(m.username)}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-white/10"
                  />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 ring-2 ring-background" />
                </div>

                {/* Name + SID + role */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm truncate leading-none">
                      {m.username}
                      {isMe && <span className="text-muted-foreground font-normal"> (you)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-[11px] flex items-center gap-1 ${meta.color}`}>
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono">{sid}</span>
                  </div>
                </div>

                {/* Seat badge */}
                {seat && (
                  <div className="flex items-center gap-1 glass rounded-full px-2 py-1 flex-shrink-0">
                    <Mic className="h-2.5 w-2.5 text-electric" />
                    <span className="text-[10px] text-electric font-semibold">
                      {seat.seat_index === 0 ? "Host" : `S${seat.seat_index}`}
                    </span>
                  </div>
                )}

                {/* Role icon */}
                {ROLE_ICONS[m.role]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
