-- =============================================
-- XPEX AGENT ECONOMY - DATABASE ACTIVATION
-- =============================================

-- 1. User Wallets - Sistema de créditos por usuário
CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  balance_credits NUMERIC NOT NULL DEFAULT 0.00,
  balance_usd NUMERIC NOT NULL DEFAULT 0.00,
  total_spent NUMERIC NOT NULL DEFAULT 0.00,
  total_earned NUMERIC NOT NULL DEFAULT 0.00,
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Credit Transactions - Histórico de transações de crédito
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.autonomous_agents(id),
  execution_id UUID REFERENCES public.executions(id),
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  source TEXT NOT NULL CHECK (source IN ('agent_execution', 'api_call', 'purchase', 'refund', 'bonus', 'platform_fee')),
  description TEXT,
  balance_before NUMERIC NOT NULL DEFAULT 0,
  balance_after NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Agent Marketplace - Catálogo de agentes disponíveis
CREATE TABLE public.agent_marketplace (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.autonomous_agents(id),
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  category TEXT NOT NULL DEFAULT 'automation',
  price_per_execution NUMERIC NOT NULL DEFAULT 0.01,
  min_credits_required NUMERIC NOT NULL DEFAULT 1.00,
  execution_count INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0.00,
  rating NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deprecated')),
  tags TEXT[] DEFAULT '{}',
  documentation_url TEXT,
  demo_available BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id)
);

-- 4. Credit Packs - Pacotes de créditos para compra
CREATE TABLE public.credit_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  credits_amount NUMERIC NOT NULL,
  price_usd NUMERIC NOT NULL,
  bonus_credits NUMERIC DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  stripe_price_id TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. API Usage Logs - Log de uso de APIs públicas
CREATE TABLE public.api_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  api_key_id UUID REFERENCES public.api_keys(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  credits_consumed NUMERIC DEFAULT 0,
  response_status INTEGER,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  request_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- User Wallets RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
ON public.user_wallets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet"
ON public.user_wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to wallets"
ON public.user_wallets FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Admins can manage all wallets"
ON public.user_wallets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Credit Transactions RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.credit_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to transactions"
ON public.credit_transactions FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Admins can view all transactions"
ON public.credit_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Agent Marketplace RLS
ALTER TABLE public.agent_marketplace ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active public marketplace listings"
ON public.agent_marketplace FOR SELECT
USING (is_public = true AND status = 'active');

CREATE POLICY "Admins can manage all marketplace listings"
ON public.agent_marketplace FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access to marketplace"
ON public.agent_marketplace FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Credit Packs RLS
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active credit packs"
ON public.credit_packs FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage credit packs"
ON public.credit_packs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access to credit packs"
ON public.credit_packs FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- API Usage Logs RLS
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API usage"
ON public.api_usage_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all API usage"
ON public.api_usage_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access to API usage"
ON public.api_usage_logs FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to update wallet balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'credit' THEN
    UPDATE public.user_wallets
    SET 
      balance_credits = balance_credits + NEW.amount,
      total_earned = total_earned + NEW.amount,
      last_transaction_at = now(),
      updated_at = now()
    WHERE user_id = NEW.user_id;
  ELSIF NEW.transaction_type = 'debit' THEN
    UPDATE public.user_wallets
    SET 
      balance_credits = balance_credits - NEW.amount,
      total_spent = total_spent + NEW.amount,
      last_transaction_at = now(),
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for automatic wallet updates
CREATE TRIGGER on_credit_transaction_insert
AFTER INSERT ON public.credit_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_wallet_balance();

-- Function to update marketplace stats
CREATE OR REPLACE FUNCTION public.update_marketplace_execution_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.agent_marketplace
  SET 
    execution_count = execution_count + 1,
    total_revenue = total_revenue + COALESCE(NEW.revenue, 0),
    updated_at = now()
  WHERE agent_id = NEW.agent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for marketplace stats
CREATE TRIGGER on_execution_complete_marketplace
AFTER INSERT ON public.executions
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION public.update_marketplace_execution_stats();

-- Function to auto-create wallet for new users
CREATE OR REPLACE FUNCTION public.create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_wallets (user_id, balance_credits)
  VALUES (NEW.id, 10.00)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- INITIAL DATA - Credit Packs
-- =============================================

INSERT INTO public.credit_packs (name, description, credits_amount, price_usd, bonus_credits, is_featured, sort_order) VALUES
('Starter', '100 créditos para começar', 100, 9.99, 0, false, 1),
('Growth', '500 créditos + 50 bônus', 500, 39.99, 50, true, 2),
('Scale', '2000 créditos + 300 bônus', 2000, 149.99, 300, false, 3),
('Enterprise', '10000 créditos + 2000 bônus', 10000, 699.99, 2000, false, 4);

-- =============================================
-- SEED MARKETPLACE - Register existing agents
-- =============================================

INSERT INTO public.agent_marketplace (agent_id, name, description, short_description, category, price_per_execution, tags, is_featured)
SELECT 
  id,
  agent_name,
  CASE agent_type
    WHEN 'api_consumer' THEN 'Agente especializado em consumir APIs de terceiros, coletar dados e processar informações automaticamente.'
    WHEN 'payment_bot' THEN 'Bot de pagamentos que processa transações, gerencia cobranças e otimiza fluxos financeiros.'
    WHEN 'nft_minter' THEN 'Agente de mintagem de NFTs que automatiza a criação e listagem de ativos digitais.'
    WHEN 'volume_generator' THEN 'Gerador de volume que simula atividade e testa sistemas de alta carga.'
  END,
  CASE agent_type
    WHEN 'api_consumer' THEN 'Consumo automático de APIs'
    WHEN 'payment_bot' THEN 'Automação de pagamentos'
    WHEN 'nft_minter' THEN 'Mintagem de NFTs'
    WHEN 'volume_generator' THEN 'Geração de volume'
  END,
  CASE agent_type
    WHEN 'api_consumer' THEN 'data'
    WHEN 'payment_bot' THEN 'payment'
    WHEN 'nft_minter' THEN 'blockchain'
    WHEN 'volume_generator' THEN 'automation'
  END,
  CASE agent_type
    WHEN 'api_consumer' THEN 0.01
    WHEN 'payment_bot' THEN 0.02
    WHEN 'nft_minter' THEN 0.015
    WHEN 'volume_generator' THEN 0.005
  END,
  ARRAY[agent_type::text, 'autonomous', 'production'],
  agent_type = 'payment_bot'
FROM public.autonomous_agents
WHERE status != 'maintenance'
ON CONFLICT (agent_id) DO NOTHING;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_marketplace;