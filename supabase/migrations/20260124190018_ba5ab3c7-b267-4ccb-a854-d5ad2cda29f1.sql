-- STEP_01: Fix Critical RLS Policies
-- Remove permissive policies and add proper user-based access control

-- =============================================
-- FIX: executions table RLS
-- =============================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert executions" ON public.executions;
DROP POLICY IF EXISTS "Authenticated users can update executions" ON public.executions;
DROP POLICY IF EXISTS "Users can view executions" ON public.executions;

-- Add user_id column to track ownership (if not exists)
ALTER TABLE public.executions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create proper RLS policies for executions
CREATE POLICY "Users can view their own executions" 
ON public.executions 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own executions" 
ON public.executions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own executions" 
ON public.executions 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access to executions" 
ON public.executions 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- =============================================
-- FIX: execution_logs table RLS
-- =============================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Service role can manage execution_logs" ON public.execution_logs;

-- Add user_id column to track ownership (if not exists)
ALTER TABLE public.execution_logs 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create proper RLS policies for execution_logs
CREATE POLICY "Users can view their own execution logs" 
ON public.execution_logs 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own execution logs" 
ON public.execution_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to execution_logs" 
ON public.execution_logs 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- =============================================
-- FIX: api_keys table RLS
-- =============================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Service role can manage api_keys" ON public.api_keys;

-- Create proper RLS policies for api_keys
CREATE POLICY "Users can view their own API keys" 
ON public.api_keys 
FOR SELECT 
USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own API keys" 
ON public.api_keys 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own API keys" 
ON public.api_keys 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own API keys" 
ON public.api_keys 
FOR DELETE 
USING (auth.uid() = owner_id);

CREATE POLICY "Service role full access to api_keys" 
ON public.api_keys 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);