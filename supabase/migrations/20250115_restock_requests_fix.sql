-- ============================================================
-- Fix Restock Requests RLS Policies (Drop & Recreate)
-- ============================================================

-- Step 1: Drop ALL existing policies first
DROP POLICY IF EXISTS "Allow public to create restock requests" ON public.restock_requests;
DROP POLICY IF EXISTS "Users can view own restock requests" ON public.restock_requests;
DROP POLICY IF EXISTS "Authenticated users can view all restock requests" ON public.restock_requests;
DROP POLICY IF EXISTS "Authenticated users can update restock requests" ON public.restock_requests;
DROP POLICY IF EXISTS "Authenticated users can delete restock requests" ON public.restock_requests;
DROP POLICY IF EXISTS "Only admin can view restock requests" ON public.restock_requests;
DROP POLICY IF EXISTS "Only admin can update restock requests" ON public.restock_requests;
DROP POLICY IF EXISTS "Only admin can delete restock requests" ON public.restock_requests;
DROP POLICY IF EXISTS "System can manage restock" ON public.restock_requests;

-- Step 2: Ensure RLS is enabled
ALTER TABLE IF EXISTS public.restock_requests ENABLE ROW LEVEL SECURITY;

-- Step 3: Create NEW policies (working version)

-- Allow anyone (even without login) to create restock requests
CREATE POLICY "Allow public to create restock requests"
ON public.restock_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to SELECT (needed for the aggregation function)
CREATE POLICY "Allow public to view restock requests"
ON public.restock_requests
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to UPDATE (for marking as notified)
CREATE POLICY "Allow public to update restock requests"
ON public.restock_requests
FOR UPDATE
TO anon, authenticated
USING (true);

-- Step 4: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restock_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restock_requests TO authenticated;
GRANT ALL ON public.restock_requests TO service_role;

-- Step 5: Ensure table and columns exist
DO $$
BEGIN
    -- Check if table exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restock_requests' AND table_schema = 'public') THEN
        CREATE TABLE public.restock_requests (
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
            CONSTRAINT check_contact_method CHECK (
                customer_email IS NOT NULL OR customer_phone IS NOT NULL
            )
        );
    END IF;
END $$;

-- Step 6: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_restock_requests_product_id ON public.restock_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_restock_requests_status ON public.restock_requests(status);
CREATE INDEX IF NOT EXISTS idx_restock_requests_created_at ON public.restock_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_restock_requests_pending ON public.restock_requests(product_id, status) WHERE status = 'pending';

-- Step 7: Create trigger function for updated_at if not exists
CREATE OR REPLACE FUNCTION public.update_restock_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger
DROP TRIGGER IF EXISTS update_restock_request_timestamp ON public.restock_requests;
CREATE TRIGGER update_restock_request_timestamp
    BEFORE UPDATE ON public.restock_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_restock_request_timestamp();

-- ============================================================
-- Done! Now public users can create restock requests
-- ============================================================
