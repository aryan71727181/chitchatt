import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  resolveBanner, BANNER_PRESETS, CATEGORIES, ROLE_META,
  type DBRoom, type DBMember,
} from "@/lib/rooms";
import { defaultAvatar } from "@/lib/auth";
import {
  X, Crown, Calendar, Globe, Lock, FileText,
  Shield, Star, Settings, Trash2, VolumeX,
  MessageSquare, Gift, Music, Mic, Users,
  UserMinus, Check, Tag,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "info" | "settings" | "access" | "team";

// ── Toggle component ──────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${on ? "bg-electric" : "bg-white/15"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

// ── Pill selector ─────────────────────────────────────────────────────────────
function PillGroup<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`h-8 px-3 rounded-full text-xs font-medium transition-all ${
            value === o.value
              ? "gradient-electric text-white shadow-glow-soft"
              : "glass text-muted-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Info Tab ──────────────────────────────────────────────────────────────────
function InfoTab({ room, members, memberCount }: { room: DBRoom; members: DBMember[]; memberCount: number }) {
  const createdDate = new Date(room.created_at).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const coOwners = members.filter((m) => m.role === "co_owner");
  const admins   = members.filter((m) => m.role === "admin");

  const rows = [
    { icon: Crown,  label: "Owner",    value: `@${room.owner_username}`, accent: true },
    { icon: Calendar, label: "Created", value: createdDate },
    { icon: Users,  label: "Online",   value: `${memberCount} live now` },
    { icon: Tag,    label: "Category", value: room.category },
    { icon: room.privacy === "public" ? Globe : Lock, label: "Privacy",
      value: room.privacy === "public" ? "Public" : "Private" },
  ];

  return (
    <div className="space-y-2.5">
      {rows.map(({ icon: Icon, label, value, accent }) => (
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

      {room.description && (
        <div className="glass rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-3.5 w-3.5 text-electric" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Description</p>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">{room.description}</p>
        </div>
      )}

      {room.welcome_message && (
        <div className="glass rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-3.5 w-3.5 text-electric" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Welcome message</p>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">{room.welcome_message}</p>
        </div>
      )}

      <div className="flex items-center justify-between glass rounded-2xl px-4 py-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Room ID</p>
        <p className="text-xs font-mono text-electric">{room.id.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({
  room, isOwner, onClose, onDelete, onMuteAll,
}: {
  room: DBRoom; isOwner: boolean;
  onClose: () => void; onDelete: () => void; onMuteAll: () => void;
}) {
  const [name, setName]         = useState(room.name);
  const [description, setDesc]  = useState(room.description ?? "");
  const [category, setCategory] = useState(room.category);
  const [welcome, setWelcome]   = useState(room.welcome_message ?? "");
  const [privacy, setPrivacy]   = useState(room.privacy);
  const [password, setPassword] = useState(room.password_hash ?? "");
  const [bannerId, setBannerId] = useState(() => {
    const preset = BANNER_PRESETS.find((b) => b.url === room.banner || b.id === room.banner);
    return preset?.id ?? BANNER_PRESETS[0].id;
  });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    const { error } = await supabase.from("rooms").update({
      name: name.trim(),
      description: description.trim() || null,
      category,
      welcome_message: welcome.trim() || null,
      privacy,
      password_hash: privacy === "private" ? password.trim() : null,
      banner: bannerId,
    } as any).eq("id", room.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Room updated");
    onClose();
  };

  return (
    <div className="space-y-3">
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
          onChange={(e) => setDesc(e.target.value)}
          rows={2}
          placeholder="What's the vibe?"
          className="w-full glass rounded-2xl p-3 text-sm outline-none resize-none focus:ring-1 focus:ring-electric"
        />
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground mb-1.5 block">Welcome Message</label>
        <textarea
          value={welcome}
          onChange={(e) => setWelcome(e.target.value)}
          rows={2}
          placeholder="Greet new joiners…"
          className="w-full glass rounded-2xl p-3 text-sm outline-none resize-none focus:ring-1 focus:ring-electric"
        />
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground mb-1.5 block">Category</label>
        <div className="grid grid-cols-3 gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`h-8 rounded-xl text-xs font-medium transition-all ${
                category === c ? "gradient-electric text-white shadow-glow-soft" : "glass text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground mb-1.5 block">Room Banner</label>
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
              {bannerId === b.id && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-electric grid place-items-center">
                  <Check className="h-2.5 w-2.5 text-white" />
                </span>
              )}
              <span className="absolute bottom-1 left-1.5 text-[9px] font-medium">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground mb-1.5 block">Privacy</label>
        <div className="grid grid-cols-2 gap-2">
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

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onMuteAll}
          className="h-10 rounded-xl glass text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95"
        >
          <VolumeX className="h-3.5 w-3.5 text-muted-foreground" /> Mute All
        </button>
        <button
          onClick={save}
          disabled={loading}
          className="h-10 rounded-xl gradient-electric text-white text-xs font-semibold shadow-glow-soft active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {isOwner && (
        <button
          onClick={onDelete}
          className="w-full h-11 rounded-2xl bg-[oklch(0.28_0.14_25)] text-[oklch(0.85_0.18_30)] text-sm font-semibold active:scale-95 flex items-center justify-center gap-2 mt-1"
        >
          <Trash2 className="h-4 w-4" /> Delete Room
        </button>
      )}
    </div>
  );
}

