-- 1) Fix evo_messages RLS: users can only manage their own messages
CREATE POLICY "Users insert their own messages"
ON public.evo_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own messages"
ON public.evo_messages FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own messages"
ON public.evo_messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 2) Remove sensitive table from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.evo_instances;

-- 3) Realtime channel authorization: only allow user-scoped topics like "user:<uid>:..."
CREATE POLICY "Users subscribe to their own realtime topics"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE ('user:' || auth.uid()::text || ':%'))
);

-- 4) Update default Meta API version to v23.0
ALTER TABLE public.evo_instances
  ALTER COLUMN meta_api_version SET DEFAULT 'v23.0';

UPDATE public.evo_instances
  SET meta_api_version = 'v23.0'
  WHERE meta_api_version = 'v21.0' OR meta_api_version IS NULL;

-- 5) New n8n_settings table (per-user)
CREATE TABLE public.n8n_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  base_url text NOT NULL,
  api_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.n8n_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own n8n settings"
ON public.n8n_settings FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_n8n_settings_updated_at
BEFORE UPDATE ON public.n8n_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();