CREATE TABLE public.referral_qualifications (
  referred_user_id uuid PRIMARY KEY,
  referrer_user_id uuid NOT NULL,
  investment_id uuid,
  qualified_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_qualifications TO authenticated;
GRANT ALL ON public.referral_qualifications TO service_role;
ALTER TABLE public.referral_qualifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inviters read their qualifying referrals" ON public.referral_qualifications FOR SELECT TO authenticated USING (referrer_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX referral_qualifications_referrer_idx ON public.referral_qualifications(referrer_user_id);

CREATE TABLE public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  milestone integer NOT NULL,
  amount numeric NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone),
  CONSTRAINT referral_reward_milestone CHECK (milestone > 0 AND milestone % 15 = 0),
  CONSTRAINT referral_reward_amount CHECK (amount = 100)
);
GRANT SELECT ON public.referral_rewards TO authenticated;
GRANT ALL ON public.referral_rewards TO service_role;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their referral rewards" ON public.referral_rewards FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.credit_referral_milestone()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE qualified_count integer; threshold integer; credited numeric;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.referrer_user_id::text, 15));
  SELECT count(*) INTO qualified_count FROM public.referral_qualifications WHERE referrer_user_id = NEW.referrer_user_id;
  IF qualified_count < 15 THEN RETURN NEW; END IF;
  FOR threshold IN 1..(qualified_count / 15) LOOP
    credited := NULL;
    INSERT INTO public.referral_rewards(user_id, milestone, amount)
      VALUES (NEW.referrer_user_id, threshold * 15, 100)
      ON CONFLICT (user_id, milestone) DO NOTHING RETURNING amount INTO credited;
    IF credited IS NOT NULL THEN
      UPDATE public.profiles SET wallet_balance = coalesce(wallet_balance, 0) + credited WHERE user_id = NEW.referrer_user_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Inviter wallet not found'; END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.credit_referral_milestone() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER credit_referral_milestone AFTER INSERT ON public.referral_qualifications FOR EACH ROW EXECUTE FUNCTION public.credit_referral_milestone();

CREATE OR REPLACE FUNCTION public.qualify_plan_referral()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inviter uuid;
BEGIN
  IF NEW.amount < 60 OR NEW.status <> 'active' THEN RETURN NEW; END IF;
  SELECT r.user_id INTO inviter FROM public.profiles p JOIN public.profiles r ON r.id = p.referred_by WHERE p.user_id = NEW.user_id;
  IF inviter IS NULL OR inviter = NEW.user_id THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(inviter::text, 15));
  INSERT INTO public.referral_qualifications(referred_user_id, referrer_user_id, investment_id)
    VALUES (NEW.user_id, inviter, NEW.id) ON CONFLICT (referred_user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.qualify_plan_referral() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER qualify_plan_referral AFTER INSERT ON public.investments FOR EACH ROW EXECUTE FUNCTION public.qualify_plan_referral();

INSERT INTO public.referral_qualifications(referred_user_id, referrer_user_id, investment_id)
SELECT DISTINCT ON (i.user_id) i.user_id, r.user_id, i.id
FROM public.investments i JOIN public.profiles p ON p.user_id=i.user_id JOIN public.profiles r ON r.id=p.referred_by
WHERE i.amount >= 60 AND i.status IN ('active','completed') AND i.user_id <> r.user_id
ORDER BY i.user_id, i.created_at;

CREATE OR REPLACE FUNCTION public.purchase_plan(_plan_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE buyer uuid := auth.uid(); price numeric; income numeric; investment_uuid uuid;
BEGIN
  IF buyer IS NULL THEN RAISE EXCEPTION 'Sign in to purchase a plan'; END IF;
  SELECT p.amount, p.daily INTO price, income FROM (VALUES
    ('Bitcoin',15::numeric,0.6::numeric),('Ethereum',30,1),('Solana',60,2),('Cardano',120,4),('BNB',240,8),('Binance USD',480,16),('Litecoin',1000,32)
  ) AS p(name,amount,daily) WHERE p.name=_plan_name;
  IF price IS NULL THEN RAISE EXCEPTION 'Unknown investment plan'; END IF;
  UPDATE public.profiles SET wallet_balance=coalesce(wallet_balance,0)-price
    WHERE user_id=buyer AND coalesce(wallet_balance,0)>=price;
  IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;
  INSERT INTO public.investments(user_id,plan_name,amount,daily_rate,duration_days,expires_at,status)
    VALUES(buyer,_plan_name,price,income/price*100,90,now()+interval '90 days','active') RETURNING id INTO investment_uuid;
  PERFORM public.process_referral_commission(buyer,price);
  RETURN investment_uuid;
END;
$$;
REVOKE ALL ON FUNCTION public.purchase_plan(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_plan(text) TO authenticated, service_role;
REVOKE INSERT ON public.investments FROM authenticated, anon;
REVOKE ALL ON FUNCTION public.process_referral_commission(uuid,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral_commission(uuid,numeric) TO service_role;

CREATE OR REPLACE FUNCTION public.protect_investment_purchase_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.amount IS DISTINCT FROM OLD.amount OR NEW.plan_name IS DISTINCT FROM OLD.plan_name OR NEW.daily_rate IS DISTINCT FROM OLD.daily_rate OR NEW.duration_days IS DISTINCT FROM OLD.duration_days OR NEW.started_at IS DISTINCT FROM OLD.started_at OR NEW.expires_at IS DISTINCT FROM OLD.expires_at) THEN
    RAISE EXCEPTION 'Purchased plan details cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER protect_investment_purchase_fields BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.protect_investment_purchase_fields();

CREATE OR REPLACE FUNCTION public.link_referral(referrer_code text, new_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inviter_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> new_user_id THEN RAISE EXCEPTION 'You may only link your own referral'; END IF;
  SELECT id INTO inviter_id FROM public.profiles WHERE referral_code=referrer_code AND user_id<>new_user_id;
  IF inviter_id IS NULL THEN RETURN; END IF;
  UPDATE public.profiles SET referred_by=inviter_id WHERE user_id=new_user_id AND referred_by IS NULL
    AND NOT EXISTS(SELECT 1 FROM public.investments WHERE user_id=new_user_id);
END;
$$;
REVOKE ALL ON FUNCTION public.link_referral(text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_referral(text,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_referral_attribution()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated','anon') AND NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    RAISE EXCEPTION 'Referral attribution must use the referral link';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER protect_referral_attribution BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_referral_attribution();