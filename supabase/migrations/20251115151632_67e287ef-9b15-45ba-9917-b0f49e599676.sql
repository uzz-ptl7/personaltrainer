-- First, drop the existing check constraint and recreate with new types
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_type_check;
ALTER TABLE public.services ADD CONSTRAINT services_type_check 
  CHECK (type IN ('consultation', 'session', 'program', 'recurring', 'one-time', 'downloadable'));

-- Create resources table for PDFs and videos
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'video')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create junction table for service-resource relationships
CREATE TABLE IF NOT EXISTS public.service_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(service_id, resource_id)
);

-- Add expiration tracking to purchases
ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_resources ENABLE ROW LEVEL SECURITY;

-- RLS policies for resources
DROP POLICY IF EXISTS "Admins can manage all resources" ON public.resources;
CREATE POLICY "Admins can manage all resources"
ON public.resources FOR ALL
USING (is_current_user_admin());

DROP POLICY IF EXISTS "Users can view resources for their active purchases" ON public.resources;
CREATE POLICY "Users can view resources for their active purchases"
ON public.resources FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.purchases p
    JOIN public.service_resources sr ON sr.service_id = p.service_id
    WHERE sr.resource_id = resources.id
    AND p.user_id = auth.uid()
    AND p.payment_status = 'completed'
    AND p.is_active = true
    AND (p.expires_at IS NULL OR p.expires_at > now())
  )
);

-- RLS policies for service_resources
DROP POLICY IF EXISTS "Admins can manage service resources" ON public.service_resources;
CREATE POLICY "Admins can manage service resources"
ON public.service_resources FOR ALL
USING (is_current_user_admin());

DROP POLICY IF EXISTS "Users can view service resources for their purchases" ON public.service_resources;
CREATE POLICY "Users can view service resources for their purchases"
ON public.service_resources FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.service_id = service_resources.service_id
    AND p.user_id = auth.uid()
    AND p.payment_status = 'completed'
    AND p.is_active = true
    AND (p.expires_at IS NULL OR p.expires_at > now())
  )
);

-- Create storage bucket for resources
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resources bucket
DROP POLICY IF EXISTS "Admins can upload resources" ON storage.objects;
CREATE POLICY "Admins can upload resources"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resources' AND (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND is_admin = true
  )
));

DROP POLICY IF EXISTS "Admins can update resources" ON storage.objects;
CREATE POLICY "Admins can update resources"
ON storage.objects FOR UPDATE
USING (bucket_id = 'resources' AND (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND is_admin = true
  )
));

DROP POLICY IF EXISTS "Admins can delete resources" ON storage.objects;
CREATE POLICY "Admins can delete resources"
ON storage.objects FOR DELETE
USING (bucket_id = 'resources' AND (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND is_admin = true
  )
));

DROP POLICY IF EXISTS "Users can view resources" ON storage.objects;
CREATE POLICY "Users can view resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');

-- Trigger to update updated_at on resources
DROP TRIGGER IF EXISTS update_resources_updated_at ON public.resources;
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the new default plans
INSERT INTO public.services (title, type, price, duration_weeks, description, includes_meet, includes_nutrition, includes_workout, is_active)
VALUES 
  ('90-Day Customized Program', 'recurring', 250, 12, 'Personalized 90-day program with customized PDFs and optional video demonstrations. Billed monthly for 3 months.', true, true, true, true),
  ('One-Time Diet Plan', 'one-time', 25, 0, 'Customized diet plan delivered as a PDF with optional video guidance.', false, true, false, true),
  ('One-Time Workout Plan', 'one-time', 49.99, 0, 'Customized workout plan delivered as a PDF with optional video demonstrations.', false, false, true, true),
  ('Ultimate Weight Loss Diet Plan', 'downloadable', 29.99, 0, 'Pre-made comprehensive diet plan PDF designed for effective weight loss. Includes meal plans, shopping lists, and nutrition tips.', false, true, false, true),
  ('30-Day Strength Builder', 'downloadable', 39.99, 0, 'Pre-made 30-day strength training program PDF with progressive workouts and exercise demonstrations.', false, false, true, true)
ON CONFLICT DO NOTHING;