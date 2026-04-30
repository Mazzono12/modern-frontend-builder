// Validates Meta WhatsApp Cloud API credentials BEFORE saving an instance.
// Returns per-field errors so the UI can highlight what is wrong.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  phone_number_id?: string;
  waba_id?: string;
  access_token?: string;
  app_id?: string;
  app_secret?: string;
  api_version?: string;
}

type FieldErrors = Partial<Record<
  "phone_number_id" | "waba_id" | "access_token" | "app_id" | "app_secret" | "api_version",
  string
>>;

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
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body) return json({ error: "Invalid JSON" }, 400);

    const fieldErrors: FieldErrors = {};

    // ---- Local format validation ----
    const phoneId = (body.phone_number_id ?? "").trim();
    const wabaId = (body.waba_id ?? "").trim();
    const token = (body.access_token ?? "").trim();
    const appId = (body.app_id ?? "").trim();
    const appSecret = (body.app_secret ?? "").trim();
    const apiVersion = (body.api_version ?? "v21.0").trim();

    if (!phoneId) fieldErrors.phone_number_id = "Phone Number ID é obrigatório.";
    else if (!/^\d{6,25}$/.test(phoneId)) fieldErrors.phone_number_id = "Deve conter apenas dígitos (6–25).";

    if (!token) fieldErrors.access_token = "Access Token é obrigatório.";
    else if (token.length < 30) fieldErrors.access_token = "Token muito curto — verifique se copiou completo.";
    else if (/\s/.test(token)) fieldErrors.access_token = "Token não pode conter espaços.";

    if (wabaId && !/^\d{6,25}$/.test(wabaId)) fieldErrors.waba_id = "WABA ID deve conter apenas dígitos.";
    if (appId && !/^\d{6,25}$/.test(appId)) fieldErrors.app_id = "App ID deve conter apenas dígitos.";
    if (appSecret && appSecret.length < 16) fieldErrors.app_secret = "App Secret parece inválido (muito curto).";
    if (!/^v\d+\.\d+$/.test(apiVersion)) fieldErrors.api_version = "Formato esperado: v21.0";

    if (Object.keys(fieldErrors).length > 0) {
      return json({ ok: false, stage: "format", fieldErrors }, 200);
    }

    const base = `https://graph.facebook.com/${apiVersion}`;
    const auth = { Authorization: `Bearer ${token}` };

    // ---- 1. Token + phone_number_id check ----
    const phoneRes = await fetch(
      `${base}/${phoneId}?fields=id,display_phone_number,verified_name,quality_rating,whatsapp_business_account`,
      { headers: auth },
    );
    const phoneData = await phoneRes.json().catch(() => ({}));

    if (!phoneRes.ok) {
      const err = phoneData?.error ?? {};
      const code = err.code;
      const sub = err.error_subcode;
      const msg = err.message ?? `HTTP ${phoneRes.status}`;

      // OAuth / token problems
      if (phoneRes.status === 401 || code === 190 || code === 102 || code === 463 || code === 467) {
        fieldErrors.access_token = `Token inválido ou expirado: ${msg}`;
      } else if (code === 200 || code === 10 || sub === 33) {
        // Permissions / object not visible to this token
        fieldErrors.access_token = "Token não tem permissão para acessar este Phone Number ID (whatsapp_business_messaging).";
        fieldErrors.phone_number_id = "Verifique se o Phone Number ID pertence à mesma conta do token.";
      } else if (phoneRes.status === 404 || code === 803 || sub === 33) {
        fieldErrors.phone_number_id = `Phone Number ID não encontrado no Meta: ${msg}`;
      } else {
        fieldErrors.phone_number_id = `Falha ao validar Phone Number ID: ${msg}`;
      }
      return json({ ok: false, stage: "phone", fieldErrors, raw: phoneData }, 200);
    }

    const detectedWaba: string | null =
      phoneData?.whatsapp_business_account?.id ?? null;

    // ---- 2. WABA validation (optional input, but if provided must match) ----
    if (wabaId) {
      if (detectedWaba && detectedWaba !== wabaId) {
        fieldErrors.waba_id = `Não confere: este Phone Number ID pertence à WABA ${detectedWaba}.`;
        return json({ ok: false, stage: "waba_mismatch", fieldErrors, detected_waba_id: detectedWaba }, 200);
      }

      const wabaRes = await fetch(`${base}/${wabaId}?fields=id,name,timezone_id`, { headers: auth });
      const wabaData = await wabaRes.json().catch(() => ({}));
      if (!wabaRes.ok) {
        const err = wabaData?.error ?? {};
        const msg = err.message ?? `HTTP ${wabaRes.status}`;
        if (wabaRes.status === 404 || err.code === 803) {
          fieldErrors.waba_id = `WABA ID não encontrado: ${msg}`;
        } else if (err.code === 200 || err.code === 10) {
          fieldErrors.waba_id = "Token não tem permissão (whatsapp_business_management) para acessar esta WABA.";
        } else {
          fieldErrors.waba_id = `Falha ao validar WABA: ${msg}`;
        }
        return json({ ok: false, stage: "waba", fieldErrors, raw: wabaData }, 200);
      }
    }

    // ---- 3. App credentials sanity check (optional) ----
    // If both app_id and app_secret are provided, hit the debug_token endpoint.
    if (appId && appSecret) {
      const dbgRes = await fetch(
        `${base}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`,
      );
      const dbg = await dbgRes.json().catch(() => ({}));
      if (!dbgRes.ok || dbg?.data?.is_valid === false) {
        const reason = dbg?.data?.error?.message ?? dbg?.error?.message ?? "App ID/Secret não conferem com o token.";
        fieldErrors.app_secret = `Validação App falhou: ${reason}`;
        return json({ ok: false, stage: "app", fieldErrors, raw: dbg }, 200);
      }
      const appOfToken = dbg?.data?.app_id;
      if (appOfToken && String(appOfToken) !== appId) {
        fieldErrors.app_id = `Token foi gerado para o App ${appOfToken}, não ${appId}.`;
        return json({ ok: false, stage: "app", fieldErrors, raw: dbg }, 200);
      }
    }

    return json({
      ok: true,
      info: {
        phone_number_id: phoneId,
        display_phone_number: phoneData?.display_phone_number ?? null,
        verified_name: phoneData?.verified_name ?? null,
        quality_rating: phoneData?.quality_rating ?? null,
        waba_id: wabaId || detectedWaba,
        detected_waba_id: detectedWaba,
      },
    });
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
