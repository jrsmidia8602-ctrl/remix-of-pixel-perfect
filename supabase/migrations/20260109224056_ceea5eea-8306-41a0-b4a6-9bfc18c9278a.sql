-- Create sellers table for Stripe Connect accounts
CREATE TABLE public.sellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT,
  stripe_account_status TEXT DEFAULT 'pending',
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  business_name TEXT,
  email TEXT,
  country TEXT DEFAULT 'US',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- RLS policies for sellers
CREATE POLICY "Users can view their own seller profile"
ON public.sellers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own seller profile"
ON public.sellers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seller profile"
ON public.sellers
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all sellers
CREATE POLICY "Admins can view all sellers"
ON public.sellers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_sellers_updated_at
  BEFORE UPDATE ON public.sellers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();