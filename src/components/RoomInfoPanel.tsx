import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveBanner, BANNER_PRESETS, type DBRoom, type DBMember } from "@/lib/rooms";
import {
  X, Users, Crown, Calendar, Tag, Globe, Lock, FileText,
  Shield, Star, Info, Settings, Trash2, VolumeX, Unlock,
} from "lucide-react";
import { toast } from "sonner";

const ROLE_META: Record<string, { icon: string; color: string }> = {
  owner:    { icon: "👑", color: "text-yellow-400" },
  co_owner: { icon: "⭐", color: "text-purple-300" },
  admin:    { icon: "🛡️", color: "text-blue-300" },
  member:   { icon: "👤", color: "text-white/50" },
};

function RoomSettingsSection({
  room,
  isOwner,
  onClose,
  onDelete,
  onMuteAll,
}: {
  room: DBRoom;
  isOwner: boolean;
  onClose: () => void;
  onDelete: () => void;
  onMuteAll: () => void;
}) {
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? "");
  const [privacy, setPrivacy] = useState(room.privacy);
  const [password, setPassword] = useState(room.password_hash ?? "");
  const [bannerId, setBannerId] = useState(() => {
    const preset = BANNER_PRESETS.find((b) => b.url === room.banner || b.id === room.banner);
    return preset?.id ?? BANNER_PRESETS[0].id;
  });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("rooms")
      .update({
        name: name.trim(),
        description: description.trim(),
        privacy,
        password_hash: privacy === "private" ? password.trim() : null,
        banner: bannerId,
      })
      .eq("id", room.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Room updated");
    onClose();
  };

  return (
    <div className="mt-3 border-t border-white/8 pt-4 space-y-3">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
        <Settings className="h-3 w-3" /> Room Settings
      </p>

      <div>
        <label className="text-[11px] text-muted-foreground mb-1.5 block">Room Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full glass rounded-2xl h-11 px-4 text-sm outline-none focus:ring-1 focus:ring-electric"
        />
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground mb-1.5 block">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full glass rounded-2xl p-3 text-sm outline-none resize-none focus:ring-1 focus:ring-electric"
          placeholder="What's the vibe?"
        />
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground mb-1.5 block">Banner</label>
        <div className="grid grid-cols-3 gap-2">
          {BANNER_PRESETS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBannerId(b.id)}
              className={`relative h-14 rounded-xl overflow-hidden ring-2 transition-all ${
                bannerId === b.id ? "ring-electric shadow-glow-soft" : "ring-transparent"
              }`}
            >
              <img src={b.url} alt={b.label} className="h-full w-full object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-1 left-1.5 text-[9px] font-medium">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground mb-1.5 block">Privacy</label>
        <div className="grid grid-cols-3 gap-2">
          {(["public", "private"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPrivacy(p)}
              className={`h-10 rounded-xl text-xs font-medium transition-all ${
                privacy === p ? "gradient-electric text-white shadow-glow-soft" : "glass text-muted-foreground"
              }`}
            >
              {p === "public" ? "🌐 Public" : "🔒 Private"}
            </button>
          ))}
        </div>
        {privacy === "private" && (
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Room password"
            className="mt-2 w-full glass rounded-2xl h-10 px-4 text-sm outline-none focus:ring-1 focus:ring-electric"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => { onMuteAll(); }}
          className="h-10 rounded-xl glass text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95"
        >
          <VolumeX className="h-3.5 w-3.5 text-muted-foreground" /> Mute All
        </button>
        <button className="h-10 rounded-xl glass text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 text-muted-foreground">
          <Unlock className="h-3.5 w-3.5" /> Lock Room
        </button>
      </div>

      <button
        onClick={save}
        disabled={loading}
        className="w-full h-11 rounded-2xl gradient-electric text-white text-sm font-semibold shadow-glow active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save Changes"}
      </button>

      {isOwner && (
        <button
          onClick={onDelete}
          className="w-full h-11 rounded-2xl bg-[oklch(0.28_0.14_25)] text-[oklch(0.85_0.18_30)] text-sm font-semibold active:scale-95 flex items-center justify-center gap-2"
        >
          <Trash2 className="h-4 w-4" /> Delete Room
        </button>
      )}
    </div>
  );
}

