import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserWallet {
  id: string;
  user_id: string;
  balance_credits: number;
  balance_usd: number;
  total_spent: number;
  total_earned: number;
  last_transaction_at: string | null;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  agent_id: string | null;
  execution_id: string | null;
  amount: number;
  transaction_type: "credit" | "debit";
  source: "agent_execution" | "api_call" | "purchase" | "refund" | "bonus" | "platform_fee";
  description: string | null;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export interface MarketplaceAgent {
  id: string;
  agent_id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  category: string;
  price_per_execution: number;
  min_credits_required: number;
  execution_count: number;
  total_revenue: number;
  rating: number;
  rating_count: number;
  is_featured: boolean;
  status: "active" | "paused" | "deprecated";
  tags: string[];
  created_at: string;
}

export interface CreditPack {
  id: string;
  name: string;
  description: string | null;
  credits_amount: number;
  price_usd: number;
  bonus_credits: number;
  is_featured: boolean;
  stripe_price_id: string | null;
}

export function useAgentEconomy(userId?: string) {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [marketplaceAgents, setMarketplaceAgents] = useState<MarketplaceAgent[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("user_wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching wallet:", error);
      return;
    }

    if (!data) {
      // Create wallet if doesn't exist
      const { data: newWallet, error: createError } = await supabase
        .from("user_wallets")
        .insert({ user_id: userId, balance_credits: 10 })
        .select()
        .single();

      if (!createError && newWallet) {
        setWallet(newWallet as UserWallet);
      }
    } else {
      setWallet(data as UserWallet);
    }
  }, [userId]);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching transactions:", error);
      return;
    }

    setTransactions((data as CreditTransaction[]) || []);
  }, [userId]);

  const fetchMarketplaceAgents = async () => {
    const { data, error } = await supabase
      .from("agent_marketplace")
      .select("*")
      .eq("status", "active")
      .eq("is_public", true)
      .order("is_featured", { ascending: false })
      .order("execution_count", { ascending: false });

    if (error) {
      console.error("Error fetching marketplace agents:", error);
      return;
    }

    setMarketplaceAgents((data as MarketplaceAgent[]) || []);
  };

  const fetchCreditPacks = async () => {
    const { data, error } = await supabase
      .from("credit_packs")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      console.error("Error fetching credit packs:", error);
      return;
    }

    setCreditPacks((data as CreditPack[]) || []);
  };

  const executeAgent = async (agentId: string, parameters?: Record<string, unknown>) => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para executar agentes",
        variant: "destructive",
      });
      return null;
    }

    if (!wallet || wallet.balance_credits < 0.01) {
      toast({
        title: "Créditos Insuficientes",
        description: "Adicione mais créditos à sua carteira",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("agent-economy", {
        body: {
          action: "execute",
          agent_id: agentId,
          user_id: userId,
          parameters,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Execução Concluída",
          description: `Agente executado com sucesso! Custo: ${data.cost} créditos`,
        });
        
        // Refresh wallet
        fetchWallet();
        fetchTransactions();
      } else {
        toast({
          title: "Erro na Execução",
          description: data.error || "Falha ao executar agente",
          variant: "destructive",
        });
      }

      return data;
    } catch (error) {
      console.error("Error executing agent:", error);
      toast({
        title: "Erro",
        description: "Falha ao executar agente",
        variant: "destructive",
      });
      return null;
    }
  };

  const purchaseCredits = async (packId: string) => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para comprar créditos",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("agent-economy", {
        body: {
          action: "purchase_credits",
          user_id: userId,
          pack_id: packId,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Compra Realizada!",
          description: `${data.credits_added} créditos adicionados à sua carteira`,
        });
        
        fetchWallet();
        fetchTransactions();
      }

      return data;
    } catch (error) {
      console.error("Error purchasing credits:", error);
      toast({
        title: "Erro",
        description: "Falha ao comprar créditos",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchWallet(),
        fetchTransactions(),
        fetchMarketplaceAgents(),
        fetchCreditPacks(),
      ]);
      setLoading(false);
    };

    loadData();

    // Realtime subscriptions
    const walletChannel = supabase
      .channel("wallet-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_wallets", filter: `user_id=eq.${userId}` },
        () => fetchWallet()
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel("transactions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "credit_transactions", filter: `user_id=eq.${userId}` },
        () => fetchTransactions()
      )
      .subscribe();

    const marketplaceChannel = supabase
      .channel("marketplace-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_marketplace" },
        () => fetchMarketplaceAgents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(marketplaceChannel);
    };
  }, [userId, fetchWallet, fetchTransactions]);

  return {
    wallet,
    transactions,
    marketplaceAgents,
    creditPacks,
    loading,
    executeAgent,
    purchaseCredits,
    refetch: () => {
      fetchWallet();
      fetchTransactions();
      fetchMarketplaceAgents();
      fetchCreditPacks();
    },
  };
}
