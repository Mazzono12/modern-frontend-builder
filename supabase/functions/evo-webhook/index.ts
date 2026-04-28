// Public webhook endpoint that the Evolution API server calls.
// URL pattern: /functions/v1/evo-webhook?secret=<webhook_secret>
// We resolve the user via the secret, store the message and update instance status.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (!secret) return json({ error: "Missing secret" }, 401);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: settings } = await admin
    .from("evo_settings")
    .select("user_id")
    .eq("webhook_secret", secret)
    .maybeSingle();

  if (!settings?.user_id) return json({ error: "Invalid secret" }, 401);
  const userId = settings.user_id;

  let payload: any = null;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const event: string = payload?.event ?? payload?.type ?? "unknown";
  const instanceName: string | null =
    payload?.instance ?? payload?.instanceName ?? payload?.data?.instance ?? null;

  // Resolve instance row (best-effort)
  let instanceId: string | null = null;
  if (instanceName) {
    const { data: inst } = await admin
      .from("evo_instances")
      .select("id")
      .eq("user_id", userId)
      .eq("name", instanceName)
      .maybeSingle();
    instanceId = inst?.id ?? null;
  }

  const logEvent = async (
    event_type: string,
    level: "info" | "success" | "warning" | "error",
    message: string,
    details?: any,
  ) => {
    await admin.from("evo_instance_events").insert({
      user_id: userId,
      instance_id: instanceId,
      instance_name: instanceName,
      event_type,
      level,
      message,
      details: details ?? null,
    });
  };

  // Connection state updates
  if (event === "connection.update" || event === "CONNECTION_UPDATE") {
    const state = payload?.data?.state ?? payload?.state;
    const status =
      state === "open" ? "connected"
      : state === "connecting" ? "connecting"
      : state === "close" ? "disconnected"
      : null;
    if (status && instanceId) {
      await admin
        .from("evo_instances")
        .update({ status, last_sync: new Date().toISOString() })
        .eq("id", instanceId)
        .eq("user_id", userId);
    }
    await logEvent(
      "connection.update",
      status === "connected" ? "success" : status === "disconnected" ? "warning" : "info",
      `Estado de conexão: ${state ?? "desconhecido"}`,
      { state },
    );
  }

  // QR refresh
  if (event === "qrcode.updated" || event === "QRCODE_UPDATED") {
    const qr =
      payload?.data?.qrcode?.base64 ??
      payload?.data?.qrcode ??
      payload?.qrcode?.base64 ??
      null;
    if (qr && instanceId) {
      await admin
        .from("evo_instances")
        .update({ qr_code: qr, status: "qr", last_sync: new Date().toISOString() })
        .eq("id", instanceId)
        .eq("user_id", userId);
    }
    await logEvent("qrcode.updated", "info", "Novo QR Code gerado");
  }

  // Incoming / outgoing messages
  if (
    event === "messages.upsert" ||
    event === "MESSAGES_UPSERT" ||
    event === "message" ||
    event === "messages.update"
  ) {
    const messages: any[] = Array.isArray(payload?.data?.messages)
      ? payload.data.messages
      : payload?.data
      ? [payload.data]
      : [];

    for (const m of messages) {
      const remoteJid = m?.key?.remoteJid ?? m?.remoteJid ?? null;
      if (!remoteJid) continue;

      const fromMe = Boolean(m?.key?.fromMe);
      const pushName = m?.pushName ?? m?.notifyName ?? null;
      const messageType = m?.messageType ?? Object.keys(m?.message ?? {})[0] ?? "text";

      const content =
        m?.message?.conversation ??
        m?.message?.extendedTextMessage?.text ??
        m?.message?.imageMessage?.caption ??
        m?.message?.videoMessage?.caption ??
        m?.text ??
        null;

      const ts = m?.messageTimestamp
        ? new Date(Number(m.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      await admin.from("evo_messages").insert({
        user_id: userId,
        instance_id: instanceId,
        remote_jid: remoteJid,
        from_me: fromMe,
        push_name: pushName,
        message_type: messageType,
        content,
        raw: m,
        message_timestamp: ts,
      });
    }
  }

  return json({ ok: true });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
