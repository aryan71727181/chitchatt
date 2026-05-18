import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search, ArrowLeft, Smile, Send, MessageCircle, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { defaultAvatar } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  getOrCreateDmRoom,
  loadDmMessages,
  sendDmMessage,
  listDmConversations,
  type DMMessage,
} from "@/lib/dm";

type ConvItem = {
  roomId: string;
  userId: string;
  username: string;
  avatar: string | null;
  lastMessage: string | null;
  lastTime: string | null;
};

type SearchParams = {
  with?: string;
  name?: string;
};

export const Route = createFileRoute("/messages")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    with: typeof s.with === "string" ? s.with : undefined,
    name: typeof s.name === "string" ? s.name : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Messages — ChitChat" },
      { name: "description", content: "Real-time direct messages." },
    ],
  }),
  component: Messages,
});

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function ChatView({
  roomId,
  theirUserId,
  theirUsername,
  theirAvatar,
  myId,
  myUsername,
  myAvatar,
  onBack,
}: {
  roomId: string;
  theirUserId: string;
  theirUsername: string;
  theirAvatar: string | null;
  myId: string;
  myUsername: string;
  myAvatar: string | null;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    loadDmMessages(roomId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    const channel = supabase
      .channel(`dm-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const m = payload.new as {
            id: string; user_id: string; username: string; avatar: string | null;
            text: string | null; kind: string; created_at: string;
          };
          setMessages((prev) => [
            ...prev,
            {
              id: m.id,
              sender_id: m.user_id,
              sender_username: m.username,
              sender_avatar: m.avatar,
              text: m.text,
              kind: m.kind,
              created_at: m.created_at,
            },
          ]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const handleSend = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setText("");
    setSending(true);
    await sendDmMessage(roomId, myId, myUsername, myAvatar, t);
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const avatar = theirAvatar ?? defaultAvatar(theirUsername);

  return (
    <AppShell>
      {/* Header */}
      <header className="px-4 pt-12 pb-3 flex items-center gap-3 animate-fade-up border-b border-white/5">
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-full glass grid place-items-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="relative">
          <img src={avatar} alt={theirUsername} className="h-10 w-10 rounded-full object-cover ring-2 ring-electric/40" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 ring-2 ring-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">@{theirUsername}</p>
          <p className="text-[11px] text-electric">● online</p>
        </div>
      </header>

      {/* Messages */}
      <section className="px-4 py-4 pb-32 space-y-2.5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 10rem)" }}>
        {loading ? (
          <div className="flex justify-center pt-10">
            <Loader2 className="h-6 w-6 animate-spin text-electric" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center pt-10 text-muted-foreground text-sm">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-electric/40" />
            Say hello to @{theirUsername}!
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === myId;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-up`}>
                {!isMe && (
                  <img
                    src={m.sender_avatar ?? defaultAvatar(m.sender_username)}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover mr-2 mt-auto flex-shrink-0"
                  />
                )}
                <div
                  className={`max-w-[78%] px-4 py-2.5 text-sm leading-snug ${
                    isMe
                      ? "gradient-electric text-white rounded-3xl rounded-br-md shadow-glow-soft"
                      : "glass rounded-3xl rounded-bl-md"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </section>

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 z-30 px-4 pb-2">
        <div className="mx-auto max-w-md glass-strong rounded-full pl-3 pr-1 h-12 flex items-center gap-1.5 shadow-card border border-white/8">
          <button className="h-9 w-9 grid place-items-center text-muted-foreground active:scale-90">
            <Smile className="h-5 w-5" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Message…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="h-10 w-10 rounded-full gradient-electric grid place-items-center shadow-glow-soft active:scale-95 disabled:opacity-40"
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Messages() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [convs, setConvs] = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRoom, setOpenRoom] = useState<{
    roomId: string;
    theirUserId: string;
    theirUsername: string;
    theirAvatar: string | null;
  } | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const myId = user?.id ?? "";
  const myUsername = profile?.username ?? user?.email?.split("@")[0] ?? "me";
  const myAvatar = profile?.profile_image ?? null;

  // Handle ?with=userId&name=username deep link
  useEffect(() => {
    if (!search.with || !myId || !myUsername) return;
    (async () => {
      const theirId = search.with!;
      const theirName = search.name ?? "User";
      const roomId = await getOrCreateDmRoom(myId, myUsername, theirId, theirName);
      if (roomId) {
        setOpenRoom({ roomId, theirUserId: theirId, theirUsername: theirName, theirAvatar: null });
      }
      // Clear search params
      navigate({ to: "/messages", search: {}, replace: true });
    })();
  }, [search.with, myId, myUsername]);

  // Load conversations
  useEffect(() => {
    if (!myId) return;
    setLoading(true);
    listDmConversations(myId).then((data) => {
      setConvs(data);
      setLoading(false);
    });
  }, [myId]);

  const handleOpenConv = (c: ConvItem) => {
    setOpenRoom({
      roomId: c.roomId,
      theirUserId: c.userId,
      theirUsername: c.username,
      theirAvatar: c.avatar,
    });
  };

  if (openRoom) {
    return (
      <ChatView
        {...openRoom}
        myId={myId}
        myUsername={myUsername}
        myAvatar={myAvatar}
        onBack={() => setOpenRoom(null)}
      />
    );
  }

  const filtered = convs.filter((c) =>
    !searchQ.trim() || c.username.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <AppShell>
      <header className="px-5 pt-12 pb-2 animate-fade-up">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-xs text-muted-foreground mt-1">Your conversations</p>
      </header>

      <div className="px-5 mt-4">
        <div className="glass rounded-2xl flex items-center gap-2 px-4 h-12">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search messages…"
            className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-16">
          <Loader2 className="h-6 w-6 animate-spin text-electric" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mx-5 mt-12 glass rounded-3xl p-8 text-center">
          <MessageCircle className="h-8 w-8 mx-auto text-electric mb-3" />
          <p className="font-semibold text-sm">No messages yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tap a user's profile in any room to start a conversation
          </p>
        </div>
      ) : (
        <ul className="mt-5 px-3 space-y-1 pb-32">
          {filtered.map((c) => {
            const av = c.avatar ?? defaultAvatar(c.username);
            return (
              <li key={c.roomId}>
                <button
                  onClick={() => handleOpenConv(c)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl active:bg-white/5 transition-colors text-left"
                >
                  <div className="relative flex-shrink-0">
                    <img src={av} alt={c.username} className="h-12 w-12 rounded-full object-cover" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 ring-2 ring-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm truncate">@{c.username}</p>
                      {c.lastTime && (
                        <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                          {timeAgo(c.lastTime)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {c.lastMessage ?? "Start chatting…"}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
