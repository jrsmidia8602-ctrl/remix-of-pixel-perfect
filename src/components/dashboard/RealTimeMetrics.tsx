import { DollarSign, Users, Percent, TrendingUp, Wallet, Bot, Zap, CreditCard, Calendar, CalendarDays } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useUnifiedDashboardData } from "@/hooks/useUnifiedDashboardData";
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
  const { stats, loading } = useUnifiedDashboardData();

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
      title: "Stripe Revenue",
      value: formatCurrency(stats.stripeRevenue),
      change: `${stats.stripePaymentsCount} payments`,
      changeType: stats.stripeRevenue > 0 ? "positive" : "neutral",
      icon: CreditCard,
      iconColor: "accent",
    },
    {
      title: "Weekly Revenue",
      value: formatCurrency(stats.weeklyRevenue),
      change: "Last 7 days",
      changeType: stats.weeklyRevenue > 0 ? "positive" : "neutral",
      icon: Calendar,
      iconColor: "success",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats.monthlyRevenue),
      change: "This month",
      changeType: stats.monthlyRevenue > 0 ? "positive" : "neutral",
      icon: CalendarDays,
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
      changeType: stats.yieldGenerated > 0 ? "positive" : "neutral",
      icon: TrendingUp,
      iconColor: "accent",
    },
    {
      title: "Active Agents",
      value: stats.activeBots.toString(),
      change: `${stats.pausedBots} idle`,
      changeType: stats.activeBots > 0 ? "positive" : "neutral",
      icon: Bot,
      iconColor: "warning",
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
