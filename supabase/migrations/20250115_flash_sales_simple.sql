-- ============================================================
-- Flash Sale Table - Simple Setup
-- ============================================================

-- Create the table
CREATE TABLE IF NOT EXISTS public.flash_sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active BOOLEAN DEFAULT FALSE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    original_price INTEGER NOT NULL,
    discounted_price INTEGER NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    banner_text TEXT DEFAULT 'Flash Sale! Limited Time Offer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public to view flash sales" ON public.flash_sales;
DROP POLICY IF EXISTS "Allow public to manage flash sales" ON public.flash_sales;
DROP POLICY IF EXISTS "Allow all operations" ON public.flash_sales;

-- Create simple policy - allow all operations for now
CREATE POLICY "Allow all operations"
ON public.flash_sales
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flash_sales TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flash_sales TO authenticated;
GRANT ALL ON public.flash_sales TO service_role;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_flash_sale_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_flash_sale_timestamp ON public.flash_sales;
CREATE TRIGGER update_flash_sale_timestamp
    BEFORE UPDATE ON public.flash_sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_flash_sale_timestamp();

-- ============================================================
-- Done! Flash sale table is ready.
-- ============================================================
