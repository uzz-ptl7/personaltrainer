-- Create video testimonials table
CREATE TABLE public.video_testimonials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_url text NOT NULL,
  title text NOT NULL,
  description text,
  is_approved boolean DEFAULT false NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.video_testimonials ENABLE ROW LEVEL SECURITY;

-- Create policies for video testimonials
CREATE POLICY "Users can create their own video testimonials" 
ON public.video_testimonials 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own video testimonials" 
ON public.video_testimonials 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all video testimonials" 
ON public.video_testimonials 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Approved testimonials are viewable by everyone" 
ON public.video_testimonials 
FOR SELECT 
USING (is_approved = true);

-- Add trigger for timestamp updates
CREATE TRIGGER update_video_testimonials_updated_at
BEFORE UPDATE ON public.video_testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for video testimonials
ALTER TABLE public.video_testimonials REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_testimonials;