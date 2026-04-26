// Authenticated proxy to Evolution API.
// Reads the user's saved server_url + api_key from evo_settings and forwards the call.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ProxyBody {
  path: string; // e.g. "/instance/create"
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  // Optional: store response into an instance row (used by createInstance + qr)
  persistInstanceId?: string;
  persistFields?: ("qr_code" | "instance_key" | "phone_number" | "status")[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const payload = (await req.json()) as ProxyBody;
    if (!payload?.path || typeof payload.path !== "string") {
      return json({ error: "Missing 'path'" }, 400);
    }

    const { data: settings, error: settingsErr } = await supabase
      .from("evo_settings")
      .select("server_url, api_key")
      .maybeSingle();

    if (settingsErr || !settings) {
      return json(
        { error: "Configure a URL e a API Key da Evolution API antes de continuar." },
        400,
      );
    }

    const url = `${settings.server_url.replace(/\/$/, "")}${payload.path}`;
    const upstream = await fetch(url, {
      method: payload.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: settings.api_key,
      },
      body: payload.body !== undefined ? JSON.stringify(payload.body) : undefined,
    });

    const text = await upstream.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    // Persist selected fields back to the instance row, if requested.
    if (upstream.ok && payload.persistInstanceId && payload.persistFields?.length) {
      const update: Record<string, unknown> = {};
      const d = data as Record<string, unknown> | null;
      if (d) {
        if (payload.persistFields.includes("qr_code")) {
          const qr =
            (d as any)?.qrcode?.base64 ??
            (d as any)?.qrcode ??
            (d as any)?.base64 ??
            null;
          if (qr) {
            update.qr_code = qr;
            update.status = "qr";
          }
        }
        if (payload.persistFields.includes("instance_key")) {
          const key =
            (d as any)?.instance?.instanceName ??
            (d as any)?.instance?.instanceId ??
            (d as any)?.hash?.apikey ??
            null;
          if (key) update.instance_key = key;
        }
        if (payload.persistFields.includes("phone_number")) {
          const num = (d as any)?.instance?.owner ?? (d as any)?.owner ?? null;
          if (num) update.phone_number = num;
        }
        if (payload.persistFields.includes("status")) {
          const state =
            (d as any)?.instance?.state ?? (d as any)?.state ?? null;
          if (state === "open") update.status = "connected";
          else if (state === "connecting") update.status = "connecting";
          else if (state === "close") update.status = "disconnected";
        }
      }
      if (Object.keys(update).length > 0) {
        await supabase
          .from("evo_instances")
          .update({ ...update, last_sync: new Date().toISOString() })
          .eq("id", payload.persistInstanceId)
          .eq("user_id", userId);
      }
    }

    return json({ ok: upstream.ok, status: upstream.status, data }, upstream.ok ? 200 : 502);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
