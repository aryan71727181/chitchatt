"use client";

// ═══════════════════════════════════════════════════════════════════════════════
// BOTTOM CONTROL BAR - Persistent floating control bar for room interactions
// ═══════════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageCircle,
  Smile,
  Gift,
  UserPlus,
  Settings,
  LogOut,
  Send,
  Hand,
  Crown,
} from "lucide-react";
import type { ReactionType } from "@/lib/voice-room/types";
import { REACTIONS } from "@/lib/voice-room/types";
import { cn } from "@/lib/utils";

interface BottomControlBarProps {
  // Mic state
  isOnSeat: boolean;
  micOn: boolean;
  onToggleMic: () => void;
  
  // Speaker state
  speakerMuted?: boolean;
  onToggleSpeaker?: () => void;
  
  // Chat
  chatText: string;
  onChatTextChange: (text: string) => void;
  onSendChat: () => void;
  
  // Reactions
  onReact: (type: ReactionType) => void;
  
  // Gifts
  onOpenGifts: () => void;
  
  // Mic request (for audience)
  hasHandRaised?: boolean;
  onToggleHandRaise?: () => void;
  micRequestEnabled?: boolean;
  
  // Host controls
  isHost?: boolean;
  onOpenHostPanel?: () => void;
  micRequestCount?: number;
  
  // Invite
  onInvite: () => void;
  
  // Leave
  onLeave: () => void;
}

export function BottomControlBar({
  isOnSeat,
  micOn,
  onToggleMic,
  speakerMuted = false,
  onToggleSpeaker,
  chatText,
  onChatTextChange,
  onSendChat,
  onReact,
  onOpenGifts,
  hasHandRaised = false,
  onToggleHandRaise,
  micRequestEnabled = true,
  isHost = false,
  onOpenHostPanel,
  micRequestCount = 0,
  onInvite,
  onLeave,
}: BottomControlBarProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendChat();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pb-safe">
      {/* Reaction picker */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            className="absolute bottom-full mb-2 left-4 right-4 flex justify-center"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
          >
            <div className="glass-strong rounded-full px-2 py-1.5 flex items-center gap-1 shadow-card">
              {REACTIONS.map((reaction, index) => (
                <motion.button
                  key={reaction.type}
                  onClick={() => {
                    onReact(reaction.type);
                    setShowReactions(false);
                  }}
                  className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center text-xl transition-all"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {reaction.emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick actions popup */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            className="absolute bottom-full mb-2 right-4"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
          >
            <div className="glass-strong rounded-2xl p-2 shadow-card space-y-1 min-w-[140px]">
              {isHost && onOpenHostPanel && (
                <motion.button
                  onClick={() => {
                    onOpenHostPanel();
                    setShowQuickActions(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  <Crown className="h-4 w-4 text-gold" />
                  <span className="text-sm font-medium">Host Panel</span>
                  {micRequestCount > 0 && (
                    <span className="ml-auto h-5 min-w-5 px-1 rounded-full bg-electric text-[10px] font-bold flex items-center justify-center">
                      {micRequestCount}
                    </span>
                  )}
                </motion.button>
              )}
              
              <motion.button
                onClick={() => {
                  onInvite();
                  setShowQuickActions(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <UserPlus className="h-4 w-4 text-electric" />
                <span className="text-sm font-medium">Invite Friends</span>
              </motion.button>
              
              {onToggleSpeaker && (
                <motion.button
                  onClick={() => {
                    onToggleSpeaker();
                    setShowQuickActions(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  {speakerMuted ? (
                    <>
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Unmute Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Mute Audio</span>
                    </>
                  )}
                </motion.button>
              )}
              
              <div className="h-px bg-white/5 my-1" />
              
              <motion.button
                onClick={() => {
                  onLeave();
                  setShowQuickActions(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-red-400"
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Leave Room</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main control bar */}
      <div className="px-4 pb-5 pt-2">
        <motion.div
          className="mx-auto max-w-md glass-strong rounded-full pl-2 pr-1 h-12 flex items-center gap-1.5 shadow-card border border-white/8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {/* Mic toggle (if on seat) or Hand raise (if audience) */}
          {isOnSeat ? (
            <motion.button
              onClick={onToggleMic}
              className={cn(
                "h-10 w-10 rounded-full grid place-items-center flex-shrink-0 transition-all",
                micOn
                  ? "gradient-electric shadow-glow-soft"
                  : "bg-white/10"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {micOn ? (
                <Mic className="h-4 w-4 text-white" />
              ) : (
                <MicOff className="h-4 w-4 text-muted-foreground" />
              )}
            </motion.button>
          ) : micRequestEnabled && onToggleHandRaise ? (
            <motion.button
              onClick={onToggleHandRaise}
              className={cn(
                "h-10 w-10 rounded-full grid place-items-center flex-shrink-0 transition-all",
                hasHandRaised
                  ? "bg-gold text-background shadow-[0_0_20px_oklch(0.82_0.16_85/0.5)]"
                  : "glass text-muted-foreground"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={
                  hasHandRaised
                    ? { y: [0, -2, 0], rotate: [0, -5, 5, 0] }
                    : {}
                }
                transition={{ repeat: hasHandRaised ? Infinity : 0, duration: 0.6 }}
              >
                <Hand className="h-4 w-4" />
              </motion.div>
            </motion.button>
          ) : (
            <motion.button
              onClick={() => setShowReactions(!showReactions)}
              className="h-10 w-10 rounded-full glass grid place-items-center flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Smile className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          )}

          {/* Chat input */}
          <input
            value={chatText}
            onChange={(e) => onChatTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something nice..."
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground px-2"
          />

          {/* Reactions button */}
          <motion.button
            onClick={() => setShowReactions(!showReactions)}
            className={cn(
              "h-9 w-9 rounded-full grid place-items-center flex-shrink-0 transition-all",
              showReactions ? "bg-electric/20 text-electric" : "glass text-muted-foreground"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Smile className="h-4 w-4" />
          </motion.button>

          {/* Gift button */}
          <motion.button
            onClick={onOpenGifts}
            className="h-9 w-9 rounded-full bg-[oklch(0.7_0.27_350)]/20 text-[oklch(0.8_0.2_350)] grid place-items-center flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Gift className="h-4 w-4" />
          </motion.button>

          {/* More options */}
          <motion.button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={cn(
              "h-9 w-9 rounded-full grid place-items-center flex-shrink-0 transition-all",
              showQuickActions ? "bg-white/15 text-white" : "glass text-muted-foreground"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="h-4 w-4" />
          </motion.button>

          {/* Send button */}
          <motion.button
            onClick={onSendChat}
            className="h-10 w-10 rounded-full gradient-electric grid place-items-center shadow-glow-soft flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="h-4 w-4 text-white" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
