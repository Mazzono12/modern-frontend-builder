-- Evolution API integration schema

-- Workspace-level configuration (server URL + global API key)
CREATE TABLE public.evo_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  server_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  webhook_secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own evo settings"
  ON public.evo_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- WhatsApp instances (one user can have many)
CREATE TYPE public.evo_instance_status AS ENUM ('disconnected', 'connecting', 'qr', 'connected', 'error');

CREATE TABLE public.evo_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instance_key TEXT,
  phone_number TEXT,
  status public.evo_instance_status NOT NULL DEFAULT 'disconnected',
  qr_code TEXT,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE public.evo_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own instances"
  ON public.evo_instances FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Messages received via webhook
CREATE TABLE public.evo_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES public.evo_instances(id) ON DELETE SET NULL,
  remote_jid TEXT NOT NULL,
  from_me BOOLEAN NOT NULL DEFAULT false,
  push_name TEXT,
  message_type TEXT,
  content TEXT,
  raw JSONB,
  message_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evo_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own messages"
  ON public.evo_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX evo_messages_user_jid_idx ON public.evo_messages (user_id, remote_jid, message_timestamp DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER evo_settings_updated BEFORE UPDATE ON public.evo_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER evo_instances_updated BEFORE UPDATE ON public.evo_instances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable realtime for instances and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.evo_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evo_messages;