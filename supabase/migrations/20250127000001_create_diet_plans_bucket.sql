-- Create the diet-plans storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('diet-plans', 'diet-plans', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for diet-plans bucket
CREATE POLICY "Authenticated users can upload diet plans" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'diet-plans' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view diet plans" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'diet-plans' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own uploaded diet plans" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'diet-plans' 
    AND auth.role() = 'authenticated'
  );