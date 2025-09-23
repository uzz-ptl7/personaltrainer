-- Add admin role and update profiles table with additional fields
ALTER TABLE public.profiles 
ADD COLUMN country text,
ADD COLUMN phone_country_code text,
ADD COLUMN is_admin boolean DEFAULT false,
ADD COLUMN is_blocked boolean DEFAULT false,
ADD COLUMN last_seen timestamp with time zone DEFAULT now(),
ADD COLUMN is_online boolean DEFAULT false;

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, phone, phone_country_code, country)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name', 
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'phone_country_code',
    NEW.raw_user_meta_data ->> 'country'
  );
  RETURN NEW;
END;
$$;

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND is_admin = true
  );
$$;

-- Update services policies to allow admin management
DROP POLICY IF EXISTS "Admin can manage services" ON public.services;
CREATE POLICY "Admin can manage services" 
ON public.services 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Add admin policies to other tables
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases" 
ON public.purchases 
FOR SELECT 
USING (public.is_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" 
ON public.bookings 
FOR SELECT 
USING (public.is_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admins can manage all bookings" 
ON public.bookings 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Create function to send notification
CREATE OR REPLACE FUNCTION public.send_notification(
  target_user_id uuid,
  notification_title text,
  notification_message text,
  notification_type text DEFAULT 'info'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (target_user_id, notification_title, notification_message, notification_type)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Create triggers for notifications
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find admin user
  SELECT user_id INTO admin_user_id 
  FROM public.profiles 
  WHERE is_admin = true 
  LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    PERFORM public.send_notification(
      admin_user_id,
      'New User Signup',
      'A new user ' || COALESCE(NEW.full_name, NEW.email) || ' has signed up.',
      'info'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_new_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
  service_title text;
  user_name text;
BEGIN
  -- Find admin user
  SELECT user_id INTO admin_user_id 
  FROM public.profiles 
  WHERE is_admin = true 
  LIMIT 1;
  
  -- Get service title and user name
  SELECT s.title INTO service_title 
  FROM public.services s 
  WHERE s.id = NEW.service_id;
  
  SELECT p.full_name INTO user_name 
  FROM public.profiles p 
  WHERE p.user_id = NEW.user_id;
  
  IF admin_user_id IS NOT NULL THEN
    PERFORM public.send_notification(
      admin_user_id,
      'New Service Purchase',
      COALESCE(user_name, 'A user') || ' purchased ' || COALESCE(service_title, 'a service') || ' for $' || NEW.amount,
      'success'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_new_user_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_user();

CREATE TRIGGER on_new_purchase_created
  AFTER INSERT ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_purchase();

-- Set up realtime for tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.purchases REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;

-- Set admin user (replace with actual admin email)
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'salim@salimsalehfitness.com';