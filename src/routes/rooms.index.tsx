import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mic, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useLiveRooms } from "@/lib/useRooms";
import { RoomCard } from "@/components/RoomCard";
import { CreateRoomFab, CreateRoomModal } from "@/components/CreateRoomModal";

export const Route = createFileRoute("/rooms/")({
  head: () => ({
    meta: [
      { title: "Live Rooms — ChitChat" },
      { name: "description", content: "Join a live party room or start your own." },
    ],
  }),
  component: RoomsList,
});

function RoomsList() {
  const [modalOpen, setModalOpen] = useState(false);
  const { rooms, loading } = useLiveRooms();

  return (
    <AppShell>
      <header className="px-5 pt-12 pb-2 animate-fade-up">
        <div className="flex items-center gap-2">
          <Mic className="h-6 w-6 text-electric" />
          <h1 className="text-3xl font-bold">Rooms</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{rooms.length} live now</p>
      </header>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground mt-10">Loading…</p>
      ) : rooms.length === 0 ? (
        <div className="mx-5 mt-10 glass-strong rounded-3xl p-8 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-electric mb-3" />
          <p className="text-sm font-semibold">No live rooms</p>
          <p className="text-xs text-muted-foreground mt-1">Start the first party</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 px-5 h-10 rounded-full gradient-electric text-white text-sm font-semibold shadow-glow-soft active:scale-95"
          >
            Create Room
          </button>
        </div>
      ) : (
        <section className="px-5 mt-5 grid grid-cols-2 gap-3 pb-32">
          {rooms.map((r) => (
            <RoomCard key={r.id} room={r} />
          ))}
        </section>
      )}

      <CreateRoomFab onClick={() => setModalOpen(true)} />
      {modalOpen && <CreateRoomModal onClose={() => setModalOpen(false)} />}
    </AppShell>
  );
}
