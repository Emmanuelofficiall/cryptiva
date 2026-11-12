DROP POLICY IF EXISTS "Anyone can view p2p settings" ON public.p2p_settings;
REVOKE SELECT ON public.p2p_settings FROM anon;
GRANT SELECT ON public.p2p_settings TO authenticated;
CREATE POLICY "Signed-in users can view active p2p settings" ON public.p2p_settings FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(), 'admin'));