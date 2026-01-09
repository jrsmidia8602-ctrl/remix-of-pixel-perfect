import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StripePayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  customer_email?: string;
  description?: string;
  metadata?: Record<string, string>;
}

interface PaymentStats {
  totalToday: number;
  totalThisMonth: number;
  successRate: number;
  pendingCount: number;
}

export function useStripePayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<StripePayment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalToday: 0,
    totalThisMonth: 0,
    successRate: 0,
    pendingCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('list-stripe-payments', {
        body: { limit: 50 },
      });

      if (fnError) throw fnError;

      if (data?.payments) {
        setPayments(data.payments);
        
        // Calculate stats
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;

        const todayPayments = data.payments.filter((p: StripePayment) => p.created >= startOfDay);
        const monthPayments = data.payments.filter((p: StripePayment) => p.created >= startOfMonth);
        const successfulPayments = data.payments.filter((p: StripePayment) => p.status === 'succeeded');
        const pendingPayments = data.payments.filter((p: StripePayment) => 
          p.status === 'requires_payment_method' || p.status === 'requires_confirmation' || p.status === 'processing'
        );

        setStats({
          totalToday: todayPayments.reduce((acc: number, p: StripePayment) => acc + p.amount, 0) / 100,
          totalThisMonth: monthPayments.reduce((acc: number, p: StripePayment) => acc + p.amount, 0) / 100,
          successRate: data.payments.length > 0 ? (successfulPayments.length / data.payments.length) * 100 : 0,
          pendingCount: pendingPayments.length,
        });
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    stats,
    isLoading,
    error,
    refetch: fetchPayments,
  };
}
