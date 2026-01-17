import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bot, 
  TrendingUp, 
  DollarSign,
  Zap,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AgentPerf {
  id: string;
  name: string;
  type: string;
  revenue: number;
  tasks: number;
  successRate: number;
  isActive: boolean;
}

export function AgentPerformanceChart() {
  const [agents, setAgents] = useState<AgentPerf[]>([]);
  const [topPerformer, setTopPerformer] = useState<AgentPerf | null>(null);

  useEffect(() => {
    fetchAgentPerformance();
    
    const channel = supabase
      .channel("agent-perf-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "autonomous_agents" },
        () => fetchAgentPerformance()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAgentPerformance = async () => {
    const { data, error } = await supabase
      .from("autonomous_agents")
      .select("*")
      .order("total_revenue_generated", { ascending: false });

    if (error) {
      console.error("Error fetching agent performance:", error);
      return;
    }

    const mapped: AgentPerf[] = (data || []).map(a => ({
      id: a.id,
      name: a.agent_name,
      type: a.agent_type,
      revenue: Number(a.total_revenue_generated) || 0,
      tasks: Number(a.total_tasks_completed) || 0,
      successRate: Number(a.success_rate) || 0,
      isActive: a.status === "active",
    }));

    setAgents(mapped);
    setTopPerformer(mapped[0] || null);
  };

  const maxRevenue = Math.max(...agents.map(a => a.revenue), 0.001);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "api_consumer":
        return <Zap className="h-3 w-3" />;
      case "payment_bot":
        return <DollarSign className="h-3 w-3" />;
      case "nft_minter":
        return <Target className="h-3 w-3" />;
      default:
        return <Bot className="h-3 w-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "api_consumer":
        return "text-crypto-cyan";
      case "payment_bot":
        return "text-success";
      case "nft_minter":
        return "text-crypto-purple";
      default:
        return "text-warning";
    }
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart className="h-5 w-5 text-success" />
            Agent Performance
          </CardTitle>
          {topPerformer && (
            <Badge variant="outline" className="bg-crypto-purple/10 text-crypto-purple border-crypto-purple/20">
              🏆 {topPerformer.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-bold">{agents.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Agents</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-bold">{agents.filter(a => a.isActive).length}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-bold">
              ${agents.reduce((s, a) => s + a.revenue, 0).toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">Total Revenue</p>
          </div>
        </div>

        {/* Agent Bars */}
        <div className="space-y-3">
          {agents.map((agent, idx) => (
            <div key={agent.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`${getTypeColor(agent.type)}`}>
                    {getTypeIcon(agent.type)}
                  </span>
                  <span className="text-sm font-medium">{agent.name}</span>
                  {agent.isActive && (
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {agent.tasks} tasks
                  </span>
                  <span className="text-sm font-medium text-success">
                    ${agent.revenue.toFixed(3)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(agent.revenue / maxRevenue) * 100} 
                  className="h-2 flex-1"
                />
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {agent.successRate.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No agents configured
          </div>
        )}
      </CardContent>
    </Card>
  );
}
