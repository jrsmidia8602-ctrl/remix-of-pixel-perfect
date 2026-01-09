import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Seller {
  id: string;
  user_id: string;
  business_name: string | null;
  email: string | null;
  country: string | null;
  stripe_account_id: string | null;
  stripe_account_status: string | null;
  charges_enabled: boolean | null;
  payouts_enabled: boolean | null;
  details_submitted: boolean | null;
  created_at: string;
  updated_at: string;
}

interface PlatformStats {
  totalSellers: number;
  activeSellers: number;
  pendingSellers: number;
  totalPayments: number;
  totalVolume: number;
  totalVaultDeposits: number;
}

export function useAdminData() {
  const { user } = useAuth();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalSellers: 0,
    activeSellers: 0,
    pendingSellers: 0,
    totalPayments: 0,
    totalVolume: 0,
    totalVaultDeposits: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = useCallback(async () => {
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    return !error && data?.role === 'admin';
  }, [user]);

  const fetchAdminData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const adminCheck = await checkAdminRole();
      setIsAdmin(adminCheck);

      if (!adminCheck) {
        setError('Unauthorized: Admin access required');
        return;
      }

      // Fetch all sellers
      const { data: sellersData, error: sellersError } = await supabase
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: false });

      if (sellersError) throw sellersError;
      setSellers(sellersData || []);

      // Calculate stats
      const activeSellers = sellersData?.filter(s => s.stripe_account_status === 'active').length || 0;
      const pendingSellers = sellersData?.filter(s => s.stripe_account_status === 'pending').length || 0;

      // Fetch payments count
      const { count: paymentsCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true });

      // Fetch vault positions count
      const { count: vaultCount } = await supabase
        .from('vault_positions')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalSellers: sellersData?.length || 0,
        activeSellers,
        pendingSellers,
        totalPayments: paymentsCount || 0,
        totalVolume: 0, // Would need Stripe API call
        totalVaultDeposits: vaultCount || 0,
      });
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data');
    } finally {
      setIsLoading(false);
    }
  }, [user, checkAdminRole]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  return {
    sellers,
    stats,
    isLoading,
    error,
    isAdmin,
    refetch: fetchAdminData,
  };
}
