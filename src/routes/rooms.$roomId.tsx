import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/rooms/$roomId")({
  component: VoiceRoomPage,
});

// Lazy load the entire content to avoid framer-motion SSR issues
const VoiceRoomContent = lazy(() => import("@/components/voice-room/VoiceRoomContent"));

function VoiceRoomPage() {
  // Client-side only detection
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Render a simple loading state during SSR
  if (!isClient) {
    return (
      <AppShell hideNav>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-electric" />
            <p className="text-sm text-muted-foreground mt-4">Loading room...</p>
          </div>
        </div>
      </AppShell>
    );
  }
  
  return (
    <Suspense fallback={
      <AppShell hideNav>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-electric" />
            <p className="text-sm text-muted-foreground mt-4">Loading room...</p>
          </div>
        </div>
      </AppShell>
    }>
      <VoiceRoomContent />
    </Suspense>
  );
}
