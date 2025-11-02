-- Create one_time_requests table for custom one-time plan requests
CREATE TABLE public.one_time_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  goal TEXT,
  fitness_level TEXT,
  allergies TEXT,
  notes TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.one_time_requests ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (so buyers can submit intake without auth)
CREATE POLICY "Allow public inserts to one_time_requests" ON public.one_time_requests FOR INSERT WITH CHECK (true);

-- Allow admins to manage one_time_requests
CREATE POLICY "Admins can manage one_time_requests" ON public.one_time_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Indexes
CREATE INDEX idx_one_time_requests_email ON public.one_time_requests(email);
CREATE INDEX idx_one_time_requests_created_at ON public.one_time_requests(created_at);
