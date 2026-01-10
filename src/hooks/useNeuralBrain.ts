import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Agent {
  id: string;
  agent_name: string;
  agent_type: "api_consumer" | "payment_bot" | "nft_minter" | "volume_generator";
  status: "idle" | "active" | "error" | "maintenance";
  performance_score: number;
  success_rate: number;
  total_tasks_completed: number;
  total_revenue_generated: number;
  daily_budget: number;
  last_active_at: string;
  last_heartbeat_at: string | null;
  current_task_id: string | null;
  error_count: number;
  last_error: string | null;
}

export interface BrainTask {
  id: string;
  task_type: "api_consumption" | "payment" | "nft_mint" | "volume_generation";
  status: "pending" | "assigned" | "executing" | "completed" | "failed" | "cancelled";
  priority: number;
  allocated_budget: number;
  expected_revenue: number | null;
  actual_revenue: number | null;
  assigned_agent_id: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_details: string | null;
}

export interface MarketOpportunity {
  id: string;
  api_product_id: string;
  demand_score: number;
  competition_score: number;
  complexity_score: number;
  potential_revenue: number;
  estimated_cost: number;
  status: "detected" | "scheduled" | "executing" | "completed" | "expired";
  detection_time: string;
  assigned_agent_id: string | null;
}

export interface BrainReport {
  id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  total_cost: number;
  net_profit: number;
  active_agents: number;
  total_tasks_completed: number;
  total_tasks_failed: number;
  system_efficiency_score: number;
  avg_success_rate: number;
}

export function useNeuralBrain() {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<BrainTask[]>([]);
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [latestReport, setLatestReport] = useState<BrainReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from("autonomous_agents")
      .select("*")
      .order("last_active_at", { ascending: false });

    if (error) {
      console.error("Error fetching agents:", error);
      return;
    }
    setAgents((data as any[]) || []);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("brain_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching tasks:", error);
      return;
    }
    setTasks((data as any[]) || []);
  };

  const fetchOpportunities = async () => {
    const { data, error } = await supabase
      .from("market_opportunities")
      .select("*")
      .order("detection_time", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching opportunities:", error);
      return;
    }
    setOpportunities((data as any[]) || []);
  };

  const fetchLatestReport = async () => {
    const { data, error } = await supabase
      .from("brain_reports")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching report:", error);
      return;
    }
    setLatestReport((data as any) || null);
  };

  const triggerBrainCycle = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("neural-brain", {
        body: { action: "run_cycle" },
      });

      if (error) throw error;

      toast({
        title: "Brain Cycle Triggered",
        description: "The Neural Brain is processing opportunities...",
      });

      // Refresh data after cycle
      setTimeout(() => {
        fetchAgents();
        fetchTasks();
        fetchOpportunities();
      }, 2000);

      return data;
    } catch (error) {
      console.error("Error triggering brain cycle:", error);
      toast({
        title: "Error",
        description: "Failed to trigger brain cycle",
        variant: "destructive",
      });
    }
  };

  const updateAgentStatus = async (agentId: string, status: Agent["status"]) => {
    const { error } = await supabase
      .from("autonomous_agents")
      .update({ status, updated_at: new Date().toISOString() } as any)
      .eq("id", agentId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update agent status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Agent Updated",
      description: `Agent status changed to ${status}`,
    });

    fetchAgents();
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAgents(),
        fetchTasks(),
        fetchOpportunities(),
        fetchLatestReport(),
      ]);
      setLoading(false);
    };

    loadData();

    // Set up realtime subscriptions
    const agentChannel = supabase
      .channel("agents-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "autonomous_agents" },
        () => fetchAgents()
      )
      .subscribe();

    const taskChannel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brain_tasks" },
        () => fetchTasks()
      )
      .subscribe();

    const opportunityChannel = supabase
      .channel("opportunities-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_opportunities" },
        () => fetchOpportunities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(agentChannel);
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(opportunityChannel);
    };
  }, []);

  const stats = {
    activeAgents: agents.filter((a) => a.status === "active").length,
    totalAgents: agents.length,
    pendingTasks: tasks.filter((t) => t.status === "pending").length,
    executingTasks: tasks.filter((t) => t.status === "executing").length,
    completedTasks: tasks.filter((t) => t.status === "completed").length,
    failedTasks: tasks.filter((t) => t.status === "failed").length,
    openOpportunities: opportunities.filter((o) => o.status === "detected").length,
    totalRevenue: agents.reduce((sum, a) => sum + Number(a.total_revenue_generated || 0), 0),
    avgSuccessRate: agents.length > 0
      ? agents.reduce((sum, a) => sum + Number(a.success_rate || 0), 0) / agents.length
      : 0,
  };

  return {
    agents,
    tasks,
    opportunities,
    latestReport,
    loading,
    stats,
    triggerBrainCycle,
    updateAgentStatus,
    refetch: () => {
      fetchAgents();
      fetchTasks();
      fetchOpportunities();
      fetchLatestReport();
    },
  };
}
