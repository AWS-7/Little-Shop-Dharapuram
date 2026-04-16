-- ============================================================
-- Dynamic Flash Sale System
-- ============================================================

-- Create flash_sales table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_flash_sales_is_active ON public.flash_sales(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_flash_sales_end_time ON public.flash_sales(end_time);

-- Enable RLS
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

-- Anyone can view active flash sales
CREATE POLICY "Allow public to view active flash sales"
ON public.flash_sales
FOR SELECT
TO anon, authenticated
USING (is_active = TRUE OR auth.role() = 'authenticated');

-- Only authenticated users can manage flash sales (admin)
CREATE POLICY "Allow authenticated to manage flash sales"
ON public.flash_sales
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.flash_sales TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flash_sales TO authenticated;
GRANT ALL ON public.flash_sales TO service_role;

-- Function to auto-deactivate expired flash sales
CREATE OR REPLACE FUNCTION public.check_expired_flash_sales()
RETURNS TRIGGER AS $$
BEGIN
    -- Update any flash sales that have passed their end_time
    UPDATE public.flash_sales
    SET is_active = FALSE,
        updated_at = NOW()
    WHERE end_time < NOW()
    AND is_active = TRUE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check expired sales on any operation
DROP TRIGGER IF EXISTS check_expired_flash_sales_trigger ON public.flash_sales;
CREATE TRIGGER check_expired_flash_sales_trigger
    BEFORE SELECT ON public.flash_sales
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.check_expired_flash_sales();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.update_flash_sale_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_flash_sale_timestamp ON public.flash_sales;
CREATE TRIGGER update_flash_sale_timestamp
    BEFORE UPDATE ON public.flash_sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_flash_sale_timestamp();

-- ============================================================
-- Sample queries for reference:
--
-- Get current active flash sale:
-- SELECT * FROM public.flash_sales WHERE is_active = TRUE LIMIT 1;
--
-- Update flash sale status:
-- UPDATE public.flash_sales SET is_active = TRUE WHERE id = 'uuid';
--
-- Delete old flash sales:
-- DELETE FROM public.flash_sales WHERE end_time < NOW() - INTERVAL '7 days';
--
-- ============================================================
