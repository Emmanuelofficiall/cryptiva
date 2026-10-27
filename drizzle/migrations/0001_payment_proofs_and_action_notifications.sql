ALTER TABLE public.deposits ADD COLUMN proof_path text;
ALTER TABLE public.deposits ADD COLUMN invoice_number text;
CREATE UNIQUE INDEX deposits_invoice_number_unique ON public.deposits(invoice_number) WHERE invoice_number IS NOT NULL;
CREATE POLICY "Users upload own payment proofs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='payment-proofs' AND (storage.foldername(name))[1]=auth.uid()::text AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','pdf'));
CREATE POLICY "Owner and admin read payment proofs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='payment-proofs' AND ((storage.foldername(name))[1]=auth.uid()::text OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "Users remove unsubmitted proofs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='payment-proofs' AND (storage.foldername(name))[1]=auth.uid()::text AND NOT EXISTS(SELECT 1 FROM public.deposits d WHERE d.proof_path=name));
CREATE TABLE public.notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, event_key text NOT NULL UNIQUE, title text NOT NULL, message text NOT NULL, link text NOT NULL DEFAULT '/dashboard', created_at timestamptz NOT NULL DEFAULT now(), read_at timestamptz, email_status text NOT NULL DEFAULT 'awaiting_domain');
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE(read_at) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY "Users mark own notifications read" ON public.notifications FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE INDEX notifications_user_created ON public.notifications(user_id,created_at DESC);
CREATE FUNCTION public.record_action_notification(recipient uuid, event_id text, heading text, body text, destination text DEFAULT '/dashboard') RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ INSERT INTO public.notifications(user_id,event_key,title,message,link) VALUES(recipient,event_id,heading,body,destination) ON CONFLICT(event_key) DO NOTHING $$;
REVOKE ALL ON FUNCTION public.record_action_notification(uuid,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_action_notification(uuid,text,text,text,text) TO service_role;
CREATE FUNCTION public.validate_deposit_proof() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.amount<=0 OR NEW.amount::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Enter a valid deposit amount'; END IF;
  IF auth.uid() IS NOT NULL THEN
   IF NEW.user_id<>auth.uid() OR NEW.status IS DISTINCT FROM 'pending' OR NEW.currency IS DISTINCT FROM 'USDT' OR NEW.method NOT IN ('TRC20 USDT', 'BEP20 USDT') THEN RAISE EXCEPTION 'Invalid deposit request'; END IF;
   IF NEW.proof_path IS NULL OR NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='payment-proofs' AND o.name=NEW.proof_path AND (storage.foldername(o.name))[1]=auth.uid()::text AND lower(storage.extension(o.name)) IN ('jpg','jpeg','png','webp','pdf') AND (o.metadata->>'size')::bigint<=5242880 AND o.metadata->>'mimetype' IN ('image/jpeg','image/png','image/webp','application/pdf')) THEN RAISE EXCEPTION 'Upload a valid payment proof first'; END IF;
  END IF;
  NEW.invoice_number:='INV-'||upper(replace(NEW.id::text,'-',''));
  NEW.transaction_ref:=NEW.invoice_number;
  NEW.reviewed_at:=NULL;
 ELSE
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Only admins review deposits'; END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.amount IS DISTINCT FROM OLD.amount OR NEW.proof_path IS DISTINCT FROM OLD.proof_path OR NEW.invoice_number IS DISTINCT FROM OLD.invoice_number OR NEW.currency IS DISTINCT FROM OLD.currency OR NEW.method IS DISTINCT FROM OLD.method OR NEW.transaction_ref IS DISTINCT FROM OLD.transaction_ref THEN RAISE EXCEPTION 'Deposit details cannot be changed'; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
   IF OLD.status<>'pending' OR NEW.status NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'This deposit has already been reviewed'; END IF;
   NEW.reviewed_at:=now();
   IF NEW.status='approved' THEN
    UPDATE public.profiles SET wallet_balance=coalesce(wallet_balance,0)+NEW.amount WHERE user_id=NEW.user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Deposit wallet not found'; END IF;
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_deposit_proof BEFORE INSERT OR UPDATE ON public.deposits FOR EACH ROW EXECUTE FUNCTION public.validate_deposit_proof();
CREATE FUNCTION public.notify_financial_action() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE rowdata jsonb:=to_jsonb(NEW); recipient uuid; heading text; body text; destination text:='/dashboard'; key text; recipient2 uuid;
BEGIN
 IF TG_OP='UPDATE' AND rowdata->>'status' IS NOT DISTINCT FROM to_jsonb(OLD)->>'status' THEN RETURN NEW; END IF;
 recipient:=(rowdata->>'user_id')::uuid;
 key:=TG_TABLE_NAME||':'||(rowdata->>'id')||':'||coalesce(rowdata->>'status',TG_OP);
 CASE TG_TABLE_NAME
 WHEN 'deposits' THEN heading:='Deposit '||coalesce(NEW.status,'pending'); body:=NEW.amount||' USDT • Invoice '||coalesce(NEW.invoice_number,NEW.transaction_ref,NEW.id::text); destination:='/dashboard?tab=deposit';
 WHEN 'withdrawals' THEN heading:='Withdrawal '||coalesce(rowdata->>'status','pending'); body:=(rowdata->>'amount')||' USDT withdrawal update'; destination:='/dashboard?tab=withdraw';
 WHEN 'investments' THEN heading:='Plan '||CASE WHEN TG_OP='INSERT' THEN 'purchased' ELSE coalesce(rowdata->>'status','updated') END; body:=(rowdata->>'plan_name')||' • '||(rowdata->>'amount')||' USDT'; destination:='/plans';
 WHEN 'p2p_orders' THEN heading:='P2P order '||(rowdata->>'status'); body:=(rowdata->>'amount')||' USDT • '||(rowdata->>'order_type'); destination:='/p2p'; recipient2:=(rowdata->>'matched_user_id')::uuid;
 WHEN 'p2p_disputes' THEN heading:='P2P dispute '||(rowdata->>'status'); body:='Your trade dispute has been '||CASE WHEN TG_OP='INSERT' THEN 'submitted' ELSE 'updated' END; destination:='/p2p'; SELECT user_id,matched_user_id INTO recipient,recipient2 FROM public.p2p_orders WHERE id=(rowdata->>'order_id')::uuid;
 WHEN 'daily_earnings' THEN heading:='Daily earning recorded'; body:=(rowdata->>'amount')||' USDT earned'; destination:='/dashboard?tab=earnings';
 WHEN 'referral_commissions' THEN heading:='Referral commission earned'; body:=(rowdata->>'amount')||' USDT commission'; destination:='/referral';
 WHEN 'referral_rewards' THEN heading:='Referral reward earned'; body:=(rowdata->>'amount')||' USDT • '||(rowdata->>'milestone')||' qualifying friends'; destination:='/referral';
 WHEN 'internal_transfers' THEN recipient:=(rowdata->>'sender_user_id')::uuid; recipient2:=(rowdata->>'recipient_user_id')::uuid; heading:='USDT transfer sent'; body:=(rowdata->>'amount')||' USDT transferred'; destination:='/p2p';
 ELSE RETURN NEW;
 END CASE;
 IF recipient IS NOT NULL THEN PERFORM public.record_action_notification(recipient,key||':'||recipient,heading,body,destination); END IF;
 IF recipient2 IS NOT NULL AND recipient2 IS DISTINCT FROM recipient THEN PERFORM public.record_action_notification(recipient2,key||':'||recipient2,CASE WHEN TG_TABLE_NAME='internal_transfers' THEN 'USDT transfer received' ELSE heading END,body,destination); END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER notify_deposit AFTER INSERT OR UPDATE ON public.deposits FOR EACH ROW EXECUTE FUNCTION public.notify_financial_action();
