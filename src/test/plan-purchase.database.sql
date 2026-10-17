-- Authenticated purchase verification; all financial effects are rolled back.
DO $$
DECLARE buyer uuid; balance_before numeric; purchased uuid;
BEGIN
  BEGIN
    SELECT user_id INTO buyer FROM public.profiles ORDER BY created_at LIMIT 1;
    SELECT coalesce(wallet_balance,0) INTO balance_before FROM public.profiles WHERE user_id=buyer;
    IF balance_before<60 THEN RAISE EXCEPTION 'Test account requires 60 USDT'; END IF;
    PERFORM set_config('request.jwt.claim.sub',buyer::text,true);
    purchased := public.purchase_plan('Solana');
    IF NOT EXISTS(SELECT 1 FROM public.investments WHERE id=purchased AND user_id=buyer AND plan_name='Solana' AND amount=60 AND duration_days=90 AND status='active') THEN RAISE EXCEPTION 'Solana purchase must persist correct plan'; END IF;
    IF (SELECT wallet_balance FROM public.profiles WHERE user_id=buyer)<>balance_before-60 THEN RAISE EXCEPTION 'Solana must deduct exactly 60 USDT'; END IF;
    RAISE EXCEPTION USING ERRCODE='ZX001', MESSAGE='Purchase verified; rolling back';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN
    RAISE NOTICE 'PASS: authenticated Solana purchase recorded and wallet debited by 60; rolled back';
  END;
END;
$$;