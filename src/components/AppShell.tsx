import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, hideNav }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className={`relative mx-auto max-w-md min-h-screen ${hideNav ? "pb-0" : "pb-32"}`}>
      {children}
      {!hideNav && <BottomNav />}
    </div>
  );
}
