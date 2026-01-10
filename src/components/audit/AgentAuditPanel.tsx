import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bot, Play, Pause, RefreshCw, DollarSign, CheckCircle, XCircle } from "lucide-react";
import type { AgentMetrics } from "@/hooks/useSystemAudit";

interface AgentAuditPanelProps {
  data: AgentMetrics;
  onRemediate?: (action: string) => void;
}

export function AgentAuditPanel({ data, onRemediate }: AgentAuditPanelProps) {
  const idleAgents = data.totalAgents - data.activeAgents;
  const utilizationRate = data.totalAgents > 0 ? (data.activeAgents / data.totalAgents) * 100 : 0;

  const stats = [
    {
      label: "Total Agents",
      value: data.totalAgents,
      icon: Bot,
      color: "text-blue-500",
    },
    {
      label: "Active",
      value: data.activeAgents,
      icon: Play,
      color: "text-green-500",
    },
    {
      label: "Idle",
      value: idleAgents,
      icon: Pause,
      color: "text-yellow-500",
    },
    {
      label: "Tasks Done",
      value: data.totalTasksCompleted,
      icon: CheckCircle,
      color: "text-emerald-500",
    },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-orange-500" />
            Agent System Audit
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemediate?.("restart_failed_agents")}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart Failed
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-4 rounded-lg bg-muted/50">
              <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Autonomy & Performance</h4>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Autonomy Level</span>
                  <span className="font-medium">{data.avgAutonomyLevel}%</span>
                </div>
                <Progress value={data.avgAutonomyLevel} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-yellow-500" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium">{data.avgSuccessRate.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={data.avgSuccessRate} 
                  className={`h-2 ${data.avgSuccessRate >= 80 ? "[&>div]:bg-green-500" : "[&>div]:bg-yellow-500"}`} 
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Utilization Rate</span>
                  <span className="font-medium">{utilizationRate.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={utilizationRate} 
                  className={`h-2 ${utilizationRate >= 70 ? "[&>div]:bg-blue-500" : "[&>div]:bg-yellow-500"}`} 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Revenue Generation</h4>
            
            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-muted-foreground">Total Revenue Generated</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400">
                ${data.totalRevenueGenerated.toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold">
                  ${(data.totalRevenueGenerated / Math.max(1, data.totalTasksCompleted)).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Avg Per Task</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold">
                  ${(data.totalRevenueGenerated / Math.max(1, data.totalAgents)).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Avg Per Agent</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50">
          <h4 className="text-sm font-medium mb-3">Agent Type Distribution</h4>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
              API Consumer x3
            </Badge>
            <Badge variant="outline" className="border-green-500/50 text-green-400">
              Payment Bot x2
            </Badge>
            <Badge variant="outline" className="border-purple-500/50 text-purple-400">
              Volume Generator x2
            </Badge>
            <Badge variant="outline" className="border-orange-500/50 text-orange-400">
              NFT Minter x1
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
