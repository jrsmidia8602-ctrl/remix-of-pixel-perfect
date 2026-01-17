import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ModuleAudit {
  module: string;
  status: "healthy" | "warning" | "critical";
  score: number;
  metrics: Record<string, unknown>;
  issues: string[];
  recommendations: string[];
}

export interface FinancialMetrics {
  totalRevenue: number;
  revenueByStream: Record<string, number>;
  platformFees: number;
  agentProfitability: number;
  yieldGenerated: number;
  monthlyGrowth: number;
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  throughput: number;
  uptime: number;
  errorRate: number;
  dbLatency: number;
}

export interface SecurityMetrics {
  vulnerabilities: { critical: number; high: number; medium: number; low: number };
  authBreaches: number;
  rateLimitEffectiveness: number;
  encryptionStatus: string;
  lastSecurityScan: string;
}

export interface AgentMetrics {
  totalAgents: number;
  activeAgents: number;
  avgAutonomyLevel: number;
  totalTasksCompleted: number;
  avgSuccessRate: number;
  totalRevenueGenerated: number;
}

export interface ComplianceStatus {
  pciDss: { status: string; score: number };
  gdpr: { status: string; score: number };
  amlKyc: { status: string; score: number };
  soc2: { status: string; score: number };
}

export interface SystemAuditData {
  timestamp: string;
  overallHealth: number;
  modules: ModuleAudit[];
  financial: FinancialMetrics;
  performance: PerformanceMetrics;
  security: SecurityMetrics;
  agents: AgentMetrics;
  compliance: ComplianceStatus;
}

export function useSystemAudit(autoRefresh = true, refreshInterval = 30000) {
  const [auditData, setAuditData] = useState<SystemAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAudit = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke("system-audit", {
        body: { path: "full" },
      });

      if (fnError) throw fnError;
      setAuditData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch audit data";
      setError(message);
      console.error("Audit fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const runRemediation = useCallback(async (action: string, params?: Record<string, unknown>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke("system-audit", {
        body: { path: "remediate", action, params },
      });

      if (fnError) throw fnError;

      toast({
        title: data.success ? "Remediation Complete" : "Remediation Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });

      // Refresh audit after remediation
      if (data.success) {
        await fetchAudit();
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Remediation failed";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return { success: false, message };
    }
  }, [fetchAudit, toast]);

  useEffect(() => {
    fetchAudit();

    if (autoRefresh) {
      const interval = setInterval(fetchAudit, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAudit, autoRefresh, refreshInterval]);

  return {
    auditData,
    loading,
    error,
    refetch: fetchAudit,
    runRemediation,
  };
}

export function useRealTimeMetrics() {
  const [metrics, setMetrics] = useState({
    activeConnections: 0,
    requestsPerSecond: 0,
    errorCount: 0,
    revenueToday: 0,
  });

  useEffect(() => {
    // Simulate real-time metrics updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        activeConnections: Math.floor(Math.random() * 50) + 100,
        requestsPerSecond: Math.floor(Math.random() * 200) + 50,
        errorCount: Math.floor(Math.random() * 5),
        revenueToday: prev.revenueToday + Math.random() * 10,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
}
