-- Create the service_plans table for personalized plans for any service
CREATE TABLE service_plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
    service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    consultation_id uuid REFERENCES consultations(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_size bigint,
    uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_type text NOT NULL DEFAULT 'custom', -- 'diet', 'workout', 'nutrition', 'custom', etc.
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX service_plans_user_id_idx ON service_plans(user_id);
CREATE INDEX service_plans_purchase_id_idx ON service_plans(purchase_id);
CREATE INDEX service_plans_service_id_idx ON service_plans(service_id);
CREATE INDEX service_plans_consultation_id_idx ON service_plans(consultation_id);

-- Enable RLS (Row Level Security)
ALTER TABLE service_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for service_plans
CREATE POLICY "Users can view their own service plans" ON service_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all service plans" ON service_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can insert service plans" ON service_plans
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can update service plans" ON service_plans
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can delete service plans" ON service_plans
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_service_plans_updated_at 
    BEFORE UPDATE ON service_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();