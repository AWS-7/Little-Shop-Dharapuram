-- Simple fix for profiles table - run this in Supabase SQL Editor

-- Step 1: Drop and recreate profiles table with all columns
DROP TABLE IF EXISTS public.profiles;

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    referral_code VARCHAR(20) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Step 4: Create index
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- Step 5: Grant permissions
GRANT SELECT, UPDATE, INSERT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Step 6: Create function to auto-generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_code VARCHAR(20);
    code_exists BOOLEAN;
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, full_name, created_at, updated_at)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Generate unique referral code
    LOOP
        new_code := 'LS' || UPPER(SUBSTRING(NEW.id::text, 1, 4)) || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 4));
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

-- Step 7: Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Generate referral codes for existing users
UPDATE public.profiles 
SET referral_code = 'LS' || UPPER(SUBSTRING(id::text, 1, 4)) || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 4))
WHERE referral_code IS NULL;
