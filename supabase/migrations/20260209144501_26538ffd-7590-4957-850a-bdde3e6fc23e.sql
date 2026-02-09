
-- Drop old status check constraint and add updated one with all statuses
ALTER TABLE public.p2p_orders DROP CONSTRAINT p2p_orders_status_check;
ALTER TABLE public.p2p_orders ADD CONSTRAINT p2p_orders_status_check 
  CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'pending_payment'::text, 'payment_sent'::text, 'disputed'::text]));
