-- XPEX Neural Supreme - Complete Database Schema

-- =====================================================
-- AUTONOMOUS AGENTS SYSTEM
-- =====================================================

-- Agent type enum
CREATE TYPE public.agent_type AS ENUM ('api_consumer', 'payment_bot', 'nft_minter', 'volume_generator');

-- Agent status enum
CREATE TYPE public.agent_status AS ENUM ('idle', 'active', 'error', 'maintenance');

-- Task type enum
CREATE TYPE public.task_type AS ENUM ('api_consumption', 'payment', 'nft_mint', 'volume_generation');

-- Task status enum
CREATE TYPE public.task_status AS ENUM ('pending', 'assigned', 'executing', 'completed', 'failed', 'cancelled');

-- Opportunity status enum
CREATE TYPE public.opportunity_status AS ENUM ('detected', 'scheduled', 'executing', 'completed', 'expired');

-- Revenue source enum
CREATE TYPE public.revenue_source AS ENUM ('api_calls', 'nft_sales', 'payment_fees', 'yield', 'other');

-- Price model enum
CREATE TYPE public.price_model AS ENUM ('per_call', 'subscription', 'tiered', 'custom');

-- Auth method enum
CREATE TYPE public.auth_method AS ENUM ('api_key', 'oauth2', 'jwt', 'none');

-- =====================================================
-- AUTONOMOUS AGENTS TABLE
-- =====================================================
CREATE TABLE public.autonomous_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_type agent_type NOT NULL,
  agent_name TEXT NOT NULL,
  capabilities TEXT[] DEFAULT '{}',
  status agent_status DEFAULT 'idle',
  
  -- Configuration
  wallet_address TEXT,
  daily_budget DECIMAL(20, 2) DEFAULT 100.00,
  max_concurrent_tasks INTEGER DEFAULT 5,
  performance_score DECIMAL(3, 2) DEFAULT 0.5 CHECK (performance_score >= 0 AND performance_score <= 1),
  
  -- Current task
  current_task_id UUID,
  current_task_started_at TIMESTAMP WITH TIME ZONE,
  
  -- Statistics
  total_tasks_completed INTEGER DEFAULT 0,
  total_revenue_generated DECIMAL(20, 2) DEFAULT 0.00,
  success_rate DECIMAL(5, 4) DEFAULT 0.0 CHECK (success_rate >= 0 AND success_rate <= 1),
  
  -- Monitoring
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_heartbeat_at TIMESTAMP WITH TIME ZONE,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- API PRODUCTS TABLE (Marketplace)
-- =====================================================
CREATE TABLE public.api_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  
  -- Product Details
  name TEXT NOT NULL,
  description TEXT,
  api_endpoint TEXT NOT NULL,
  documentation_url TEXT,
  
  -- Pricing
  price_model price_model NOT NULL DEFAULT 'per_call',
  price_per_call DECIMAL(20, 6) DEFAULT 0.001,
  monthly_subscription_price DECIMAL(20, 2),
  tier_pricing JSONB,
  
  -- Usage Limits
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  monthly_call_limit INTEGER,
  
  -- Technical Details
  request_method TEXT DEFAULT 'POST',
  request_headers JSONB DEFAULT '{}',
  request_body_template JSONB,
  response_format TEXT CHECK (response_format IN ('json', 'xml', 'text', 'binary')),
  
  -- Authentication
  auth_method auth_method DEFAULT 'api_key',
  auth_credentials JSONB,
  
  -- Statistics
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  total_revenue DECIMAL(20, 2) DEFAULT 0.00,
  active_consumers INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BRAIN TASKS TABLE
