-- Create text_testimonials table
CREATE TABLE public.text_testimonials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    role text NOT NULL,
    company text,
    content text NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    website text,
    email text NOT NULL,
    phone text NOT NULL,
    is_approved boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.text_testimonials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for text_testimonials
CREATE POLICY "Everyone can view approved text testimonials" ON public.text_testimonials 
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can view their own text testimonials" ON public.text_testimonials 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own text testimonials" ON public.text_testimonials 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own text testimonials" ON public.text_testimonials 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all text testimonials" ON public.text_testimonials 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_text_testimonials_updated_at 
    BEFORE UPDATE ON public.text_testimonials 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_text_testimonials_is_approved ON public.text_testimonials(is_approved);
CREATE INDEX idx_text_testimonials_user_id ON public.text_testimonials(user_id);
CREATE INDEX idx_text_testimonials_created_at ON public.text_testimonials(created_at);