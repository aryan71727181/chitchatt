"use client";

// ═══════════════════════════════════════════════════════════════════════════════
// HOST CONTROL PANEL - Complete room control dashboard for hosts and moderators
// ═══════════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  X,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Globe,
  Users,
  Mic,
  MicOff,
  Shield,
  UserX,
  Volume2,
  VolumeX,
  MessageSquareOff,
  Zap,
  Palette,
  Music,
  Calendar,
  Settings,
  Crown,
  Trash2,
  RotateCcw,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Ban,
  Clock,
  Hash,
} from "lucide-react";
import { SeatLayoutSelector } from "./SeatGrid";
import type { SeatLayoutMode, RoomSettings, RoomMode, ROOM_MODES } from "@/lib/voice-room/types";
import type { DBMember } from "@/lib/rooms";
import { cn } from "@/lib/utils";

interface HostControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RoomSettings;
  onUpdateSettings: (updates: Partial<RoomSettings>) => void;
  isOwner: boolean;
  isCoOwner: boolean;
  members: DBMember[];
  onMuteAll: () => void;
  onKickUser: (userId: string) => void;
  onBanUser: (userId: string) => void;
  onPromoteUser: (userId: string, role: "co_owner" | "admin") => void;
  onDemoteUser: (userId: string) => void;
  onDeleteRoom: () => void;
  onChangeSeatLayout: (layout: SeatLayoutMode) => void;
}

type PanelSection = "room" | "moderation" | "users" | "advanced";

const ROOM_MODE_OPTIONS: { mode: RoomMode; label: string; icon: React.ReactNode }[] = [
  { mode: "voice_chat", label: "Voice Chat", icon: <Mic className="h-4 w-4" /> },
  { mode: "chill", label: "Chill Music", icon: <Music className="h-4 w-4" /> },
  { mode: "gaming", label: "Gaming", icon: <Zap className="h-4 w-4" /> },
  { mode: "podcast", label: "Podcast", icon: <Volume2 className="h-4 w-4" /> },
  { mode: "event", label: "Event", icon: <Calendar className="h-4 w-4" /> },
];

const BACKGROUND_THEMES = [
  { id: "default", label: "Default", color: "bg-gradient-to-b from-violet-600/20 to-blue-600/20" },
  { id: "fire", label: "Fire", color: "bg-gradient-to-b from-orange-600/20 to-red-600/20" },
  { id: "ocean", label: "Ocean", color: "bg-gradient-to-b from-cyan-600/20 to-blue-600/20" },
  { id: "forest", label: "Forest", color: "bg-gradient-to-b from-green-600/20 to-emerald-600/20" },
  { id: "sunset", label: "Sunset", color: "bg-gradient-to-b from-pink-600/20 to-orange-600/20" },
  { id: "night", label: "Night", color: "bg-gradient-to-b from-slate-600/20 to-slate-800/20" },
];

