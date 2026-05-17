import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChitChat — Find your vibe" },
      { name: "description", content: "Premium GenZ social rooms. Find your vibe." },
    ],
  }),
  component: Splash,
});

function Splash() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      if (loading) return;
      navigate({ to: session ? "/home" : "/auth", replace: true });
    }, 2400);
    return () => clearTimeout(t);
  }, [session, loading, navigate]);

  return (
    <div className="fixed inset-0 grid place-items-center bg-black overflow-hidden">
      {/* ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[520px] w-[520px] rounded-full bg-[oklch(0.55_0.3_295)] opacity-30 blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[260px] w-[420px] rounded-full bg-[oklch(0.55_0.28_280)] opacity-30 blur-[100px]" />
      </div>

      <div className="relative text-center splash-rise">
        <div className="text-5xl sm:text-6xl font-extrabold tracking-tight">
          <span
            className="text-[oklch(0.65_0.3_300)]"
            style={{
              textShadow:
                "0 0 12px oklch(0.65 0.32 300 / 0.95), 0 0 32px oklch(0.6 0.3 295 / 0.7), 0 0 60px oklch(0.55 0.28 290 / 0.5)",
            }}
          >
            CHIT
          </span>
          <span
            className="text-white"
            style={{ textShadow: "0 0 10px rgba(255,255,255,0.85), 0 0 30px rgba(200,200,255,0.55)" }}
          >
            CHAT
          </span>
        </div>
        <p className="mt-4 text-sm text-white/80 tracking-wide">
          Find your <span className="text-[oklch(0.7_0.3_300)] font-semibold">vibe.</span>
        </p>

        {/* loader bar */}
        <div className="mt-8 mx-auto h-[3px] w-40 rounded-full overflow-hidden bg-white/10">
          <div className="h-full w-1/3 gradient-electric splash-bar" />
        </div>
      </div>

      <style>{`
        @keyframes splashRise {
          0% { opacity: 0; transform: translateY(10px) scale(0.96); filter: blur(6px); }
          60% { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .splash-rise { animation: splashRise 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        @keyframes splashBar {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(360%); }
        }
        .splash-bar { animation: splashBar 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}