import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "chitchat_follows_v1";

function loadLocal(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveLocal(set: Set<string>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...set]));
}

export function isFollowingLocal(targetId: string): boolean {
  return loadLocal().has(targetId);
}

/** Toggle follow. Returns new follow state. */
export async function toggleFollow(
  myId: string,
  targetId: string
): Promise<{ following: boolean; error?: string }> {
  if (myId === targetId) return { following: false, error: "Cannot follow yourself" };

  const set = loadLocal();
  const isNowFollowing = !set.has(targetId);

  // Optimistically update localStorage
  if (isNowFollowing) {
    set.add(targetId);
  } else {
    set.delete(targetId);
  }
  saveLocal(set);

  // Try DB (requires follows migration + toggle_follow function)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("toggle_follow", { target_id: targetId });
    if (error) {
      // DB not ready — fall back to local-only (still "works" for this session)
      console.warn("toggle_follow RPC not available, using local storage:", error.message);
    }
  } catch {
    // silence — localStorage is the source of truth
  }

  return { following: isNowFollowing };
}

/** Check if the current user follows targetId — tries DB first, then local */
export async function checkFollowing(targetId: string): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("is_following", { target_id: targetId });
    if (!error && typeof data === "boolean") return data;
  } catch {
    // ignore
  }
  return isFollowingLocal(targetId);
}
