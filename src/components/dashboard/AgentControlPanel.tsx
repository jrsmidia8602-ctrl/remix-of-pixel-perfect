import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, RefreshCw, Zap, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  agent_name: string;
  agent_type: string;
  status: string;
  daily_budget: number;
  total_revenue_generated: number;
  total_tasks_completed: number;
  success_rate: number;
  last_active_at: string | null;
}

export function AgentControlPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [runningCycle, setRunningCycle] = useState(false);
  const { toast } = useToast();

  const fetchAgents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("autonomous_agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();

    const channel = supabase
      .channel("agent-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "autonomous_agents" },
        () => fetchAgents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAgents]);

  const toggleAgent = async (agent: Agent) => {
    try {
      setActivating(agent.id);
      const newStatus = agent.status === "active" ? "idle" : "active";
      
      const { error } = await supabase
        .from("autonomous_agents")
        .update({ 
          status: newStatus,
          last_active_at: new Date().toISOString()
        })
        .eq("id", agent.id);

      if (error) throw error;

      toast({
        title: newStatus === "active" ? "Agent Activated" : "Agent Paused",
        description: `${agent.agent_name} is now ${newStatus}`,
      });

      fetchAgents();
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to update agent: ${err instanceof Error ? err.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setActivating(null);
    }
  };

  const runExecutionCycle = async () => {
    try {
      setRunningCycle(true);
      
      const { data, error } = await supabase.functions.invoke("agent-scheduler", {
        body: { action: "run_scheduled_cycle" }
      });

      if (error) throw error;

      toast({
        title: "Execution Cycle Complete",
        description: `Processed ${data?.agents_processed || 0} agents, ${data?.executions || 0} executions`,
      });

      fetchAgents();
    } catch (err) {
      toast({
        title: "Cycle Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRunningCycle(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case "idle":
        return <Badge variant="secondary">Idle</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case "api_consumer":
        return "🔌";
      case "payment_bot":
        return "💳";
      case "nft_minter":
        return "🎨";
      case "volume_generator":
        return "📊";
      default:
        return "🤖";
    }
  };

  if (loading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Agent Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Agent Control</CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAgents}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={runExecutionCycle}
            disabled={runningCycle}
            className="gradient-primary"
          >
            <Zap className="h-4 w-4 mr-1" />
            {runningCycle ? "Running..." : "Run Cycle"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No agents configured</p>
            <p className="text-sm text-muted-foreground/70">
              Seed the database with agents to begin
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <div 
                key={agent.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getAgentTypeIcon(agent.agent_type)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{agent.agent_name}</span>
                      {getStatusBadge(agent.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${agent.total_revenue_generated?.toFixed(2) || "0.00"} revenue • {agent.total_tasks_completed || 0} tasks
                    </div>
                  </div>
                </div>
                <Button
                  variant={agent.status === "active" ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleAgent(agent)}
                  disabled={activating === agent.id}
                >
                  {activating === agent.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : agent.status === "active" ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
