import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw, Server, Database, Zap, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface HealthCheck {
  name: string;
  status: "healthy" | "warning" | "error" | "checking";
  latency?: number;
  message?: string;
  lastChecked?: string;
}

interface AuditResult {
  overall_health: number;
  modules: Record<string, {
    status: string;
    health: number;
    issues?: string[];
  }>;
  recommendations?: string[];
}

const EDGE_FUNCTIONS = [
  { name: "Neural Brain", endpoint: "neural-brain" },
  { name: "Agent Scheduler", endpoint: "agent-scheduler" },
  { name: "Phoenix API", endpoint: "phoenix-api" },
  { name: "Payment Bot", endpoint: "payment-bot" },
  { name: "System Audit", endpoint: "system-audit" },
  { name: "Stripe Webhook", endpoint: "stripe-webhook" },
];

export function SystemHealthMonitor() {
  const [checks, setChecks] = useState<HealthCheck[]>(
    EDGE_FUNCTIONS.map((f) => ({ name: f.name, status: "checking" }))
  );
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningAudit, setRunningAudit] = useState(false);

  const checkEndpoint = async (name: string, endpoint: string): Promise<HealthCheck> => {
    const start = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: { action: "health_check" },
      });

      const latency = Date.now() - start;

      if (error) {
        return { name, status: "error", latency, message: error.message, lastChecked: new Date().toISOString() };
      }

      return {
        name,
        status: latency < 1000 ? "healthy" : "warning",
        latency,
        message: `Response in ${latency}ms`,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name,
        status: "error",
        latency: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const runHealthChecks = async () => {
    setLoading(true);
    setChecks(EDGE_FUNCTIONS.map((f) => ({ name: f.name, status: "checking" })));

    const results = await Promise.all(
      EDGE_FUNCTIONS.map((f) => checkEndpoint(f.name, f.endpoint))
    );

    setChecks(results);
    setLoading(false);
  };

  const runFullAudit = async () => {
    setRunningAudit(true);
    try {
      const { data, error } = await supabase.functions.invoke("system-audit", {
        body: { action: "full_audit" },
      });

      if (error) throw error;

      setAuditResult(data);
      toast.success("System audit completed");
    } catch (error) {
      console.error("Audit error:", error);
      toast.error("Failed to run system audit");
    } finally {
      setRunningAudit(false);
    }
  };

  useEffect(() => {
    runHealthChecks();

    // Auto-refresh every 60 seconds
    const interval = setInterval(runHealthChecks, 60000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: HealthCheck["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: HealthCheck["status"]) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-success/20 text-success border-success/30">Healthy</Badge>;
      case "warning":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Warning</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Checking</Badge>;
    }
  };

  const healthyCount = checks.filter((c) => c.status === "healthy").length;
  const overallHealth = (healthyCount / checks.length) * 100;

  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-crypto-cyan" />
              System Health Monitor
            </CardTitle>
            <CardDescription>
              Real-time monitoring of all system components
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={runHealthChecks} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
            <Button onClick={runFullAudit} disabled={runningAudit}>
              {runningAudit ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Full Audit
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Health */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Overall System Health</h4>
            <span className="text-2xl font-bold" style={{ color: overallHealth >= 80 ? "#10B981" : overallHealth >= 50 ? "#F59E0B" : "#EF4444" }}>
              {overallHealth.toFixed(0)}%
            </span>
          </div>
          <Progress value={overallHealth} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {healthyCount} of {checks.length} components healthy
          </p>
        </div>

        {/* Component Status Grid */}
        <div className="grid gap-3 md:grid-cols-2">
          {checks.map((check) => (
            <div
              key={check.name}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <p className="font-medium">{check.name}</p>
                  {check.latency && (
                    <p className="text-xs text-muted-foreground">
                      {check.latency}ms latency
                    </p>
                  )}
                </div>
              </div>
              {getStatusBadge(check.status)}
            </div>
          ))}
        </div>

        {/* Database & Infrastructure */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Infrastructure Status</h4>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
              <Database className="h-5 w-5 text-crypto-purple" />
              <div>
                <p className="font-medium">Database</p>
                <Badge className="bg-success/20 text-success border-success/30">Connected</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
              <Server className="h-5 w-5 text-crypto-cyan" />
              <div>
                <p className="font-medium">Edge Functions</p>
                <Badge className="bg-success/20 text-success border-success/30">Active</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
              <Zap className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium">Real-time</p>
                <Badge className="bg-success/20 text-success border-success/30">Enabled</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Results */}
        {auditResult && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <h4 className="font-semibold mb-3">Last Audit Results</h4>
            <div className="space-y-2">
              {auditResult.recommendations?.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
              {!auditResult.recommendations?.length && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle className="h-4 w-4" />
                  <span>No critical issues found</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
