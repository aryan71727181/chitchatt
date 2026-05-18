import { Check, X, Hand } from "lucide-react";
import { defaultAvatar } from "@/lib/auth";

export type SeatRequest = {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  avatar: string | null;
  status: string;
  created_at: string;
};

export function SeatRequestsPanel({
  requests,
  onApprove,
  onDeny,
  onClose,
}: {
  requests: SeatRequest[];
  onApprove: (req: SeatRequest) => void;
  onDeny: (req: SeatRequest) => void;
  onClose: () => void;
}) {
  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-md flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass-strong rounded-t-3xl p-5 shadow-card animate-fade-up"
        style={{ maxHeight: "70vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-white/20" />

        <div className="flex items-center justify-between mb-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl gradient-electric grid place-items-center shadow-glow-soft">
              <Hand className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Seat Requests</h3>
              <p className="text-[10px] text-muted-foreground">{pending.length} waiting</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full glass grid place-items-center">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {pending.length === 0 ? (
          <div className="py-8 text-center">
            <Hand className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto no-scrollbar" style={{ maxHeight: "calc(70vh - 100px)" }}>
            {pending.map((req) => (
              <div key={req.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                <div className="h-11 w-11 rounded-full p-[2px] gradient-electric flex-shrink-0">
                  <img
                    src={req.avatar ?? defaultAvatar(req.username)}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                    onError={(e) => { e.currentTarget.src = defaultAvatar(req.username); }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">@{req.username}</p>
                  <p className="text-[10px] text-muted-foreground">Wants to join stage</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => onDeny(req)}
                    className="h-9 w-9 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 grid place-items-center active:scale-95"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onApprove(req)}
                    className="h-9 w-9 rounded-full gradient-electric text-white grid place-items-center shadow-glow-soft active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