CREATE TRIGGER notify_withdrawal AFTER INSERT OR UPDATE ON public.withdrawals FOR EACH ROW EXECUTE FUNCTION public.notify_financial_action();
CREATE TRIGGER notify_investment AFTER INSERT OR UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.notify_financial_action();
CREATE TRIGGER notify_p2p_order AFTER INSERT OR UPDATE ON public.p2p_orders FOR EACH ROW EXECUTE FUNCTION public.notify_financial_action();
CREATE TRIGGER notify_p2p_dispute AFTER INSERT OR UPDATE ON public.p2p_disputes FOR EACH ROW EXECUTE FUNCTION public.notify_financial_action();
CREATE TRIGGER notify_daily_earning AFTER INSERT ON public.daily_earnings FOR EACH ROW EXECUTE FUNCTION public.notify_financial_action();
CREATE TRIGGER notify_referral_commission AFTER INSERT ON public.referral_commissions FOR EACH ROW EXECUTE FUNCTION public.notify_financial_action();
CREATE TRIGGER notify_referral_reward AFTER INSERT ON public.referral_rewards FOR EACH ROW EXECUTE FUNCTION public.notify_financial_action();
CREATE TRIGGER notify_internal_transfer AFTER INSERT ON public.internal_transfers FOR EACH ROW EXECUTE FUNCTION public.notify_financial_action();
CREATE FUNCTION public.notify_profile_action() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF TG_OP='INSERT' THEN PERFORM public.record_action_notification(NEW.user_id,'account-created:'||NEW.user_id,'Welcome to Cryptiva','Your account has been created.','/dashboard?tab=profile');
 ELSIF NEW.full_name IS DISTINCT FROM OLD.full_name OR NEW.email IS DISTINCT FROM OLD.email OR NEW.preferred_currency IS DISTINCT FROM OLD.preferred_currency THEN PERFORM public.record_action_notification(NEW.user_id,'profile:'||gen_random_uuid(),'Profile updated','Your account details have been updated.','/dashboard?tab=profile'); END IF; RETURN NEW; END $$;
CREATE TRIGGER notify_profile_action AFTER INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.notify_profile_action();
CREATE FUNCTION public.notify_own_account_action(action text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
 IF action NOT IN ('signed_in','password_updated') THEN RAISE EXCEPTION 'Invalid account action'; END IF;
 PERFORM public.record_action_notification(auth.uid(),'account:'||gen_random_uuid(),CASE action WHEN 'signed_in' THEN 'New sign-in' ELSE 'Password updated' END,CASE action WHEN 'signed_in' THEN 'You signed in to your Cryptiva account.' ELSE 'Your Cryptiva password was changed.' END,'/dashboard?tab=profile'); END $$;
REVOKE ALL ON FUNCTION public.notify_own_account_action(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.notify_own_account_action(text) TO authenticated;
