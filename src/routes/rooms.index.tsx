import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mic, Sparkles, Flame, Star, Clock, Users, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useLiveRooms } from "@/lib/useRooms";
import { RoomCard } from "@/components/RoomCard";
import { CreateRoomFab, CreateRoomModal } from "@/components/CreateRoomModal";

export const Route = createFileRoute("/rooms/")({
  head: () => ({
    meta: [
      { title: "Party Rooms — ChitChat" },
      { name: "description", content: "Join a live party room or start your own." },
    ],
  }),
  component: RoomsList,
});

const TABS = [
  { id: "hot",      label: "Hot",    icon: Flame },
  { id: "new",      label: "New",    icon: Clock },
  { id: "top",      label: "Top",    icon: Star  },
  { id: "all",      label: "All",    icon: Users },
];

function RoomsList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("hot");
  const { rooms, loading } = useLiveRooms();

  // Simple sort variations per tab (all using same data for now)
  const sorted = [...rooms].sort((a, b) => {
    if (activeTab === "new") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (activeTab === "top") return b.listener_count - a.listener_count;
    return b.listener_count - a.listener_count;
  });

  const featured = sorted[0];
  const rest = sorted.slice(1);

  return (
    <AppShell>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="px-5 pt-12 pb-3 animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl gradient-electric grid place-items-center shadow-glow-soft">
                <Mic className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Party Rooms</h1>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 ml-0.5">
              <span className="h-1.5 w-1.5 live-dot inline-block mr-1.5 align-middle" />
              {rooms.length} rooms live now
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="h-10 w-10 rounded-full gradient-electric grid place-items-center shadow-glow-soft active:scale-95"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      {/* ── Filter Tabs ─────────────────────────────────────────── */}
      <div className="px-5 flex gap-2 mt-1 animate-fade-up">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                active
                  ? "gradient-electric text-white shadow-glow-soft"
                  : "glass text-muted-foreground"
              }`}
            >
              <Icon className="h-3 w-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      {loading ? (
        /* Skeleton */
        <div className="px-4 mt-5 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-3xl glass animate-shimmer" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="mx-5 mt-10 glass-strong rounded-3xl p-8 text-center">
          <div className="h-16 w-16 rounded-full gradient-electric grid place-items-center mx-auto mb-4 shadow-glow">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <p className="font-bold text-base">No live rooms yet</p>
          <p className="text-xs text-muted-foreground mt-1">Start the first party tonight!</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-5 px-6 h-11 rounded-full gradient-electric text-white text-sm font-bold shadow-glow active:scale-95"
          >
            Create Room
          </button>
        </div>
      ) : (
        <div className="px-4 mt-5 pb-32">
          {/* Featured — full width tall card */}
          {featured && (
            <div className="mb-4 animate-fade-up">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Star className="h-3.5 w-3.5 text-gold" />
                <span className="text-[11px] font-bold text-gold tracking-wide">FEATURED ROOM</span>
              </div>
              <RoomCard room={featured} large />
            </div>
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Flame className="h-3.5 w-3.5 text-[oklch(0.72_0.22_30)]" />
                <span className="text-[11px] font-bold text-muted-foreground tracking-wide">
                  {activeTab === "new" ? "NEWEST ROOMS" : activeTab === "top" ? "TOP ROOMS" : "ALL ROOMS"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {rest.map((r) => (
                  <RoomCard key={r.id} room={r} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <CreateRoomFab onClick={() => setModalOpen(true)} />
      {modalOpen && <CreateRoomModal onClose={() => setModalOpen(false)} />}
    </AppShell>
  );
}
