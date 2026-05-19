import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Sparkles, User, Hash, SlidersHorizontal, X, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES, sidFromUserId } from "@/lib/rooms";
import { useLiveRooms } from "@/lib/useRooms";
import { RoomCard } from "@/components/RoomCard";
import { CreateRoomFab, CreateRoomModal } from "@/components/CreateRoomModal";
import { DeleteRoomModal } from "@/components/DeleteRoomModal";
import { supabase } from "@/integrations/supabase/client";
import { defaultAvatar, useAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { DBRoom } from "@/lib/rooms";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover — ChitChat" },
      { name: "description", content: "Discover live party rooms and people." },
    ],
  }),
  component: Discover,
});

type FoundUser = { id: string; username: string; bio: string | null; profile_image: string | null; sid: string };
type FoundRoom = { id: string; name: string; category: string; listener_count: number };

const SID_RE  = /^CHT\d{1,8}$/i;
const UUID_RE = /^[0-9a-f]{8}/i;

function Discover() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [active, setActive]       = useState<string>("All");
  const [q, setQ]                 = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalRoom, setDeleteModalRoom] = useState<DBRoom | null>(null);
  const { rooms, loading } = useLiveRooms();

  const [searchMode, setSearchMode] = useState<"room" | "sid" | "roomid" | null>(null);
  const [foundUsers, setFoundUsers] = useState<FoundUser[]>([]);
  const [foundRoom, setFoundRoom]   = useState<FoundRoom | null>(null);
  const [searching, setSearching]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const val = q.trim();
    if (!val) { setSearchMode(null); setFoundUsers([]); setFoundRoom(null); return; }
    if (SID_RE.test(val))  { setSearchMode("sid");    return; }
    if (UUID_RE.test(val)) { setSearchMode("roomid"); return; }
    setSearchMode("room");
  }, [q]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchMode || searchMode === "room") { setFoundUsers([]); setFoundRoom(null); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      if (searchMode === "sid") {
        const { data } = await supabase.from("profiles").select("id, username, bio, profile_image").limit(200);
        const matches  = (data ?? []).filter((p) => sidFromUserId(p.id).toLowerCase().startsWith(q.trim().toLowerCase()));
        setFoundUsers(matches.map((p) => ({ ...p, sid: sidFromUserId(p.id) })));
        setFoundRoom(null);
      } else {
        const { data } = await supabase.from("rooms").select("id, name, category, listener_count")
          .ilike("id", `${q.trim()}%`).neq("category", "DM").limit(1).maybeSingle();
        setFoundRoom(data ?? null);
        setFoundUsers([]);
      }
      setSearching(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchMode, q]);

  const filtered = useMemo(() => {
    if (searchMode !== "room" && searchMode !== null) return [];
    return rooms.filter((r) => {
      if (active !== "All" && r.category !== active) return false;
      if (q.trim() && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rooms, active, q, searchMode]);

  const featured = filtered[0];
  const rest      = filtered.slice(1);
  const isSidOrId = searchMode === "sid" || searchMode === "roomid";

  const openDeleteModal = (room: DBRoom, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModalRoom(room);
  };

  return (
    <AppShell>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="px-5 pt-12 pb-3 animate-fade-up">
        <h1 className="text-2xl font-bold">Discover</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Find rooms, people, or search by SID</p>
      </header>

      {/* ── Search bar ─────────────────────────────────────────── */}
      <div className="px-4 mt-1 animate-fade-up">
        <div className="glass-strong rounded-2xl flex items-center gap-2.5 px-4 h-12 border border-white/10">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Room name, CHT-SID or Room ID…"
            className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground"
          />
          {q ? (
            <button onClick={() => setQ("")} className="text-muted-foreground hover:text-white flex-shrink-0">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>

        {/* Search hint chips */}
        {searchMode === "sid" && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-electric">
            <User className="h-3 w-3" /> Searching by ChitChat ID…
          </div>
        )}
        {searchMode === "roomid" && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-electric">
            <Hash className="h-3 w-3" /> Searching by Room ID…
          </div>
        )}
      </div>

      {/* ── SID results ─────────────────────────────────────────── */}
      {searchMode === "sid" && (
        <section className="px-4 mt-4 pb-32 space-y-2">
          {searching && (
            <div className="space-y-2 mt-4">
              {[0,1,2].map((i) => (
                <div key={i} className="h-16 rounded-2xl glass animate-shimmer" />
              ))}
            </div>
          )}
          {!searching && foundUsers.length === 0 && q.length >= 3 && (
            <div className="glass-strong rounded-3xl p-8 text-center mt-4">
              <User className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold text-sm">No user found</p>
              <p className="text-xs text-muted-foreground mt-1">Try a full SID like CHT123456</p>
            </div>
          )}
          {foundUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => navigate({ to: "/rooms", search: { view: u.id } } as never)}
              className="w-full glass rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="relative flex-shrink-0">
                <div className="h-12 w-12 rounded-full p-[2px] gradient-electric shadow-glow-soft">
                  <img
                    src={u.profile_image ?? defaultAvatar(u.username)}
                    alt={u.username}
                    className="h-full w-full rounded-full object-cover"
                    onError={(e) => { e.currentTarget.src = defaultAvatar(u.username); }}
                  />
                </div>
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">@{u.username}</p>
                <p className="text-[11px] text-electric font-mono">{u.sid}</p>
                {u.bio && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{u.bio}</p>}
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">View →</span>
            </button>
          ))}
        </section>
      )}

      {/* ── Room ID result ──────────────────────────────────────── */}
      {searchMode === "roomid" && (
        <section className="px-4 mt-4 pb-32">
          {searching && <div className="h-20 rounded-2xl glass animate-shimmer mt-4" />}
          {!searching && !foundRoom && q.length >= 8 && (
            <div className="glass-strong rounded-3xl p-8 text-center mt-4">
              <Hash className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold text-sm">No room found</p>
              <p className="text-xs text-muted-foreground mt-1">Check the Room ID and try again</p>
            </div>
          )}
          {foundRoom && (
            <button
              onClick={() => navigate({ to: "/rooms/$roomId", params: { roomId: foundRoom.id } })}
              className="w-full glass rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="h-12 w-12 rounded-2xl gradient-electric grid place-items-center flex-shrink-0 shadow-glow-soft">
                <Hash className="h-5 w-5 text-white" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{foundRoom.name}</p>
                <p className="text-[11px] text-muted-foreground">{foundRoom.category} · {foundRoom.listener_count} online</p>
                <p className="text-[10px] text-white/25 font-mono truncate mt-0.5">{foundRoom.id}</p>
              </div>
              <span className="text-xs text-electric font-semibold flex-shrink-0">Enter →</span>
            </button>
          )}
        </section>
      )}

      {/* ── Browse rooms ─────────────────────────────────────────── */}
      {!isSidOrId && (
        <>
          {/* Category filter */}
          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1 animate-fade-up">
            {["All", ...CATEGORIES].map((c) => {
              const sel = active === c;
              return (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`shrink-0 px-4 h-9 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                    sel ? "gradient-electric text-white shadow-glow-soft" : "glass text-muted-foreground"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="px-4 mt-5 grid grid-cols-2 gap-3">
              {[0,1,2,3].map((i) => <div key={i} className="h-48 rounded-3xl glass animate-shimmer" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mx-4 mt-10 glass-strong rounded-3xl p-8 text-center">
              <Sparkles className="h-8 w-8 mx-auto text-electric mb-3" />
              <p className="font-semibold text-sm">No rooms here yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to start the vibe</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 px-5 h-10 rounded-full gradient-electric text-white text-sm font-bold shadow-glow-soft active:scale-95"
              >
                Create Room
              </button>
            </div>
          ) : (
            <div className="px-4 mt-4 pb-32">
              {featured && (
                <div className="mb-4 relative">
                  <RoomCard room={featured} large />
                  {user && featured.owner_id === user.id && (
                  <button
                    onClick={(e) => openDeleteModal(featured, e)}
                    className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/70 backdrop-blur grid place-items-center active:scale-95 transition-transform"
                    title="Delete room"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </button>
                  )}
                </div>
              )}
              {rest.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {rest.map((r) => (
                    <div key={r.id} className="relative">
                      <RoomCard room={r} />
                      {user && r.owner_id === user.id && (
                      <button
                        onClick={(e) => openDeleteModal(r, e)}
                        className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-black/70 backdrop-blur grid place-items-center active:scale-95 transition-transform"
                        title="Delete room"
                      >
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <CreateRoomFab onClick={() => setModalOpen(true)} />
      {modalOpen && <CreateRoomModal onClose={() => setModalOpen(false)} />}
      {deleteModalRoom && (
        <DeleteRoomModal
          roomId={deleteModalRoom.id}
          roomName={deleteModalRoom.name}
          onClose={() => setDeleteModalRoom(null)}
          onDeleted={() => setDeleteModalRoom(null)}
        />
      )}
    </AppShell>
  );
}
