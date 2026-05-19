"use client";

// ═══════════════════════════════════════════════════════════════════════════════
// PREMIUM SEAT COMPONENT - Individual seat with premium animations and states
// ═══════════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Mic,
  MicOff,
  Plus,
  Lock,
  MoreVertical,
  Hand,
  Star,
  Shield,
} from "lucide-react";
import type { DBSeat } from "@/lib/rooms";
import { defaultAvatar } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface PremiumSeatProps {
  seat: DBSeat;
  isHost?: boolean;
  isSpeaking?: boolean;
  isMe?: boolean;
  isVip?: boolean;
  levelBadge?: number;
  hasHandRaised?: boolean;
  onTake: () => void;
  onLeave: () => void;
  onProfile?: () => void;
  onModerate?: () => void;
  onLockToggle?: () => void;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { container: "h-16 w-16", avatar: "h-14 w-14", badge: "h-4 w-4", mic: "h-5 w-5", text: "text-[9px]" },
  md: { container: "h-20 w-20", avatar: "h-[4.5rem] w-[4.5rem]", badge: "h-5 w-5", mic: "h-6 w-6", text: "text-[10px]" },
  lg: { container: "h-28 w-28", avatar: "h-24 w-24", badge: "h-7 w-7", mic: "h-7 w-7", text: "text-xs" },
};

export function PremiumSeat({
  seat,
  isHost = false,
  isSpeaking = false,
  isMe = false,
  isVip = false,
  levelBadge,
  hasHandRaised = false,
  onTake,
  onLeave,
  onProfile,
  onModerate,
  onLockToggle,
  size = "md",
}: PremiumSeatProps) {
  const s = SIZES[size];
  const seatNum = `NO.${seat.seat_index}`;
  const isEmpty = !seat.user_id;

  // Empty seat
  if (isEmpty) {
    return (
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <motion.button
          onClick={seat.locked ? onLockToggle : onTake}
          className={cn(
            "relative rounded-full grid place-items-center border transition-all",
            s.container,
            isHost
              ? "border-electric/60 bg-[radial-gradient(circle_at_center,oklch(0.2_0.07_260),oklch(0.11_0.025_270))] shadow-glow"
              : "border-electric/30 bg-[linear-gradient(180deg,oklch(0.17_0.045_270),oklch(0.11_0.02_270))]",
            seat.locked && "opacity-55"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Host crown badge */}
          {isHost && (
            <motion.span
              className="absolute -top-2 h-8 w-8 rounded-full grid place-items-center bg-electric text-background shadow-glow-soft z-10"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Crown className="h-4 w-4" />
            </motion.span>
          )}

          {/* Locked / Empty state */}
          {seat.locked ? (
            <div className="flex flex-col items-center gap-1">
              <Lock className="h-4 w-4 text-muted-foreground" />
              {!isHost && (
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1 w-3 rounded-full bg-white/15"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Plus
                className={cn(
                  "text-electric",
                  isHost ? "h-7 w-7" : "h-5 w-5"
                )}
              />
            </motion.div>
          )}
        </motion.button>

        {/* Label */}
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 font-semibold tracking-[0.12em]",
            s.text,
            isHost
              ? "border-electric/40 text-electric"
              : "border-white/8 text-muted-foreground"
          )}
        >
          {seat.locked ? "LOCKED" : isHost ? "HOST SEAT" : seatNum}
        </span>
      </motion.div>
    );
  }

  // Occupied seat
  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <div className="relative">
        {/* Speaking pulse rings */}
        <AnimatePresence>
          {isSpeaking && (
            <>
              <motion.span
                className="absolute -inset-1.5 rounded-full bg-electric/30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.15, 1],
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
              <motion.span
                className="absolute -inset-3 rounded-full bg-electric/20"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                  scale: [1, 1.2, 1],
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ repeat: Infinity, duration: 1.2, delay: 0.15 }}
              />
              <motion.span
                className="absolute -inset-5 rounded-full bg-electric/10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0.1, 0.2, 0.1],
                  scale: [1, 1.25, 1],
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Avatar button */}
        <motion.button
          onClick={isMe ? onLeave : (onProfile ?? onModerate)}
          className={cn(
            "relative rounded-full p-[3px]",
            s.container,
            isSpeaking
              ? "gradient-electric shadow-glow"
              : isVip
              ? "bg-[linear-gradient(180deg,oklch(0.82_0.16_85),oklch(0.6_0.12_85))]"
              : "bg-[linear-gradient(180deg,oklch(0.72_0.22_255),oklch(0.5_0.17_255))]"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isHost ? (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,oklch(0.2_0.06_255),oklch(0.1_0.025_270))] text-electric">
              <Crown className="h-8 w-8" />
            </div>
          ) : (
            <img
              src={seat.avatar ?? defaultAvatar(seat.username ?? "u")}
              alt=""
              className={cn("rounded-full object-cover", s.avatar)}
            />
          )}
        </motion.button>

        {/* Host crown badge */}
        {isHost && (
          <motion.span
            className="absolute -top-2 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full grid place-items-center bg-electric text-background shadow-glow-soft z-10"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Crown className="h-4 w-4" />
          </motion.span>
        )}

        {/* VIP badge */}
        {isVip && !isHost && (
          <motion.span
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full grid place-items-center bg-gold text-background shadow-lg z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Star className="h-3 w-3" />
          </motion.span>
        )}

        {/* Level badge */}
        {levelBadge && levelBadge > 0 && (
          <motion.span
            className="absolute -top-1 -left-1 h-5 min-w-5 px-1 rounded-full grid place-items-center bg-violet-glow text-white text-[9px] font-bold shadow-lg z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {levelBadge}
          </motion.span>
        )}

        {/* Hand raised indicator */}
        <AnimatePresence>
          {hasHandRaised && (
            <motion.span
              className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full grid place-items-center bg-gold text-background shadow-lg z-20"
              initial={{ y: 10, opacity: 0, scale: 0 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0, scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              >
                <Hand className="h-3.5 w-3.5" />
              </motion.div>
            </motion.span>
          )}
        </AnimatePresence>

        {/* Mic indicator */}
        <motion.span
          className={cn(
            "absolute bottom-0 right-0 rounded-full grid place-items-center ring-2 ring-background",
            s.mic,
            seat.muted
              ? "bg-[oklch(0.36_0.18_20)]"
              : isSpeaking
              ? "bg-electric animate-pulse"
              : "bg-electric"
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          {seat.muted ? (
            <MicOff className="h-2.5 w-2.5 text-muted-foreground" />
          ) : (
            <Mic className="h-2.5 w-2.5 text-white" />
          )}
        </motion.span>

        {/* Mod menu button */}
        {onModerate && !isMe && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onModerate();
            }}
            className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-black/70 grid place-items-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreVertical className="h-3 w-3" />
          </motion.button>
        )}
      </div>

      {/* Username */}
      {!isHost && (
        <span
          className={cn(
            "font-medium leading-none truncate max-w-[84px] text-center",
            s.text,
            isMe && "text-electric"
          )}
        >
          {seat.username}
          {isMe && " (you)"}
        </span>
      )}

      {/* Host label */}
      {isHost && (
        <span className="text-[10px] tracking-[0.16em] text-electric font-semibold">
          HOST
        </span>
      )}
    </motion.div>
  );
}
