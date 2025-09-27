-- Create storage bucket for video testimonials
INSERT INTO storage.buckets (id, name, public) VALUES ('video-testimonials', 'video-testimonials', true);

-- Create RLS policies for video testimonials storage
CREATE POLICY "Anyone can view video testimonials" ON storage.objects
FOR SELECT USING (bucket_id = 'video-testimonials');

CREATE POLICY "Authenticated users can upload video testimonials" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'video-testimonials' AND 
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own video testimonials" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'video-testimonials' AND 
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own video testimonials" ON storage.objects
FOR DELETE USING (
  bucket_id = 'video-testimonials' AND 
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);