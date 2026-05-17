import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES } from "@/lib/rooms";
import { useLiveRooms } from "@/lib/useRooms";
import { RoomCard } from "@/components/RoomCard";
import { CreateRoomFab, CreateRoomModal } from "@/components/CreateRoomModal";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover Rooms — ChitChat" },
      { name: "description", content: "Discover live premium party rooms and people matching your vibe." },
    ],
  }),
  component: Discover,
});

function Discover() {
  const [active, setActive] = useState<string>("All");
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { rooms, loading } = useLiveRooms();

  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      if (active !== "All" && r.category !== active) return false;
      if (q.trim() && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rooms, active, q]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <AppShell>
      <header className="px-5 pt-12 pb-2 animate-fade-up">
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="text-xs text-muted-foreground mt-1">Live rooms · find your vibe</p>
      </header>

      <div className="px-5 mt-4">
        <div className="glass rounded-2xl flex items-center gap-2 px-4 h-12">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search rooms…"
            className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

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

      <CreateRoomFab onClick={() => setModalOpen(true)} />
      {modalOpen && <CreateRoomModal onClose={() => setModalOpen(false)} />}
    </AppShell>
  );
}
