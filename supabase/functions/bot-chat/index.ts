// Lovable AI–powered chat for the floating assistant.
// Body: { messages: [{role, content}] }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    if (messages.length === 0) return json({ error: "messages required" }, 400);

    const { data: settings } = await supabase
      .from("bot_settings")
      .select("*")
      .maybeSingle();

    const model = settings?.model || "google/gemini-2.5-flash";
    const systemPrompt =
      settings?.system_prompt ||
      "Você é um assistente útil do CIFHER. Responda em português.";
    const temperature = Number(settings?.temperature ?? 0.7);

    if (settings && settings.enabled === false) {
      return json({ error: "Assistente desativado nas configurações." }, 400);
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (resp.status === 429) return json({ error: "Limite de requisições. Tente novamente em instantes." }, 429);
    if (resp.status === 402) return json({ error: "Créditos insuficientes no workspace Lovable AI." }, 402);

    const data = await resp.json();
    if (!resp.ok) return json({ error: data?.error?.message || "Falha no AI gateway" }, 502);

    const reply = data?.choices?.[0]?.message?.content ?? "";
    return json({ reply });
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
