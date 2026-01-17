import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Bot, DollarSign, Activity, TrendingUp, RefreshCw, Zap, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface Agent {
  id: string;
  agent_name: string;
  agent_type: string;
  status: "idle" | "active" | "error" | "maintenance";
  daily_budget: number | null;
  total_revenue_generated: number | null;
  total_tasks_completed: number | null;
  success_rate: number | null;
  last_active_at: string | null;
  performance_score: number | null;
}

const AGENT_TYPE_ICONS: Record<string, string> = {
  api_consumer: "🔌",
  volume_generator: "📊",
  payment_bot: "💳",
  nft_minter: "🎨",
};

export function AgentFleetControl() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [runningCycle, setRunningCycle] = useState(false);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("autonomous_agents")
        .select("*")
        .order("total_revenue_generated", { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();

    const channel = supabase
      .channel("agents-control")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "autonomous_agents" },
        () => fetchAgents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleAgentStatus = async (agent: Agent) => {
    setUpdating(agent.id);
    const newStatus = agent.status === "active" ? "idle" : "active";

    try {
      const { error } = await supabase
        .from("autonomous_agents")
        .update({ status: newStatus, last_active_at: new Date().toISOString() })
        .eq("id", agent.id);

      if (error) throw error;

      toast.success(`${agent.agent_name} ${newStatus === "active" ? "activated" : "paused"}`);
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error("Failed to update agent status");
    } finally {
      setUpdating(null);
    }
  };

  const updateBudget = async (agentId: string, budget: number) => {
    try {
      const { error } = await supabase
        .from("autonomous_agents")
        .update({ daily_budget: budget })
        .eq("id", agentId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating budget:", error);
    }
  };

  const runScheduledCycle = async () => {
    setRunningCycle(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-scheduler", {
        body: { action: "run_scheduled_cycle" },
      });

      if (error) throw error;

      toast.success("Execution cycle completed", {
        description: `Processed ${data?.processed || 0} agents`,
      });
      fetchAgents();
    } catch (error) {
      console.error("Error running cycle:", error);
      toast.error("Failed to run execution cycle");
    } finally {
      setRunningCycle(false);
    }
  };

  const activateAllAgents = async () => {
    try {
      const { error } = await supabase
        .from("autonomous_agents")
        .update({ status: "active", daily_budget: 100 })
        .neq("status", "active");

      if (error) throw error;

      toast.success("All agents activated with $100 daily budget");
      fetchAgents();
    } catch (error) {
      console.error("Error activating agents:", error);
      toast.error("Failed to activate agents");
    }
  };

  const getStatusBadge = (status: Agent["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/20 text-success border-success/30"><Activity className="w-3 h-3 mr-1" /> Active</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "maintenance":
        return <Badge variant="secondary">Maintenance</Badge>;
      default:
        return <Badge variant="outline">Idle</Badge>;
    }
  };

  const totalRevenue = agents.reduce((acc, a) => acc + (a.total_revenue_generated || 0), 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;

  if (loading) {
    return (
      <Card className="border-border bg-card/50">
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-crypto-purple" />
              Agent Fleet Control
            </CardTitle>
            <CardDescription>
              Manage and monitor your autonomous agent fleet
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={activateAllAgents}>
              <Zap className="h-4 w-4 mr-2" />
              Activate All
            </Button>
            <Button onClick={runScheduledCycle} disabled={runningCycle}>
              {runningCycle ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Cycle
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fleet Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-crypto-purple/10 border border-crypto-purple/30">
            <p className="text-xs text-muted-foreground">Total Agents</p>
            <p className="text-2xl font-bold">{agents.length}</p>
          </div>
          <div className="p-4 rounded-lg bg-success/10 border border-success/30">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-success">{activeAgents}</p>
          </div>
          <div className="p-4 rounded-lg bg-crypto-green/10 border border-crypto-green/30">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-crypto-green">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-lg bg-crypto-cyan/10 border border-crypto-cyan/30">
            <p className="text-xs text-muted-foreground">Avg Success Rate</p>
            <p className="text-2xl font-bold text-crypto-cyan">
              {agents.length > 0
                ? (agents.reduce((acc, a) => acc + (a.success_rate || 0), 0) / agents.length * 100).toFixed(0)
                : 0}%
            </p>
          </div>
        </div>

        {/* Agent Cards */}
        <div className="space-y-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-4 rounded-lg border border-border bg-muted/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{AGENT_TYPE_ICONS[agent.agent_type] || "🤖"}</span>
                  <div>
                    <h4 className="font-semibold">{agent.agent_name}</h4>
                    <p className="text-xs text-muted-foreground capitalize">
                      {agent.agent_type.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(agent.status)}
                  <Switch
                    checked={agent.status === "active"}
                    onCheckedChange={() => toggleAgentStatus(agent)}
                    disabled={updating === agent.id}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Revenue
                  </p>
                  <p className="font-semibold">${(agent.total_revenue_generated || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3" /> Tasks
                  </p>
                  <p className="font-semibold">{agent.total_tasks_completed || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Success Rate
                  </p>
                  <p className="font-semibold">{((agent.success_rate || 0) * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Performance</p>
                  <Progress value={(agent.performance_score || 0) * 100} className="mt-1" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">
                    Daily Budget: ${agent.daily_budget || 0}
                  </p>
                </div>
                <Slider
                  value={[agent.daily_budget || 10]}
                  min={1}
                  max={500}
                  step={10}
                  onValueCommit={(value) => updateBudget(agent.id, value[0])}
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
