import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, Shield, DollarSign, Bot, Database, Zap } from "lucide-react";
import type { SystemAuditData } from "@/hooks/useSystemAudit";

interface SystemHealthOverviewProps {
  data: SystemAuditData;
}

export function SystemHealthOverview({ data }: SystemHealthOverviewProps) {
  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Healthy</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
  };

  const metrics = [
    {
      title: "Overall Health",
      value: `${data.overallHealth}%`,
      icon: Activity,
      color: getHealthColor(data.overallHealth),
      progress: data.overallHealth,
    },
    {
      title: "Security Score",
      value: `${100 - data.security.vulnerabilities.critical * 10 - data.security.vulnerabilities.high * 5}%`,
      icon: Shield,
      color: data.security.vulnerabilities.critical === 0 ? "text-green-500" : "text-red-500",
      progress: 100 - data.security.vulnerabilities.critical * 10,
    },
    {
      title: "Total Revenue",
      value: `$${data.financial.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-500",
      progress: Math.min(100, (data.financial.totalRevenue / 10000) * 100),
    },
    {
      title: "Agent Efficiency",
      value: `${data.agents.avgSuccessRate.toFixed(1)}%`,
      icon: Bot,
      color: data.agents.avgSuccessRate >= 80 ? "text-green-500" : "text-yellow-500",
      progress: data.agents.avgSuccessRate,
    },
    {
      title: "DB Latency",
      value: `${data.performance.dbLatency}ms`,
      icon: Database,
      color: data.performance.dbLatency < 20 ? "text-green-500" : "text-yellow-500",
      progress: Math.max(0, 100 - data.performance.dbLatency * 2),
    },
    {
      title: "Uptime",
      value: `${data.performance.uptime}%`,
      icon: Zap,
      color: data.performance.uptime >= 99 ? "text-green-500" : "text-yellow-500",
      progress: data.performance.uptime,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health Overview</h2>
          <p className="text-muted-foreground">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>
        {getHealthBadge(data.overallHealth)}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                <span className="text-xs text-muted-foreground">{metric.title}</span>
              </div>
              <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
              <Progress value={metric.progress} className="h-1 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.modules.map((module) => (
          <Card key={module.module} className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{module.module}</CardTitle>
                <Badge
                  variant="outline"
                  className={
                    module.status === "healthy"
                      ? "border-green-500/50 text-green-400"
                      : module.status === "warning"
                      ? "border-yellow-500/50 text-yellow-400"
                      : "border-red-500/50 text-red-400"
                  }
                >
                  {module.score}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress
                value={module.score}
                className={`h-2 ${
                  module.status === "healthy"
                    ? "[&>div]:bg-green-500"
                    : module.status === "warning"
                    ? "[&>div]:bg-yellow-500"
                    : "[&>div]:bg-red-500"
                }`}
              />
              {module.issues.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  {module.issues[0]}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
