ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Anyone can read generations" ON public.generations;
DROP POLICY IF EXISTS "Anyone can create generations" ON public.generations;
DROP POLICY IF EXISTS "Anyone can update generations" ON public.generations;
DROP POLICY IF EXISTS "Anyone can delete generations" ON public.generations;

REVOKE ALL ON public.generations FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generations TO authenticated;
GRANT ALL ON public.generations TO service_role;

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own generations" ON public.generations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own generations" ON public.generations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own generations" ON public.generations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own generations" ON public.generations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);