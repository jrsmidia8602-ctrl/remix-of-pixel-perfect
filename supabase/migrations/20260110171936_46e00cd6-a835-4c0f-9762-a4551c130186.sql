-- Fix overly permissive RLS policies for executions table
DROP POLICY IF EXISTS "Service can insert executions" ON public.executions;
DROP POLICY IF EXISTS "Service can update executions" ON public.executions;

-- Create proper policies that require authentication
CREATE POLICY "Authenticated users can insert executions"
ON public.executions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update executions"
ON public.executions FOR UPDATE
TO authenticated
USING (true);