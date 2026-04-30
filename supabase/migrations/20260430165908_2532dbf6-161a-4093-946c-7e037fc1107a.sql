-- evo_settings
DROP POLICY IF EXISTS "Users manage their own evo settings" ON public.evo_settings;
CREATE POLICY "Users manage their own evo settings"
ON public.evo_settings FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- evo_instances
DROP POLICY IF EXISTS "Users manage their own instances" ON public.evo_instances;
CREATE POLICY "Users manage their own instances"
ON public.evo_instances FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- evo_instance_events
DROP POLICY IF EXISTS "Users insert their own instance events" ON public.evo_instance_events;
DROP POLICY IF EXISTS "Users read their own instance events" ON public.evo_instance_events;
CREATE POLICY "Users insert their own instance events"
ON public.evo_instance_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read their own instance events"
ON public.evo_instance_events FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- evo_messages SELECT
DROP POLICY IF EXISTS "Users read their own messages" ON public.evo_messages;
CREATE POLICY "Users read their own messages"
ON public.evo_messages FOR SELECT TO authenticated
USING (auth.uid() = user_id);