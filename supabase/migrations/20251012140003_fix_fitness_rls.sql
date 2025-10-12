-- Fix RLS policies for fitness_assessments table
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own fitness assessment" ON public.fitness_assessments;
DROP POLICY IF EXISTS "Users can insert their own fitness assessment" ON public.fitness_assessments;
DROP POLICY IF EXISTS "Users can update their own fitness assessment" ON public.fitness_assessments;
DROP POLICY IF EXISTS "Admins can view all fitness assessments" ON public.fitness_assessments;
DROP POLICY IF EXISTS "Admins can manage all fitness assessments" ON public.fitness_assessments;

-- Create simple, working RLS policies
CREATE POLICY "fitness_assessments_select" ON public.fitness_assessments
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "fitness_assessments_insert" ON public.fitness_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fitness_assessments_update" ON public.fitness_assessments
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "fitness_assessments_delete" ON public.fitness_assessments
  FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );