// Client-only motion components - prevents SSR issues with framer-motion
"use client";

import { lazy, Suspense, type ComponentProps } from "react";
import type { motion as motionType, AnimatePresence as AnimatePresenceType } from "framer-motion";

// Lazy load framer-motion only on client
const MotionComponents = lazy(() =>
  import("framer-motion").then((mod) => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: mod.motion,
    AnimatePresence: mod.AnimatePresence,
  }))
);

// Re-export motion components that work safely with SSR
export { MotionComponents };

// Type-safe motion component that renders nothing on server
export function ClientMotion({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