-- =====================================================
CREATE TABLE public.brain_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_type task_type NOT NULL,
  priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),
  
  -- Target
  target_api_id UUID REFERENCES public.api_products(id),
  target_wallet TEXT,
  target_amount DECIMAL(20, 2),
  
  -- Execution
  assigned_agent_id UUID REFERENCES public.autonomous_agents(id),
  status task_status DEFAULT 'pending',
  
  -- Budget & Results
  allocated_budget DECIMAL(20, 2) NOT NULL,
  actual_cost DECIMAL(20, 2),
  expected_revenue DECIMAL(20, 2),
  actual_revenue DECIMAL(20, 2),
  
  -- Timing
  deadline TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Results
  success_indicators JSONB DEFAULT '{}',
  error_details TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MARKET OPPORTUNITIES TABLE
-- =====================================================
CREATE TABLE public.market_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_product_id UUID REFERENCES public.api_products(id) NOT NULL,
  
  -- Analysis Scores (0-1)
  demand_score DECIMAL(3, 2) NOT NULL CHECK (demand_score >= 0 AND demand_score <= 1),
  competition_score DECIMAL(3, 2) NOT NULL CHECK (competition_score >= 0 AND competition_score <= 1),
  complexity_score DECIMAL(3, 2) NOT NULL CHECK (complexity_score >= 0 AND complexity_score <= 1),
  
  -- Financials
  potential_revenue DECIMAL(20, 2) NOT NULL,
  estimated_cost DECIMAL(20, 2) NOT NULL,
  
  -- Timing
  detection_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_window_start TIMESTAMP WITH TIME ZONE,
  time_window_end TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status opportunity_status DEFAULT 'detected',
  
  -- Agent allocation
  assigned_agent_id UUID REFERENCES public.autonomous_agents(id),
  assigned_task_id UUID REFERENCES public.brain_tasks(id),
  
  -- Results
  actual_revenue DECIMAL(20, 2),
  actual_cost DECIMAL(20, 2),
  completion_time TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  analysis_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AGENT PERFORMANCE TABLE
-- =====================================================
CREATE TABLE public.agent_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.autonomous_agents(id) NOT NULL,
  
  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Metrics
  tasks_completed INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  total_revenue DECIMAL(20, 2) DEFAULT 0.00,
  total_cost DECIMAL(20, 2) DEFAULT 0.00,
  
  -- Performance score (calculated by brain)
  performance_score DECIMAL(3, 2) DEFAULT 0.5,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(agent_id, period_start, period_end)
);

-- =====================================================
-- BRAIN REPORTS TABLE
-- =====================================================
CREATE TABLE public.brain_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  
  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- System metrics
  active_agents INTEGER DEFAULT 0,
  idle_agents INTEGER DEFAULT 0,
  total_tasks_created INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  total_tasks_failed INTEGER DEFAULT 0,
  
  -- Financial metrics
  total_revenue DECIMAL(20, 2) DEFAULT 0.00,
  total_cost DECIMAL(20, 2) DEFAULT 0.00,
  platform_fees DECIMAL(20, 2) DEFAULT 0.00,
  net_profit DECIMAL(20, 2) DEFAULT 0.00,
  
  -- Performance metrics
  avg_success_rate DECIMAL(5, 4) DEFAULT 0.0,
  avg_task_duration_seconds DECIMAL(10, 2) DEFAULT 0.0,
  system_efficiency_score DECIMAL(3, 2) DEFAULT 0.5,
  
  -- Opportunity metrics
  opportunities_detected INTEGER DEFAULT 0,
  opportunities_executed INTEGER DEFAULT 0,
  opportunity_conversion_rate DECIMAL(5, 4) DEFAULT 0.0,
  
  -- AI Analysis
  insights JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '{}',
  predicted_next_period_revenue DECIMAL(20, 2),
  
  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- API USAGE METRICS TABLE
