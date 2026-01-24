import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ModuleStatus {
  enabled: boolean;
  [key: string]: unknown;
}

export interface SystemStatus {
  timestamp: string;
  system_version: string;
  status: string;
  modules: {
    demand_radar: {
      enabled: boolean;
      total_signals: number;
      opportunities_found: number;
      hot_opportunities: number;
      warm_opportunities: number;
      auto_execute: boolean;
    };
    ai_core: {
      enabled: boolean;
      version: string;
      learning_mode: string;
      active_modules: string[];
    };
    marketplace: {
      connected: boolean;
      total_agents: number;
      active_agents: number;
      featured_agents: number;
      total_executions: number;
      total_revenue: number;
    };
    wallets: {
      connected: boolean;
      users_tracked: number;
      wallets_low_balance: number;
      total_credits_in_circulation: number;
      auto_recharge_enabled: boolean;
    };
    executions: {
      pending: number;
      completed_success: number;
      completed_failed: number;
      success_rate: string;
      avg_response_time_ms: number;
      auto_retry_enabled: boolean;
    };
    credit_packs: {
      active_packs: number;
    };
    economy_stats: {
      total_credits_in_circulation: number;
      total_credits_spent: number;
      total_credits_earned: number;
      total_wallets: number;
      marketplace: {
        total_agents: number;
        featured_agents: number;
        total_executions: number;
        total_revenue: number;
      };
      platform: {
        total_revenue: number;
        total_fees: number;
      };
    };
  };
  recommendations: string[];
}

export interface CycleResult {
  cycle_completed: boolean;
  actions_executed: {
    signals_scanned: number;
    signals_processed: number;
    offers_generated: number;
    offers_published: number;
    executions_retried: number;
    wallets_recharged: number;
    agents_rebalanced: number;
    hot_opportunities_created?: number;
  };
  current_status: SystemStatus;
}

export function useFullPowerOrchestrator() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastCycleResult, setLastCycleResult] = useState<CycleResult | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("full-power-orchestrator/status", {
        method: "GET",
      });

      if (error) throw error;
      if (data?.success) {
        setStatus(data as SystemStatus);
      }
    } catch (error) {
      console.error("Error fetching orchestrator status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const runCycle = useCallback(async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("full-power-orchestrator/run-cycle", {
        method: "POST",
      });

      if (error) throw error;

      if (data?.success) {
        setLastCycleResult(data as CycleResult);
        setStatus(data.current_status);
        toast.success("Full Power Cycle completed!", {
          description: `${data.actions_executed.signals_processed} signals processed, ${data.actions_executed.offers_published} offers published`,
        });
      }

      return data;
    } catch (error) {
      console.error("Error running cycle:", error);
      toast.error("Failed to run Full Power Cycle");
      return null;
    } finally {
      setRunning(false);
    }
  }, []);

  const triggerScan = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("full-power-orchestrator/trigger-scan", {
        method: "POST",
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${data.signals_generated} signals generated`);
        await fetchStatus();
      }

      return data;
    } catch (error) {
      console.error("Error triggering scan:", error);
      toast.error("Failed to trigger scan");
      return null;
    }
  }, [fetchStatus]);

  const processPipeline = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("full-power-orchestrator/process-pipeline", {
        method: "POST",
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Pipeline completed: ${data.pipeline.processed} signals, ${data.offers.published} offers`);
        await fetchStatus();
      }

      return data;
    } catch (error) {
      console.error("Error processing pipeline:", error);
      toast.error("Failed to process pipeline");
      return null;
    }
  }, [fetchStatus]);

  const retryExecutions = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("full-power-orchestrator/retry-executions", {
        method: "POST",
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${data.executions_retried} executions retried`);
        await fetchStatus();
      }

      return data;
    } catch (error) {
      console.error("Error retrying executions:", error);
      toast.error("Failed to retry executions");
      return null;
    }
  }, [fetchStatus]);

  const rechargeWallets = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("full-power-orchestrator/recharge-wallets", {
        method: "POST",
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${data.wallets_recharged} wallets recharged`);
        await fetchStatus();
      }

      return data;
    } catch (error) {
      console.error("Error recharging wallets:", error);
      toast.error("Failed to recharge wallets");
      return null;
    }
  }, [fetchStatus]);

  const rebalanceAgents = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("full-power-orchestrator/rebalance-agents", {
        method: "POST",
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${data.agents_rebalanced} agents rebalanced`);
        await fetchStatus();
      }

      return data;
    } catch (error) {
      console.error("Error rebalancing agents:", error);
      toast.error("Failed to rebalance agents");
      return null;
    }
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    status,
    loading,
    running,
    lastCycleResult,
    fetchStatus,
    runCycle,
    triggerScan,
    processPipeline,
    retryExecutions,
    rechargeWallets,
    rebalanceAgents,
  };
}
