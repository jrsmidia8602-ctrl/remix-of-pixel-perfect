import { DollarSign, Users, Percent, TrendingUp, Wallet, Bot, Zap, CheckCircle } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

export function RealTimeMetrics() {
  const { stats, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const metrics: Array<{
    title: string;
    value: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    icon: typeof DollarSign;
    iconColor: "primary" | "accent" | "success" | "warning" | "destructive";
  }> = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: `+${formatCurrency(stats.todayRevenue)} today`,
      changeType: stats.todayRevenue > 0 ? "positive" : "neutral",
      icon: DollarSign,
      iconColor: "primary",
    },
    {
      title: "Active Sellers",
      value: formatNumber(stats.activeSellers),
      change: `${stats.activeSellers} verified`,
      changeType: "positive",
      icon: Users,
      iconColor: "accent",
    },
    {
      title: "Platform Fees",
      value: formatCurrency(stats.platformFees),
      change: "5% commission",
      changeType: "positive",
      icon: Percent,
      iconColor: "success",
    },
    {
      title: "Yield Generated",
      value: formatCurrency(stats.yieldGenerated),
      change: "From DeFi",
      changeType: "neutral",
      icon: TrendingUp,
      iconColor: "accent",
    },
    {
      title: "Crypto Volume",
      value: `${stats.cryptoVolume.toFixed(2)} ETH`,
      change: "All chains",
      changeType: "neutral",
      icon: Wallet,
      iconColor: "primary",
    },
    {
      title: "Active Agents",
      value: stats.activeBots.toString(),
      change: `${stats.pausedBots} idle`,
      changeType: stats.activeBots > 0 ? "positive" : "neutral",
      icon: Bot,
      iconColor: "warning",
    },
    {
      title: "Executions",
      value: formatNumber(stats.totalExecutions),
      change: `${stats.successRate.toFixed(1)}% success`,
      changeType: stats.successRate >= 90 ? "positive" : "neutral",
      icon: Zap,
      iconColor: "accent",
    },
    {
      title: "Pending",
      value: stats.pendingPayments.toString(),
      change: "Payments queued",
      changeType: stats.pendingPayments > 5 ? "negative" : "neutral",
      icon: CheckCircle,
      iconColor: "success",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          changeType={metric.changeType}
          icon={metric.icon}
          iconColor={metric.iconColor}
        />
      ))}
    </div>
  );
}
