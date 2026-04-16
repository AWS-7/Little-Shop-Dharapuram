-- ============================================================
-- Notify Me / Restock Requests Feature
-- ============================================================

-- Create restock_requests table
CREATE TABLE IF NOT EXISTS public.restock_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    customer_name TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'converted', 'expired')),
    notification_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure at least one contact method is provided
    CONSTRAINT check_contact_method CHECK (
        customer_email IS NOT NULL OR customer_phone IS NOT NULL
    )
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_restock_requests_product_id ON public.restock_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_restock_requests_status ON public.restock_requests(status);
CREATE INDEX IF NOT EXISTS idx_restock_requests_created_at ON public.restock_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_restock_requests_pending ON public.restock_requests(product_id, status) WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE public.restock_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone (even without auth) to create restock requests
CREATE POLICY "Allow public to create restock requests"
ON public.restock_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to view their own requests (by matching email/phone)
CREATE POLICY "Users can view own restock requests"
ON public.restock_requests
FOR SELECT
TO authenticated
USING (
    -- User can see if they match email or phone
    customer_email = auth.jwt() ->> 'email'
    OR customer_phone = auth.jwt() ->> 'phone'
);

-- Allow all authenticated users to view all requests (for admin dashboard)
-- In production, restrict this to admin role only
CREATE POLICY "Authenticated users can view all restock requests"
ON public.restock_requests
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update requests (for marking as notified)
CREATE POLICY "Authenticated users can update restock requests"
ON public.restock_requests
FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to delete requests
CREATE POLICY "Authenticated users can delete restock requests"
ON public.restock_requests
FOR DELETE
TO authenticated
USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restock_requests TO anon, authenticated;
GRANT ALL ON public.restock_requests TO service_role;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_restock_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_restock_request_timestamp ON public.restock_requests;
CREATE TRIGGER update_restock_request_timestamp
    BEFORE UPDATE ON public.restock_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_restock_request_timestamp();

-- ============================================================
-- Admin View: Aggregated Restock Requests by Product
-- ============================================================
-- 
-- Get most requested out-of-stock products:
-- 
-- SELECT 
--     product_id,
--     product_name,
--     COUNT(*) as request_count,
--     COUNT(CASE WHEN customer_email IS NOT NULL THEN 1 END) as email_requests,
--     COUNT(CASE WHEN customer_phone IS NOT NULL THEN 1 END) as phone_requests,
--     MAX(created_at) as last_request_date
-- FROM public.restock_requests
-- WHERE status = 'pending'
-- GROUP BY product_id, product_name
-- ORDER BY request_count DESC;
--
-- ============================================================
