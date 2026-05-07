
CREATE TYPE public.sms_campaign_status AS ENUM ('draft','scheduled','sending','completed','failed','canceled');
CREATE TYPE public.sms_recipient_status AS ENUM ('pending','sent','failed');

CREATE TABLE public.sms_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  message text NOT NULL,
  instance_id uuid REFERENCES public.evo_instances(id) ON DELETE SET NULL,
  instance_name text,
  scheduled_at timestamptz,
  status public.sms_campaign_status NOT NULL DEFAULT 'draft',
  total_count int NOT NULL DEFAULT 0,
  sent_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  throttle_ms int NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE public.sms_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.sms_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  phone text NOT NULL,
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  rendered_message text,
  status public.sms_recipient_status NOT NULL DEFAULT 'pending',
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sms_campaigns_user ON public.sms_campaigns(user_id, created_at DESC);
CREATE INDEX idx_sms_recipients_campaign ON public.sms_recipients(campaign_id);
CREATE INDEX idx_sms_recipients_status ON public.sms_recipients(status);

ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own sms campaigns"
  ON public.sms_campaigns FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own sms recipients"
  ON public.sms_recipients FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_sms_campaigns_updated
  BEFORE UPDATE ON public.sms_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
