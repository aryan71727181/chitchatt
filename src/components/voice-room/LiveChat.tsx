"use client";

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE CHAT - Real-time room chat with mentions, replies, and premium features
// ═══════════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  Pin,
  Reply,
  AtSign,
  Crown,
  Shield,
  Star,
  Sparkles,
} from "lucide-react";
import type { DBMessage, DBMember } from "@/lib/rooms";
import { defaultAvatar } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface LiveChatProps {
  messages: DBMessage[];
  members: DBMember[];
  currentUserId?: string;
  onOpenProfile: (userId: string) => void;
  pinnedMessage?: DBMessage | null;
  maxHeight?: string;
}

const ROLE_BADGES: Record<string, { icon: React.ReactNode; color: string }> = {
  owner: { icon: <Crown className="h-2.5 w-2.5" />, color: "text-gold bg-gold/20" },
  co_owner: { icon: <Star className="h-2.5 w-2.5" />, color: "text-purple-300 bg-purple-300/20" },
  admin: { icon: <Shield className="h-2.5 w-2.5" />, color: "text-blue-300 bg-blue-300/20" },
};

export function LiveChat({
  messages,
  members,
  currentUserId,
  onOpenProfile,
  pinnedMessage,
  maxHeight = "max-h-52",
}: LiveChatProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (autoScroll) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length, autoScroll]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const getMemberRole = (userId: string) => {
    return members.find((m) => m.user_id === userId)?.role ?? "member";
  };

  return (
    <div className="relative">
      {/* Pinned message */}
      <AnimatePresence>
        {pinnedMessage && (
          <motion.div
            className="mx-5 mb-2 glass rounded-2xl px-3 py-2 flex items-start gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Pin className="h-3 w-3 text-electric mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-electric font-semibold">
                Pinned by @{pinnedMessage.username}
              </span>
              <p className="text-xs text-white/80 truncate">{pinnedMessage.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat messages */}
      <div
        ref={containerRef}
        className={cn(
          "px-5 space-y-2 overflow-y-auto no-scrollbar pb-2",
          maxHeight
        )}
        onScroll={handleScroll}
      >
        {messages.length === 0 && (
          <motion.p
            className="text-center text-[11px] text-muted-foreground py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Sparkles className="h-4 w-4 mx-auto mb-2 text-electric/50" />
            Start the conversation
          </motion.p>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const role = getMemberRole(msg.user_id);
            const badge = ROLE_BADGES[role];
            const isGift = msg.kind === "gift";
            const isSystem = (msg.kind as string) === "system";

            if (isSystem) {
              return (
                <motion.div
                  key={msg.id}
                  className="text-center py-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <span className="text-[10px] text-muted-foreground px-3 py-1 rounded-full glass">
                    {msg.text}
                  </span>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                className="flex items-start gap-2"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <motion.button
                  onClick={() => onOpenProfile(msg.user_id)}
                  className="flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img
                    src={msg.avatar ?? defaultAvatar(msg.username)}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10"
                  />
                </motion.button>

                <div
                  className={cn(
                    "rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]",
                    isGift
                      ? "bg-gradient-to-r from-pink-glow/20 to-gold/20 border border-gold/20"
                      : "glass"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <motion.button
                      onClick={() => onOpenProfile(msg.user_id)}
                      className={cn(
                        "text-[10px] font-semibold hover:underline",
                        msg.user_id === currentUserId ? "text-electric" : "text-white/80"
                      )}
                    >
                      {msg.username}
                    </motion.button>

                    {badge && (
                      <span
                        className={cn(
                          "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold",
                          badge.color
                        )}
                      >
                        {badge.icon}
                      </span>
                    )}
                  </div>

                  {isGift ? (
                    <motion.p
                      className="text-2xl leading-snug"
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      {msg.gift_emoji}
                    </motion.p>
                  ) : (
                    <p className="text-sm leading-snug break-words">{msg.text}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={chatEndRef} />
      </div>

      {/* Scroll to bottom indicator */}
      <AnimatePresence>
        {!autoScroll && (
          <motion.button
            onClick={() => {
              chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
              setAutoScroll(true);
            }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 glass rounded-full px-3 py-1.5 text-[10px] font-medium flex items-center gap-1.5 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-electric"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            New messages
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
