import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { defaultAvatar, defaultCover, useAuth } from "@/lib/auth";
import { sidFromUserId } from "@/lib/rooms";
import type { DBMember } from "@/lib/rooms";
import { toggleFollow, checkFollowing } from "@/lib/follows";
import { getOrCreateDmRoom } from "@/lib/dm";
import {
  X, UserPlus, UserCheck, MessageCircle, Sparkles,
  Shield, Star, User, Loader2, Settings2, ChevronDown, ChevronUp,
  VolumeX, UserX, Crown,
} from "lucide-react";
import { toast } from "sonner";

type Profile = {
  id: string;
  username: string;
  bio: string | null;
  profile_image: string | null;
  cover_image: string | null;
  followers: number;
  following: number;
  vibe_score: number;
  created_at: string;
};

const ROLE_META: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  owner:    { icon: "👑", label: "Host",     color: "text-yellow-400", bg: "bg-yellow-400/15" },
  co_owner: { icon: "⭐", label: "Co-owner", color: "text-purple-300", bg: "bg-purple-300/15" },
  admin:    { icon: "🛡️", label: "Admin",    color: "text-blue-300",   bg: "bg-blue-300/15"   },
  member:   { icon: "👤", label: "Listener", color: "text-white/60",   bg: "bg-white/10"      },
};

const MOODS = ["✨ Vibing", "🔥 Lit", "😴 Chill", "💬 Chatty", "🎵 Musical", "😂 Hyped"];
function moodForId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return MOODS[h % MOODS.length];
}

