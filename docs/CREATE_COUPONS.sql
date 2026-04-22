-- Create coupons table with RLS policies
-- First, drop existing table if it exists with wrong structure
DROP TABLE IF EXISTS coupons CASCADE;

-- Create fresh table
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  usage_limit INTEGER NOT NULL DEFAULT 100 CHECK (usage_limit > 0),
  used_count INTEGER NOT NULL DEFAULT 0,
  expiry_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read active coupons" ON coupons;
DROP POLICY IF EXISTS "Allow admin full access to coupons" ON coupons;

-- Public can read active coupons (for client-side validation)
CREATE POLICY "Allow public read active coupons"
ON coupons
FOR SELECT
TO PUBLIC
USING (is_active = true);

-- Authenticated users (Admin) can do ALL operations
CREATE POLICY "Allow admin full access to coupons"
ON coupons
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active) WHERE is_active = true;

-- Function to validate and use a coupon (atomic operation)
CREATE OR REPLACE FUNCTION validate_and_use_coupon(coupon_code TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  coupon_id UUID,
  discount_percent INTEGER,
  message TEXT
) AS $$
DECLARE
  coupon_record RECORD;
BEGIN
  -- Get coupon
  SELECT * INTO coupon_record FROM coupons 
  WHERE code = coupon_code AND is_active = true;
  
  -- Check if exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Invalid coupon code'::TEXT;
    RETURN;
  END IF;
  
  -- Check expiry
  IF coupon_record.expiry_date < NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Coupon has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check usage limit
  IF coupon_record.used_count >= coupon_record.usage_limit THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Usage limit reached'::TEXT;
    RETURN;
  END IF;
  
  -- Valid coupon - increment count
  UPDATE coupons 
  SET used_count = used_count + 1, updated_at = NOW()
  WHERE id = coupon_record.id;
  
  RETURN QUERY SELECT true, coupon_record.id, coupon_record.discount_percent, 'Coupon applied successfully'::TEXT;
  
END;
$$ LANGUAGE plpgsql;

-- Sample data (optional)
-- INSERT INTO coupons (code, discount_percent, usage_limit, expiry_date) VALUES
-- ('LITTLE10', 10, 50, NOW() + INTERVAL '30 days'),
-- ('WELCOME20', 20, 100, NOW() + INTERVAL '60 days'),
-- ('SALE50', 50, 20, NOW() + INTERVAL '7 days');
