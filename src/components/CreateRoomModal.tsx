import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X, Lock, Globe, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CATEGORIES, BANNER_PRESETS } from "@/lib/rooms";
import { toast } from "sonner";

export function CreateRoomModal({ onClose }: { onClose: () => void }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [banner, setBanner] = useState(BANNER_PRESETS[0].url);
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user || !profile) return;
    if (!name.trim()) return toast.error("Give your room a name");
    if (privacy === "private" && !password.trim()) return toast.error("Private rooms need a password");

    setLoading(true);
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        owner_id: user.id,
        owner_username: profile.username,
        name: name.trim(),
        category,
        description: description.trim(),
        banner,
        privacy,
        password_hash: privacy === "private" ? password.trim() : null,
      })
      .select("id")
      .single();
    setLoading(false);

    if (error || !data) {
      toast.error(error?.message ?? "Failed to create room");
      return;
    }
    toast.success("Room created");
    onClose();
    navigate({ to: "/rooms/$roomId", params: { roomId: data.id } });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md animate-fade-up" onClick={onClose}>
      <div
        className="w-full max-w-md glass-strong rounded-t-3xl sm:rounded-3xl p-5 shadow-card max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-full gradient-electric grid place-items-center shadow-glow-soft">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <h2 className="font-bold text-lg">Create Room</h2>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-full glass grid place-items-center active:scale-95">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Room Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={48}
              placeholder="Midnight Vibes"
              className="mt-1.5 w-full glass rounded-2xl h-11 px-4 text-sm outline-none focus:ring-1 focus:ring-electric"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Category</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 h-8 rounded-full text-[11px] font-medium transition-all ${
                    category === c ? "gradient-electric text-white shadow-glow-soft" : "glass text-muted-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={140}
              rows={2}
              placeholder="What's the vibe?"
              className="mt-1.5 w-full glass rounded-2xl p-3 text-sm outline-none focus:ring-1 focus:ring-electric resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Banner</label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {BANNER_PRESETS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBanner(b.url)}
                  className={`relative h-16 rounded-xl overflow-hidden ring-2 transition-all ${
                    banner === b.url ? "ring-electric shadow-glow-soft" : "ring-transparent"
                  }`}
                >
                  <img src={b.url} alt={b.label} className="h-full w-full object-cover" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-1 left-1.5 text-[10px] font-medium">{b.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Privacy</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setPrivacy("public")}
                className={`h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                  privacy === "public" ? "gradient-electric text-white shadow-glow-soft" : "glass text-muted-foreground"
                }`}
              >
                <Globe className="h-4 w-4" /> Public
              </button>
              <button
                onClick={() => setPrivacy("private")}
                className={`h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                  privacy === "private" ? "gradient-electric text-white shadow-glow-soft" : "glass text-muted-foreground"
                }`}
              >
                <Lock className="h-4 w-4" /> Private
              </button>
            </div>
            {privacy === "private" && (
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={32}
                placeholder="Room password"
                className="mt-2 w-full glass rounded-2xl h-11 px-4 text-sm outline-none focus:ring-1 focus:ring-electric"
              />
            )}
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full h-12 rounded-2xl gradient-electric text-white font-semibold shadow-glow active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create Room"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreateRoomFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-28 right-5 z-40 h-14 px-5 rounded-full gradient-electric text-white font-semibold shadow-glow flex items-center gap-2 active:scale-95 transition-transform"
    >
      <Sparkles className="h-4 w-4" />
      Create Room
    </button>
  );
}
