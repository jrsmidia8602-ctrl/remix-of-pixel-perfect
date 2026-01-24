import { Card } from "@/components/ui/card";
import {
  Radio,
  Target,
  Flame,
  ThermometerSun,
  Snowflake,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import type { RadarStats } from "@/hooks/useDemandRadar";

interface RadarStatsCardsProps {
  stats: RadarStats;
}

export function RadarStatsCards({ stats }: RadarStatsCardsProps) {
  const cards = [
    {
      title: "Total Signals",
      value: stats.totalSignals,
      icon: Radio,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Opportunities",
      value: stats.totalOpportunities,
      icon: Target,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Hot Demands",
      value: stats.hotOpportunities,
      icon: Flame,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      title: "Warm Demands",
      value: stats.warmOpportunities,
      icon: ThermometerSun,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Cold Demands",
      value: stats.coldOpportunities,
      icon: Snowflake,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Potential Revenue",
      value: `$${stats.totalPotentialRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Avg Demand Score",
      value: stats.avgDemandScore,
      icon: TrendingUp,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
      {cards.map((card) => (
        <Card key={card.title} className="p-3 border-border bg-card/50">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{card.title}</p>
              <p className="text-lg font-bold">{card.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
