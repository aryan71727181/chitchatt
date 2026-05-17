import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ArrowLeft, Smile, Image as ImageIcon, Mic, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { chats } from "@/lib/mock";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — ChitChat" },
      { name: "description", content: "Premium glass chat with your people." },
    ],
  }),
  component: Messages,
});

const sampleConvo = [
  { from: "them", text: "okay but the vibe last night was unreal 🌙" },
  { from: "me", text: "fr fr we have to do it again" },
  { from: "them", text: "you're literally my vibe rn 🌙" },
  { from: "me", text: "stop you're making me blush 💙" },
];

function Messages() {
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState("");
  const active = chats.find((c) => c.id === open);

  if (active) {
    return (
      <AppShell>
        <header className="px-4 pt-12 pb-3 flex items-center gap-3 animate-fade-up">
          <button onClick={() => setOpen(null)} className="h-10 w-10 rounded-full glass grid place-items-center active:scale-95 transition-transform">
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div className="relative">
            <img src={active.avatar} alt={active.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-electric/40" />
            {active.online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[oklch(0.7_0.2_150)] ring-2 ring-background" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight">{active.name}</p>
            <p className="text-[11px] text-electric">{active.online ? "● online" : "offline"}</p>
          </div>
        </header>

        <section className="px-4 mt-4 space-y-2.5">
          {sampleConvo.map((m, i) => (
            <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"} animate-fade-up`}>
              <div
                className={`max-w-[78%] px-4 py-2.5 text-sm leading-snug ${
                  m.from === "me"
                    ? "gradient-electric text-white rounded-3xl rounded-br-md shadow-glow-soft"
                    : "glass rounded-3xl rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </section>

        <div className="fixed bottom-24 left-0 right-0 z-30 px-4">
          <div className="mx-auto max-w-md glass-strong rounded-full pl-3 pr-1 h-12 flex items-center gap-1.5 shadow-card">
            <button className="h-9 w-9 grid place-items-center text-muted-foreground active:scale-90"><Smile className="h-5 w-5" /></button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message…"
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <button className="h-9 w-9 grid place-items-center text-muted-foreground active:scale-90"><ImageIcon className="h-4.5 w-4.5" /></button>
            <button className="h-9 w-9 grid place-items-center text-muted-foreground active:scale-90"><Mic className="h-4.5 w-4.5" /></button>
            <button className="h-10 w-10 rounded-full gradient-electric grid place-items-center shadow-glow-soft active:scale-95">
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="px-5 pt-12 pb-2 animate-fade-up">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-xs text-muted-foreground mt-1">Pick up where you left off</p>
      </header>

      <div className="px-5 mt-4">
        <div className="glass rounded-2xl flex items-center gap-2 px-4 h-12">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input placeholder="Search messages…" className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground" />
        </div>
      </div>

      {/* Online strip */}
      <section className="mt-5 flex gap-3 overflow-x-auto no-scrollbar px-5">
        {chats.filter((c) => c.online).map((c) => (
          <button key={c.id} onClick={() => setOpen(c.id)} className="shrink-0 flex flex-col items-center gap-1.5">
            <div className="relative">
              <span className="absolute -inset-1 rounded-full gradient-electric opacity-70 blur-sm" />
              <img src={c.avatar} alt={c.name} className="relative h-14 w-14 rounded-full object-cover ring-2 ring-background" />
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[oklch(0.7_0.2_150)] ring-2 ring-background" />
            </div>
            <span className="text-[11px] font-medium">{c.name}</span>
          </button>
        ))}
      </section>

      {/* List */}
      <ul className="mt-5 px-3 space-y-1">
        {chats.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => setOpen(c.id)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl active:bg-white/5 transition-colors text-left"
            >
              <div className="relative">
                <img src={c.avatar} alt={c.name} className="h-12 w-12 rounded-full object-cover" />
                {c.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[oklch(0.7_0.2_150)] ring-2 ring-background" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm truncate">{c.name}</p>
                  <span className="text-[10px] text-muted-foreground">{c.time}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className={`text-xs truncate ${c.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>{c.last}</p>
                  {c.unread > 0 && (
                    <span className="ml-2 min-w-[18px] h-[18px] px-1.5 rounded-full gradient-electric text-white text-[10px] font-bold grid place-items-center shadow-glow-soft">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
