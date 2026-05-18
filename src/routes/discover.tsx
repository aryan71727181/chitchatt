import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Sparkles, User, Hash } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES, sidFromUserId } from "@/lib/rooms";
import { useLiveRooms } from "@/lib/useRooms";
import { RoomCard } from "@/components/RoomCard";
import { CreateRoomFab, CreateRoomModal } from "@/components/CreateRoomModal";
import { supabase } from "@/integrations/supabase/client";
import { defaultAvatar } from "@/lib/auth";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover Rooms — ChitChat" },
      { name: "description", content: "Discover live premium party rooms and people matching your vibe." },
    ],
  }),
  component: Discover,
});

type FoundUser = {
  id: string;
  username: string;
  bio: string | null;
  profile_image: string | null;
  sid: string;
};

type FoundRoom = {
  id: string;
  name: string;
  category: string;
  listener_count: number;
};

const SID_RE  = /^CHT\d{1,8}$/i;
const UUID_RE = /^[0-9a-f]{8}/i;

function Discover() {
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("All");
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { rooms, loading } = useLiveRooms();

  // Smart search state
  const [searchMode, setSearchMode] = useState<"room" | "sid" | "roomid" | null>(null);
  const [foundUsers, setFoundUsers] = useState<FoundUser[]>([]);
  const [foundRoom, setFoundRoom] = useState<FoundRoom | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine search mode from query
  useEffect(() => {
    const val = q.trim();
    if (!val) { setSearchMode(null); setFoundUsers([]); setFoundRoom(null); return; }

    if (SID_RE.test(val)) {
      setSearchMode("sid");
    } else if (UUID_RE.test(val)) {
      setSearchMode("roomid");
    } else {
      setSearchMode("room");
    }
  }, [q]);

  // Execute smart search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchMode || searchMode === "room") { setFoundUsers([]); setFoundRoom(null); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);

      if (searchMode === "sid") {
        // Load profiles and match SID
        const { data } = await supabase
          .from("profiles")
          .select("id, username, bio, profile_image")
          .limit(200);
        const matches = (data ?? []).filter((p) =>
          sidFromUserId(p.id).toLowerCase().startsWith(q.trim().toLowerCase())
        );
        setFoundUsers(
          matches.map((p) => ({ ...p, sid: sidFromUserId(p.id) }))
        );
        setFoundRoom(null);
      } else if (searchMode === "roomid") {
        // Search room by ID prefix
        const { data } = await supabase
          .from("rooms")
          .select("id, name, category, listener_count")
          .ilike("id", `${q.trim()}%`)
          .neq("category", "DM")
          .limit(1)
          .maybeSingle();
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
  const rest = filtered.slice(1);

  const isSidOrRoomIdMode = searchMode === "sid" || searchMode === "roomid";

  return (
    <AppShell>
      <header className="px-5 pt-12 pb-2 animate-fade-up">
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="text-xs text-muted-foreground mt-1">Live rooms · search by SID or Room ID</p>
      </header>

      <div className="px-5 mt-4">
        <div className="glass rounded-2xl flex items-center gap-2 px-4 h-12">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search rooms, SID (CHT…) or Room ID…"
            className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-muted-foreground text-xs hover:text-white">✕</button>
          )}
        </div>

        {/* Search mode hint */}
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

      {/* SID search results */}
      {searchMode === "sid" && (
        <section className="px-5 mt-4 pb-32">
          {searching && (
            <p className="text-center text-sm text-muted-foreground py-8">Searching…</p>
          )}
          {!searching && foundUsers.length === 0 && q.length >= 3 && (
            <div className="glass-strong rounded-3xl p-8 text-center">
              <User className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-semibold">No user found</p>
              <p className="text-xs text-muted-foreground mt-1">Try the full SID like CHT123456</p>
            </div>
          )}
          {foundUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => navigate({ to: "/rooms", search: { view: u.id } } as never)}
              className="w-full glass rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-transform mb-3"
            >
              <img
                src={u.profile_image ?? defaultAvatar(u.username)}
                alt={u.username}
                className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                onError={(e) => { e.currentTarget.src = defaultAvatar(u.username); }}
              />
              <div className="text-left min-w-0">
                <p className="font-semibold text-sm truncate">@{u.username}</p>
                <p className="text-[11px] text-electric font-mono">{u.sid}</p>
                {u.bio && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{u.bio}</p>}
              </div>
              <span className="ml-auto text-xs text-muted-foreground shrink-0">View →</span>
            </button>
          ))}
        </section>
      )}

      {/* Room ID search result */}
      {searchMode === "roomid" && (
        <section className="px-5 mt-4 pb-32">
          {searching && (
            <p className="text-center text-sm text-muted-foreground py-8">Searching…</p>
          )}
          {!searching && !foundRoom && q.length >= 8 && (
            <div className="glass-strong rounded-3xl p-8 text-center">
              <Hash className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-semibold">No room found</p>
              <p className="text-xs text-muted-foreground mt-1">Check the Room ID and try again</p>
            </div>
          )}
          {foundRoom && (
            <button
              onClick={() => navigate({ to: "/rooms/$roomId", params: { roomId: foundRoom.id } })}
              className="w-full glass rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-transform"
            >
              <div className="h-12 w-12 rounded-2xl gradient-electric grid place-items-center flex-shrink-0">
                <Hash className="h-5 w-5 text-white" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-sm truncate">{foundRoom.name}</p>
                <p className="text-[11px] text-muted-foreground">{foundRoom.category} · {foundRoom.listener_count} listeners</p>
                <p className="text-[10px] text-white/30 font-mono truncate mt-0.5">{foundRoom.id}</p>
              </div>
              <span className="ml-auto text-xs text-muted-foreground shrink-0">Enter →</span>
            </button>
          )}
        </section>
      )}

      {/* Normal room search / browse */}
      {!isSidOrRoomIdMode && (
        <>
          <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar px-5 pb-1">
            {["All", ...CATEGORIES].map((c) => {
              const sel = active === c;
              return (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`shrink-0 px-4 h-9 rounded-full text-xs font-medium transition-all active:scale-95 ${
                    sel ? "gradient-electric text-white shadow-glow-soft" : "glass text-muted-foreground"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {loading ? (
            <p className="text-center text-sm text-muted-foreground mt-10">Loading rooms…</p>
          ) : filtered.length === 0 ? (
            <div className="mx-5 mt-10 glass-strong rounded-3xl p-8 text-center">
              <Sparkles className="h-8 w-8 mx-auto text-electric mb-3" />
              <p className="text-sm font-semibold">No rooms here yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to start the vibe</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 px-5 h-10 rounded-full gradient-electric text-white text-sm font-semibold shadow-glow-soft active:scale-95"
              >
                Create Room
              </button>
            </div>
          ) : (
            <>
              {featured && (
                <section className="px-5 mt-5 animate-fade-up">
                  <RoomCard room={featured} large />
                </section>
              )}
              {rest.length > 0 && (
                <section className="px-5 mt-5 grid grid-cols-2 gap-3 pb-32">
                  {rest.map((r) => (
                    <RoomCard key={r.id} room={r} />
                  ))}
                </section>
              )}
            </>
          )}
        </>
      )}

      <CreateRoomFab onClick={() => setModalOpen(true)} />
      {modalOpen && <CreateRoomModal onClose={() => setModalOpen(false)} />}
    </AppShell>
  );
}