// ── Access Tab ────────────────────────────────────────────────────────────────
function AccessTab({ room }: { room: DBRoom }) {
  const [joinMode, setJoinMode]   = useState<"public" | "followers" | "owner_following" | "private">(room.join_mode ?? "public");
  const [seatMode, setSeatMode]   = useState<"everyone" | "followers" | "admin_approval">(room.seat_mode ?? "everyone");
  const [micMode,  setMicMode]    = useState<"open" | "host_approval" | "locked">(room.mic_mode ?? "open");
  const [allowChat,   setAllowChat]   = useState(room.allow_chat  ?? true);
  const [allowGifts,  setAllowGifts]  = useState(room.allow_gifts ?? true);
  const [allowMusic,  setAllowMusic]  = useState(room.allow_music ?? true);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    const { error } = await supabase.from("rooms").update({
      join_mode:    joinMode,
      seat_mode:    seatMode,
      mic_mode:     micMode,
      allow_chat:   allowChat,
      allow_gifts:  allowGifts,
      allow_music:  allowMusic,
    } as any).eq("id", room.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Access settings saved");
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-3.5 w-3.5 text-electric" />
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Who Can Join</p>
        </div>
        <PillGroup
          options={[
            { value: "public" as const,           label: "Public" },
            { value: "followers" as const,         label: "Followers" },
            { value: "owner_following" as const,   label: "I Follow" },
            { value: "private" as const,           label: "Private" },
          ]}
          value={joinMode}
          onChange={setJoinMode}
        />
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {joinMode === "public"          && "Anyone can join this room"}
          {joinMode === "followers"       && "Only your followers can join"}
          {joinMode === "owner_following" && "Only people you follow can join"}
          {joinMode === "private"         && "Use room password to restrict entry"}
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-3.5 w-3.5 text-electric" />
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Who Can Take a Seat</p>
        </div>
        <PillGroup
          options={[
            { value: "everyone" as const,         label: "Everyone" },
            { value: "followers" as const,         label: "Followers" },
            { value: "admin_approval" as const,    label: "Approval Only" },
          ]}
          value={seatMode}
          onChange={setSeatMode}
        />
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {seatMode === "everyone"         && "Any listener can take a seat"}
          {seatMode === "followers"        && "Only followers can take seats"}
          {seatMode === "admin_approval"   && "Admins must invite users to seats"}
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Mic className="h-3.5 w-3.5 text-electric" />
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Mic Mode</p>
        </div>
        <PillGroup
          options={[
            { value: "open" as const,            label: "Open Mic" },
            { value: "host_approval" as const,   label: "Host Approval" },
            { value: "locked" as const,          label: "Locked" },
          ]}
          value={micMode}
          onChange={setMicMode}
        />
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {micMode === "open"           && "Seated users can speak freely"}
          {micMode === "host_approval"  && "Host must unmute each speaker"}
          {micMode === "locked"         && "Only the host can speak"}
        </p>
      </div>

      <div className="glass rounded-2xl px-4 py-3 space-y-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Room Features</p>
        {[
          { icon: MessageSquare, label: "Chat",   sub: "Allow text messages in room",  val: allowChat,  set: setAllowChat  },
          { icon: Gift,          label: "Gifts",  sub: "Allow sending gift reactions",  val: allowGifts, set: setAllowGifts },
          { icon: Music,         label: "Music",  sub: "Allow music sharing",           val: allowMusic, set: setAllowMusic },
        ].map(({ icon: Icon, label, sub, val, set }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-electric/15 grid place-items-center flex-shrink-0">
                <Icon className="h-3.5 w-3.5 text-electric" />
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </div>
            </div>
            <Toggle on={val} onChange={set} />
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={loading}
        className="w-full h-11 rounded-2xl gradient-electric text-white text-sm font-semibold shadow-glow active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save Access Settings"}
      </button>
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────────────────────
function TeamTab({
  members, roomId, currentUserRole,
}: {
  members: DBMember[]; roomId: string; currentUserRole: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const isOwner   = currentUserRole === "owner";
  const isCoOwner = currentUserRole === "co_owner";

  const staff         = members.filter((m) => m.role !== "member");
  const regularMembers = members.filter((m) => m.role === "member");

  const setRole = async (userId: string, role: string) => {
    setLoading(userId + role);
    const { error } = await supabase.from("room_members")
      .update({ role }).eq("room_id", roomId).eq("user_id", userId);
    setLoading(null);
    if (error) { toast.error(error.message); return; }
    const meta = ROLE_META[role];
    toast.success(`Role updated to ${meta?.label ?? role}`);
  };

  return (
    <div className="space-y-4">
      {staff.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Team</p>
          <div className="space-y-2">
            {staff.map((m) => {
              const meta = ROLE_META[m.role] ?? ROLE_META.member;
              const canRemove = m.role !== "owner" && (isOwner || (isCoOwner && m.role === "admin"));
              return (
                <div key={m.user_id} className="glass rounded-2xl px-3 py-3 flex items-center gap-3">
                  <img
                    src={m.avatar ?? defaultAvatar(m.username)}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{m.username}</p>
                    <p className={`text-[11px] flex items-center gap-1 mt-0.5 ${meta.color}`}>
                      <span>{meta.icon}</span> {meta.label}
                    </p>
                  </div>
                  {canRemove && (
                    <button
                      disabled={loading === m.user_id + "member"}
                      onClick={() => setRole(m.user_id, "member")}
                      className="h-8 px-3 rounded-xl bg-white/10 text-[11px] font-medium text-muted-foreground active:scale-95 disabled:opacity-50 flex items-center gap-1"
                    >
                      <UserMinus className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(isOwner || isCoOwner) && regularMembers.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
            Promote Members
          </p>
          <div className="space-y-2">
            {regularMembers.slice(0, 30).map((m) => (
              <div key={m.user_id} className="glass rounded-2xl px-3 py-3 flex items-center gap-3">
                <img
                  src={m.avatar ?? defaultAvatar(m.username)}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{m.username}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">👤 Listener</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    disabled={!!loading}
                    onClick={() => setRole(m.user_id, "vip")}
                    className="h-8 px-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-[11px] font-medium active:scale-95 disabled:opacity-50"
                  >
                    💎 VIP
                  </button>
                  <button
                    disabled={!!loading}
                    onClick={() => setRole(m.user_id, "admin")}
                    className="h-8 px-2 rounded-xl bg-blue-500/20 text-blue-300 text-[11px] font-medium active:scale-95 disabled:opacity-50"
                  >
                    🛡️ Admin
                  </button>
                  {isOwner && (
                    <button
                      disabled={!!loading}
                      onClick={() => setRole(m.user_id, "co_owner")}
                      className="h-8 px-2 rounded-xl bg-purple-500/20 text-purple-300 text-[11px] font-medium active:scale-95 disabled:opacity-50"
                    >
                      ⭐
                    </button>
                  )}
                </div>
              </div>
            ))}
            {regularMembers.length > 30 && (
              <p className="text-xs text-muted-foreground text-center">+{regularMembers.length - 30} more members</p>
            )}
          </div>
        </div>
      )}

      {/* Permission legend */}
      <div className="glass rounded-2xl p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-semibold">Permissions</p>
        <div className="space-y-2 text-xs text-white/70">
          {[
            { icon: "👑", color: "text-yellow-400",  name: "Host",     desc: "Full control, room management, delete room" },
            { icon: "⭐", color: "text-purple-300",  name: "Co-owner", desc: "Moderate, manage admins, cannot remove host" },
            { icon: "🛡️", color: "text-blue-300",    name: "Admin",    desc: "Mute, kick, seat management" },
            { icon: "💎", color: "text-cyan-300",    name: "VIP",      desc: "Displayed badge, seat priority" },
            { icon: "👤", color: "text-white/40",    name: "Listener", desc: "Chat, gifts, join seats" },
          ].map(({ icon, color, name, desc }) => (
            <div key={name} className="flex items-start gap-2">
              <span className={`mt-0.5 ${color}`}>{icon}</span>
              <span><b className={color}>{name}</b> — {desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function RoomInfoPanel({
  room,
  members,
  memberCount,
  isMod,
  isOwner,
  onClose,
  onDelete,
  onMuteAll,
  currentUserRole,
}: {
  room: DBRoom;
  members: DBMember[];
  memberCount: number;
  isMod?: boolean;
  isOwner?: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onMuteAll?: () => void;
  currentUserRole?: string;
}) {
  const canTeam = currentUserRole === "owner" || currentUserRole === "co_owner";

  // Determine available tabs
  const tabs: { id: Tab; label: string }[] = [
    { id: "info", label: "Info" },
    ...(isMod ? [
      { id: "settings" as Tab, label: "Settings" },
      { id: "access"   as Tab, label: "Access" },
    ] : []),
    ...(canTeam ? [{ id: "team" as Tab, label: "Team" }] : []),
  ];

  const [activeTab, setActiveTab] = useState<Tab>("info");
  const bannerUrl = resolveBanner(room.banner);

  return (
    <div
      className="fixed inset-0 z-[85] bg-black/75 backdrop-blur-md flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass-strong rounded-t-3xl shadow-card animate-fade-up"
        style={{ maxHeight: "92vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Banner */}
        <div className="mx-5 mt-2 h-28 rounded-2xl overflow-hidden relative flex-shrink-0">
          <img
            src={bannerUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.src = BANNER_PRESETS[0].url; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute bottom-3 left-4 right-12">
            <h2 className="font-bold text-lg leading-tight truncate">{room.name}</h2>
            <p className="text-[11px] text-electric font-semibold uppercase tracking-wider mt-0.5">{room.category}</p>
          </div>
          <div className="absolute top-3 left-4">
            <span className="glass rounded-full px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 backdrop-blur grid place-items-center"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tab bar */}
        {tabs.length > 1 && (
          <div className="flex gap-1 px-5 pt-3 flex-shrink-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 h-8 rounded-full text-xs font-semibold transition-all ${
                  activeTab === t.id
                    ? "gradient-electric text-white shadow-glow-soft"
                    : "glass text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        <div className="overflow-y-auto flex-1 px-5 pt-4 pb-8 no-scrollbar">
          {activeTab === "info" && (
            <InfoTab room={room} members={members} memberCount={memberCount} />
          )}
          {activeTab === "settings" && isMod && onDelete && onMuteAll && (
            <SettingsTab
              room={room}
              isOwner={!!isOwner}
              onClose={onClose}
              onDelete={onDelete}
              onMuteAll={onMuteAll}
            />
          )}
          {activeTab === "access" && isMod && (
            <AccessTab room={room} />
          )}
          {activeTab === "team" && canTeam && (
            <TeamTab
              members={members}
              roomId={room.id}
              currentUserRole={currentUserRole ?? "member"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
