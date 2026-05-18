import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DBRoom } from "@/lib/rooms";

export function useLiveRooms() {
  const [rooms, setRooms] = useState<DBRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .eq("status", "active")
        .neq("category", "DM")
        .order("listener_count", { ascending: false })
        .order("created_at", { ascending: false });
      if (alive) {
        setRooms((data ?? []) as DBRoom[]);
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel("rooms-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => load())
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { rooms, loading };
}
