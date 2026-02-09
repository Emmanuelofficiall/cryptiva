
-- Add separate buy and sell price columns
ALTER TABLE public.p2p_settings ADD COLUMN buy_price numeric NOT NULL DEFAULT 0;
ALTER TABLE public.p2p_settings ADD COLUMN sell_price numeric NOT NULL DEFAULT 0;

-- Initialize buy/sell from existing usdt_price
UPDATE public.p2p_settings SET buy_price = usdt_price, sell_price = usdt_price;