-- =====================================================
CREATE TABLE public.api_usage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_product_id UUID REFERENCES public.api_products(id) NOT NULL,
  consumer_id UUID,
  
  -- Time window
  time_window TIMESTAMP WITH TIME ZONE NOT NULL,
  time_granularity TEXT CHECK (time_granularity IN ('minute', 'hour', 'day', 'week', 'month')),
  
  -- Usage metrics
  call_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  
  -- Performance metrics
  avg_response_time_ms DECIMAL(10, 2) DEFAULT 0.0,
  p95_response_time_ms DECIMAL(10, 2) DEFAULT 0.0,
  p99_response_time_ms DECIMAL(10, 2) DEFAULT 0.0,
  
  -- Financial metrics
  total_cost DECIMAL(20, 6) DEFAULT 0.00,
  total_revenue DECIMAL(20, 2) DEFAULT 0.00,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(api_product_id, consumer_id, time_window, time_granularity)
);

-- =====================================================
-- AUTONOMOUS REVENUE TABLE
-- =====================================================
CREATE TABLE public.autonomous_revenue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Source
  revenue_source revenue_source NOT NULL,
  agent_id UUID REFERENCES public.autonomous_agents(id),
  task_id UUID REFERENCES public.brain_tasks(id),
  
  -- Transaction details
  transaction_id TEXT,
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Split details
  platform_fee DECIMAL(20, 2) DEFAULT 0.00,
  seller_amount DECIMAL(20, 2) DEFAULT 0.00,
  agent_reward DECIMAL(20, 2) DEFAULT 0.00,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'distributed', 'failed')),
  
  -- Timing
  revenue_date TIMESTAMP WITH TIME ZONE NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE,
  distributed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VOLUME GENERATION LOGS TABLE
-- =====================================================
CREATE TABLE public.volume_generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id TEXT NOT NULL,
  api_id TEXT NOT NULL,
  payload JSONB,
  result TEXT CHECK (result IN ('success', 'failure')),
  response_time_ms DECIMAL(10, 2) DEFAULT 0.0,
  cost DECIMAL(20, 6) DEFAULT 0.0,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- YIELD STRATEGIES TABLE
-- =====================================================
CREATE TABLE public.yield_strategies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  strategy_name TEXT NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  apy DECIMAL(5, 2),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  estimated_monthly_yield DECIMAL(20, 2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  actual_yield DECIMAL(20, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ARBITRAGE OPPORTUNITIES TABLE
-- =====================================================
CREATE TABLE public.arbitrage_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buy_chain TEXT NOT NULL,
  sell_chain TEXT NOT NULL,
  buy_price DECIMAL(20, 6) NOT NULL,
  sell_price DECIMAL(20, 6) NOT NULL,
  estimated_profit DECIMAL(20, 6),
  status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'executing', 'completed', 'expired', 'failed')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  actual_profit DECIMAL(20, 6),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CONNECTED WALLETS TABLE (for multi-chain support)
-- =====================================================
CREATE TABLE public.connected_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(seller_id, wallet_address, chain_id)
);

-- =====================================================
-- PENDING PAYMENTS TABLE
-- =====================================================
CREATE TABLE public.pending_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.sellers(id),
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT CHECK (payment_method IN ('stripe', 'crypto')),
  wallet_id TEXT,
  purpose TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  transaction_id TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE public.autonomous_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volume_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbitrage_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - AUTONOMOUS AGENTS
-- =====================================================
CREATE POLICY "Admins can manage all agents" ON public.autonomous_agents
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access to agents" ON public.autonomous_agents
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- RLS POLICIES - API PRODUCTS
-- =====================================================
CREATE POLICY "Anyone can view active public api products" ON public.api_products
  FOR SELECT USING (is_active = true AND is_public = true);

