-- Event log for instance diagnostics
CREATE TABLE public.evo_instance_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instance_id UUID,
  instance_name TEXT,
  event_type TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_evo_events_user_inst ON public.evo_instance_events(user_id, instance_id, created_at DESC);

ALTER TABLE public.evo_instance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own instance events"
  ON public.evo_instance_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own instance events"
  ON public.evo_instance_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.evo_instance_events;