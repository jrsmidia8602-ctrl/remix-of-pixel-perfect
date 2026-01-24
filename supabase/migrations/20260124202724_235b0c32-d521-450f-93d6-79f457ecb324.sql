-- =============================================
-- NEURAL DEMAND RADAR SCHEMA
-- =============================================

-- Enum for demand signal sources
CREATE TYPE demand_source AS ENUM (
  'google_trends',
  'twitter',
  'reddit',
  'freelance_marketplace',
  'manual_input'
);

-- Enum for intent levels
CREATE TYPE intent_level AS ENUM (
  'curiosity',
  'research',
  'solution_search',
  'purchase_intent'
);

-- Enum for demand temperature
CREATE TYPE demand_temperature AS ENUM (
  'cold',
  'warm',
  'hot'
);

-- Enum for service offer types
CREATE TYPE service_offer_type AS ENUM (
  'api_on_demand',
  'ready_backend',
  'ai_automation',
  'white_label_saas',
  'express_consulting'
);

-- Table: Demand Signals (raw signals from sources)
CREATE TABLE public.demand_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source demand_source NOT NULL,
  source_url TEXT,
  keyword TEXT NOT NULL,
  signal_text TEXT,
  signal_volume INTEGER DEFAULT 1,
  velocity_score NUMERIC DEFAULT 0,
  raw_data JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: Classified Intents (processed signals with intent classification)
CREATE TABLE public.classified_intents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID REFERENCES public.demand_signals(id) ON DELETE CASCADE,
  intent_level intent_level NOT NULL,
  confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  keywords_matched JSONB DEFAULT '[]'::jsonb,
  analysis_reasoning TEXT,
  classified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: Trend Predictions (predictive analysis)
CREATE TABLE public.trend_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intent_id UUID REFERENCES public.classified_intents(id) ON DELETE CASCADE,
  trend_score NUMERIC NOT NULL CHECK (trend_score >= 0 AND trend_score <= 100),
  momentum_index NUMERIC DEFAULT 0,
  predicted_growth_rate NUMERIC DEFAULT 0,
  time_series_data JSONB DEFAULT '[]'::jsonb,
  prediction_window_days INTEGER DEFAULT 7,
  predicted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: Demand Opportunities (final scored opportunities)
CREATE TABLE public.demand_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID REFERENCES public.demand_signals(id),
  intent_id UUID REFERENCES public.classified_intents(id),
  prediction_id UUID REFERENCES public.trend_predictions(id),
  
  -- Scoring (formula: signal_volume*0.3 + intent_confidence*0.4 + trend_score*0.3)
  demand_score NUMERIC NOT NULL CHECK (demand_score >= 0 AND demand_score <= 100),
  temperature demand_temperature NOT NULL,
  
  -- Opportunity details
  title TEXT NOT NULL,
  description TEXT,
  keywords TEXT[],
  estimated_ticket NUMERIC DEFAULT 0,
  urgency_score NUMERIC DEFAULT 0,
  
  -- Service mapping
  recommended_service service_offer_type,
  suggested_price NUMERIC,
  estimated_delivery_days INTEGER,
  
  -- Linking to market_opportunities table
  market_opportunity_id UUID REFERENCES public.market_opportunities(id),
  
  -- Status
  status TEXT DEFAULT 'detected',
  converted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: Service Offers (auto-generated offers)
CREATE TABLE public.service_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demand_opportunity_id UUID REFERENCES public.demand_opportunities(id) ON DELETE CASCADE,
  
  -- Offer details
  offer_type service_offer_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  delivery_days INTEGER NOT NULL,
  
  -- Templates
  copy_template TEXT,
  landing_page_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Performance
  views_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.demand_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classified_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for demand_signals
CREATE POLICY "Admins can manage all demand signals" ON public.demand_signals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access to demand signals" ON public.demand_signals
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- RLS Policies for classified_intents
CREATE POLICY "Admins can manage all classified intents" ON public.classified_intents
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access to classified intents" ON public.classified_intents
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- RLS Policies for trend_predictions
CREATE POLICY "Admins can manage all trend predictions" ON public.trend_predictions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access to trend predictions" ON public.trend_predictions
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- RLS Policies for demand_opportunities
CREATE POLICY "Admins can manage all demand opportunities" ON public.demand_opportunities
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access to demand opportunities" ON public.demand_opportunities
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- RLS Policies for service_offers
CREATE POLICY "Admins can manage all service offers" ON public.service_offers
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access to service offers" ON public.service_offers
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Indexes for performance
CREATE INDEX idx_demand_signals_source ON public.demand_signals(source);
CREATE INDEX idx_demand_signals_keyword ON public.demand_signals(keyword);
CREATE INDEX idx_demand_signals_detected_at ON public.demand_signals(detected_at DESC);

CREATE INDEX idx_classified_intents_level ON public.classified_intents(intent_level);
CREATE INDEX idx_classified_intents_confidence ON public.classified_intents(confidence_score DESC);

CREATE INDEX idx_demand_opportunities_score ON public.demand_opportunities(demand_score DESC);
CREATE INDEX idx_demand_opportunities_temperature ON public.demand_opportunities(temperature);
CREATE INDEX idx_demand_opportunities_status ON public.demand_opportunities(status);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.demand_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.demand_opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_offers;

-- Trigger for updated_at
CREATE TRIGGER update_demand_opportunities_updated_at
  BEFORE UPDATE ON public.demand_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_offers_updated_at
  BEFORE UPDATE ON public.service_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample demand data for testing
INSERT INTO public.demand_signals (source, keyword, signal_text, signal_volume, velocity_score) VALUES
  ('google_trends', 'AI chatbot API', 'Rising searches for AI chatbot integration APIs', 450, 2.3),
  ('twitter', 'backend automation', 'Need a backend that handles payments automatically', 120, 1.8),
  ('reddit', 'SaaS white label', 'Looking for white-label SaaS solutions for my agency', 85, 1.5),
  ('freelance_marketplace', 'payment gateway API', 'Urgent: Need payment gateway integration expert', 200, 3.1),
  ('manual_input', 'webhook automation', 'Client requests for webhook-based automation services', 50, 1.2);