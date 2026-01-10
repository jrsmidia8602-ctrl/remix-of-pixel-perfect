import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Bot, 
  Cpu, 
  DollarSign, 
  Activity, 
  AlertTriangle,
  Zap,
  CheckCircle,
  PauseCircle,
  Settings
} from "lucide-react";
import type { Agent } from "@/hooks/useNeuralBrain";

interface AgentStatusCardProps {
  agent: Agent;
  onStatusChange: (agentId: string, status: Agent["status"]) => void;
}

const agentTypeConfig = {
  api_consumer: { 
    label: "API Consumer", 
    color: "bg-crypto-purple/10 text-crypto-purple border-crypto-purple/20",
    icon: Cpu
  },
  payment_bot: { 
    label: "Payment Bot", 
    color: "bg-crypto-cyan/10 text-crypto-cyan border-crypto-cyan/20",
    icon: DollarSign
  },
  nft_minter: { 
    label: "NFT Minter", 
    color: "bg-crypto-pink/10 text-crypto-pink border-crypto-pink/20",
    icon: Zap
  },
  volume_generator: { 
    label: "Volume Generator", 
    color: "bg-crypto-blue/10 text-crypto-blue border-crypto-blue/20",
    icon: Activity
  },
};

const statusConfig = {
  idle: { 
    label: "Idle", 
    color: "bg-muted text-muted-foreground border-border",
    icon: PauseCircle
  },
  active: { 
    label: "Active", 
    color: "bg-success/10 text-success border-success/20",
    icon: CheckCircle
  },
  error: { 
    label: "Error", 
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertTriangle
  },
  maintenance: { 
    label: "Maintenance", 
    color: "bg-warning/10 text-warning border-warning/20",
    icon: Settings
  },
};

export function AgentStatusCard({ agent, onStatusChange }: AgentStatusCardProps) {
  const typeInfo = agentTypeConfig[agent.agent_type];
  const statusInfo = statusConfig[agent.status];
  const TypeIcon = typeInfo.icon;
  const StatusIcon = statusInfo.icon;

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Card className="border-border bg-card/50 hover:border-primary/50 transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary">
              <TypeIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">{agent.agent_name}</CardTitle>
              <Badge variant="outline" className={typeInfo.color}>
                {typeInfo.label}
              </Badge>
            </div>
          </div>
          <Switch 
            checked={agent.status === "active"} 
            onCheckedChange={(checked) => 
              onStatusChange(agent.id, checked ? "active" : "idle")
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status & Performance */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={statusInfo.color}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusInfo.label}
            </Badge>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Performance</span>
              <p className="text-lg font-bold text-crypto-cyan">
                {(Number(agent.performance_score) * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground">Tasks Done</p>
              <p className="text-lg font-semibold">{agent.total_tasks_completed}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground">Success Rate</p>
              <p className="text-lg font-semibold text-success">
                {(Number(agent.success_rate) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground">Revenue</p>
              <p className="text-lg font-semibold text-crypto-cyan">
                ${Number(agent.total_revenue_generated).toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground">Last Active</p>
              <p className="text-lg font-semibold">{formatTime(agent.last_active_at)}</p>
            </div>
          </div>

          {/* Error Display */}
          {agent.last_error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Last Error</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground truncate">
                {agent.last_error}
              </p>
            </div>
          )}

          {/* Budget Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Daily Budget</span>
              <span className="font-medium">${Number(agent.daily_budget).toFixed(0)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full gradient-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, (Number(agent.total_revenue_generated) / Number(agent.daily_budget)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
