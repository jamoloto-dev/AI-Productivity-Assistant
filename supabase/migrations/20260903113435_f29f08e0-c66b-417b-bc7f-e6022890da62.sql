CREATE TABLE public.generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('comms','postmortem','shift')),
  title TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generations TO authenticated;
GRANT ALL ON public.generations TO service_role;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read generations" ON public.generations FOR SELECT USING (true);
CREATE POLICY "Anyone can create generations" ON public.generations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update generations" ON public.generations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete generations" ON public.generations FOR DELETE USING (true);