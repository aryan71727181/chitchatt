import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Radio, Compass, MessageCircle, User } from "lucide-react";

type Tab = { to: string; icon: typeof Home; label: string; center?: boolean; badge?: number };

const tabs: Tab[] = [
  { to: "/home",     icon: Home,          label: "Home"    },
  { to: "/discover", icon: Compass,       label: "Explore" },
  { to: "/rooms",    icon: Radio,         label: "Party",  center: true },
  { to: "/messages", icon: MessageCircle, label: "Inbox",  badge: 12   },
  { to: "/profile",  icon: User,          label: "Me"      },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-5 pt-1 pointer-events-none">
      <div className="mx-auto max-w-md glass-strong rounded-[2rem] px-1 py-2 flex items-end justify-between shadow-card pointer-events-auto relative border border-white/10">
        {tabs.map((t) => {
          const active = pathname === t.to || pathname.startsWith(t.to + "/");
          const Icon = t.icon;

          if (t.center) {
            return (
              <Link
                key={t.to}
                to={t.to as any}
                className="relative -mt-10 flex flex-col items-center"
              >
                <span className="relative h-[3.8rem] w-[3.8rem] rounded-full gradient-electric grid place-items-center shadow-glow animate-glow-pulse">
                  <span className="absolute inset-[3px] rounded-full bg-[oklch(0.1_0.02_280)] grid place-items-center">
                    <Icon className="h-6 w-6 text-white drop-shadow-[0_0_8px_white]" />
                  </span>
                </span>
                <span className="mt-1.5 text-[9px] font-bold tracking-wide text-electric">{t.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={t.to}
              to={t.to as any}
              className="relative flex-1 flex flex-col items-center gap-0.5 py-2 active:scale-95 transition-transform"
            >
              {/* Glow pill behind active icon */}
              {active && (
                <span className="absolute top-1.5 h-8 w-8 rounded-full bg-electric/15 blur-sm" />
              )}
              <span className="relative">
                <Icon
                  className={`h-5 w-5 transition-all duration-200 ${
                    active ? "text-electric scale-110" : "text-muted-foreground"
                  }`}
                />
                {t.badge ? (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 grid place-items-center rounded-full gradient-electric text-[9px] font-bold text-white shadow-glow-soft">
                    {t.badge}
                  </span>
                ) : null}
              </span>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? "text-electric" : "text-muted-foreground/70"
                }`}
              >
                {t.label}
              </span>
              {active && (
                <span className="absolute bottom-1 h-1 w-5 rounded-full gradient-electric shadow-glow-soft" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
