"use client";

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM HEADER - Premium sticky header with room info, stats, and quick actions
// ═══════════════════════════════════════════════════════════════════════════════

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  UserPlus,
  Flag,
  Users,
  Eye,
  Clock,
  MoreVertical,
  Volume2,
  VolumeX,
  Crown,
  Shield,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { DBRoom, DBMember } from "@/lib/rooms";
import { resolveBanner } from "@/lib/rooms";
import { cn } from "@/lib/utils";

interface RoomHeaderProps {
  room: DBRoom;
  members: DBMember[];
  speakerCount: number;
  onBack: () => void;
  onShare: () => void;
  onInvite: () => void;
  onReport?: () => void;
  onOpenMembers: () => void;
  onOpenInfo: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

function formatDuration(startTime: string): string {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diff = Math.floor((now - start) / 1000);

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function RoomHeader({
  room,
  members,
  speakerCount,
  onBack,
  onShare,
  onInvite,
  onReport,
  onOpenMembers,
  onOpenInfo,
  isMuted = false,
  onToggleMute,
}: RoomHeaderProps) {
  const [duration, setDuration] = useState("0:00");
  const bannerUrl = resolveBanner(room.banner);

  // Live duration timer
  useEffect(() => {
    const update = () => setDuration(formatDuration(room.created_at));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [room.created_at]);

  const owner = members.find((m) => m.role === "owner");
  const coHosts = members.filter((m) => m.role === "co_owner").slice(0, 2);

  return (
    <motion.header
      className="relative"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="relative px-4 pt-12 pb-4">
        {/* Top row: Back + Actions */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <motion.button
            onClick={onBack}
            className="h-10 w-10 rounded-full glass grid place-items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Leave room"
          >
            <ArrowLeft className="h-4 w-4" />
          </motion.button>

          <div className="flex items-center gap-2">
            {onToggleMute && (
              <motion.button
                onClick={onToggleMute}
                className={cn(
                  "h-10 w-10 rounded-full grid place-items-center transition-all",
                  isMuted ? "glass text-muted-foreground" : "glass text-white"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isMuted ? "Unmute speakers" : "Mute speakers"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </motion.button>
            )}

            <motion.button
              onClick={onShare}
              className="h-10 w-10 rounded-full glass grid place-items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Share room"
            >
              <Share2 className="h-4 w-4" />
            </motion.button>

            <motion.button
              onClick={onInvite}
              className="h-10 w-10 rounded-full gradient-electric shadow-glow-soft grid place-items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Invite friends"
            >
              <UserPlus className="h-4 w-4 text-white" />
            </motion.button>

            <motion.button
              onClick={onOpenInfo}
              className="h-10 w-10 rounded-full glass grid place-items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Room info"
            >
              <MoreVertical className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Room title and info */}
        <div className="mb-3">
          <motion.h1
            className="font-display font-bold text-xl leading-tight truncate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {room.name}
          </motion.h1>

          {/* Host info */}
          <motion.div
            className="flex items-center gap-2 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {owner && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Crown className="h-3 w-3 text-gold" />
                <span className="text-electric font-medium">@{owner.username}</span>
              </div>
            )}
            {coHosts.length > 0 && (
              <>
                <span className="text-muted-foreground/40">+</span>
                {coHosts.map((co) => (
                  <div
                    key={co.user_id}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground"
                  >
                    <Shield className="h-2.5 w-2.5 text-violet-glow" />
                    <span>@{co.username}</span>
                  </div>
                ))}
              </>
            )}
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          className="flex flex-wrap items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Category tag */}
          <span className="glass rounded-full px-2.5 py-1 text-[11px] font-medium">
            {room.category}
          </span>

          {/* Live indicator */}
          <span className="glass rounded-full px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.2_150)]"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
            LIVE
          </span>

          {/* Duration */}
          <span className="glass rounded-full px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {duration}
          </span>

          {/* Listeners button */}
          <motion.button
            onClick={onOpenMembers}
            className="glass rounded-full px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5 active:scale-95 transition-transform"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye className="h-3 w-3 text-electric" />
            <span className="text-electric font-semibold">{members.length}</span>
          </motion.button>

          {/* Speakers count */}
          <span className="glass rounded-full px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5">
            <Users className="h-3 w-3 text-muted-foreground" />
            {speakerCount} on mic
          </span>
        </motion.div>
      </div>
    </motion.header>
  );
}
