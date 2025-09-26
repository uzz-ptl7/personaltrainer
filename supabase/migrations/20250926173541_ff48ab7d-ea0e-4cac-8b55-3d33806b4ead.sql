-- Fix infinite recursion in RLS policies by creating security definer functions

-- Create security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(is_admin, FALSE) 
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop all existing admin policies to avoid recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can manage all purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can manage newsletter subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage all services" ON services;
DROP POLICY IF EXISTS "Admins can manage all testimonials" ON video_testimonials;

-- Recreate admin policies using the security definer function
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage all bookings" ON bookings
FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "Admins can view all purchases" ON purchases
FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage all purchases" ON purchases
FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage newsletter subscribers" ON newsletter_subscribers
FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage all notifications" ON notifications
FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage all services" ON services
FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage all testimonials" ON video_testimonials
FOR ALL USING (public.is_current_user_admin());