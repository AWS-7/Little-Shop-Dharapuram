-- Fix Flash Sale Table Issues
-- Run this in Supabase SQL Editor

-- 1. Create flash_sales table if not exists
CREATE TABLE IF NOT EXISTS flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT,
  product_name TEXT NOT NULL,
  product_image TEXT,  -- Product image URL
  original_price NUMERIC NOT NULL,
  discounted_price NUMERIC NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  banner_text TEXT DEFAULT 'Flash Sale! Limited Time Offer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Add product_image column if table already exists but column missing
ALTER TABLE flash_sales ADD COLUMN IF NOT EXISTS product_image TEXT;

-- 2. Enable RLS
ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies
DROP POLICY IF EXISTS "Allow public read flash sales" ON flash_sales;
DROP POLICY IF EXISTS "Allow admin manage flash sales" ON flash_sales;

-- 4. Create policies
CREATE POLICY "Allow public read flash sales"
ON flash_sales FOR SELECT TO PUBLIC USING (is_active = true);

CREATE POLICY "Allow admin manage flash sales"
ON flash_sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Verify table exists and has data
SELECT * FROM flash_sales WHERE is_active = true;

-- 6. Sample insert with image (optional test)
-- INSERT INTO flash_sales (product_id, product_name, product_image, original_price, discounted_price, end_time, is_active)
-- VALUES ('test-123', 'Test Product', 'https://placehold.co/600x600/f3f4f6/9ca3af?text=Flash+Sale', 1000, 599, NOW() + INTERVAL '24 hours', true);
