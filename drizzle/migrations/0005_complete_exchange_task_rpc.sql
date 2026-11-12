CREATE OR REPLACE FUNCTION public.complete_exchange_task(_investment_id uuid, _pair text, _action text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _inv record;
  _task_id uuid;
  _today date := (now() AT TIME ZONE 'UTC')::date;
  _reward numeric;
  _daily numeric;
  _done int;
  _desc text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF _action NOT IN ('buy','sell') THEN RAISE EXCEPTION 'Invalid action'; END IF;
  IF _pair NOT IN ('BTC/USDT','ETH/USDT','BNB/USDT','SOL/USDT','XRP/USDT') THEN RAISE EXCEPTION 'Invalid pair'; END IF;

  SELECT * INTO _inv FROM investments WHERE id = _investment_id AND user_id = _uid AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active plan not found'; END IF;

  IF EXISTS (SELECT 1 FROM user_tasks WHERE user_id = _uid AND task_type = 'exchange' AND title = _pair
      AND description LIKE '%(inv:' || _investment_id || ')%' AND status = 'completed'
      AND (completed_at AT TIME ZONE 'UTC')::date = _today) THEN
    RAISE EXCEPTION 'This trade is already done today';
  END IF;

  _daily := round(_inv.amount * _inv.daily_rate / 100, 4);
  _reward := round(_daily / 5, 4);
  _desc := upper(_action) || ' ' || _pair || ' for ' || _inv.plan_name || ' (inv:' || _investment_id || ')';

  SELECT id INTO _task_id FROM user_tasks WHERE user_id = _uid AND task_type = 'exchange' AND title = _pair
    AND description LIKE '%(inv:' || _investment_id || ')%' ORDER BY created_at LIMIT 1;
  IF _task_id IS NULL THEN
    INSERT INTO user_tasks(user_id, title, description, reward, task_type, status, completed_at)
    VALUES (_uid, _pair, _desc, _reward, 'exchange', 'completed', now());
  ELSE
    UPDATE user_tasks SET status = 'completed', completed_at = now(), reward = _reward, description = _desc WHERE id = _task_id;
  END IF;

  UPDATE profiles SET wallet_balance = coalesce(wallet_balance, 0) + _reward WHERE user_id = _uid;

  SELECT count(DISTINCT title) INTO _done FROM user_tasks WHERE user_id = _uid AND task_type = 'exchange'
    AND description LIKE '%(inv:' || _investment_id || ')%' AND status = 'completed'
    AND (completed_at AT TIME ZONE 'UTC')::date = _today;

  IF _done >= 5 AND NOT EXISTS (SELECT 1 FROM daily_earnings WHERE investment_id = _investment_id AND earned_date = _today) THEN
    INSERT INTO daily_earnings(user_id, investment_id, amount, earned_date) VALUES (_uid, _investment_id, _daily, _today);
    UPDATE investments SET total_earned = coalesce(total_earned, 0) + _daily WHERE id = _investment_id;
  END IF;

  RETURN jsonb_build_object('reward', _reward, 'completed', _done, 'plan_finished', _done >= 5, 'daily_income', _daily);
END $$;
REVOKE ALL ON FUNCTION public.complete_exchange_task(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.complete_exchange_task(uuid, text, text) TO authenticated;