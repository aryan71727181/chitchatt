import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto max-w-md min-h-screen pb-32">
      {children}
      <BottomNav />
    </div>
  );
}
