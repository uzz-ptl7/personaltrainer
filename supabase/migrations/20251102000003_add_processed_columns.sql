-- Add processed column to contacts and one_time_requests

ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE;

ALTER TABLE public.one_time_requests
ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE;

-- Allow admins to update processed flag only
DROP POLICY IF EXISTS "Admins can manage contacts" ON public.contacts;
CREATE POLICY "Admins can manage contacts" ON public.contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "Admins can manage one_time_requests" ON public.one_time_requests;
CREATE POLICY "Admins can manage one_time_requests" ON public.one_time_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Index on processed for quick queries
CREATE INDEX IF NOT EXISTS idx_contacts_processed ON public.contacts(processed);
CREATE INDEX IF NOT EXISTS idx_one_time_requests_processed ON public.one_time_requests(processed);
