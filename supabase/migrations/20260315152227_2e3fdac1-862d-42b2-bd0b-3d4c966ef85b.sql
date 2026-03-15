
-- Fix: Replace overly permissive INSERT policy on notifications
DROP POLICY "System insert notifications" ON public.notifications;
CREATE POLICY "Authenticated insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id IS NOT NULL);
