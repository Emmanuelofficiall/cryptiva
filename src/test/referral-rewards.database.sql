-- Run through the database data tool. All fixtures and wallet changes roll back.
DO $$
DECLARE inviter uuid; invitee uuid; inviter_profile uuid; before_balance numeric; total integer;
BEGIN
  BEGIN
    SELECT user_id,id INTO inviter,inviter_profile FROM public.profiles ORDER BY created_at LIMIT 1;
    SELECT user_id INTO invitee FROM public.profiles WHERE user_id<>inviter ORDER BY created_at LIMIT 1;
    IF invitee IS NULL THEN RAISE EXCEPTION 'Two existing users are required'; END IF;
    SELECT coalesce(wallet_balance,0) INTO before_balance FROM public.profiles WHERE user_id=inviter;
    UPDATE public.profiles SET referred_by=inviter_profile WHERE user_id=invitee;
    INSERT INTO public.investments(user_id,plan_name,amount,daily_rate,duration_days,status) VALUES(invitee,'Ethereum',30,100.0/30,90,'active');
    IF EXISTS(SELECT 1 FROM public.referral_qualifications WHERE referred_user_id=invitee) THEN RAISE EXCEPTION '$30 plan must not qualify'; END IF;
    INSERT INTO public.investments(user_id,plan_name,amount,daily_rate,duration_days,status) VALUES(invitee,'Solana',60,100.0/30,90,'active');
    IF NOT EXISTS(SELECT 1 FROM public.referral_qualifications WHERE referred_user_id=invitee AND referrer_user_id=inviter) THEN RAISE EXCEPTION '$60 Solana must qualify'; END IF;
    INSERT INTO public.investments(user_id,plan_name,amount,daily_rate,duration_days,status) VALUES(invitee,'Cardano',120,100.0/30,90,'active');
    SELECT count(*) INTO total FROM public.referral_qualifications WHERE referred_user_id=invitee;
    IF total<>1 THEN RAISE EXCEPTION 'Repeat purchase must count only once'; END IF;
    INSERT INTO public.referral_qualifications(referred_user_id,referrer_user_id) SELECT gen_random_uuid(),inviter FROM generate_series(1,13);
    IF EXISTS(SELECT 1 FROM public.referral_rewards WHERE user_id=inviter) THEN RAISE EXCEPTION '14 users must not earn reward'; END IF;
    INSERT INTO public.referral_qualifications(referred_user_id,referrer_user_id) VALUES(gen_random_uuid(),inviter);
    IF (SELECT wallet_balance FROM public.profiles WHERE user_id=inviter)<>before_balance+100 THEN RAISE EXCEPTION '15 users must credit 100 USDT'; END IF;
    INSERT INTO public.referral_qualifications(referred_user_id,referrer_user_id) SELECT gen_random_uuid(),inviter FROM generate_series(1,15);
    IF (SELECT wallet_balance FROM public.profiles WHERE user_id=inviter)<>before_balance+200 THEN RAISE EXCEPTION '30 users must credit 200 USDT'; END IF;
    IF (SELECT count(*) FROM public.referral_rewards WHERE user_id=inviter)<>2 THEN RAISE EXCEPTION 'Exactly two reward entries required'; END IF;
    RAISE EXCEPTION USING ERRCODE='ZX001', MESSAGE='All referral reward tests passed; rolling back fixtures';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN
    RAISE NOTICE 'PASS: $60 threshold, distinct invitees, 15=$100, 30=$200; fixtures rolled back';
  END;
END;
$$;