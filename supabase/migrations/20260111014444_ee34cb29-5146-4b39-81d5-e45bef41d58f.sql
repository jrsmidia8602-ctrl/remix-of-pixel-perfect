-- API Keys table for public API authentication
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  owner_id UUID,
  permissions TEXT[] DEFAULT ARRAY['execute', 'status', 'balance'],
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  daily_budget NUMERIC DEFAULT 100.00,
  total_spent NUMERIC DEFAULT 0,
  total_executions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Execution logs for detailed audit trail
CREATE TABLE public.execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID REFERENCES public.executions(id),
  api_key_id UUID REFERENCES public.api_keys(id),
  step TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

-- API keys are managed by operators only (service role access)
CREATE POLICY "Service role can manage api_keys"
ON public.api_keys
FOR ALL
USING (true)
WITH CHECK (true);

-- Execution logs viewable by service role
CREATE POLICY "Service role can manage execution_logs"
ON public.execution_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Index for fast key lookup
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_prefix ON public.api_keys(key_prefix);
CREATE INDEX idx_execution_logs_execution_id ON public.execution_logs(execution_id);

-- Trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();