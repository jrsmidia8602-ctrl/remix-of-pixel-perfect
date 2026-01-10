import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  activeSellers: number;
  platformFees: number;
  yieldGenerated: number;
  cryptoVolume: number;
  activeBots: number;
  pausedBots: number;
  totalExecutions: number;
  successRate: number;
  pendingPayments: number;
}

interface RevenueDataPoint {
  name: string;
  fiat: number;
  crypto: number;
}

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    todayRevenue: 0,
    activeSellers: 0,
    platformFees: 0,
    yieldGenerated: 0,
    cryptoVolume: 0,
    activeBots: 0,
    pausedBots: 0,
    totalExecutions: 0,
    successRate: 0,
    pendingPayments: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        revenueResult,
        agentsResult,
        sellersResult,
        executionsResult,
        cryptoResult,
        pendingResult,
      ] = await Promise.all([
        // Total revenue from autonomous_revenue
        supabase
          .from("autonomous_revenue")
          .select("amount, platform_fee, revenue_source, created_at"),
        
        // Active agents
        supabase
          .from("autonomous_agents")
          .select("id, status, total_revenue_generated"),
        
        // Active sellers
        supabase
          .from("sellers")
          .select("id, stripe_account_status"),
        
        // Executions
        supabase
          .from("executions")
          .select("id, status, cost, revenue, created_at"),
        
        // Crypto transactions
        supabase
          .from("crypto_transactions")
          .select("amount, status"),
        
        // Pending payments
        supabase
          .from("pending_payments")
          .select("id, status, amount")
          .eq("status", "pending"),
      ]);

      // Calculate stats
      const revenue = revenueResult.data || [];
      const agents = agentsResult.data || [];
      const sellers = sellersResult.data || [];
      const executions = executionsResult.data || [];
      const cryptoTxs = cryptoResult.data || [];
      const pending = pendingResult.data || [];

      const totalRevenue = revenue.reduce((sum, r) => sum + Number(r.amount), 0);
      const platformFees = revenue.reduce((sum, r) => sum + Number(r.platform_fee || 0), 0);
      
      // Today's revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRevenue = revenue
        .filter(r => new Date(r.created_at) >= today)
        .reduce((sum, r) => sum + Number(r.amount), 0);

      // Agent stats
      const activeBots = agents.filter(a => a.status === "active").length;
      const pausedBots = agents.filter(a => a.status === "idle").length;

      // Seller stats
      const activeSellers = sellers.filter(s => s.stripe_account_status === "active").length;

      // Execution stats
      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(e => e.status === "completed").length;
      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

      // Crypto volume (sum of amounts)
      const cryptoVolume = cryptoTxs
        .filter(t => t.status === "completed")
        .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);

      // Yield generated (from yield sources)
      const yieldGenerated = revenue
        .filter(r => r.revenue_source === "yield")
        .reduce((sum, r) => sum + Number(r.amount), 0);

      // Pending payments count
      const pendingPayments = pending.length;

      setStats({
        totalRevenue,
        todayRevenue,
        activeSellers,
        platformFees,
        yieldGenerated,
        cryptoVolume,
        activeBots,
        pausedBots,
        totalExecutions,
        successRate,
        pendingPayments,
      });

      // Generate revenue chart data (last 7 days)
      const chartData: RevenueDataPoint[] = [];
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayRevenue = revenue.filter(r => {
          const rDate = new Date(r.created_at);
          return rDate >= date && rDate < nextDate;
        });

        const fiat = dayRevenue
          .filter(r => r.revenue_source !== "yield")
          .reduce((sum, r) => sum + Number(r.amount), 0);
        
        const crypto = dayRevenue
          .filter(r => r.revenue_source === "yield")
          .reduce((sum, r) => sum + Number(r.amount), 0);

        chartData.push({
          name: days[date.getDay()],
          fiat: Math.round(fiat * 100) / 100,
          crypto: Math.round(crypto * 100) / 100,
        });
      }

      setRevenueData(chartData);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Set up realtime subscriptions
    const revenueChannel = supabase
      .channel("dashboard-revenue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "autonomous_revenue" },
        () => fetchDashboardData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "executions" },
        () => fetchDashboardData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "autonomous_agents" },
        () => fetchDashboardData()
      )
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => {
      supabase.removeChannel(revenueChannel);
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  return {
    stats,
    revenueData,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}
