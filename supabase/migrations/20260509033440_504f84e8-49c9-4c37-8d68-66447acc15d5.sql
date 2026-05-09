DROP TABLE IF EXISTS public.sms_recipients CASCADE;
DROP TABLE IF EXISTS public.sms_campaigns CASCADE;
DROP TABLE IF EXISTS public.evo_messages CASCADE;
DROP TABLE IF EXISTS public.evo_instance_events CASCADE;
DROP TABLE IF EXISTS public.evo_instances CASCADE;
DROP TABLE IF EXISTS public.evo_settings CASCADE;

DROP TYPE IF EXISTS public.sms_recipient_status CASCADE;
DROP TYPE IF EXISTS public.sms_campaign_status CASCADE;
DROP TYPE IF EXISTS public.evo_instance_status CASCADE;
DROP TYPE IF EXISTS public.evo_provider CASCADE;