export function RoomInfoPanel({
  room,
  members,
  memberCount,
  isMod,
  isOwner,
  onClose,
  onDelete,
  onMuteAll,
}: {
  room: DBRoom;
  members: DBMember[];
  memberCount: number;
  isMod?: boolean;
  isOwner?: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onMuteAll?: () => void;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const bannerUrl = resolveBanner(room.banner);

  const createdDate = new Date(room.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const coOwners = members.filter((m) => m.role === "co_owner");
  const admins = members.filter((m) => m.role === "admin");

  return (
    <div
      className="fixed inset-0 z-[85] bg-black/75 backdrop-blur-md flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass-strong rounded-t-3xl shadow-card max-h-[90vh] overflow-y-auto no-scrollbar animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Banner */}
        <div className="mx-5 mt-2 h-32 rounded-2xl overflow-hidden relative">
          <img
            src={bannerUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.src = BANNER_PRESETS[0].url; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-3 left-4">
            <span className="glass rounded-full px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
          </div>
          {room.privacy === "private" && (
            <div className="absolute top-3 right-3">
              <span className="glass rounded-full px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1.5">
                <Lock className="h-2.5 w-2.5" /> PRIVATE
              </span>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-2">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="font-bold text-xl leading-tight">{room.name}</h2>
            <p className="text-[11px] text-electric mt-1 font-semibold uppercase tracking-wider">{room.category}</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full glass grid place-items-center active:scale-95 flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="h-px bg-white/8 mx-5 mb-4" />

        <div className="px-5 pb-6 space-y-2.5">
          {/* Core info rows */}
          {[
            { icon: Crown,    label: "Owner",    value: `@${room.owner_username}`, accent: true },
            { icon: Calendar, label: "Created",  value: createdDate },
            { icon: Users,    label: "Members",  value: `${memberCount} live now` },
            { icon: Tag,      label: "Category", value: room.category },
            { icon: room.privacy === "public" ? Globe : Lock,
              label: "Privacy",
              value: room.privacy === "public" ? "Public" : "Private" },
          ].map(({ icon: Icon, label, value, accent }) => (
            <div key={label} className="flex items-center gap-3 glass rounded-2xl px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-electric/15 grid place-items-center flex-shrink-0">
                <Icon className="h-3.5 w-3.5 text-electric" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className={`text-sm font-semibold mt-0.5 truncate ${accent ? "text-electric" : ""}`}>{value}</p>
              </div>
            </div>
          ))}

          {/* Co-owners */}
          {coOwners.length > 0 && (
            <div className="glass rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-3.5 w-3.5 text-purple-300" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Co-owners</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {coOwners.map((m) => (
                  <span key={m.user_id} className="flex items-center gap-1.5 glass rounded-full px-2.5 py-1 text-xs text-purple-300">
                    ⭐ @{m.username}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Admins */}
          {admins.length > 0 && (
            <div className="glass rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-3.5 w-3.5 text-blue-300" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Admins</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {admins.map((m) => (
                  <span key={m.user_id} className="flex items-center gap-1.5 glass rounded-full px-2.5 py-1 text-xs text-blue-300">
                    🛡️ @{m.username}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* All members quick list */}
          {members.length > 0 && (
            <div className="glass rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2.5">
                <Info className="h-3.5 w-3.5 text-electric" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Members · {memberCount}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {members.slice(0, 16).map((m) => {
                  const meta = ROLE_META[m.role] ?? ROLE_META.member;
                  return (
                    <span key={m.user_id} className={`flex items-center gap-1 text-xs ${meta.color}`}>
                      {meta.icon} @{m.username}
                    </span>
                  );
                })}
                {members.length > 16 && (
                  <span className="text-xs text-muted-foreground">+{members.length - 16} more</span>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {room.description && (
            <div className="glass rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-3.5 w-3.5 text-electric" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Description</p>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">{room.description}</p>
            </div>
          )}

          {/* Room ID */}
          <div className="flex items-center justify-between glass rounded-2xl px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Room ID</p>
            <p className="text-xs font-mono text-electric">{room.id.slice(0, 8).toUpperCase()}</p>
          </div>

          {/* Mod settings toggle */}
          {isMod && (
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="w-full h-11 rounded-2xl glass border border-electric/20 text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Settings className="h-4 w-4 text-electric" />
              {showSettings ? "Hide Settings" : "Room Settings"}
            </button>
          )}

          {/* Inline settings */}
          {isMod && showSettings && onDelete && onMuteAll && (
            <RoomSettingsSection
              room={room}
              isOwner={!!isOwner}
              onClose={onClose}
              onDelete={onDelete}
              onMuteAll={onMuteAll}
            />
          )}
        </div>
      </div>
    </div>
  );
}
