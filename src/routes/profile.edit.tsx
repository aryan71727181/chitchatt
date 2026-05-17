import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Camera, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { defaultAvatar, defaultCover, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile/edit")({
  head: () => ({ meta: [{ title: "Edit profile — ChitChat" }] }),
  component: EditProfile,
});

function EditProfile() {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({
    username: "",
    age: "",
    gender: "",
    location: "",
    bio: "",
    profile_image: "",
    cover_image: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setF({
        username: profile.username,
        age: profile.age?.toString() ?? "",
        gender: profile.gender ?? "",
        location: profile.location ?? "",
        bio: profile.bio ?? "",
        profile_image: profile.profile_image ?? "",
        cover_image: profile.cover_image ?? "",
      });
    }
  }, [profile]);

  if (!profile) {
    return <AppShell><div className="min-h-screen grid place-items-center text-white/50 text-sm">Loading…</div></AppShell>;
  }

  const seed = profile.id;
  const avatar = f.profile_image || defaultAvatar(seed);
  const cover = f.cover_image || defaultCover(seed);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!f.username.trim()) return setErr("Username is required.");
    setBusy(true);
    const { error } = await updateProfile({
      username: f.username.trim(),
      age: f.age ? Number(f.age) : null,
      gender: f.gender || null,
      location: f.location.trim() || null,
      bio: f.bio,
      profile_image: f.profile_image.trim() || null,
      cover_image: f.cover_image.trim() || null,
    });
    setBusy(false);
    if (error) {
      if (/duplicate|unique/i.test(error)) setErr("Username already taken.");
      else setErr(error);
      return;
    }
    navigate({ to: "/profile" });
  };

  const inputCls = "w-full h-12 rounded-2xl bg-white/[0.04] border border-white/10 px-4 text-sm outline-none focus:border-[oklch(0.65_0.3_295)] focus:ring-2 focus:ring-[oklch(0.55_0.3_295)]/40";

  return (
    <AppShell>
      <div className="relative h-48 overflow-hidden">
        <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background" />
        <div className="relative px-4 pt-12 flex items-center justify-between">
          <button onClick={() => navigate({ to: "/profile" })} className="h-10 w-10 rounded-full glass grid place-items-center">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="font-bold text-base">Edit Profile</h1>
          <div className="w-10" />
        </div>
      </div>

      <section className="px-5 -mt-10 relative">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="absolute -inset-1 rounded-full gradient-electric blur-md opacity-70" />
            <img src={avatar} alt="" className="relative h-20 w-20 rounded-full object-cover ring-4 ring-background bg-white/5" />
            <span className="absolute bottom-0 right-0 h-6 w-6 rounded-full gradient-electric grid place-items-center ring-2 ring-background">
              <Camera className="h-3 w-3 text-white" />
            </span>
          </div>
          <div className="flex-1 text-xs text-muted-foreground">
            Paste image URLs below — pic & cover update instantly.
          </div>
        </div>

        <form onSubmit={onSave} className="mt-6 space-y-3">
          <Labeled label="Username">
            <input className={inputCls} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
          </Labeled>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Age">
              <input className={inputCls} type="number" min={13} max={99} value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} />
            </Labeled>
            <Labeled label="Gender">
              <select className={inputCls + " appearance-none"} value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
                <option value="">—</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="nonbinary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </Labeled>
          </div>
          <Labeled label="Location">
            <input className={inputCls} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
          </Labeled>
          <Labeled label="Bio">
            <textarea className={inputCls + " h-24 py-3 resize-none"} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} maxLength={160} />
          </Labeled>
          <Labeled label="Profile image URL">
            <input className={inputCls} value={f.profile_image} onChange={(e) => setF({ ...f, profile_image: e.target.value })} placeholder="https://…" />
          </Labeled>
          <Labeled label="Cover image URL">
            <input className={inputCls} value={f.cover_image} onChange={(e) => setF({ ...f, cover_image: e.target.value })} placeholder="https://…" />
          </Labeled>

          {err && <p className="text-xs text-[oklch(0.7_0.25_25)] px-1">{err}</p>}

          <button disabled={busy} className="mt-4 w-full h-14 rounded-2xl gradient-electric text-white font-semibold inline-flex items-center justify-center gap-2 shadow-glow active:scale-[0.98] transition disabled:opacity-60">
            {busy ? "Saving…" : (<><Check className="h-4 w-4" /> Save Changes</>)}
          </button>
        </form>
      </section>
    </AppShell>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground px-1">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}