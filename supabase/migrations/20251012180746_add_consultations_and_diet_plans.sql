-- Create consultations table
CREATE TABLE public.consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consultation_type TEXT NOT NULL CHECK (consultation_type IN ('initial', 'weekly_checkup')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    meet_link TEXT,
    meet_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create diet_plans table
CREATE TABLE public.diet_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    consultation_id UUID REFERENCES public.consultations(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_consultations_user_id ON public.consultations(user_id);
CREATE INDEX idx_consultations_scheduled_at ON public.consultations(scheduled_at);
CREATE INDEX idx_consultations_status ON public.consultations(status);
CREATE INDEX idx_diet_plans_user_id ON public.diet_plans(user_id);
CREATE INDEX idx_diet_plans_purchase_id ON public.diet_plans(purchase_id);
CREATE INDEX idx_diet_plans_is_active ON public.diet_plans(is_active);

-- Enable RLS
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for consultations
CREATE POLICY "Users can view their own consultations" ON public.consultations 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all consultations" ON public.consultations 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can manage all consultations" ON public.consultations 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- RLS policies for diet_plans
CREATE POLICY "Users can view their own diet plans" ON public.diet_plans 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all diet plans" ON public.diet_plans 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can manage all diet plans" ON public.diet_plans 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Add triggers for updated_at
CREATE TRIGGER update_consultations_updated_at 
    BEFORE UPDATE ON public.consultations 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diet_plans_updated_at 
    BEFORE UPDATE ON public.diet_plans 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically schedule weekly checkups
CREATE OR REPLACE FUNCTION public.schedule_weekly_checkup()
RETURNS TRIGGER AS $$
BEGIN
    -- When a consultation is completed, schedule the next weekly checkup
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.consultation_type = 'weekly_checkup' THEN
        INSERT INTO public.consultations (user_id, consultation_type, scheduled_at, notes)
        VALUES (NEW.user_id, 'weekly_checkup', NEW.scheduled_at + INTERVAL '1 week', 'Auto-scheduled weekly checkup');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-scheduling weekly checkups
CREATE TRIGGER auto_schedule_weekly_checkup
    AFTER UPDATE ON public.consultations
    FOR EACH ROW EXECUTE FUNCTION public.schedule_weekly_checkup();
