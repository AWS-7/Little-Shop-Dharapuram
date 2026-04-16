-- ============================================================
-- Referral & Loyalty Program - Database Schema
-- ============================================================

-- 1. Create profiles table if it doesn't exist (for user profile data)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    referral_code VARCHAR(20) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy for profiles (users can view/edit own profile)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow inserts during signup
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT SELECT, UPDATE, INSERT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- 2. Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    reward_claimed BOOLEAN DEFAULT FALSE,
    reward_coupon_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(referred_user_id) -- One user can only be referred once
);

-- Create indexes for referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- 3. Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'referral_reward', 'promotional', 'first_order')),
    discount_amount INTEGER, -- Fixed amount discount (e.g., 100 for ₹100 off)
    discount_percent INTEGER, -- Percentage discount (if applicable)
    min_order_amount INTEGER DEFAULT 0,
    max_discount INTEGER,
    description TEXT,
    is_used BOOLEAN DEFAULT FALSE,
    usage_limit INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for coupons
CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON public.coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_used ON public.coupons(is_used);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON public.coupons(valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_type ON public.coupons(type);

-- 4. Enable Row Level Security
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for referrals
-- Users can view their own referrals (as referrer or referred)
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- Only system can insert/update referrals (via functions)
DROP POLICY IF EXISTS "System can manage referrals" ON public.referrals;
CREATE POLICY "System can manage referrals"
ON public.referrals
FOR ALL
USING (auth.role() = 'service_role');

-- 6. Create RLS Policies for coupons
-- Users can view their own coupons
DROP POLICY IF EXISTS "Users can view own coupons" ON public.coupons;
CREATE POLICY "Users can view own coupons"
ON public.coupons
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own coupons (mark as used)
DROP POLICY IF EXISTS "Users can update own coupons" ON public.coupons;
CREATE POLICY "Users can update own coupons"
ON public.coupons
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Only system can insert coupons
DROP POLICY IF EXISTS "System can insert coupons" ON public.coupons;
CREATE POLICY "System can insert coupons"
ON public.coupons
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- 7. Create function to automatically generate referral code on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_code VARCHAR(20);
    code_exists BOOLEAN;
BEGIN
    -- Generate unique referral code
    LOOP
        new_code := 'LS' || UPPER(SUBSTRING(NEW.id::text, 1, 4)) || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 4));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    -- Update profile with referral code
    UPDATE public.profiles 
    SET referral_code = new_code
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for coupons updated_at
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Grant permissions
GRANT ALL ON public.referrals TO service_role;
GRANT ALL ON public.coupons TO service_role;
GRANT SELECT ON public.referrals TO authenticated;
GRANT SELECT, UPDATE ON public.coupons TO authenticated;

-- ============================================================
-- Setup Complete!
-- ============================================================
-- 
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. For existing users, run this to generate referral codes:
--    UPDATE public.profiles 
--    SET referral_code = 'LS' || UPPER(SUBSTRING(id::text, 1, 4)) || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 4))
--    WHERE referral_code IS NULL;
--
-- 3. Test the referral flow:
--    - Create a new user with a referral code
--    - Verify referral is recorded
--    - Complete an order as referred user
--    - Verify referrer gets ₹100 coupon
--
-- ============================================================
