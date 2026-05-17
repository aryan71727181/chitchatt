import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, User as UserIcon, Calendar, MapPin, Sparkles, ArrowRight, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — ChitChat" }] }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signup");

  useEffect(() => {
    if (!loading && session) navigate({ to: "/home", replace: true });
  }, [session, loading, navigate]);

  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-20 h-[360px] w-[360px] rounded-full bg-[oklch(0.55_0.3_295)] opacity-30 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-[oklch(0.55_0.28_270)] opacity-30 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-md min-h-screen px-5 pt-10 pb-12">
        {/* top brand */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate({ to: "/" })}
            className="h-10 w-10 rounded-full glass grid place-items-center active:scale-95 transition"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-sm font-semibold text-[oklch(0.75_0.25_300)] inline-flex items-center gap-1"
          >
            {mode === "signin" ? "Sign up" : "Login"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight">
            {mode === "signup" ? "Create Account" : "Welcome Back"}
          </h1>
          <Sparkles className="h-5 w-5 text-[oklch(0.7_0.3_300)]" />
        </div>
        <p className="mt-2 text-sm text-white/60 max-w-xs">
          {mode === "signup"
            ? "Join ChitChat and start finding people who match your vibe."
            : "Log in to drop back into your rooms."}
        </p>

        {mode === "signup" ? <SignupForm /> : <SigninForm onForgot={() => {}} />}

        <Divider />

        <SocialButtons />

        <p className="mt-6 text-center text-[11px] text-white/50">
          By signing up, you agree to our{" "}
          <a className="text-[oklch(0.75_0.25_300)]" href="#">Terms of Service</a> and{" "}
          <a className="text-[oklch(0.75_0.25_300)]" href="#">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute inset-y-0 left-4 grid place-items-center text-white/40">
        <Icon className="h-4 w-4" />
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full h-14 rounded-2xl bg-white/[0.04] border border-white/10 pl-12 pr-12 text-sm text-white placeholder:text-white/40 outline-none focus:border-[oklch(0.65_0.3_295)] focus:ring-2 focus:ring-[oklch(0.55_0.3_295)]/40 transition";

function SignupForm() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({
    email: "",
    password: "",
    username: "",
    age: "",
    gender: "",
    location: "",
  });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!f.email || !f.password || !f.username || !f.age || !f.gender || !f.location) {
      setErr("All fields are required.");
      return;
    }
    if (f.password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
        data: {
          username: f.username.trim(),
          age: f.age,
          gender: f.gender,
          location: f.location.trim(),
        },
      },
    });
    setBusy(false);
    if (error) {
      if (/already|registered|exists/i.test(error.message)) {
        setErr("Email already in use. Try logging in.");
      } else if (/duplicate|unique/i.test(error.message)) {
        setErr("Username already taken.");
      } else {
        setErr(error.message);
      }
      return;
    }
    navigate({ to: "/home", replace: true });
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <Field icon={Mail}>
        <input className={inputClass} type="email" placeholder="Email" value={f.email} onChange={set("email")} autoComplete="email" />
      </Field>
      <Field icon={Lock}>
        <input className={inputClass} type={showPw ? "text" : "password"} placeholder="Password" value={f.password} onChange={set("password")} autoComplete="new-password" />
        <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </Field>
      <Field icon={UserIcon}>
        <input className={inputClass} placeholder="Username" value={f.username} onChange={set("username")} autoComplete="username" />
      </Field>
      <Field icon={Calendar}>
        <input className={inputClass} type="number" min={13} max={99} placeholder="Age" value={f.age} onChange={set("age")} />
      </Field>
      <Field icon={UserIcon}>
        <select
          className={inputClass + " appearance-none"}
          value={f.gender}
          onChange={set("gender") as any}
        >
          <option value="" disabled>Gender</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="nonbinary">Non-binary</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field icon={MapPin}>
        <input className={inputClass} placeholder="Location" value={f.location} onChange={set("location")} />
      </Field>

      {err && <p className="text-xs text-[oklch(0.7_0.25_25)] px-1">{err}</p>}

      <button
        disabled={busy}
        className="mt-2 w-full h-14 rounded-2xl gradient-electric text-white font-semibold inline-flex items-center justify-center gap-2 shadow-glow active:scale-[0.98] transition disabled:opacity-60"
      >
        {busy ? "Creating…" : (<>Create Account <ArrowRight className="h-4 w-4" /></>)}
      </button>
    </form>
  );
}

function SigninForm({ onForgot }: { onForgot: () => void }) {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) {
      setErr("Invalid email or password.");
      return;
    }
    navigate({ to: "/home", replace: true });
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <Field icon={Mail}>
        <input className={inputClass} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </Field>
      <Field icon={Lock}>
        <input className={inputClass} type={showPw ? "text" : "password"} placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </Field>

      {err && <p className="text-xs text-[oklch(0.7_0.25_25)] px-1">{err}</p>}

      <div className="flex items-center justify-between text-xs text-white/60 px-1">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" defaultChecked className="accent-[oklch(0.65_0.3_295)]" /> Keep me logged in
        </label>
        <button type="button" onClick={onForgot} className="text-[oklch(0.75_0.25_300)]">Forgot password?</button>
      </div>

      <button
        disabled={busy}
        className="mt-2 w-full h-14 rounded-2xl gradient-electric text-white font-semibold inline-flex items-center justify-center gap-2 shadow-glow active:scale-[0.98] transition disabled:opacity-60"
      >
        {busy ? "Signing in…" : (<>Login <ArrowRight className="h-4 w-4" /></>)}
      </button>
    </form>
  );
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-3 text-[11px] text-white/40">
      <span className="h-px flex-1 bg-white/10" /> OR <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function SocialButtons() {
  const [busy, setBusy] = useState<string | null>(null);
  const oauth = async (provider: "google" | "apple") => {
    setBusy(provider);
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/home" });
    if (r.error) {
      setBusy(null);
      alert(`Could not sign in with ${provider}.`);
    }
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => oauth("google")}
        disabled={busy !== null}
        className="h-12 rounded-2xl bg-white/[0.04] border border-white/10 text-sm font-medium inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
      >
        <GoogleG /> {busy === "google" ? "Loading…" : "Google"}
      </button>
      <button
        onClick={() => oauth("apple")}
        disabled={busy !== null}
        className="h-12 rounded-2xl bg-white/[0.04] border border-white/10 text-sm font-medium inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
      >
        <AppleLogo /> {busy === "apple" ? "Loading…" : "Apple"}
      </button>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.5-1.7 4.4-5.5 4.4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-9 0-.6-.07-1.1-.16-1.6H12z" />
    </svg>
  );
}
function AppleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M16.4 13.2c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.9-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.5 1.2 0 1.7-.8 3.1-.8 1.4 0 1.9.8 3.1.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.6-3.9zM14.2 5.8c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.7.7-1.2 1.9-1.1 3 1.1.1 2.3-.6 3-1.4z" />
    </svg>
  );
}