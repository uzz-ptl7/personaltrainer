-- Add referral_source field to profiles table
ALTER TABLE public.profiles ADD COLUMN referral_source TEXT;

-- Update the handle_new_user function to properly save all signup data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    phone, 
    phone_country_code, 
    country,
    referral_source
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'phone_country_code',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'referral_source'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
