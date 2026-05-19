"use client";

// ═══════════════════════════════════════════════════════════════════════════════
// MIC REQUEST QUEUE - Panel for hosts to manage audience mic requests
// ═══════════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  X,
  Hand,
  Check,
  XIcon,
  Star,
  Clock,
  Mic,
  Users,
} from "lucide-react";
import type { MicRequest } from "@/lib/voice-room/types";
import { defaultAvatar } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface MicRequestQueueProps {
  isOpen: boolean;
  onClose: () => void;
  requests: MicRequest[];
  onAccept: (requestId: string, seatIndex: number) => void;
  onReject: (requestId: string) => void;
  availableSeats: number[];
}

export function MicRequestQueue({
  isOpen,
  onClose,
  requests,
  onAccept,
  onReject,
  availableSeats,
}: MicRequestQueueProps) {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const vipRequests = pendingRequests.filter((r) => r.priority === "vip");
  const normalRequests = pendingRequests.filter((r) => r.priority !== "vip");

  const sortedRequests = [...vipRequests, ...normalRequests];

  const formatTime = (timestamp: string) => {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
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
            className="w-full max-w-md glass-strong rounded-t-3xl shadow-card overflow-hidden"
            style={{ maxHeight: "70vh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gold/20 grid place-items-center">
                  <Hand className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <h2 className="font-bold text-base">Mic Requests</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {pendingRequests.length} waiting
                  </p>
                </div>
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

            {/* Available seats indicator */}
            {availableSeats.length > 0 && (
              <div className="mx-5 mb-3 glass rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Available Seats
                  </span>
                  <span className="text-[11px] text-electric font-semibold">
                    {availableSeats.length} open
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSeats.map((seatIdx) => (
                    <motion.button
                      key={seatIdx}
                      onClick={() =>
                        setSelectedSeat(selectedSeat === seatIdx ? null : seatIdx)
                      }
                      className={cn(
                        "h-8 w-8 rounded-lg text-xs font-semibold transition-all",
                        selectedSeat === seatIdx
                          ? "bg-electric text-white shadow-glow-soft"
                          : "glass text-muted-foreground"
                      )}
                      whileTap={{ scale: 0.95 }}
                    >
                      {seatIdx}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Request list */}
            <div className="px-5 pb-8 overflow-y-auto" style={{ maxHeight: "calc(70vh - 180px)" }}>
              {sortedRequests.length === 0 ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No mic requests yet</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">
                    Audience members can raise their hand to request mic access
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {sortedRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        className={cn(
                          "glass rounded-2xl p-3 flex items-center gap-3",
                          request.priority === "vip" && "ring-1 ring-gold/40"
                        )}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ delay: index * 0.05 }}
                        layout
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={request.avatar ?? defaultAvatar(request.username)}
                            alt=""
                            className="h-11 w-11 rounded-full object-cover"
                          />
                          {request.priority === "vip" && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold grid place-items-center">
                              <Star className="h-2.5 w-2.5 text-background" />
                            </span>
                          )}
                          <motion.span
                            className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-gold grid place-items-center"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                          >
                            <Hand className="h-2.5 w-2.5 text-background" />
                          </motion.span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm truncate">
                              @{request.username}
                            </p>
                            {request.priority === "vip" && (
                              <span className="px-1.5 py-0.5 rounded-full bg-gold/20 text-gold text-[8px] font-bold">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              {formatTime(request.requestedAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <motion.button
                            onClick={() => onReject(request.id)}
                            className="h-9 w-9 rounded-xl bg-red-500/10 text-red-400 grid place-items-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <XIcon className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              const seat = selectedSeat ?? availableSeats[0];
                              if (seat !== undefined) {
                                onAccept(request.id, seat);
                              }
                            }}
                            disabled={availableSeats.length === 0}
                            className={cn(
                              "h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5",
                              availableSeats.length > 0
                                ? "gradient-electric text-white shadow-glow-soft"
                                : "bg-white/5 text-muted-foreground cursor-not-allowed"
                            )}
                            whileHover={
                              availableSeats.length > 0 ? { scale: 1.02 } : undefined
                            }
                            whileTap={
                              availableSeats.length > 0 ? { scale: 0.98 } : undefined
                            }
                          >
                            <Check className="h-3.5 w-3.5" />
                            Accept
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAND RAISE BUTTON - For audience members to request mic access
// ═══════════════════════════════════════════════════════════════════════════════

interface HandRaiseButtonProps {
  isRaised: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function HandRaiseButton({
  isRaised,
  onToggle,
  disabled = false,
}: HandRaiseButtonProps) {
  return (
    <motion.button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "h-10 w-10 rounded-full grid place-items-center transition-all",
        isRaised
          ? "bg-gold text-background shadow-[0_0_20px_oklch(0.82_0.16_85/0.5)]"
          : "glass text-muted-foreground hover:text-white"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isRaised ? "Cancel request" : "Request to speak"}
    >
      <motion.div
        animate={
          isRaised
            ? { y: [0, -3, 0], rotate: [0, -10, 10, 0] }
            : {}
        }
        transition={{ repeat: isRaised ? Infinity : 0, duration: 0.8 }}
      >
        <Hand className="h-4 w-4" />
      </motion.div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIC REQUEST INDICATOR - Shows pending requests count for hosts
// ═══════════════════════════════════════════════════════════════════════════════

interface MicRequestIndicatorProps {
  count: number;
  onClick: () => void;
}

export function MicRequestIndicator({ count, onClick }: MicRequestIndicatorProps) {
  if (count === 0) return null;

  return (
    <motion.button
      onClick={onClick}
      className="relative h-10 px-4 rounded-full glass flex items-center gap-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ repeat: Infinity, duration: 0.6 }}
      >
        <Hand className="h-4 w-4 text-gold" />
      </motion.div>
      <span className="text-xs font-semibold">{count}</span>
      <motion.span
        className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-electric grid place-items-center text-[9px] font-bold"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        !
      </motion.span>
    </motion.button>
  );
}
