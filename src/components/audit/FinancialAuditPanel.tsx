import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Percent, PiggyBank, BarChart3 } from "lucide-react";
import type { FinancialMetrics } from "@/hooks/useSystemAudit";

interface FinancialAuditPanelProps {
  data: FinancialMetrics;
}

export function FinancialAuditPanel({ data }: FinancialAuditPanelProps) {
  const revenueStreams = Object.entries(data.revenueByStream).map(([source, amount]) => ({
    source: source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    amount,
    percentage: data.totalRevenue > 0 ? (amount / data.totalRevenue) * 100 : 0,
  }));

  const metrics = [
    {
      title: "Total Revenue",
      value: `$${data.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      trend: data.monthlyGrowth,
      description: "Last 30 days",
    },
    {
      title: "Platform Fees",
      value: `$${data.platformFees.toLocaleString()}`,
      icon: PiggyBank,
      trend: null,
      description: "Collected fees",
    },
    {
      title: "Agent Profitability",
      value: `${data.agentProfitability.toFixed(1)}%`,
      icon: Percent,
      trend: null,
      description: "Net margin",
    },
    {
      title: "Yield Generated",
      value: `$${data.yieldGenerated.toLocaleString()}`,
      icon: BarChart3,
      trend: null,
      description: "DeFi earnings",
    },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Financial Audit
          </CardTitle>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <TrendingUp className="h-3 w-3 mr-1" />
            +{data.monthlyGrowth}% MoM
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div key={metric.title} className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <metric.icon className="h-4 w-4" />
                <span className="text-xs">{metric.title}</span>
              </div>
              <p className="text-xl font-bold">{metric.value}</p>
              <div className="flex items-center gap-1">
                {metric.trend !== null && (
                  metric.trend >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )
                )}
                <span className="text-xs text-muted-foreground">{metric.description}</span>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3">Revenue by Stream</h4>
          <div className="space-y-3">
            {revenueStreams.map((stream) => (
              <div key={stream.source} className="flex items-center gap-3">
                <div className="w-24 text-sm text-muted-foreground truncate">
                  {stream.source}
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                      style={{ width: `${stream.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right text-sm font-medium">
                  ${stream.amount.toLocaleString()}
                </div>
                <div className="w-12 text-right text-xs text-muted-foreground">
                  {stream.percentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-500">$10K</p>
            <p className="text-xs text-muted-foreground">Monthly Target</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {((data.totalRevenue / 10000) * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-cyan-500">20%</p>
            <p className="text-xs text-muted-foreground">Growth Target</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
