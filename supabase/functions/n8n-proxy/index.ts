// Authenticated proxy to a user's n8n instance.
// Reads base_url + api_key from public.n8n_settings (per-user) and forwards the request.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Action =
  | "test_connection"
  | "list_workflows"
  | "get_workflow"
  | "activate_workflow"
  | "deactivate_workflow"
  | "execute_workflow"
  | "list_executions"
  | "get_execution"
  | "list_credentials";

interface Body {
  action: Action;
  // Optional one-time settings (used only by test_connection before saving):
  base_url?: string;
  api_key?: string;
  // Per-action params
  workflow_id?: string;
  execution_id?: string;
  payload?: Record<string, unknown>;
  limit?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body?.action) return json({ error: "Missing action" }, 400);

    // Resolve credentials
    let baseUrl = (body.base_url ?? "").trim();
    let apiKey = (body.api_key ?? "").trim();

    if (!baseUrl || !apiKey) {
      const { data: settings, error: settingsErr } = await supabase
        .from("n8n_settings")
        .select("base_url, api_key")
        .maybeSingle();
      if (settingsErr || !settings) {
        return json({ error: "Configure a URL e a API Key do n8n antes de continuar." }, 400);
      }
      baseUrl = settings.base_url;
      apiKey = settings.api_key;
    }

    if (!/^https?:\/\//i.test(baseUrl)) {
      return json({ error: "URL do n8n inválida (use http:// ou https://)" }, 400);
    }

    const root = baseUrl.replace(/\/+$/, "");
    const apiBase = `${root}/api/v1`;

    let url = "";
    let method: "GET" | "POST" | "DELETE" | "PATCH" = "GET";
    let graphBody: Record<string, unknown> | null = null;

    switch (body.action) {
      case "test_connection":
      case "list_workflows": {
        const limit = Math.min(Math.max(body.limit ?? 50, 1), 100);
        url = `${apiBase}/workflows?limit=${limit}`;
        break;
      }
      case "get_workflow": {
        if (!body.workflow_id) return json({ error: "workflow_id obrigatório" }, 400);
        url = `${apiBase}/workflows/${encodeURIComponent(body.workflow_id)}`;
        break;
      }
      case "activate_workflow": {
        if (!body.workflow_id) return json({ error: "workflow_id obrigatório" }, 400);
        url = `${apiBase}/workflows/${encodeURIComponent(body.workflow_id)}/activate`;
        method = "POST";
        break;
      }
      case "deactivate_workflow": {
        if (!body.workflow_id) return json({ error: "workflow_id obrigatório" }, 400);
        url = `${apiBase}/workflows/${encodeURIComponent(body.workflow_id)}/deactivate`;
        method = "POST";
        break;
      }
      case "execute_workflow": {
        // n8n public API does not have a generic "execute" endpoint for non-webhook workflows.
        // We support workflows that expose a webhook by hitting the webhook URL directly.
        if (!body.workflow_id) return json({ error: "workflow_id (webhook path) obrigatório" }, 400);
        url = `${root}/webhook/${encodeURIComponent(body.workflow_id)}`;
        method = "POST";
        graphBody = (body.payload ?? {}) as Record<string, unknown>;
        break;
      }
      case "list_executions": {
        const limit = Math.min(Math.max(body.limit ?? 20, 1), 100);
        const wf = body.workflow_id ? `&workflowId=${encodeURIComponent(body.workflow_id)}` : "";
        url = `${apiBase}/executions?limit=${limit}${wf}`;
        break;
      }
      case "get_execution": {
        if (!body.execution_id) return json({ error: "execution_id obrigatório" }, 400);
        url = `${apiBase}/executions/${encodeURIComponent(body.execution_id)}`;
        break;
      }
      case "list_credentials": {
        url = `${apiBase}/credentials`;
        break;
      }
      default:
        return json({ error: `Ação desconhecida: ${body.action}` }, 400);
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: {
          "X-N8N-API-KEY": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: graphBody ? JSON.stringify(graphBody) : undefined,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro de rede";
      return json({ error: `Falha de rede ao conectar ao n8n: ${msg}` }, 502);
    }

    const text = await res.text();
    let data: unknown;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

    if (!res.ok) {
      return json({ error: "n8n API error", status: res.status, details: data }, res.status);
    }
    return json({ ok: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
