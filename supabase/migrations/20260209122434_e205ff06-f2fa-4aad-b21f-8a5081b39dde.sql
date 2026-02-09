
-- Create a security definer function to handle referral commissions server-side
-- This bypasses RLS since users can't insert into referral_commissions or update other users' profiles
CREATE OR REPLACE FUNCTION public.process_referral_commission(
  _investor_id uuid,
  _invest_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _my_referred_by uuid;
  _referrer_record RECORD;
  _lvlb_record RECORD;
  _lvlc_record RECORD;
  _comm numeric;
BEGIN
  -- Get investor's referred_by
  SELECT referred_by INTO _my_referred_by FROM profiles WHERE user_id = _investor_id;
  IF _my_referred_by IS NULL THEN RETURN; END IF;

  -- Level A: Direct referrer (5%)
  SELECT id, user_id, referred_by, wallet_balance INTO _referrer_record FROM profiles WHERE id = _my_referred_by;
  IF _referrer_record IS NULL THEN RETURN; END IF;
  
  _comm := _invest_amount * 0.05;
  INSERT INTO referral_commissions (user_id, from_user_id, level, rate, amount)
  VALUES (_referrer_record.user_id, _investor_id, 'A', 5, _comm);
  UPDATE profiles SET wallet_balance = COALESCE(wallet_balance, 0) + _comm WHERE id = _referrer_record.id;

  -- Level B: Referrer's referrer (3%)
  IF _referrer_record.referred_by IS NULL THEN RETURN; END IF;
  SELECT id, user_id, referred_by, wallet_balance INTO _lvlb_record FROM profiles WHERE id = _referrer_record.referred_by;
  IF _lvlb_record IS NULL THEN RETURN; END IF;

  _comm := _invest_amount * 0.03;
  INSERT INTO referral_commissions (user_id, from_user_id, level, rate, amount)
  VALUES (_lvlb_record.user_id, _investor_id, 'B', 3, _comm);
  UPDATE profiles SET wallet_balance = COALESCE(wallet_balance, 0) + _comm WHERE id = _lvlb_record.id;

  -- Level C: 3rd tier (1%)
  IF _lvlb_record.referred_by IS NULL THEN RETURN; END IF;
  SELECT id, user_id, wallet_balance INTO _lvlc_record FROM profiles WHERE id = _lvlb_record.referred_by;
  IF _lvlc_record IS NULL THEN RETURN; END IF;

  _comm := _invest_amount * 0.01;
  INSERT INTO referral_commissions (user_id, from_user_id, level, rate, amount)
  VALUES (_lvlc_record.user_id, _investor_id, 'C', 1, _comm);
  UPDATE profiles SET wallet_balance = COALESCE(wallet_balance, 0) + _comm WHERE id = _lvlc_record.id;
END;
$$;
