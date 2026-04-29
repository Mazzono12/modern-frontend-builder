// Authenticated proxy to WhatsApp Cloud API (Meta).
// Reads per-instance Meta credentials from evo_instances and forwards the request.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Action-based API so the frontend stays simple. Each action maps to a Cloud API call.
type Action =
  | "send_text"
  | "send_media"        // image | audio | video | document | sticker
  | "send_template"
  | "send_interactive"  // buttons or list
  | "send_reaction"
  | "mark_read"
  | "get_phone_info";

interface Body {
  instance_id: string;
  action: Action;
  payload?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body?.instance_id || !body?.action) return json({ error: "Missing instance_id or action" }, 400);

    const { data: inst, error: instErr } = await supabase
      .from("evo_instances")
      .select("*")
      .eq("id", body.instance_id)
      .maybeSingle();
    if (instErr || !inst) return json({ error: "Instância não encontrada" }, 404);
    if (inst.provider !== "meta_cloud") return json({ error: "Instância não é Meta Cloud" }, 400);
    if (!inst.meta_phone_number_id || !inst.meta_access_token) {
      return json({ error: "Credenciais Meta incompletas para esta instância" }, 400);
    }

    const apiVersion = inst.meta_api_version || "v21.0";
    const phoneId = inst.meta_phone_number_id;
    const token = inst.meta_access_token;
    const base = `https://graph.facebook.com/${apiVersion}`;

    const logEvent = async (
      event_type: string,
      level: "info" | "success" | "warning" | "error",
      message: string,
      details?: unknown,
    ) => {
      await admin.from("evo_instance_events").insert({
        user_id: userId,
        instance_id: inst.id,
        instance_name: inst.name,
        event_type,
        level,
        message,
        details: details ?? null,
      });
    };

    let url = "";
    let method: "GET" | "POST" = "POST";
    let graphBody: Record<string, unknown> | null = null;
    const p = body.payload ?? {};

    const buildRecipient = () => {
      const to = String((p as any).to ?? "");
      if (!to) throw new Error("Campo 'to' obrigatório");
      return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.replace(/\D/g, ""),
      };
    };

    switch (body.action) {
      case "send_text": {
        url = `${base}/${phoneId}/messages`;
        graphBody = {
          ...buildRecipient(),
          type: "text",
          text: {
            preview_url: Boolean((p as any).preview_url ?? true),
            body: String((p as any).body ?? ""),
          },
        };
        break;
      }
      case "send_media": {
        url = `${base}/${phoneId}/messages`;
        const kind = String((p as any).kind ?? "image"); // image|audio|video|document|sticker
        const media: Record<string, unknown> = {};
        if ((p as any).id) media.id = (p as any).id;
        else if ((p as any).link) media.link = (p as any).link;
        else throw new Error("Forneça 'id' ou 'link' da mídia");
        if ((p as any).caption && (kind === "image" || kind === "video" || kind === "document")) {
          media.caption = String((p as any).caption);
        }
        if ((p as any).filename && kind === "document") media.filename = String((p as any).filename);
        graphBody = { ...buildRecipient(), type: kind, [kind]: media };
        break;
      }
      case "send_template": {
        url = `${base}/${phoneId}/messages`;
        graphBody = {
          ...buildRecipient(),
          type: "template",
          template: {
            name: String((p as any).name ?? ""),
            language: { code: String((p as any).language ?? "pt_BR") },
            ...(Array.isArray((p as any).components) ? { components: (p as any).components } : {}),
          },
        };
        break;
      }
      case "send_interactive": {
        url = `${base}/${phoneId}/messages`;
        graphBody = {
          ...buildRecipient(),
          type: "interactive",
          interactive: (p as any).interactive,
        };
        break;
      }
      case "send_reaction": {
        url = `${base}/${phoneId}/messages`;
        graphBody = {
          ...buildRecipient(),
          type: "reaction",
          reaction: {
            message_id: String((p as any).message_id ?? ""),
            emoji: String((p as any).emoji ?? ""),
          },
        };
        break;
      }
      case "mark_read": {
        url = `${base}/${phoneId}/messages`;
        graphBody = {
          messaging_product: "whatsapp",
          status: "read",
          message_id: String((p as any).message_id ?? ""),
        };
        break;
      }
      case "get_phone_info": {
        url = `${base}/${phoneId}?fields=display_phone_number,verified_name,quality_rating`;
        method = "GET";
        graphBody = null;
        break;
      }
      default:
        return json({ error: `Ação desconhecida: ${body.action}` }, 400);
    }

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: graphBody ? JSON.stringify(graphBody) : undefined,
    });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
      await logEvent(`meta.${body.action}`, "error", `Falha Meta API (${res.status})`, data);
      return json({ error: "Meta API error", status: res.status, details: data }, res.status);
    }

    // Persist outgoing message + log
    if (
      body.action === "send_text" ||
      body.action === "send_media" ||
      body.action === "send_template" ||
      body.action === "send_interactive"
    ) {
      const externalId = data?.messages?.[0]?.id ?? null;
      const remoteJid = String((p as any).to ?? "").replace(/\D/g, "");
      const content =
        body.action === "send_text" ? String((p as any).body ?? "") :
        body.action === "send_template" ? `[template:${(p as any).name}]` :
        body.action === "send_media" ? `[${(p as any).kind ?? "media"}]${(p as any).caption ? " " + (p as any).caption : ""}` :
        "[interactive]";

      await admin.from("evo_messages").insert({
        user_id: userId,
        instance_id: inst.id,
        remote_jid: `${remoteJid}@s.whatsapp.net`,
        from_me: true,
        message_type: body.action.replace("send_", ""),
        content,
        external_id: externalId,
        status: "sent",
        raw: { request: graphBody, response: data },
      });
      await logEvent(`meta.${body.action}`, "success", `Mensagem enviada via Meta`, { externalId });
    } else {
      await logEvent(`meta.${body.action}`, "info", `Ação ${body.action} executada`, data);
    }

    return json({ ok: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
