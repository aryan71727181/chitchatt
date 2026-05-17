import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { RtcTokenBuilder, RtcRole } from "agora-token";

export const getAgoraToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { channel: string; uid: number; publisher: boolean }) => {
    if (!d?.channel || typeof d.channel !== "string" || d.channel.length > 64) throw new Error("bad channel");
    if (typeof d.uid !== "number" || d.uid < 0 || d.uid > 2 ** 31 - 1) throw new Error("bad uid");
    return { channel: d.channel, uid: d.uid, publisher: !!d.publisher };
  })
  .handler(async ({ data }) => {
    const appId = process.env.AGORA_APP_ID;
    const cert = process.env.AGORA_APP_CERTIFICATE;
    if (!appId || !cert) throw new Error("Agora not configured");
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
    const role = data.publisher ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      cert,
      data.channel,
      data.uid,
      role,
      expiresAt,
      expiresAt,
    );
    return { token, appId, uid: data.uid, expiresAt };
  });
