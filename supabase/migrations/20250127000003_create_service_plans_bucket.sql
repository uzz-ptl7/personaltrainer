-- Create the service-plans storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-plans', 'service-plans', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for service-plans bucket
CREATE POLICY "Authenticated users can upload service plans" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'service-plans' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view service plans" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'service-plans' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own uploaded service plans" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'service-plans' 
    AND auth.role() = 'authenticated'
  );