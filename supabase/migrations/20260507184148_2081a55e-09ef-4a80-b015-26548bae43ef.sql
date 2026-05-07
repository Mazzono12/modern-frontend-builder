
CREATE TABLE public.bot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  name text NOT NULL DEFAULT 'CIFHER AI',
  welcome_message text NOT NULL DEFAULT 'Oi! Sou o assistente CIFHER ✨ Como posso ajudar?',
  system_prompt text NOT NULL DEFAULT 'Você é um assistente útil e profissional do CIFHER, plataforma de atendimento omnichannel. Responda de forma clara e objetiva em português.',
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  temperature numeric NOT NULL DEFAULT 0.7,
  quick_replies jsonb NOT NULL DEFAULT '["Como criar campanha?","Ver métricas de hoje","Treinar chatbot","Falar com humano"]'::jsonb,
  status_text text NOT NULL DEFAULT 'Online · resposta em segundos',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own bot settings"
  ON public.bot_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_bot_settings_updated
  BEFORE UPDATE ON public.bot_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
