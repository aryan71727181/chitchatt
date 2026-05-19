"use client";

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING REACTIONS - Animated floating emoji reactions that float up and fade
// ═══════════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import type { FloatingReaction, ReactionType } from "@/lib/voice-room/types";
import { REACTIONS } from "@/lib/voice-room/types";

interface FloatingReactionsProps {
  reactions: FloatingReaction[];
}

export function FloatingReactions({ reactions }: FloatingReactionsProps) {
  const getEmoji = (type: ReactionType) => {
    return REACTIONS.find((r) => r.type === type)?.emoji ?? "❤️";
  };

  return (
    <div className="fixed bottom-40 right-4 w-20 h-60 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {reactions.map((reaction) => (
          <motion.div
            key={reaction.id}
            className="absolute bottom-0 text-2xl"
            style={{ left: `${reaction.x - 50}%` }}
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{
              y: -200,
              opacity: [1, 1, 0],
              scale: [0.5, 1.2, 1],
              x: [0, Math.random() * 30 - 15, Math.random() * 40 - 20],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 2.5,
              ease: "easeOut",
              opacity: { times: [0, 0.7, 1] },
              scale: { times: [0, 0.3, 1] },
            }}
          >
            {getEmoji(reaction.type)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REACTION BAR - Quick reaction buttons that appear above the chat input
// ═══════════════════════════════════════════════════════════════════════════════

interface ReactionBarProps {
  isOpen: boolean;
  onClose: () => void;
  onReact: (type: ReactionType) => void;
}

export function ReactionBar({ isOpen, onClose, onReact }: ReactionBarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute bottom-full mb-2 left-0 right-0 flex justify-center"
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <motion.div
            className="glass-strong rounded-full px-2 py-1.5 flex items-center gap-1 shadow-card"
            initial={{ width: 0 }}
            animate={{ width: "auto" }}
          >
            {REACTIONS.map((reaction, index) => (
              <motion.button
                key={reaction.type}
                onClick={() => {
                  onReact(reaction.type);
                }}
                className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center text-xl transition-all active:scale-90"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                title={reaction.label}
              >
                {reaction.emoji}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE REACTIONS - Reactions that appear on the stage area
// ═══════════════════════════════════════════════════════════════════════════════

interface StageReactionsProps {
  reactions: FloatingReaction[];
}

export function StageReactions({ reactions }: StageReactionsProps) {
  const getEmoji = (type: ReactionType) => {
    return REACTIONS.find((r) => r.type === type)?.emoji ?? "❤️";
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {reactions.slice(-15).map((reaction) => (
          <motion.div
            key={reaction.id}
            className="absolute text-3xl"
            style={{
              left: `${20 + Math.random() * 60}%`,
              bottom: "10%",
            }}
            initial={{ y: 0, opacity: 0, scale: 0.3, rotate: -10 }}
            animate={{
              y: -300,
              opacity: [0, 1, 1, 0],
              scale: [0.3, 1.3, 1, 0.8],
              rotate: [0, Math.random() * 20 - 10],
              x: [0, Math.random() * 60 - 30],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 3,
              ease: "easeOut",
              opacity: { times: [0, 0.1, 0.7, 1] },
              scale: { times: [0, 0.2, 0.5, 1] },
            }}
          >
            {getEmoji(reaction.type)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