export function HostControlPanel({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  isOwner,
  isCoOwner,
  members,
  onMuteAll,
  onKickUser,
  onBanUser,
  onPromoteUser,
  onDemoteUser,
  onDeleteRoom,
  onChangeSeatLayout,
}: HostControlPanelProps) {
  const [activeSection, setActiveSection] = useState<PanelSection>("room");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const canModify = isOwner || isCoOwner;

  const ToggleButton = ({
    active,
    onToggle,
    label,
    icon: Icon,
    disabled = false,
  }: {
    active: boolean;
    onToggle: () => void;
    label: string;
    icon: React.ElementType;
    disabled?: boolean;
  }) => (
    <motion.button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "flex items-center justify-between w-full glass rounded-2xl px-4 py-3 transition-all",
        active && "ring-1 ring-electric/40",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-9 w-9 rounded-xl grid place-items-center",
            active ? "bg-electric/20 text-electric" : "bg-white/5 text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div
        className={cn(
          "h-6 w-11 rounded-full p-0.5 transition-colors",
          active ? "bg-electric" : "bg-white/10"
        )}
      >
        <motion.div
          className="h-5 w-5 rounded-full bg-white shadow-md"
          animate={{ x: active ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </motion.button>
  );

  const SectionTab = ({
    section,
    label,
    icon: Icon,
  }: {
    section: PanelSection;
    label: string;
    icon: React.ElementType;
  }) => (
    <motion.button
      onClick={() => setActiveSection(section)}
      className={cn(
        "flex-1 py-2.5 px-3 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 transition-all",
        activeSection === section
          ? "bg-electric/20 text-electric"
          : "text-muted-foreground hover:text-white"
      )}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="h-4 w-4" />
      {label}
    </motion.button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg glass-strong rounded-t-3xl shadow-card overflow-hidden"
            style={{ maxHeight: "85vh" }}
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
                <div className="h-10 w-10 rounded-xl gradient-electric grid place-items-center shadow-glow-soft">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-base">Host Controls</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {isOwner ? "Full access" : "Moderator access"}
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

            {/* Section tabs */}
            <div className="px-5 py-2">
              <div className="flex gap-1 p-1 glass rounded-2xl">
                <SectionTab section="room" label="Room" icon={Settings} />
                <SectionTab section="moderation" label="Moderate" icon={Shield} />
                <SectionTab section="users" label="Users" icon={Users} />
                {isOwner && (
                  <SectionTab section="advanced" label="Advanced" icon={Zap} />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-8 overflow-y-auto" style={{ maxHeight: "calc(85vh - 200px)" }}>
              <AnimatePresence mode="wait">
                {/* Room Controls */}
                {activeSection === "room" && (
                  <motion.div
                    key="room"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-3 pt-3"
                  >
                    {/* Seat Layout */}
                    <div className="glass rounded-2xl p-4">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">
                        Seat Layout
                      </p>
                      <SeatLayoutSelector
                        current={settings.seatCount}
                        onChange={onChangeSeatLayout}
                        disabled={!canModify}
                      />
                    </div>

                    {/* Room Mode */}
                    <div className="glass rounded-2xl p-4">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">
                        Room Mode
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {ROOM_MODE_OPTIONS.map(({ mode, label, icon }) => (
                          <motion.button
                            key={mode}
                            onClick={() => onUpdateSettings({ roomMode: mode })}
                            className={cn(
                              "py-2.5 px-3 rounded-xl text-[11px] font-medium flex flex-col items-center gap-1.5 transition-all",
                              settings.roomMode === mode
                                ? "bg-electric/20 text-electric ring-1 ring-electric/40"
                                : "glass text-muted-foreground hover:text-white"
                            )}
                            whileTap={{ scale: 0.95 }}
                          >
                            {icon}
                            {label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Quick toggles */}
                    <div className="space-y-2">
                      <ToggleButton
                        active={settings.isLocked}
                        onToggle={() => onUpdateSettings({ isLocked: !settings.isLocked })}
                        label="Lock Room"
                        icon={settings.isLocked ? Lock : Unlock}
                      />
                      <ToggleButton
                        active={settings.hasPassword}
                        onToggle={() => onUpdateSettings({ hasPassword: !settings.hasPassword })}
                        label="Password Protected"
                        icon={Hash}
                      />
                      <ToggleButton
                        active={settings.isHidden}
                        onToggle={() => onUpdateSettings({ isHidden: !settings.isHidden })}
                        label="Hide from Discovery"
                        icon={settings.isHidden ? EyeOff : Eye}
                      />
                      <ToggleButton
                        active={settings.micRequestEnabled}
                        onToggle={() => onUpdateSettings({ micRequestEnabled: !settings.micRequestEnabled })}
                        label="Allow Mic Requests"
                        icon={Mic}
                      />
                      <ToggleButton
                        active={settings.autoMicApproval}
                        onToggle={() => onUpdateSettings({ autoMicApproval: !settings.autoMicApproval })}
                        label="Auto-approve Mic Requests"
                        icon={Zap}
                        disabled={!settings.micRequestEnabled}
                      />
                    </div>

                    {/* Background Theme */}
                    <div className="glass rounded-2xl p-4">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">
                        Background Theme
                      </p>
                      <div className="grid grid-cols-6 gap-2">
                        {BACKGROUND_THEMES.map((theme) => (
                          <motion.button
                            key={theme.id}
                            onClick={() => onUpdateSettings({ backgroundTheme: theme.id })}
                            className={cn(
                              "h-10 rounded-xl transition-all",
                              theme.color,
                              settings.backgroundTheme === theme.id &&
                                "ring-2 ring-electric shadow-glow-soft"
                            )}
                            whileTap={{ scale: 0.9 }}
                            title={theme.label}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Moderation Controls */}
                {activeSection === "moderation" && (
                  <motion.div
                    key="moderation"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-3 pt-3"
                  >
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        onClick={onMuteAll}
                        className="glass rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95"
                        whileTap={{ scale: 0.95 }}
                      >
                        <VolumeX className="h-5 w-5 text-orange-400" />
                        <span className="text-xs font-medium">Mute All</span>
                      </motion.button>
                      <motion.button
                        onClick={() => onUpdateSettings({ chatEnabled: false })}
                        className="glass rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95"
                        whileTap={{ scale: 0.95 }}
                      >
                        <MessageSquareOff className="h-5 w-5 text-red-400" />
                        <span className="text-xs font-medium">Disable Chat</span>
                      </motion.button>
                    </div>

                    {/* Slow mode */}
                    <div className="glass rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Slow Mode</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {settings.slowModeSeconds === 0
                            ? "Off"
                            : `${settings.slowModeSeconds}s delay`}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {[0, 5, 10, 30, 60].map((seconds) => (
                          <motion.button
                            key={seconds}
                            onClick={() => onUpdateSettings({ slowModeSeconds: seconds })}
                            className={cn(
                              "flex-1 py-2 rounded-xl text-xs font-medium transition-all",
                              settings.slowModeSeconds === seconds
                                ? "bg-electric/20 text-electric"
                                : "glass text-muted-foreground"
                            )}
                            whileTap={{ scale: 0.95 }}
                          >
                            {seconds === 0 ? "Off" : `${seconds}s`}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Audience limit */}
                    <div className="glass rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Audience Limit</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {settings.audienceLimit === 0 ? "Unlimited" : settings.audienceLimit}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {[0, 50, 100, 200, 500].map((limit) => (
                          <motion.button
                            key={limit}
                            onClick={() => onUpdateSettings({ audienceLimit: limit })}
                            className={cn(
                              "flex-1 py-2 rounded-xl text-xs font-medium transition-all",
                              settings.audienceLimit === limit
                                ? "bg-electric/20 text-electric"
                                : "glass text-muted-foreground"
                            )}
                            whileTap={{ scale: 0.95 }}
                          >
                            {limit === 0 ? "No Limit" : limit}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* User Management */}
                {activeSection === "users" && (
                  <motion.div
                    key="users"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-2 pt-3"
                  >
                    {members.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No members in room yet
                      </div>
                    ) : (
                      members.map((member) => {
                        const isExpanded = expandedUser === member.user_id;
                        const roleLabel =
                          member.role === "owner"
                            ? "Host"
                            : member.role === "co_owner"
                            ? "Co-host"
                            : member.role === "admin"
                            ? "Admin"
                            : "Member";
                        const canManage =
                          canModify && member.role !== "owner" && (isOwner || member.role === "member");

                        return (
                          <motion.div
                            key={member.user_id}
                            className="glass rounded-2xl overflow-hidden"
                            layout
                          >
                            <button
                              onClick={() =>
                                setExpandedUser(isExpanded ? null : member.user_id)
                              }
                              className="w-full flex items-center gap-3 p-3"
                            >
                              <img
                                src={member.avatar ?? ""}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover"
                              />
                              <div className="flex-1 text-left">
                                <p className="text-sm font-medium">@{member.username}</p>
                                <p className="text-[11px] text-muted-foreground">{roleLabel}</p>
                              </div>
                              {canManage && (
                                <motion.div
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                >
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </motion.div>
                              )}
                            </button>

                            <AnimatePresence>
                              {isExpanded && canManage && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-white/5"
                                >
                                  <div className="p-3 grid grid-cols-2 gap-2">
                                    <motion.button
                                      onClick={() => onKickUser(member.user_id)}
                                      className="py-2 rounded-xl bg-orange-500/10 text-orange-400 text-xs font-medium flex items-center justify-center gap-1.5"
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <UserX className="h-3.5 w-3.5" />
                                      Kick
                                    </motion.button>
                                    {isOwner && (
                                      <motion.button
                                        onClick={() => onBanUser(member.user_id)}
                                        className="py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium flex items-center justify-center gap-1.5"
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <Ban className="h-3.5 w-3.5" />
                                        Ban
                                      </motion.button>
                                    )}
                                    {member.role === "member" && (
                                      <>
                                        <motion.button
                                          onClick={() => onPromoteUser(member.user_id, "admin")}
                                          className="py-2 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-medium flex items-center justify-center gap-1.5"
                                          whileTap={{ scale: 0.95 }}
                                        >
                                          <Shield className="h-3.5 w-3.5" />
                                          Admin
                                        </motion.button>
                                        {isOwner && (
                                          <motion.button
                                            onClick={() => onPromoteUser(member.user_id, "co_owner")}
                                            className="py-2 rounded-xl bg-purple-500/10 text-purple-400 text-xs font-medium flex items-center justify-center gap-1.5"
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Crown className="h-3.5 w-3.5" />
                                            Co-host
                                          </motion.button>
                                        )}
                                      </>
                                    )}
                                    {(member.role === "admin" || member.role === "co_owner") && (
                                      <motion.button
                                        onClick={() => onDemoteUser(member.user_id)}
                                        className="py-2 rounded-xl glass text-muted-foreground text-xs font-medium flex items-center justify-center gap-1.5"
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <ArrowLeftRight className="h-3.5 w-3.5" />
                                        Demote
                                      </motion.button>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })
                    )}
                  </motion.div>
                )}

                {/* Advanced (Owner only) */}
                {activeSection === "advanced" && isOwner && (
                  <motion.div
                    key="advanced"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-3 pt-3"
                  >
                    <ToggleButton
                      active={settings.eventModeEnabled}
                      onToggle={() => onUpdateSettings({ eventModeEnabled: !settings.eventModeEnabled })}
                      label="Event Mode"
                      icon={Calendar}
                    />

                    <div className="h-px bg-white/5 my-4" />

                    <div className="space-y-3">
                      <p className="text-[11px] text-red-400 uppercase tracking-wider font-semibold">
                        Danger Zone
                      </p>
                      <motion.button
                        onClick={() => {
                          if (confirm("Are you sure you want to close this room? This cannot be undone.")) {
                            onDeleteRoom();
                          }
                        }}
                        className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold flex items-center justify-center gap-2"
                        whileTap={{ scale: 0.98 }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Close Room Permanently
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
