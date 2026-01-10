import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gauge, Clock, Zap, AlertCircle, Database, Activity } from "lucide-react";
import type { PerformanceMetrics } from "@/hooks/useSystemAudit";

interface PerformanceAuditPanelProps {
  data: PerformanceMetrics;
  realTimeMetrics?: {
    activeConnections: number;
    requestsPerSecond: number;
    errorCount: number;
  };
}

export function PerformanceAuditPanel({ data, realTimeMetrics }: PerformanceAuditPanelProps) {
  const targets = {
    responseTime: 200,
    throughput: 1000,
    uptime: 99.99,
    errorRate: 1,
    dbLatency: 10,
  };

  const getStatus = (current: number, target: number, inverse = false) => {
    const ratio = inverse ? target / current : current / target;
    if (ratio >= 0.9) return "success";
    if (ratio >= 0.7) return "warning";
    return "error";
  };

  const metrics = [
    {
      title: "Avg Response Time",
      current: data.avgResponseTime,
      target: targets.responseTime,
      unit: "ms",
      icon: Clock,
      status: getStatus(targets.responseTime, data.avgResponseTime, true),
      inverse: true,
    },
    {
      title: "Throughput",
      current: data.throughput,
      target: targets.throughput,
      unit: "req/s",
      icon: Zap,
      status: getStatus(data.throughput, targets.throughput),
      inverse: false,
    },
    {
      title: "Uptime",
      current: data.uptime,
      target: targets.uptime,
      unit: "%",
      icon: Activity,
      status: getStatus(data.uptime, targets.uptime),
      inverse: false,
    },
    {
      title: "Error Rate",
      current: data.errorRate,
      target: targets.errorRate,
      unit: "%",
      icon: AlertCircle,
      status: getStatus(targets.errorRate, data.errorRate, true),
      inverse: true,
    },
    {
      title: "DB Latency",
      current: data.dbLatency,
      target: targets.dbLatency,
      unit: "ms",
      icon: Database,
      status: getStatus(targets.dbLatency, data.dbLatency, true),
      inverse: true,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      default:
        return "text-red-500";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "success":
        return "[&>div]:bg-green-500";
      case "warning":
        return "[&>div]:bg-yellow-500";
      default:
        return "[&>div]:bg-red-500";
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-purple-500" />
            Performance Metrics
          </CardTitle>
          {realTimeMetrics && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                <span className="text-green-500 font-medium">{realTimeMetrics.activeConnections}</span> connections
              </span>
              <span className="text-muted-foreground">
                <span className="text-cyan-500 font-medium">{realTimeMetrics.requestsPerSecond}</span> req/s
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {metrics.map((metric) => {
            const progressValue = metric.inverse
              ? Math.min(100, (metric.target / metric.current) * 100)
              : Math.min(100, (metric.current / metric.target) * 100);

            return (
              <div key={metric.title} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <metric.icon className={`h-4 w-4 ${getStatusColor(metric.status)}`} />
                    <span className="text-sm font-medium">{metric.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getStatusColor(metric.status)}`}>
                      {metric.current.toFixed(metric.unit === "%" ? 2 : 0)}{metric.unit}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {metric.target}{metric.unit}
                    </span>
                  </div>
                </div>
                <Progress value={progressValue} className={`h-2 ${getProgressColor(metric.status)}`} />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-lg font-bold text-green-500">&lt; 200ms</p>
            <p className="text-xs text-muted-foreground">Response Target</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-lg font-bold text-cyan-500">&gt; 1000 req/s</p>
            <p className="text-xs text-muted-foreground">Throughput Target</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-lg font-bold text-purple-500">99.99%</p>
            <p className="text-xs text-muted-foreground">Uptime Target</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
          <h4 className="text-sm font-medium mb-2">Optimization Recommendations</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {data.avgResponseTime > targets.responseTime && (
              <li>• Consider adding caching layer to reduce response times</li>
            )}
            {data.throughput < targets.throughput && (
              <li>• Scale horizontally to handle more concurrent requests</li>
            )}
            {data.dbLatency > targets.dbLatency && (
              <li>• Optimize database queries and add indexes</li>
            )}
            {data.errorRate > targets.errorRate && (
              <li>• Investigate error patterns and implement retries</li>
            )}
            {metrics.every((m) => m.status === "success") && (
              <li className="text-green-400">✓ All performance metrics within target</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
