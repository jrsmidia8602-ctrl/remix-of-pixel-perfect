-- Create executions table to track agent API executions
CREATE TABLE public.executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.autonomous_agents(id),
  api_product_id UUID REFERENCES public.api_products(id),
  cost NUMERIC(10, 4) NOT NULL DEFAULT 0,
  revenue NUMERIC(10, 4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed')),
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Users can view executions"
ON public.executions FOR SELECT
USING (true);

-- Allow insert for authenticated users and service role
CREATE POLICY "Service can insert executions"
ON public.executions FOR INSERT
WITH CHECK (true);

-- Allow update for service role
CREATE POLICY "Service can update executions"
ON public.executions FOR UPDATE
USING (true);

-- Add index for performance
CREATE INDEX idx_executions_agent_id ON public.executions(agent_id);
CREATE INDEX idx_executions_created_at ON public.executions(created_at DESC);

-- Enable realtime for executions
ALTER PUBLICATION supabase_realtime ADD TABLE public.executions;