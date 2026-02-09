
-- Merchants table: admin grants merchant role to users
CREATE TABLE public.merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active merchants" ON public.merchants FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage merchants" ON public.merchants FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- P2P settings: admin sets USDT price per currency
CREATE TABLE public.p2p_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL UNIQUE,
  usdt_price numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.p2p_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view p2p settings" ON public.p2p_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage p2p settings" ON public.p2p_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default currencies
INSERT INTO public.p2p_settings (currency, usdt_price) VALUES
  ('RWF', 1349),
  ('USD', 1),
  ('EUR', 0.92),
  ('GBP', 0.79),
  ('KES', 129),
  ('UGX', 3750),
  ('NGN', 1550),
  ('GHS', 15.5),
  ('ZAR', 18.5),
  ('TZS', 2650);

-- Payment methods for users (buyers/sellers)
CREATE TABLE public.user_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_name text NOT NULL,
  account_name text NOT NULL,
  account_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods" ON public.user_payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payment methods" ON public.user_payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own payment methods" ON public.user_payment_methods FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Merchants payment methods visible" ON public.user_payment_methods FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.merchants WHERE merchants.user_id = user_payment_methods.user_id AND merchants.is_active = true)
);

-- Add currency column to p2p_orders
ALTER TABLE public.p2p_orders ADD COLUMN IF NOT EXISTS local_currency text NOT NULL DEFAULT 'RWF';

-- Enable realtime for merchants and p2p_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.merchants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.p2p_settings;
