
-- Create P2P trading orders table
CREATE TABLE public.p2p_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('buy', 'sell')),
  amount NUMERIC NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  payment_method TEXT NOT NULL,
  payment_details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  matched_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.p2p_orders ENABLE ROW LEVEL SECURITY;

-- Everyone can view open orders
CREATE POLICY "Anyone can view open P2P orders"
ON public.p2p_orders FOR SELECT
USING (status = 'open' OR user_id = auth.uid() OR matched_user_id = auth.uid());

-- Users can create their own orders
CREATE POLICY "Users can create P2P orders"
ON public.p2p_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders or matched orders
CREATE POLICY "Users can update relevant P2P orders"
ON public.p2p_orders FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

-- Users can delete their own open orders
CREATE POLICY "Users can cancel own open orders"
ON public.p2p_orders FOR DELETE
USING (auth.uid() = user_id AND status = 'open');

-- Trigger for updated_at
CREATE TRIGGER update_p2p_orders_updated_at
BEFORE UPDATE ON public.p2p_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.p2p_orders;
