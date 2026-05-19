"use client";

// ═══════════════════════════════════════════════════════════════════════════════
// SEAT MODERATION SHEET - Quick actions for moderating individual seats
// ═══════════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mic,
  MicOff,
  UserMinus,
  LogOut,
  Lock,
  Unlock,
  ArrowLeftRight,
  Crown,
  Shield,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { DBSeat, DBMember } from "@/lib/rooms";
import { defaultAvatar } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface SeatModerationSheetProps {
  seat: DBSeat | null;
  member?: DBMember | null;
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  isCoOwner: boolean;
  currentUserId?: string;
  onMute: () => void;
  onKickSeat: () => void;
  onKickRoom: () => void;
  onLock: () => void;
  onPromote: (role: "co_owner" | "admin") => void;
  onSwapSeats?: (targetSeatIndex: number) => void;
  availableSeats?: number[];
}

export function SeatModerationSheet({
  seat,
  member,
  isOpen,
  onClose,
  isOwner,
  isCoOwner,
  currentUserId,
  onMute,
  onKickSeat,
  onKickRoom,
  onLock,
  onPromote,
  onSwapSeats,
  availableSeats = [],
}: SeatModerationSheetProps) {
  if (!seat) return null;

  const isEmpty = !seat.user_id;
  const isMe = seat.user_id === currentUserId;
  const canModerate = isOwner || isCoOwner;
  
  const roleLabel = member
    ? member.role === "owner"
      ? "Host"
      : member.role === "co_owner"
      ? "Co-host"
      : member.role === "admin"
      ? "Admin"
      : "Member"
    : "";

  const ActionButton = ({
    icon: Icon,
    label,
    description,
    onClick,
    variant = "default",
    disabled = false,
  }: {
    icon: React.ElementType;
    label: string;
    description?: string;
    onClick: () => void;
    variant?: "default" | "danger" | "success" | "warning";
    disabled?: boolean;
  }) => {
    const colors = {
      default: "text-white",
      danger: "text-red-400",
      success: "text-green-400",
      warning: "text-orange-400",
    };
    const bgs = {
      default: "bg-white/5",
      danger: "bg-red-500/10 border-red-500/20",
      success: "bg-green-500/10 border-green-500/20",
      warning: "bg-orange-500/10 border-orange-500/20",
    };

    return (
      <motion.button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "w-full p-3 rounded-xl border border-white/5 flex items-center gap-3 transition-all",
          bgs[variant],
          disabled && "opacity-50 cursor-not-allowed"
        )}
        whileHover={!disabled ? { scale: 1.01 } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
      >
        <div
          className={cn(
            "h-9 w-9 rounded-xl grid place-items-center",
            variant === "default" ? "bg-white/10" : "bg-current/20",
            colors[variant]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 text-left">
          <p className={cn("text-sm font-medium", colors[variant])}>{label}</p>
          {description && (
            <p className="text-[11px] text-muted-foreground">{description}</p>
          )}
        </div>
      </motion.button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[85] bg-black/70 backdrop-blur-md flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md glass-strong rounded-t-3xl p-5 shadow-card"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center -mt-2 mb-4">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              {isEmpty ? (
                <div className="h-14 w-14 rounded-full glass grid place-items-center">
                  {seat.locked ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <span className="text-2xl">+</span>
                  )}
                </div>
              ) : (
                <img
                  src={seat.avatar ?? defaultAvatar(seat.username ?? "u")}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-white/10"
                />
              )}
              <div className="flex-1">
                <p className="font-bold text-lg">
                  {isEmpty ? "Empty Seat" : seat.username}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {seat.seat_index === 0 ? "Host Seat" : `Seat ${seat.seat_index}`}
                  {roleLabel && ` · ${roleLabel}`}
                </p>
              </div>
              <motion.button
                onClick={onClose}
                className="h-8 w-8 rounded-full glass grid place-items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {/* Empty seat actions */}
              {isEmpty && (
                <ActionButton
                  icon={seat.locked ? Unlock : Lock}
                  label={seat.locked ? "Unlock Seat" : "Lock Seat"}
                  description={
                    seat.locked
                      ? "Allow users to take this seat"
                      : "Prevent users from taking this seat"
                  }
                  onClick={onLock}
                />
              )}

              {/* Occupied seat actions */}
              {!isEmpty && !isMe && (
                <>
                  <ActionButton
                    icon={seat.muted ? Volume2 : VolumeX}
                    label={seat.muted ? "Unmute" : "Mute"}
                    description="Toggle microphone for this user"
                    onClick={onMute}
                  />

                  <ActionButton
                    icon={UserMinus}
                    label="Remove from Seat"
                    description="Move user back to audience"
                    onClick={onKickSeat}
                    variant="warning"
                  />

                  <ActionButton
                    icon={LogOut}
                    label="Kick from Room"
                    description="Remove user from the room entirely"
                    onClick={onKickRoom}
                    variant="danger"
                  />

                  {/* Role management */}
                  {canModerate && member?.role === "member" && (
                    <>
                      <div className="h-px bg-white/5 my-3" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                        Assign Role
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {isOwner && (
                          <motion.button
                            onClick={() => onPromote("co_owner")}
                            className="py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium flex flex-col items-center gap-1"
                            whileTap={{ scale: 0.95 }}
                          >
                            <Crown className="h-4 w-4" />
                            Make Co-host
                          </motion.button>
                        )}
                        <motion.button
                          onClick={() => onPromote("admin")}
                          className="py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium flex flex-col items-center gap-1"
                          whileTap={{ scale: 0.95 }}
                        >
                          <Shield className="h-4 w-4" />
                          Make Admin
                        </motion.button>
                      </div>
                    </>
                  )}

                  {/* Swap seats */}
                  {onSwapSeats && availableSeats.length > 0 && (
                    <>
                      <div className="h-px bg-white/5 my-3" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                        Swap Seat
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableSeats.map((seatIdx) => (
                          <motion.button
                            key={seatIdx}
                            onClick={() => onSwapSeats(seatIdx)}
                            className="h-10 w-10 rounded-xl glass text-xs font-medium flex items-center justify-center"
                            whileTap={{ scale: 0.95 }}
                          >
                            {seatIdx}
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Lock/unlock for occupied seats */}
              {!isEmpty && canModerate && (
                <ActionButton
                  icon={seat.locked ? Unlock : Lock}
                  label={seat.locked ? "Unlock Seat" : "Lock Seat After Leave"}
                  description="Lock this seat when user leaves"
                  onClick={onLock}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
