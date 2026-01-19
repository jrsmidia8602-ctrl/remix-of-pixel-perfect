import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

interface DashboardStats {
  // Revenue Stats
  totalRevenue: number;
  stripeRevenue: number;
  platformRevenue: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  
  // Business Stats
  activeSellers: number;
  platformFees: number;
  yieldGenerated: number;
  cryptoVolume: number;
  
  // Agent Stats
  activeBots: number;
  pausedBots: number;
  totalExecutions: number;
  successRate: number;
  pendingPayments: number;
  
  // Stripe Stats
  stripePaymentsCount: number;
  stripeTodayCount: number;
  stripeSuccessRate: number;
}

interface RevenueDataPoint {
  name: string;
  stripe: number;
  platform: number;
  yield: number;
}

interface PaymentMethodData {
  name: string;
  value: number;
  color: string;
}

export function useUnifiedDashboardData() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    stripeRevenue: 0,
    platformRevenue: 0,
    todayRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    activeSellers: 0,
    platformFees: 0,
    yieldGenerated: 0,
    cryptoVolume: 0,
    activeBots: 0,
    pausedBots: 0,
    totalExecutions: 0,
    successRate: 0,
    pendingPayments: 0,
    stripePaymentsCount: 0,
    stripeTodayCount: 0,
    stripeSuccessRate: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [stripePayments, setStripePayments] = useState<StripePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStripePayments = async (): Promise<StripePayment[]> => {
    try {
      const { data, error } = await supabase.functions.invoke("list-stripe-payments", {
        body: { limit: 100 },
      });

      if (error) {
        console.error("Error fetching Stripe payments:", error);
        return [];
      }

      return data?.payments || [];
    } catch (err) {
      console.error("Error fetching Stripe payments:", err);
      return [];
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel including Stripe
      const [
        revenueResult,
        agentsResult,
        sellersResult,
        executionsResult,
        cryptoResult,
        pendingResult,
        paymentsResult,
        stripePaymentsData,
      ] = await Promise.all([
        supabase.from("autonomous_revenue").select("amount, platform_fee, revenue_source, created_at"),
        supabase.from("autonomous_agents").select("id, status, total_revenue_generated"),
        supabase.from("sellers").select("id, stripe_account_status"),
        supabase.from("executions").select("id, status, cost, revenue, created_at"),
        supabase.from("crypto_transactions").select("amount, status, chain, token"),
        supabase.from("pending_payments").select("id, status, amount").eq("status", "pending"),
        supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(100),
        fetchStripePayments(),
      ]);

      const revenue = revenueResult.data || [];
      const agents = agentsResult.data || [];
      const sellers = sellersResult.data || [];
      const executions = executionsResult.data || [];
      const cryptoTxs = cryptoResult.data || [];
      const pending = pendingResult.data || [];
      const dbPayments = paymentsResult.data || [];

      // Calculate Stripe revenue (amounts are in cents)
      const successfulStripePayments = stripePaymentsData.filter(p => p.status === "succeeded");
      const stripeRevenue = successfulStripePayments.reduce((sum, p) => sum + (p.amount / 100), 0);
      
      // Calculate platform revenue from autonomous_revenue table
      const platformRevenue = revenue.reduce((sum, r) => sum + Number(r.amount), 0);
      const platformFees = revenue.reduce((sum, r) => sum + Number(r.platform_fee || 0), 0);

      // Total revenue combines Stripe + Platform
      const totalRevenue = stripeRevenue + platformRevenue;

      // Time-based calculations
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Today's Stripe revenue
      const todayStripe = stripePaymentsData
        .filter(p => p.status === "succeeded" && new Date(p.created * 1000) >= today)
        .reduce((sum, p) => sum + (p.amount / 100), 0);

      // Today's platform revenue
      const todayPlatform = revenue
        .filter(r => new Date(r.created_at) >= today)
        .reduce((sum, r) => sum + Number(r.amount), 0);

      const todayRevenue = todayStripe + todayPlatform;

      // Weekly revenue
      const weeklyStripe = stripePaymentsData
        .filter(p => p.status === "succeeded" && new Date(p.created * 1000) >= weekAgo)
        .reduce((sum, p) => sum + (p.amount / 100), 0);

      const weeklyPlatform = revenue
        .filter(r => new Date(r.created_at) >= weekAgo)
        .reduce((sum, r) => sum + Number(r.amount), 0);

      const weeklyRevenue = weeklyStripe + weeklyPlatform;

      // Monthly revenue
      const monthlyStripe = stripePaymentsData
        .filter(p => p.status === "succeeded" && new Date(p.created * 1000) >= monthStart)
        .reduce((sum, p) => sum + (p.amount / 100), 0);

      const monthlyPlatform = revenue
        .filter(r => new Date(r.created_at) >= monthStart)
        .reduce((sum, r) => sum + Number(r.amount), 0);

      const monthlyRevenue = monthlyStripe + monthlyPlatform;

      // Agent stats
      const activeBots = agents.filter(a => a.status === "active").length;
      const pausedBots = agents.filter(a => a.status === "idle").length;

      // Seller stats
      const activeSellers = sellers.filter(s => s.stripe_account_status === "active").length;

      // Execution stats
      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(e => e.status === "completed").length;
      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

      // Crypto volume
      const cryptoVolume = cryptoTxs
        .filter(t => t.status === "completed")
        .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);

      // Yield generated
      const yieldGenerated = revenue
        .filter(r => r.revenue_source === "yield")
        .reduce((sum, r) => sum + Number(r.amount), 0);

      // Stripe stats
      const stripeTodayCount = stripePaymentsData.filter(
        p => new Date(p.created * 1000) >= today
      ).length;
      const stripeSuccessRate = stripePaymentsData.length > 0 
        ? (successfulStripePayments.length / stripePaymentsData.length) * 100 
        : 0;

      setStats({
        totalRevenue,
        stripeRevenue,
        platformRevenue,
        todayRevenue,
        weeklyRevenue,
        monthlyRevenue,
        activeSellers,
        platformFees,
        yieldGenerated,
        cryptoVolume,
        activeBots,
        pausedBots,
        totalExecutions,
        successRate,
        pendingPayments: pending.length,
        stripePaymentsCount: stripePaymentsData.length,
        stripeTodayCount,
        stripeSuccessRate,
      });

      setStripePayments(stripePaymentsData);

      // Generate revenue chart data (last 7 days)
      const chartData: RevenueDataPoint[] = [];
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        // Stripe revenue for this day
        const dayStripe = stripePaymentsData
          .filter(p => {
            const pDate = new Date(p.created * 1000);
            return p.status === "succeeded" && pDate >= date && pDate < nextDate;
          })
          .reduce((sum, p) => sum + (p.amount / 100), 0);

        // Platform revenue for this day
        const dayPlatform = revenue
          .filter(r => {
            const rDate = new Date(r.created_at);
            return r.revenue_source !== "yield" && rDate >= date && rDate < nextDate;
          })
          .reduce((sum, r) => sum + Number(r.amount), 0);

        // Yield revenue for this day
        const dayYield = revenue
          .filter(r => {
            const rDate = new Date(r.created_at);
            return r.revenue_source === "yield" && rDate >= date && rDate < nextDate;
          })
          .reduce((sum, r) => sum + Number(r.amount), 0);

        chartData.push({
          name: days[date.getDay()],
          stripe: Math.round(dayStripe * 100) / 100,
          platform: Math.round(dayPlatform * 100) / 100,
          yield: Math.round(dayYield * 100) / 100,
        });
      }

      setRevenueData(chartData);

      // Calculate payment methods distribution
      const methodsMap: Record<string, number> = {
        Stripe: stripeRevenue,
      };

      // Add crypto by chain/token
      cryptoTxs
        .filter(t => t.status === "completed")
        .forEach(t => {
          const key = t.token || t.chain || "Crypto";
          methodsMap[key] = (methodsMap[key] || 0) + parseFloat(t.amount || "0");
        });

      // Add yield
      if (yieldGenerated > 0) {
        methodsMap["DeFi Yield"] = yieldGenerated;
      }

      const colors: Record<string, string> = {
        Stripe: "hsl(263 70% 58%)",
        ETH: "hsl(217 91% 60%)",
        USDC: "hsl(187 92% 45%)",
        USDT: "hsl(142 76% 45%)",
        "DeFi Yield": "hsl(45 93% 47%)",
        Crypto: "hsl(280 65% 60%)",
      };

      const paymentMethodsData: PaymentMethodData[] = Object.entries(methodsMap)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name,
          value: Math.round(value * 100) / 100,
          color: colors[name] || "hsl(215 20% 55%)",
        }));

      setPaymentMethods(paymentMethodsData);
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
    const channel = supabase
      .channel("unified-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "autonomous_revenue" },
        () => fetchDashboardData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
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
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  return {
    stats,
    revenueData,
    paymentMethods,
    stripePayments,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}
