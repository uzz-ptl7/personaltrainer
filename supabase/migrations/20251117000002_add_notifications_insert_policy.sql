-- Add INSERT policy for notifications
-- This allows the service role (used by Edge Functions) to insert notifications for any user
-- Also allows admins to manually create notifications

CREATE POLICY "Service role can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Also add a policy for admins to create notifications
CREATE POLICY "Admins can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);
