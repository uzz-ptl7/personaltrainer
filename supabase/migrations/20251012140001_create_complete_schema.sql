-- Base schema migration - create all initial tables
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  phone_country_code TEXT DEFAULT '+250',
  country TEXT DEFAULT 'Rwanda',
  is_admin BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('program', 'consultation', 'session')),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_weeks INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 60,
  includes_nutrition BOOLEAN DEFAULT FALSE,
  includes_workout BOOLEAN DEFAULT FALSE,
  includes_meet BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  meet_link TEXT,
  meet_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_testimonials table
CREATE TABLE public.video_testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create newsletter_subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create fitness_assessments table
CREATE TABLE public.fitness_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2) NOT NULL,
  bmi DECIMAL(4,2) NOT NULL,
  body_fat_percentage DECIMAL(4,2) NOT NULL,
  heart_rate_bpm INTEGER NOT NULL,
  muscle_mass_kg DECIMAL(5,2) NOT NULL,
  bmr_kcal INTEGER NOT NULL,
  water_percentage DECIMAL(4,2) NOT NULL,
  body_fat_mass_kg DECIMAL(5,2) NOT NULL,
  lean_body_mass_kg DECIMAL(5,2) NOT NULL,
  bone_mass_kg DECIMAL(4,2) NOT NULL,
  visceral_fat INTEGER NOT NULL,
  protein_percentage DECIMAL(4,2) NOT NULL,
  skeletal_muscle_mass_kg DECIMAL(5,2) NOT NULL,
  subcutaneous_fat_percentage DECIMAL(4,2) NOT NULL,
  body_age INTEGER NOT NULL,
  body_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add has_completed_assessment column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN has_completed_assessment BOOLEAN DEFAULT FALSE;

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Create RLS policies for services  
CREATE POLICY "Everyone can view active services" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage all services" ON public.services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Create RLS policies for purchases
CREATE POLICY "Users can view their own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own purchases" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all purchases" ON public.purchases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can manage all purchases" ON public.purchases FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Create RLS policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all bookings" ON public.bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Create RLS policies for video_testimonials
CREATE POLICY "Everyone can view approved testimonials" ON public.video_testimonials FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can view their own testimonials" ON public.video_testimonials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own testimonials" ON public.video_testimonials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own testimonials" ON public.video_testimonials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all testimonials" ON public.video_testimonials FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Create RLS policies for newsletter_subscribers
CREATE POLICY "Allow public inserts to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage newsletter subscribers" ON public.newsletter_subscribers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Create RLS policies for fitness_assessments
CREATE POLICY "Users can view their own fitness assessment" 
ON public.fitness_assessments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fitness assessment" 
ON public.fitness_assessments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fitness assessment" 
ON public.fitness_assessments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all fitness assessments" 
ON public.fitness_assessments FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can manage all fitness assessments" 
ON public.fitness_assessments FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create function to update profile when assessment is completed
CREATE OR REPLACE FUNCTION public.update_assessment_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET has_completed_assessment = TRUE 
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_video_testimonials_updated_at BEFORE UPDATE ON public.video_testimonials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fitness_assessments_updated_at BEFORE UPDATE ON public.fitness_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically update assessment status
CREATE TRIGGER on_fitness_assessment_completed
  AFTER INSERT ON public.fitness_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_assessment_status();

-- Insert sample services (without fitness assessment as it's now free and mandatory)
INSERT INTO public.services (title, description, type, price, duration_weeks, duration_minutes, includes_nutrition, includes_workout, includes_meet) VALUES
('Personal Training Session', '1-on-1 personal training session with certified trainer', 'session', 50000, 0, 60, false, true, true),
('Nutrition Consultation', 'Personalized nutrition plan and dietary consultation', 'consultation', 30000, 0, 45, true, false, true),
('12-Week Transformation Program', 'Complete body transformation program with nutrition and workout plan', 'program', 500000, 12, 0, true, true, true),
('6-Week Strength Program', 'Focused strength building program', 'program', 300000, 6, 0, false, true, false);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin);
CREATE INDEX idx_services_type ON public.services(type);
CREATE INDEX idx_services_is_active ON public.services(is_active);
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_service_id ON public.purchases(service_id);
CREATE INDEX idx_purchases_payment_status ON public.purchases(payment_status);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_scheduled_at ON public.bookings(scheduled_at);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_video_testimonials_is_approved ON public.video_testimonials(is_approved);
CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX idx_fitness_assessments_user_id ON public.fitness_assessments(user_id);

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