-- ============================================================
-- Fix Carts Table - Ensure proper constraints
-- ============================================================

-- 1. Create carts table if it doesn't exist with proper constraints
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'converted', 'abandoned')),
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure user_id has UNIQUE constraint for ON CONFLICT to work
DO $$
BEGIN
    -- Check if unique constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'carts_user_id_key' 
        AND conrelid = 'public.carts'::regclass
    ) THEN
        -- Add unique constraint if it doesn't exist
        ALTER TABLE public.carts ADD CONSTRAINT carts_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);

-- 4. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS carts_updated_at ON carts;
CREATE TRIGGER carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 5. Enable Row Level Security
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
DROP POLICY IF EXISTS "Users can manage own cart" ON carts;
CREATE POLICY "Users can manage own cart"
  ON carts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin cart access" ON carts;
CREATE POLICY "Admin cart access"
  ON carts FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. Add to realtime publication (if not already added)
DO $$
BEGIN
    -- Check if carts is already in the publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'carts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE carts;
    END IF;
EXCEPTION WHEN undefined_object THEN
    -- Publication doesn't exist, skip
    NULL;
END $$;

-- 8. Grant permissions
GRANT ALL ON public.carts TO authenticated;
GRANT ALL ON public.carts TO service_role;