export function UserProfilePopup({
  member,
  onClose,
  isCurrentUser,
  canModerate,
  onKick,
  onMute,
  onPromote,
  onDemote,
  currentUserRole,
}: {
  member: DBMember;
  onClose: () => void;
  isCurrentUser: boolean;
  canModerate: boolean;
  onKick?: () => void;
  onMute?: () => void;
  onPromote?: (role: "co_owner" | "admin") => void;
  onDemote?: () => void;
  currentUserRole?: string;
}) {
  const { user, profile: myProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data }, isF] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, bio, profile_image, cover_image, followers, following, vibe_score, created_at")
          .eq("id", member.user_id)
          .maybeSingle(),
        !isCurrentUser && user ? checkFollowing(member.user_id) : Promise.resolve(false),
      ]);
      if (!alive) return;
      setProfile(data as Profile | null);
      setFollowerCount((data as Profile | null)?.followers ?? 0);
      setFollowing(!!isF);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [member.user_id, isCurrentUser, user]);

  const handleFollow = useCallback(async () => {
    if (!user) return;
    setFollowLoading(true);
    const { following: nowFollowing, error } = await toggleFollow(user.id, member.user_id);
    if (error) {
      toast.error(error);
    } else {
      setFollowing(nowFollowing);
      setFollowerCount((n) => n + (nowFollowing ? 1 : -1));
      toast.success(nowFollowing ? `Following @${member.username}` : `Unfollowed @${member.username}`);
    }
    setFollowLoading(false);
  }, [user, member.user_id, member.username]);

  const handleMessage = useCallback(async () => {
    if (!user || !myProfile) return;
    setMsgLoading(true);
    const roomId = await getOrCreateDmRoom(
      user.id,
      myProfile.username,
      member.user_id,
      member.username,
    );
    setMsgLoading(false);
    if (!roomId) {
      toast.error("Could not open chat");
      return;
    }
    onClose();
    navigate({
      to: "/messages",
      search: { with: member.user_id, name: member.username },
    });
  }, [user, myProfile, member, navigate, onClose]);

  const sid  = sidFromUserId(member.user_id);
  const meta = ROLE_META[member.role] ?? ROLE_META.member;
  const mood = moodForId(member.user_id);
  const joinDate = profile
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;
  const avatar = profile?.profile_image ?? member.avatar ?? defaultAvatar(member.username);
  const cover  = profile?.cover_image   ?? defaultCover(member.user_id);

  // ---- Manage button permission logic ----
  const targetRole    = member.role;
  const viewerRole    = currentUserRole ?? "member";
  const isTargetOwner = targetRole === "owner";

  // Who can see the Manage button at all?
  const viewerIsOwner   = viewerRole === "owner";
  const viewerIsCoOwner = viewerRole === "co_owner";
  const viewerIsAdmin   = viewerRole === "admin";

  // Admin can only manage plain members
  const adminCanTarget = viewerIsAdmin && targetRole === "member";
  // Co-owner can manage members & admins
  const coOwnerCanTarget = viewerIsCoOwner && (targetRole === "member" || targetRole === "admin");
  // Owner can manage everyone except other owners
  const ownerCanTarget = viewerIsOwner && !isTargetOwner;

  const canShowManage =
    canModerate && !isCurrentUser && !isTargetOwner &&
    (ownerCanTarget || coOwnerCanTarget || adminCanTarget);

  // Which actions are available?
  const canRemoveSeat  = canShowManage; // everyone who can manage can remove from seat
  const canKickRoom    = canShowManage && (viewerIsOwner || viewerIsCoOwner);
  const canMakeAdmin   = canShowManage && (viewerIsOwner || viewerIsCoOwner) && targetRole === "member";
  const canMakeCoOwner = canShowManage && viewerIsOwner && (targetRole === "member" || targetRole === "admin");
  const canRemoveRole  = canShowManage && (viewerIsOwner || viewerIsCoOwner) && (targetRole === "admin" || targetRole === "co_owner");

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass-strong rounded-t-3xl overflow-hidden shadow-card animate-fade-up"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-white/20 z-10" />

        {/* Cover */}
        <div className="relative h-32 flex-shrink-0">
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.src = defaultCover(member.user_id); }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 backdrop-blur grid place-items-center"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="px-5 pb-6 overflow-y-auto no-scrollbar" style={{ maxHeight: "calc(92vh - 8rem)" }}>
          {/* Avatar row */}
          <div className="flex items-end gap-3 -mt-12 mb-4">
            <div className="relative">
              <img
                src={avatar}
                alt=""
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-background shadow-card"
                onError={(e) => { e.currentTarget.src = defaultAvatar(member.username); }}
              />
              <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-green-400 ring-2 ring-background" />
            </div>
            <div className="pb-2 flex-1 min-w-0">
              <h2 className="font-bold text-lg leading-tight truncate">@{member.username}</h2>
              <p className="text-[11px] text-electric font-mono mt-0.5">{sid}</p>
            </div>
          </div>

          {/* Role badge */}
          <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold mb-3 ${meta.bg} ${meta.color}`}>
            <span>{meta.icon}</span>
            <span>{meta.label}</span>
          </div>

          {/* Bio */}
          {loading ? (
            <div className="h-4 w-3/4 rounded-full bg-white/10 animate-pulse mb-3" />
          ) : profile?.bio ? (
            <p className="text-sm text-white/80 leading-relaxed mb-3">{profile.bio}</p>
          ) : null}

          {/* Mood chip */}
          <div className="glass rounded-2xl px-4 py-2.5 mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-electric flex-shrink-0" />
            <span className="text-sm">{mood}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Followers", value: loading ? "…" : followerCount.toLocaleString() },
              { label: "Following", value: loading ? "…" : (profile?.following ?? 0).toLocaleString() },
              { label: "Vibe",      value: loading ? "…" : `${profile?.vibe_score ?? 0}` },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl py-3 text-center">
                <p className="font-bold text-sm">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {joinDate && (
            <p className="text-[11px] text-muted-foreground mb-4">Joined ChitChat · {joinDate}</p>
          )}

          {/* Action buttons: Follow / Message / Manage */}
          {!isCurrentUser && (
            <div className={`grid gap-2 mb-4 ${canShowManage ? "grid-cols-3" : "grid-cols-2"}`}>
              {/* Follow */}
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`h-11 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                  following
                    ? "glass border border-electric/40 text-electric"
                    : "gradient-electric text-white shadow-glow-soft"
                } disabled:opacity-60`}
              >
                {followLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : following ? (
                  <><UserCheck className="h-3.5 w-3.5" /> Following</>
                ) : (
                  <><UserPlus className="h-3.5 w-3.5" /> Follow</>
                )}
              </button>

              {/* Message */}
              <button
                onClick={handleMessage}
                disabled={msgLoading}
                className="h-11 rounded-2xl glass text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60"
              >
                {msgLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <><MessageCircle className="h-3.5 w-3.5" /> Message</>
                )}
              </button>

              {/* Manage — only for mods */}
              {canShowManage && (
                <button
                  onClick={() => setManageOpen((o) => !o)}
                  className={`h-11 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                    manageOpen
                      ? "bg-white/15 border border-white/20 text-white"
                      : "glass text-white/70"
                  }`}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Manage
                  {manageOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              )}
            </div>
          )}

          {/* Manage panel — expands below the buttons */}
          {canShowManage && manageOpen && (
            <div className="mb-4 rounded-2xl overflow-hidden border border-white/10">
              {/* Header */}
              <div className="px-4 py-2.5 bg-white/5 border-b border-white/8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Manage @{member.username}
                </p>
                {viewerIsAdmin && (
                  <p className="text-[10px] text-yellow-400/80 mt-0.5">
                    Admin · limited controls only
                  </p>
                )}
              </div>

              <div className="p-3 flex flex-col gap-2">
                {/* Mute from seat — available to all managers */}
                {onMute && (
                  <button
                    onClick={() => { onMute(); onClose(); }}
                    className="h-11 rounded-xl glass text-sm font-medium flex items-center gap-3 px-4 active:scale-95 w-full text-left"
                  >
                    <VolumeX className="h-4 w-4 text-blue-300 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">Mute / Unmute</p>
                      <p className="text-[10px] text-muted-foreground">Silence this user on stage</p>
                    </div>
                  </button>
                )}

                {/* Remove from seat — available to all managers */}
                {canRemoveSeat && onKick && (
                  <button
                    onClick={() => { onKick(); onClose(); }}
                    className="h-11 rounded-xl glass text-sm font-medium flex items-center gap-3 px-4 active:scale-95 w-full text-left"
                  >
                    <UserX className="h-4 w-4 text-orange-300 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">Remove from Seat</p>
                      <p className="text-[10px] text-muted-foreground">
                        {viewerIsAdmin ? "Move to audience (admin limit)" : "Move user to audience"}
                      </p>
                    </div>
                  </button>
                )}

                {/* Kick from room — only owners & co-owners */}
                {canKickRoom && onKick && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove @${member.username} from the room?`)) {
                        onKick();
                        onClose();
                      }
                    }}
                    className="h-11 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-medium flex items-center gap-3 px-4 active:scale-95 w-full text-left"
                  >
                    <X className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-red-300">Remove from Room</p>
                      <p className="text-[10px] text-red-400/60">Kick user out entirely</p>
                    </div>
                  </button>
                )}

                {/* Divider before role actions */}
                {(canMakeAdmin || canMakeCoOwner || canRemoveRole) && (
                  <div className="border-t border-white/8 my-1" />
                )}

                {/* Make Admin */}
                {canMakeAdmin && onPromote && (
                  <button
                    onClick={() => { onPromote("admin"); onClose(); }}
                    className="h-11 rounded-xl glass text-sm font-medium flex items-center gap-3 px-4 active:scale-95 w-full text-left"
                  >
                    <Shield className="h-4 w-4 text-blue-300 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-300">Make Admin</p>
                      <p className="text-[10px] text-muted-foreground">Limited moderation powers</p>
                    </div>
                  </button>
                )}

                {/* Make Co-owner — owner only */}
                {canMakeCoOwner && onPromote && (
                  <button
                    onClick={() => { onPromote("co_owner"); onClose(); }}
                    className="h-11 rounded-xl glass text-sm font-medium flex items-center gap-3 px-4 active:scale-95 w-full text-left"
                  >
                    <Star className="h-4 w-4 text-purple-300 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-purple-300">Make Co-owner</p>
                      <p className="text-[10px] text-muted-foreground">Full moderation powers</p>
                    </div>
                  </button>
                )}

                {/* Remove role (demote) — owners & co-owners */}
                {canRemoveRole && onDemote && (
                  <button
                    onClick={() => { onDemote(); onClose(); }}
                    className="h-11 rounded-xl glass text-sm font-medium flex items-center gap-3 px-4 active:scale-95 w-full text-left"
                  >
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">Remove Role</p>
                      <p className="text-[10px] text-muted-foreground">Demote to regular member</p>
                    </div>
                  </button>
                )}

                {/* Crown transfer — owner only (canShowManage already excludes target owner) */}
                {viewerIsOwner && canShowManage && (
                  <button
                    onClick={() => toast("Crown transfer coming soon")}
                    className="h-11 rounded-xl glass text-sm font-medium flex items-center gap-3 px-4 active:scale-95 w-full text-left opacity-50"
                  >
                    <Crown className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-yellow-300">Transfer Ownership</p>
                      <p className="text-[10px] text-muted-foreground">Make them the new host</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
