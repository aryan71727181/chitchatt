"use client";

// ═══════════════════════════════════════════════════════════════════════════════
// SEAT GRID - Dynamic seat layout system with 8/12/16 seat modes
// ═══════════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import type { DBSeat } from "@/lib/rooms";
import { uidFromUserId } from "@/lib/rooms";
import type { SeatLayoutMode } from "@/lib/voice-room/types";
import { PremiumSeat } from "./PremiumSeat";
import { cn } from "@/lib/utils";

interface SeatGridProps {
  seats: DBSeat[];
  seatLayout: SeatLayoutMode;
  speakingUids: Set<number>;
  currentUserId?: string;
  isMod?: boolean;
  onTakeSeat: (seat: DBSeat) => void;
  onLeaveSeat: () => void;
  onOpenProfile: (userId: string) => void;
  onModerate: (seat: DBSeat) => void;
  onLockToggle: (seat: DBSeat) => void;
}

// Layout configurations for different seat counts
const LAYOUT_CONFIG: Record<SeatLayoutMode, { 
  rows: number[]; 
  hostSize: "md" | "lg";
  seatSize: "sm" | "md";
}> = {
  8: { rows: [3, 4], hostSize: "lg", seatSize: "md" },
  12: { rows: [4, 4, 3], hostSize: "lg", seatSize: "md" },
  16: { rows: [4, 4, 4, 3], hostSize: "md", seatSize: "sm" },
};

export function SeatGrid({
  seats,
  seatLayout,
  speakingUids,
  currentUserId,
  isMod = false,
  onTakeSeat,
  onLeaveSeat,
  onOpenProfile,
  onModerate,
  onLockToggle,
}: SeatGridProps) {
  const config = LAYOUT_CONFIG[seatLayout];
  const hostSeat = seats.find((s) => s.seat_index === 0);
  const otherSeats = seats
    .filter((s) => s.seat_index !== 0)
    .sort((a, b) => a.seat_index - b.seat_index)
    .slice(0, seatLayout - 1); // Limit to current layout size

  // Distribute seats into rows
  const seatRows: DBSeat[][] = [];
  let seatIndex = 0;
  for (const rowCount of config.rows) {
    const row: DBSeat[] = [];
    for (let i = 0; i < rowCount && seatIndex < otherSeats.length; i++) {
      row.push(otherSeats[seatIndex]);
      seatIndex++;
    }
    if (row.length > 0) {
      seatRows.push(row);
    }
  }

  const isSpeaking = (seat: DBSeat) =>
    !!seat.user_id && speakingUids.has(uidFromUserId(seat.user_id));

  return (
    <div className="relative px-4 pt-6 pb-7">
      {/* Decorative concentric rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-[7rem] h-[11rem] w-[18rem] -translate-x-1/2 rounded-[50%] border border-electric/14"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        />
        <motion.div
          className="absolute left-1/2 top-[8.5rem] h-[14rem] w-[21rem] -translate-x-1/2 rounded-[50%] border border-electric/10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        />
        <motion.div
          className="absolute left-1/2 top-[10rem] h-[17rem] w-[24rem] -translate-x-1/2 rounded-[50%] border border-electric/6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        />
      </div>

      {/* Host seat - always centered at top */}
      <motion.div
        className="flex justify-center mb-7"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        {hostSeat && (
          <PremiumSeat
            seat={hostSeat}
            isHost
            size={config.hostSize}
            isSpeaking={isSpeaking(hostSeat)}
            isMe={hostSeat.user_id === currentUserId}
            onTake={() => onTakeSeat(hostSeat)}
            onLeave={onLeaveSeat}
            onProfile={
              hostSeat.user_id && hostSeat.user_id !== currentUserId
                ? () => onOpenProfile(hostSeat.user_id!)
                : undefined
            }
            onModerate={
              isMod && hostSeat.user_id && hostSeat.user_id !== currentUserId
                ? () => onModerate(hostSeat)
                : undefined
            }
          />
        )}
      </motion.div>

      {/* Dynamic seat rows */}
      <div className="relative flex flex-col items-center gap-5">
        {seatRows.map((row, rowIndex) => (
          <motion.div
            key={rowIndex}
            className={cn(
              "flex items-center justify-center",
              seatLayout === 16 ? "gap-3" : "gap-4"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + rowIndex * 0.05 }}
          >
            <AnimatePresence mode="popLayout">
              {row.map((seat) => (
                <motion.div
                  key={seat.seat_index}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <PremiumSeat
                    seat={seat}
                    size={config.seatSize}
                    isSpeaking={isSpeaking(seat)}
                    isMe={seat.user_id === currentUserId}
                    onTake={() => onTakeSeat(seat)}
                    onLeave={onLeaveSeat}
                    onProfile={
                      seat.user_id && seat.user_id !== currentUserId
                        ? () => onOpenProfile(seat.user_id!)
                        : undefined
                    }
                    onModerate={
                      isMod && seat.user_id && seat.user_id !== currentUserId
                        ? () => onModerate(seat)
                        : undefined
                    }
                    onLockToggle={
                      isMod && !seat.user_id ? () => onLockToggle(seat) : undefined
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Layout selector component for host panel
interface SeatLayoutSelectorProps {
  current: SeatLayoutMode;
  onChange: (layout: SeatLayoutMode) => void;
  disabled?: boolean;
}

export function SeatLayoutSelector({
  current,
  onChange,
  disabled = false,
}: SeatLayoutSelectorProps) {
  const layouts: SeatLayoutMode[] = [8, 12, 16];

  return (
    <div className="flex items-center gap-2">
      {layouts.map((layout) => (
        <motion.button
          key={layout}
          onClick={() => !disabled && onChange(layout)}
          className={cn(
            "h-10 px-4 rounded-xl text-xs font-semibold transition-all",
            current === layout
              ? "gradient-electric text-white shadow-glow-soft"
              : "glass text-muted-foreground hover:text-white",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          whileHover={!disabled ? { scale: 1.02 } : undefined}
          whileTap={!disabled ? { scale: 0.98 } : undefined}
          disabled={disabled}
        >
          {layout} Seats
        </motion.button>
      ))}
    </div>
  );
}
