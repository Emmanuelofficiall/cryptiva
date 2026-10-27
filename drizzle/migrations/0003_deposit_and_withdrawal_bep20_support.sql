CREATE OR REPLACE FUNCTION public.validate_deposit_proof() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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
