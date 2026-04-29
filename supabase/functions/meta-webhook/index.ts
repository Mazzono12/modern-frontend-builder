// Public webhook for WhatsApp Cloud API (Meta).
// Endpoint pattern:
//   GET  /functions/v1/meta-webhook?instance=<id>&hub.mode=...&hub.verify_token=...&hub.challenge=...
//   POST /functions/v1/meta-webhook?instance=<id>     (with X-Hub-Signature-256 header)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-hub-signature-256",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const instanceId = url.searchParams.get("instance");
  if (!instanceId) return text("Missing instance", 400);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: inst } = await admin
    .from("evo_instances")
    .select("id, user_id, name, meta_verify_token, meta_app_secret, provider")
    .eq("id", instanceId)
    .maybeSingle();

  if (!inst || inst.provider !== "meta_cloud") return text("Instance not found", 404);

  // ---- GET: webhook verification handshake ----
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const verifyToken = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && verifyToken && verifyToken === inst.meta_verify_token) {
      await admin.from("evo_instance_events").insert({
        user_id: inst.user_id, instance_id: inst.id, instance_name: inst.name,
        event_type: "meta.webhook.verified", level: "success",
        message: "Webhook verificado pela Meta",
      });
      return new Response(challenge ?? "", { status: 200, headers: corsHeaders });
    }
    return text("Forbidden", 403);
  }

  if (req.method !== "POST") return text("Method not allowed", 405);

  // ---- POST: validate signature, store events ----
  const raw = await req.text();
  if (inst.meta_app_secret) {
    const sig = req.headers.get("x-hub-signature-256") ?? "";
    const ok = await verifySignature(raw, sig, inst.meta_app_secret);
    if (!ok) {
      await admin.from("evo_instance_events").insert({
        user_id: inst.user_id, instance_id: inst.id, instance_name: inst.name,
        event_type: "meta.webhook.invalid_signature", level: "error",
        message: "Assinatura X-Hub-Signature-256 inválida",
      });
      return text("Invalid signature", 401);
    }
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return text("Invalid JSON", 400); }

  const logEvent = (event_type: string, level: "info" | "success" | "warning" | "error", message: string, details?: unknown) =>
    admin.from("evo_instance_events").insert({
      user_id: inst.user_id, instance_id: inst.id, instance_name: inst.name,
      event_type, level, message, details: details ?? null,
    });

  try {
    const entries: any[] = Array.isArray(payload?.entry) ? payload.entry : [];
    let messageCount = 0;
    let statusCount = 0;

    for (const entry of entries) {
      const changes: any[] = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const ch of changes) {
        const value = ch?.value ?? {};

        // Incoming/outgoing messages
        const messages: any[] = Array.isArray(value?.messages) ? value.messages : [];
        const contacts: any[] = Array.isArray(value?.contacts) ? value.contacts : [];
        const contactByWa: Record<string, any> = {};
        for (const c of contacts) if (c?.wa_id) contactByWa[c.wa_id] = c;

        for (const m of messages) {
          const from = String(m?.from ?? "");
          if (!from) continue;
          const type = String(m?.type ?? "text");
          const ts = m?.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : new Date().toISOString();

          const content =
            m?.text?.body ??
            m?.image?.caption ??
            m?.video?.caption ??
            m?.document?.caption ??
            m?.button?.text ??
            m?.interactive?.button_reply?.title ??
            m?.interactive?.list_reply?.title ??
            null;

          await admin.from("evo_messages").insert({
            user_id: inst.user_id,
            instance_id: inst.id,
            remote_jid: `${from}@s.whatsapp.net`,
            from_me: false,
            push_name: contactByWa[from]?.profile?.name ?? null,
            message_type: type,
            content,
            external_id: m?.id ?? null,
            status: "received",
            raw: m,
            message_timestamp: ts,
          });
          messageCount++;
        }

        // Delivery / read statuses
        const statuses: any[] = Array.isArray(value?.statuses) ? value.statuses : [];
        for (const s of statuses) {
          const externalId = s?.id;
          const status = s?.status; // sent | delivered | read | failed
          if (externalId && status) {
            await admin
              .from("evo_messages")
              .update({ status })
              .eq("external_id", externalId)
              .eq("user_id", inst.user_id);
            statusCount++;
          }
          if (status === "failed") {
            await logEvent("meta.message.failed", "error", "Mensagem falhou", s);
          }
        }
      }
    }

    if (messageCount) await logEvent("meta.messages.received", "info", `${messageCount} mensagem(ns) recebida(s)`);
    if (statusCount) await logEvent("meta.statuses", "info", `${statusCount} atualização(ões) de status`);

    // Mark instance as connected on first valid event
    await admin
      .from("evo_instances")
      .update({ status: "connected", last_sync: new Date().toISOString() })
      .eq("id", inst.id);

    return json({ ok: true });
  } catch (err) {
    await logEvent("meta.webhook.error", "error", err instanceof Error ? err.message : "Erro");
    return json({ ok: false }, 200); // ack to Meta to avoid retries on our bug
  }
});

async function verifySignature(rawBody: string, header: string, appSecret: string): Promise<boolean> {
  if (!header.startsWith("sha256=")) return false;
  const provided = header.slice("sha256=".length);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  return diff === 0;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function text(msg: string, status = 200) {
  return new Response(msg, { status, headers: corsHeaders });
}
