-- Provider enum
DO $$ BEGIN
  CREATE TYPE public.evo_provider AS ENUM ('evolution', 'meta_cloud');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add provider + Meta-specific columns to evo_instances
ALTER TABLE public.evo_instances
  ADD COLUMN IF NOT EXISTS provider public.evo_provider NOT NULL DEFAULT 'evolution',
  ADD COLUMN IF NOT EXISTS meta_phone_number_id text,
  ADD COLUMN IF NOT EXISTS meta_waba_id text,
  ADD COLUMN IF NOT EXISTS meta_access_token text,
  ADD COLUMN IF NOT EXISTS meta_app_secret text,
  ADD COLUMN IF NOT EXISTS meta_app_id text,
  ADD COLUMN IF NOT EXISTS meta_verify_token text,
  ADD COLUMN IF NOT EXISTS meta_api_version text NOT NULL DEFAULT 'v21.0',
  ADD COLUMN IF NOT EXISTS meta_display_phone_number text;

-- Messages: external id + status (works for both providers but mostly Meta)
ALTER TABLE public.evo_messages
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS status text;

CREATE INDEX IF NOT EXISTS evo_messages_external_id_idx
  ON public.evo_messages (external_id) WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS evo_instances_provider_idx
  ON public.evo_instances (user_id, provider);
