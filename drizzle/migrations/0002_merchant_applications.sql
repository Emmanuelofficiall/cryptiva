CREATE TABLE public.merchant_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 2 AND 100), contact_phone text NOT NULL CHECK (length(trim(contact_phone)) BETWEEN 5 AND 40), country text NOT NULL CHECK (length(trim(country)) BETWEEN 2 AND 100), experience text NOT NULL CHECK (length(trim(experience)) BETWEEN 10 AND 2000), status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')), review_note text, created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz, reviewed_by uuid
);
GRANT SELECT, INSERT ON public.merchant_applications TO authenticated;
GRANT ALL ON public.merchant_applications TO service_role;
ALTER TABLE public.merchant_applications ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX merchant_one_pending_application ON public.merchant_applications(user_id) WHERE status='pending';
CREATE POLICY application_read ON public.merchant_applications FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY application_submit ON public.merchant_applications FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND status='pending' AND review_note IS NULL AND reviewed_at IS NULL AND reviewed_by IS NULL AND NOT EXISTS(SELECT 1 FROM public.merchants WHERE user_id=auth.uid() AND is_active));
CREATE OR REPLACE FUNCTION public.review_merchant_application(application_id uuid, decision text, note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE application public.merchant_applications;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Only admins can review applications'; END IF;
 IF decision NOT IN ('approved','rejected') OR decision IS NULL THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 IF length(coalesce(note,''))>1000 THEN RAISE EXCEPTION 'Review note is too long'; END IF;
 SELECT * INTO application FROM public.merchant_applications WHERE id=application_id FOR UPDATE;
 IF NOT FOUND OR application.status<>'pending' THEN RAISE EXCEPTION 'Application is not pending'; END IF;
 IF decision='approved' THEN
  PERFORM pg_advisory_xact_lock(hashtextextended(application.user_id::text, 20));
  UPDATE public.merchants SET is_active=true,display_name=application.display_name WHERE user_id=application.user_id;
  IF NOT FOUND THEN INSERT INTO public.merchants(user_id,display_name,is_active) VALUES(application.user_id,application.display_name,true); END IF;
 END IF;
 UPDATE public.merchant_applications SET status=decision,review_note=trim(coalesce(note,'')),reviewed_at=now(),reviewed_by=auth.uid() WHERE id=application_id;
 PERFORM public.record_action_notification(application.user_id,'merchant-application:'||application_id||':'||decision,'Merchant application '||decision,CASE WHEN decision='approved' THEN 'Your merchant account is ready.' ELSE coalesce(nullif(trim(note),''),'Your merchant application was not approved.') END,'/p2p');
END $$;
REVOKE ALL ON FUNCTION public.review_merchant_application(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_merchant_application(uuid,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.notify_merchant_application() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 PERFORM public.record_action_notification(NEW.user_id,'merchant-application:'||NEW.id||':pending','Merchant application submitted','Your application is awaiting admin review.','/p2p'); RETURN NEW; END $$;
CREATE TRIGGER notify_merchant_application AFTER INSERT ON public.merchant_applications FOR EACH ROW EXECUTE FUNCTION public.notify_merchant_application();