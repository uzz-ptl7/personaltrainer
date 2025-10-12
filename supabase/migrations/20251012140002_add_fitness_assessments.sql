-- Add fitness assessments functionality to existing database
-- Create fitness_assessments table for storing user fitness data
CREATE TABLE IF NOT EXISTS public.fitness_assessments (
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

-- Add has_completed_assessment column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'has_completed_assessment') THEN
    ALTER TABLE public.profiles 
    ADD COLUMN has_completed_assessment BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.fitness_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fitness_assessments
DO $$
BEGIN
  -- Check if policies exist before creating them
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fitness_assessments' AND policyname = 'Users can view their own fitness assessment') THEN
    CREATE POLICY "Users can view their own fitness assessment" 
    ON public.fitness_assessments FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fitness_assessments' AND policyname = 'Users can insert their own fitness assessment') THEN
    CREATE POLICY "Users can insert their own fitness assessment" 
    ON public.fitness_assessments FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fitness_assessments' AND policyname = 'Users can update their own fitness assessment') THEN
    CREATE POLICY "Users can update their own fitness assessment" 
    ON public.fitness_assessments FOR UPDATE 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fitness_assessments' AND policyname = 'Admins can view all fitness assessments') THEN
    CREATE POLICY "Admins can view all fitness assessments" 
    ON public.fitness_assessments FOR SELECT 
    USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fitness_assessments' AND policyname = 'Admins can manage all fitness assessments') THEN
    CREATE POLICY "Admins can manage all fitness assessments" 
    ON public.fitness_assessments FOR ALL 
    USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
    );
  END IF;
END $$;

-- Create function to update profile when assessment is completed if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_assessment_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET has_completed_assessment = TRUE 
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically update assessment status if it doesn't exist
DROP TRIGGER IF EXISTS on_fitness_assessment_completed ON public.fitness_assessments;
CREATE TRIGGER on_fitness_assessment_completed
  AFTER INSERT ON public.fitness_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_assessment_status();

-- Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_fitness_assessments_updated_at ON public.fitness_assessments;
CREATE TRIGGER update_fitness_assessments_updated_at 
BEFORE UPDATE ON public.fitness_assessments 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_fitness_assessments_user_id ON public.fitness_assessments(user_id);

-- Remove the fitness assessment service from services table if it exists
DELETE FROM public.services WHERE title = 'Fitness Assessment';