
-- Create disputes table for P2P trade dispute resolution
CREATE TABLE public.p2p_disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.p2p_orders(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID
);

-- Enable RLS
ALTER TABLE public.p2p_disputes ENABLE ROW LEVEL SECURITY;

-- Users can create disputes for their own orders
CREATE POLICY "Users can create disputes for their orders"
ON public.p2p_disputes
FOR INSERT
WITH CHECK (
  auth.uid() = reporter_user_id AND
  EXISTS (
    SELECT 1 FROM public.p2p_orders
    WHERE p2p_orders.id = order_id
    AND (p2p_orders.user_id = auth.uid() OR p2p_orders.matched_user_id = auth.uid())
  )
);

-- Users can view disputes on their orders
CREATE POLICY "Users can view own disputes"
ON public.p2p_disputes
FOR SELECT
USING (
  reporter_user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.p2p_orders
    WHERE p2p_orders.id = order_id
    AND (p2p_orders.user_id = auth.uid() OR p2p_orders.matched_user_id = auth.uid())
  )
);

-- Admins can manage all disputes
CREATE POLICY "Admins can manage all disputes"
ON public.p2p_disputes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create internal transfers table for merchants
CREATE TABLE public.internal_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_user_id UUID NOT NULL,
  recipient_user_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.internal_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transfers"
ON public.internal_transfers
FOR SELECT
USING (auth.uid() = sender_user_id OR auth.uid() = recipient_user_id);

CREATE POLICY "Merchants can create transfers"
ON public.internal_transfers
FOR INSERT
WITH CHECK (
  auth.uid() = sender_user_id AND
  EXISTS (
    SELECT 1 FROM public.merchants WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Admins can view all transfers
CREATE POLICY "Admins can view all transfers"
ON public.internal_transfers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
