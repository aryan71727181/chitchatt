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
  Shield, Star, User, Loader2,
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

  const sid = sidFromUserId(member.user_id);
  const meta = ROLE_META[member.role] ?? ROLE_META.member;
  const mood = moodForId(member.user_id);
  const joinDate = profile
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;
  const avatar = profile?.profile_image ?? member.avatar ?? defaultAvatar(member.username);
  const cover = profile?.cover_image ?? defaultCover(member.user_id);

  const isOwnerOfRoom = member.role === "owner";
  const canShowMod = canModerate && !isCurrentUser && !isOwnerOfRoom;
  const isViewer_owner = currentUserRole === "owner";
  const isViewer_coowner = currentUserRole === "co_owner";

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
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">SID: {sid}</p>
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
              { label: "Vibe", value: loading ? "…" : `${profile?.vibe_score ?? 0}` },
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

          {/* Action buttons */}
          {!isCurrentUser && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {/* Follow button */}
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

              {/* Message button */}
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

              {/* Invite chip */}
              <button className="h-11 rounded-2xl glass text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95">
                <Sparkles className="h-3.5 w-3.5 text-electric" />
                Invite
              </button>
            </div>
          )}

          {/* Moderation controls */}
          {canShowMod && (
            <div className="border-t border-white/8 pt-4">
              <p className="text-[11px] text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Moderation</p>
              <div className="grid grid-cols-2 gap-2">
                {onMute && (
                  <button
                    onClick={() => { onMute(); onClose(); }}
                    className="h-10 rounded-xl glass text-xs font-medium active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Shield className="h-3.5 w-3.5 text-blue-300" /> Mute
                  </button>
                )}
                {onKick && (
                  <button
                    onClick={() => { onKick(); onClose(); }}
                    className="h-10 rounded-xl glass text-xs font-medium text-[oklch(0.8_0.18_30)] active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" /> Kick
                  </button>
                )}
                {(isViewer_owner || isViewer_coowner) && onPromote && member.role === "member" && (
                  <>
                    <button
                      onClick={() => { onPromote("admin"); onClose(); }}
                      className="h-10 rounded-xl glass text-xs font-medium text-blue-300 active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Shield className="h-3.5 w-3.5" /> Make Admin
                    </button>
                    {isViewer_owner && (
                      <button
                        onClick={() => { onPromote("co_owner"); onClose(); }}
                        className="h-10 rounded-xl glass text-xs font-medium text-purple-300 active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Star className="h-3.5 w-3.5" /> Co-owner
                      </button>
                    )}
                  </>
                )}
                {(isViewer_owner || isViewer_coowner) && onDemote &&
                  (member.role === "admin" || (isViewer_owner && member.role === "co_owner")) && (
                  <button
                    onClick={() => { onDemote(); onClose(); }}
                    className="h-10 rounded-xl glass text-xs font-medium text-muted-foreground active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <User className="h-3.5 w-3.5" /> Remove Role
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
