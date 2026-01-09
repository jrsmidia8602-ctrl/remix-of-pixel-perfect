-- Create payments table for tracking fiat transactions
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_payment_intent_id TEXT UNIQUE,
  seller_id UUID REFERENCES public.sellers(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  customer_email TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crypto_transactions table
CREATE TABLE public.crypto_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tx_hash TEXT UNIQUE,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount TEXT NOT NULL,
  token TEXT NOT NULL,
  chain TEXT NOT NULL,
  confirmations INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vault_positions table for yield tracking
CREATE TABLE public.vault_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vault_type TEXT NOT NULL, -- 'split' or 'yield'
  vault_address TEXT NOT NULL,
  deposited_amount TEXT NOT NULL,
  current_shares TEXT,
  chain TEXT NOT NULL,
  token TEXT NOT NULL,
  apy DECIMAL(10, 4),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_positions ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers can view their own payments" ON public.payments
  FOR SELECT USING (
    seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
  );

-- Crypto transactions policies
CREATE POLICY "Users can view their own crypto transactions" ON public.crypto_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crypto transactions" ON public.crypto_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all crypto transactions" ON public.crypto_transactions
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Vault positions policies
CREATE POLICY "Users can view their own vault positions" ON public.vault_positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vault positions" ON public.vault_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vault positions" ON public.vault_positions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vault positions" ON public.vault_positions
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crypto_transactions_updated_at
  BEFORE UPDATE ON public.crypto_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vault_positions_updated_at
  BEFORE UPDATE ON public.vault_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();