CREATE POLICY "Sellers can manage their own api products" ON public.api_products
  FOR ALL USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all api products" ON public.api_products
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS POLICIES - BRAIN TASKS
-- =====================================================
CREATE POLICY "Admins can manage all brain tasks" ON public.brain_tasks
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access to tasks" ON public.brain_tasks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- RLS POLICIES - MARKET OPPORTUNITIES
-- =====================================================
CREATE POLICY "Admins can view all opportunities" ON public.market_opportunities
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access to opportunities" ON public.market_opportunities
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- RLS POLICIES - AGENT PERFORMANCE
-- =====================================================
CREATE POLICY "Admins can view all agent performance" ON public.agent_performance
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access to performance" ON public.agent_performance
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- RLS POLICIES - BRAIN REPORTS
-- =====================================================
CREATE POLICY "Admins can view all brain reports" ON public.brain_reports
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access to reports" ON public.brain_reports
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- RLS POLICIES - API USAGE METRICS
-- =====================================================
CREATE POLICY "Admins can view all api usage metrics" ON public.api_usage_metrics
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers can view their own api usage" ON public.api_usage_metrics
  FOR SELECT USING (api_product_id IN (
    SELECT ap.id FROM public.api_products ap
    JOIN public.sellers s ON ap.seller_id = s.id
    WHERE s.user_id = auth.uid()
  ));

-- =====================================================
-- RLS POLICIES - AUTONOMOUS REVENUE
-- =====================================================
CREATE POLICY "Admins can view all autonomous revenue" ON public.autonomous_revenue
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access to revenue" ON public.autonomous_revenue
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- RLS POLICIES - VOLUME GENERATION LOGS
-- =====================================================
CREATE POLICY "Admins can view all volume logs" ON public.volume_generation_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access to volume logs" ON public.volume_generation_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- RLS POLICIES - YIELD STRATEGIES
-- =====================================================
CREATE POLICY "Admins can view all yield strategies" ON public.yield_strategies
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access to yield" ON public.yield_strategies
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- RLS POLICIES - ARBITRAGE OPPORTUNITIES
-- =====================================================
CREATE POLICY "Admins can view all arbitrage" ON public.arbitrage_opportunities
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access to arbitrage" ON public.arbitrage_opportunities
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- RLS POLICIES - CONNECTED WALLETS
-- =====================================================
CREATE POLICY "Sellers can manage their own wallets" ON public.connected_wallets
  FOR ALL USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all connected wallets" ON public.connected_wallets
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS POLICIES - PENDING PAYMENTS
-- =====================================================
CREATE POLICY "Sellers can view their own pending payments" ON public.pending_payments
  FOR SELECT USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all pending payments" ON public.pending_payments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access to pending payments" ON public.pending_payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_autonomous_agents_status ON public.autonomous_agents(status, agent_type);
CREATE INDEX idx_brain_tasks_status ON public.brain_tasks(status, priority);
CREATE INDEX idx_market_opportunities_demand ON public.market_opportunities(demand_score DESC);
CREATE INDEX idx_api_products_active ON public.api_products(is_active, price_per_call);
CREATE INDEX idx_autonomous_revenue_date ON public.autonomous_revenue(revenue_date);
CREATE INDEX idx_autonomous_revenue_source ON public.autonomous_revenue(revenue_source, status);
CREATE INDEX idx_brain_reports_period ON public.brain_reports(period_start, period_end);
CREATE INDEX idx_api_usage_time ON public.api_usage_metrics(time_window);
CREATE INDEX idx_volume_logs_generated ON public.volume_generation_logs(generated_at);
CREATE INDEX idx_arbitrage_detected ON public.arbitrage_opportunities(detected_at);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_autonomous_agents_updated_at
  BEFORE UPDATE ON public.autonomous_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_products_updated_at
  BEFORE UPDATE ON public.api_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brain_tasks_updated_at
  BEFORE UPDATE ON public.brain_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_market_opportunities_updated_at
  BEFORE UPDATE ON public.market_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_yield_strategies_updated_at
  BEFORE UPDATE ON public.yield_strategies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connected_wallets_updated_at
  BEFORE UPDATE ON public.connected_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pending_payments_updated_at
  BEFORE UPDATE ON public.pending_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();