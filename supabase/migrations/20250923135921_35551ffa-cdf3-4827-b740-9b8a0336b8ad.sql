-- Create video testimonials storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('video-testimonials', 'video-testimonials', true);

-- Create storage policies for video testimonials
CREATE POLICY "Video testimonials are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'video-testimonials');

CREATE POLICY "Users can upload their own video testimonials" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'video-testimonials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own video testimonials" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'video-testimonials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own video testimonials" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'video-testimonials' AND auth.uid()::text = (storage.foldername(name))[1]);