-- ============================================================
-- Gift Wrap Feature - Database Schema Update
-- ============================================================

-- Add gift wrap columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS gift_wrap BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gift_wrap_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gift_message TEXT;

-- Create index for gift wrap queries (for admin reporting)
CREATE INDEX IF NOT EXISTS idx_orders_gift_wrap ON public.orders(gift_wrap) WHERE gift_wrap = TRUE;

-- Update RLS policies if needed (orders table already has RLS enabled)
-- No additional policies needed - existing SELECT/INSERT policies cover new columns

-- ============================================================
-- Sample Query for Admin Dashboard (to view gift wrap orders)
-- ============================================================
-- 
-- Get all gift wrap orders:
-- SELECT order_id, customer->>'name' as customer_name, gift_wrap, gift_wrap_amount, gift_message 
-- FROM public.orders 
-- WHERE gift_wrap = TRUE;
--
-- Get gift wrap revenue summary:
-- SELECT COUNT(*) as gift_wrap_orders, SUM(gift_wrap_amount) as total_gift_wrap_revenue
-- FROM public.orders 
-- WHERE gift_wrap = TRUE;
--
-- ============================================================
