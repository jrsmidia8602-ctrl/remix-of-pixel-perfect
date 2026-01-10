import { Card, CardContent } from "@/components/ui/card";
import { 
  Brain, 
  Bot, 
  Activity, 
  Target, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  XCircle
} from "lucide-react";

interface BrainStatsCardsProps {
  stats: {
    activeAgents: number;
    totalAgents: number;
    pendingTasks: number;
    executingTasks: number;
    completedTasks: number;
    failedTasks: number;
    openOpportunities: number;
    totalRevenue: number;
    avgSuccessRate: number;
  };
}

export function BrainStatsCards({ stats }: BrainStatsCardsProps) {
  const cards = [
    {
      title: "Active Agents",
      value: `${stats.activeAgents} / ${stats.totalAgents}`,
      icon: Bot,
      color: "text-crypto-purple",
      bg: "bg-crypto-purple/10",
    },
    {
      title: "Executing Tasks",
      value: stats.executingTasks.toString(),
      subtitle: `${stats.pendingTasks} pending`,
      icon: Activity,
      color: "text-crypto-cyan",
      bg: "bg-crypto-cyan/10",
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks.toString(),
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Failed Tasks",
      value: stats.failedTasks.toString(),
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      title: "Open Opportunities",
      value: stats.openOpportunities.toString(),
      icon: Target,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-crypto-green",
      bg: "bg-crypto-green/10",
    },
    {
      title: "Avg Success Rate",
      value: `${(stats.avgSuccessRate * 100).toFixed(0)}%`,
      icon: TrendingUp,
      color: "text-crypto-cyan",
      bg: "bg-crypto-cyan/10",
    },
    {
      title: "System Status",
      value: stats.activeAgents > 0 ? "Online" : "Idle",
      icon: Brain,
      color: stats.activeAgents > 0 ? "text-success" : "text-muted-foreground",
      bg: stats.activeAgents > 0 ? "bg-success/10" : "bg-muted",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">{card.title}</p>
                <p className="text-xl font-bold">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
