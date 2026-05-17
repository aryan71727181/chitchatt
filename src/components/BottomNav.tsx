import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, Mic, MessageCircle, User } from "lucide-react";

type Tab = {
  to: string;
  icon: typeof Home;
  label: string;
  center?: boolean;
  badge?: number;
};
const tabs: Tab[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/discover", icon: Compass, label: "Discover" },
  { to: "/rooms", icon: Mic, label: "Rooms", center: true },
  { to: "/messages", icon: MessageCircle, label: "Messages", badge: 12 },
  { to: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-2 pointer-events-none">
      <div className="mx-auto max-w-md glass-strong rounded-3xl px-2 py-2 flex items-end justify-between shadow-card pointer-events-auto relative">
        {tabs.map((t) => {
          const active = pathname === t.to || (t.to !== "/" && pathname.startsWith(t.to));
          const Icon = t.icon;
          if (t.center) {
            return (
              <Link
                key={t.to}
                to={t.to}
                className="relative -mt-8 flex flex-col items-center justify-center"
              >
                <span className="relative h-16 w-16 rounded-full gradient-electric grid place-items-center animate-glow-pulse">
                  <span className="absolute inset-1 rounded-full bg-background/40 backdrop-blur-md grid place-items-center">
                    <Icon className="h-7 w-7 text-white drop-shadow-[0_0_8px_oklch(0.72_0.22_255)]" />
                  </span>
                </span>
                <span className={`mt-1 text-[10px] ${active ? "text-electric" : "text-muted-foreground"}`}>{t.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={t.to}
              to={t.to}
              className="relative flex-1 flex flex-col items-center gap-1 py-2 transition-transform active:scale-95"
            >
              <span className="relative">
                <Icon className={`h-5 w-5 transition-colors ${active ? "text-electric" : "text-muted-foreground"}`} />
                {t.badge ? (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-[oklch(0.65_0.27_350)] text-[9px] font-bold text-white shadow-glow-soft">
                    {t.badge}
                  </span>
                ) : null}
              </span>
              <span className={`text-[10px] ${active ? "text-electric font-medium" : "text-muted-foreground"}`}>{t.label}</span>
              {active && <span className="absolute -top-0.5 h-1 w-1 rounded-full bg-electric shadow-glow-soft" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
