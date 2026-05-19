"use client";

// ═══════════════════════════════════════════════════════════════════════════════
// GIFT PANEL - Premium gift selection and sending interface
// ═══════════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  X,
  Gift,
  Coins,
  Crown,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { GIFTS, type Gift as GiftType, type GiftTier } from "@/lib/voice-room/types";
import { cn } from "@/lib/utils";

interface GiftPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (gift: GiftType, recipientId?: string) => void;
  userCoins?: number;
  topGifters?: { userId: string; username: string; total: number }[];
}

const TIER_COLORS: Record<GiftTier, { bg: string; border: string; text: string }> = {
  basic: { bg: "bg-white/5", border: "border-white/10", text: "text-white/80" },
  premium: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-300" },
  legendary: { bg: "bg-gold/10", border: "border-gold/30", text: "text-gold" },
};

export function GiftPanel({
  isOpen,
  onClose,
  onSendGift,
  userCoins = 0,
  topGifters = [],
}: GiftPanelProps) {
  const [selectedTier, setSelectedTier] = useState<GiftTier | "all">("all");
  const [selectedGift, setSelectedGift] = useState<GiftType | null>(null);

  const filteredGifts =
    selectedTier === "all"
      ? GIFTS
      : GIFTS.filter((g) => g.tier === selectedTier);

  const handleSend = () => {
    if (selectedGift) {
      onSendGift(selectedGift);
      setSelectedGift(null);
    }
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
            style={{ maxHeight: "75vh" }}
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
                <div className="h-10 w-10 rounded-xl bg-pink-glow/20 grid place-items-center">
                  <Gift className="h-5 w-5 text-pink-glow" />
                </div>
                <div>
                  <h2 className="font-bold text-base">Send Gift</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Coins className="h-3 w-3 text-gold" />
                    <span className="text-[11px] text-gold font-semibold">
                      {userCoins.toLocaleString()} coins
                    </span>
                  </div>
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

            {/* Top Gifters */}
            {topGifters.length > 0 && (
              <div className="mx-5 mb-3 glass rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5 text-gold" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Top Gifters
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {topGifters.slice(0, 5).map((gifter, idx) => (
                    <div
                      key={gifter.userId}
                      className="flex items-center gap-2 glass rounded-xl px-3 py-2 flex-shrink-0"
                    >
                      <span
                        className={cn(
                          "text-xs font-bold",
                          idx === 0
                            ? "text-gold"
                            : idx === 1
                            ? "text-white/60"
                            : idx === 2
                            ? "text-orange-400"
                            : "text-muted-foreground"
                        )}
                      >
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-medium truncate max-w-[80px]">
                        @{gifter.username}
                      </span>
                      <span className="text-[10px] text-gold">{gifter.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tier tabs */}
            <div className="px-5 mb-3">
              <div className="flex gap-1 p-1 glass rounded-2xl">
                {(["all", "basic", "premium", "legendary"] as const).map((tier) => (
                  <motion.button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-xl text-[11px] font-semibold transition-all capitalize",
                      selectedTier === tier
                        ? tier === "legendary"
                          ? "bg-gold/20 text-gold"
                          : tier === "premium"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-electric/20 text-electric"
                        : "text-muted-foreground hover:text-white"
                    )}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tier === "all" ? "All" : tier}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Gift grid */}
            <div
              className="px-5 pb-4 overflow-y-auto"
              style={{ maxHeight: "calc(75vh - 280px)" }}
            >
              <div className="grid grid-cols-5 gap-2">
                {filteredGifts.map((gift, index) => {
                  const tierStyle = TIER_COLORS[gift.tier];
                  const isSelected = selectedGift?.id === gift.id;
                  const canAfford = userCoins >= gift.coins;

                  return (
                    <motion.button
                      key={gift.id}
                      onClick={() => canAfford && setSelectedGift(gift)}
                      disabled={!canAfford}
                      className={cn(
                        "relative rounded-2xl p-2 flex flex-col items-center gap-1 border transition-all",
                        tierStyle.bg,
                        isSelected
                          ? "ring-2 ring-electric shadow-glow-soft"
                          : tierStyle.border,
                        !canAfford && "opacity-50 cursor-not-allowed"
                      )}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={canAfford ? { scale: 1.05 } : undefined}
                      whileTap={canAfford ? { scale: 0.95 } : undefined}
                    >
                      <span className="text-2xl">{gift.emoji}</span>
                      <span className="text-[9px] font-medium truncate w-full text-center">
                        {gift.name}
                      </span>
                      <span className={cn("text-[9px] font-semibold", tierStyle.text)}>
                        {gift.coins}
                      </span>
                      {gift.tier === "legendary" && (
                        <Sparkles className="absolute top-1 right-1 h-3 w-3 text-gold" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Send button */}
            <div className="px-5 pb-6">
              <motion.button
                onClick={handleSend}
                disabled={!selectedGift}
                className={cn(
                  "w-full h-12 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                  selectedGift
                    ? "gradient-electric text-white shadow-glow"
                    : "glass text-muted-foreground cursor-not-allowed"
                )}
                whileHover={selectedGift ? { scale: 1.01 } : undefined}
                whileTap={selectedGift ? { scale: 0.99 } : undefined}
              >
                {selectedGift ? (
                  <>
                    <span className="text-xl">{selectedGift.emoji}</span>
                    Send {selectedGift.name}
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px]">
                      {selectedGift.coins} coins
                    </span>
                  </>
                ) : (
                  "Select a gift"
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GIFT ANIMATION - Animated gift notification that appears on screen
// ═══════════════════════════════════════════════════════════════════════════════

import type { GiftNotification } from "@/lib/voice-room/types";

interface GiftAnimationProps {
  notifications: GiftNotification[];
}

export function GiftAnimation({ notifications }: GiftAnimationProps) {
  return (
    <div className="fixed top-32 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 pointer-events-none z-50">
      <AnimatePresence>
        {notifications.slice(0, 3).map((notif, index) => (
          <motion.div
            key={notif.id}
            className="glass-strong rounded-2xl px-4 py-3 mb-2 flex items-center gap-3 shadow-card"
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <motion.span
              className="text-3xl"
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -10, 10, 0],
              }}
              transition={{ repeat: 2, duration: 0.5 }}
            >
              {notif.gift.emoji}
            </motion.span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                <span className="text-electric">@{notif.senderUsername}</span>
                {notif.recipientUsername && (
                  <>
                    {" sent to "}
                    <span className="text-pink-glow">@{notif.recipientUsername}</span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{notif.gift.name}</span>
                {notif.comboCount > 1 && (
                  <motion.span
                    className="px-1.5 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-bold"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    x{notif.comboCount}
                  </motion.span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING GIFTS - Animated gifts that float across the stage
// ═══════════════════════════════════════════════════════════════════════════════

interface FloatingGiftsProps {
  notifications: GiftNotification[];
}

export function FloatingGifts({ notifications }: FloatingGiftsProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {notifications.map((notif) => {
          const startX = 20 + Math.random() * 60;
          const animation = notif.gift.animationType;

          if (animation === "float") {
            return (
              <motion.div
                key={notif.id}
                className="absolute text-4xl"
                style={{ left: `${startX}%`, bottom: "20%" }}
                initial={{ y: 0, opacity: 0, scale: 0.3 }}
                animate={{
                  y: -200,
                  opacity: [0, 1, 1, 0],
                  scale: [0.3, 1.5, 1.2, 0.8],
                  x: [0, Math.random() * 50 - 25],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 3, ease: "easeOut" }}
              >
                {notif.gift.emoji}
              </motion.div>
            );
          }

          if (animation === "burst") {
            return (
              <motion.div
                key={notif.id}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 2, 1.5], opacity: [0, 1, 0] }}
                transition={{ duration: 1.5 }}
              >
                <span className="text-6xl">{notif.gift.emoji}</span>
              </motion.div>
            );
          }

          if (animation === "rain") {
            return Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={`${notif.id}-${i}`}
                className="absolute text-2xl"
                style={{ left: `${10 + i * 20}%`, top: "-10%" }}
                initial={{ y: 0, opacity: 1 }}
                animate={{
                  y: 400,
                  opacity: [1, 1, 0],
                  rotate: [0, 360],
                }}
                transition={{ duration: 2 + i * 0.2, delay: i * 0.1 }}
              >
                {notif.gift.emoji}
              </motion.div>
            ));
          }

          // spotlight
          return (
            <motion.div
              key={notif.id}
              className="absolute left-1/2 top-1/3 -translate-x-1/2"
              initial={{ scale: 0, opacity: 0, y: 50 }}
              animate={{
                scale: [0, 1.8, 1.5],
                opacity: [0, 1, 1, 0],
                y: [50, 0, -20],
              }}
              transition={{ duration: 2.5 }}
            >
              <div className="relative">
                <motion.div
                  className="absolute -inset-8 rounded-full bg-gold/20"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ repeat: 2, duration: 0.5 }}
                />
                <span className="text-7xl block">{notif.gift.emoji}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
