// Sends bulk SMS for a campaign via Evolution API.
// Input: { campaign_id: string }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function render(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, k) => {
    const v = vars?.[k];
    return v === undefined || v === null ? "" : String(v);
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
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
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const campaignId = body?.campaign_id;
    if (!campaignId || typeof campaignId !== "string") {
      return json({ error: "Missing campaign_id" }, 400);
    }

    const { data: campaign, error: campErr } = await supabase
      .from("sms_campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("user_id", userId)
      .maybeSingle();
    if (campErr || !campaign) return json({ error: "Campaign not found" }, 404);

    const { data: settings } = await supabase
      .from("evo_settings")
      .select("server_url, api_key")
      .maybeSingle();
    if (!settings) return json({ error: "Configure Evolution API antes" }, 400);

    if (!campaign.instance_name) return json({ error: "Campanha sem instância" }, 400);

    const { data: pending, error: recErr } = await supabase
      .from("sms_recipients")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("status", "pending");
    if (recErr) return json({ error: recErr.message }, 500);

    await supabase
      .from("sms_campaigns")
      .update({ status: "sending", started_at: new Date().toISOString() })
      .eq("id", campaignId);

    const baseUrl = settings.server_url.replace(/\/$/, "");
    const throttle = Math.max(0, campaign.throttle_ms ?? 1000);
    let sent = 0;
    let failed = 0;

    for (const r of pending ?? []) {
      const text = render(campaign.message, r.variables ?? {});
      try {
        const resp = await fetch(`${baseUrl}/message/sendSms/${campaign.instance_name}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: settings.api_key },
          body: JSON.stringify({ number: r.phone, text }),
        });
        const okResp = resp.ok;
        const data = await resp.text();
        if (okResp) {
          sent++;
          await supabase.from("sms_recipients").update({
            status: "sent",
            rendered_message: text,
            sent_at: new Date().toISOString(),
          }).eq("id", r.id);
        } else {
          failed++;
          await supabase.from("sms_recipients").update({
            status: "failed",
            rendered_message: text,
            error: `${resp.status}: ${data.slice(0, 300)}`,
          }).eq("id", r.id);
        }
      } catch (e) {
        failed++;
        const msg = e instanceof Error ? e.message : "Unknown";
        await supabase.from("sms_recipients").update({
          status: "failed", rendered_message: text, error: msg,
        }).eq("id", r.id);
      }
      if (throttle) await new Promise((res) => setTimeout(res, throttle));
    }

    await supabase.from("sms_campaigns").update({
      status: failed > 0 && sent === 0 ? "failed" : "completed",
      sent_count: (campaign.sent_count ?? 0) + sent,
      failed_count: (campaign.failed_count ?? 0) + failed,
      completed_at: new Date().toISOString(),
    }).eq("id", campaignId);

    return json({ ok: true, sent, failed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
