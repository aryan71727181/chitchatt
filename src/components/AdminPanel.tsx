import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DBMember } from "@/lib/rooms";
import { defaultAvatar } from "@/lib/auth";
import { X, Crown, Shield, Star, User, ChevronRight, UserMinus } from "lucide-react";
import { toast } from "sonner";

const ROLE_META: Record<string, { icon: string; label: string; color: string }> = {
  owner:    { icon: "👑", label: "Host",     color: "text-yellow-400" },
  co_owner: { icon: "⭐", label: "Co-owner", color: "text-purple-300" },
  admin:    { icon: "🛡️", label: "Admin",    color: "text-blue-300" },
  member:   { icon: "👤", label: "Member",   color: "text-muted-foreground" },
};

export function AdminPanel({
  members,
  roomId,
  currentUserRole,
  onClose,
}: {
  members: DBMember[];
  roomId: string;
  currentUserRole: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const isOwner = currentUserRole === "owner";
  const isCoOwner = currentUserRole === "co_owner";

  const staff = members.filter((m) => m.role !== "member");
  const regularMembers = members.filter((m) => m.role === "member");

  const setRole = async (userId: string, role: string) => {
    setLoading(userId + role);
    const { error } = await supabase
      .from("room_members")
      .update({ role })
      .eq("room_id", roomId)
      .eq("user_id", userId);
    setLoading(null);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Role updated to ${ROLE_META[role]?.label ?? role}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[92] bg-black/70 backdrop-blur-md flex items-end justify-center animate-fade-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass-strong rounded-t-3xl pb-8 shadow-card"
        style={{ maxHeight: "80vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h2 className="font-bold text-base">Room Management</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Manage roles & permissions</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full glass grid place-items-center active:scale-95">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="h-px bg-white/8 mx-5" />

        <div className="overflow-y-auto flex-1 px-5 pt-4 space-y-4 no-scrollbar">
          {/* Staff section */}
          {staff.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Team</p>
              <div className="space-y-2">
                {staff.map((m) => {
                  const meta = ROLE_META[m.role] ?? ROLE_META.member;
                  return (
                    <div key={m.user_id} className="glass rounded-2xl px-3 py-3 flex items-center gap-3">
                      <img
                        src={m.avatar ?? defaultAvatar(m.username)}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{m.username}</p>
                        <p className={`text-[11px] flex items-center gap-1 mt-0.5 ${meta.color}`}>
                          <span>{meta.icon}</span> {meta.label}
                        </p>
                      </div>
                      {m.role !== "owner" && (isOwner || (isCoOwner && m.role === "admin")) && (
                        <button
                          disabled={loading === m.user_id + "member"}
                          onClick={() => setRole(m.user_id, "member")}
                          className="h-8 px-3 rounded-xl bg-white/10 text-[11px] font-medium text-muted-foreground active:scale-95 disabled:opacity-50 flex items-center gap-1"
                        >
                          <UserMinus className="h-3 w-3" /> Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Members - promote section */}
          {(isOwner || isCoOwner) && regularMembers.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
                Promote Members
              </p>
              <div className="space-y-2">
                {regularMembers.map((m) => (
                  <div key={m.user_id} className="glass rounded-2xl px-3 py-3 flex items-center gap-3">
                    <img
                      src={m.avatar ?? defaultAvatar(m.username)}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{m.username}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">👤 Listener</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        disabled={!!loading}
                        onClick={() => setRole(m.user_id, "admin")}
                        className="h-8 px-2.5 rounded-xl bg-blue-500/20 text-blue-300 text-[11px] font-medium active:scale-95 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Shield className="h-3 w-3" /> Admin
                      </button>
                      {isOwner && (
                        <button
                          disabled={!!loading}
                          onClick={() => setRole(m.user_id, "co_owner")}
                          className="h-8 px-2.5 rounded-xl bg-purple-500/20 text-purple-300 text-[11px] font-medium active:scale-95 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Star className="h-3 w-3" /> Co-own
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permission legend */}
          <div className="glass rounded-2xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-semibold">Permissions</p>
            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">👑</span>
                <span><b className="text-yellow-400">Host</b> — Full control, room management, delete room</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-300 mt-0.5">⭐</span>
                <span><b className="text-purple-300">Co-owner</b> — Moderate, manage admins, cannot remove host</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-300 mt-0.5">🛡️</span>
                <span><b className="text-blue-300">Admin</b> — Mute, kick, seat management</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white/40 mt-0.5">👤</span>
                <span><b className="text-white/60">Listener</b> — Chat, gifts, join seats</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
