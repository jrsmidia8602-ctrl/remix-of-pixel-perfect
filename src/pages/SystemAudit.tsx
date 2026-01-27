import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Download, 
  Shield, 
  Activity, 
  DollarSign, 
  Bot, 
  Gauge,
  Wrench,
  FileText,
  Loader2
} from "lucide-react";
import { useSystemAudit, useRealTimeMetrics } from "@/hooks/useSystemAudit";
import { SystemHealthOverview } from "@/components/audit/SystemHealthOverview";
import { FinancialAuditPanel } from "@/components/audit/FinancialAuditPanel";
import { SecurityAuditPanel } from "@/components/audit/SecurityAuditPanel";
import { PerformanceAuditPanel } from "@/components/audit/PerformanceAuditPanel";
import { AgentAuditPanel } from "@/components/audit/AgentAuditPanel";
import { RemediationPanel } from "@/components/audit/RemediationPanel";

export default function SystemAudit() {
  const { auditData, loading, error, refetch, runRemediation } = useSystemAudit(true, 30000);
  const realTimeMetrics = useRealTimeMetrics();

  const handleExportReport = (format: string) => {
    if (!auditData) return;

    const filename = `xp-infra-audit-${new Date().toISOString().split("T")[0]}.${format}`;
    let content: string;

    if (format === "json") {
      content = JSON.stringify(auditData, null, 2);
    } else {
      // Generate markdown report
      content = `# XP Infrastructure - System Audit Report
      
**Generated:** ${new Date(auditData.timestamp).toLocaleString()}
**Overall Health Score:** ${auditData.overallHealth}%

## Executive Summary

### System Health
${auditData.modules.map(m => `- **${m.module}:** ${m.score}% (${m.status})`).join("\n")}

### Financial Metrics
- Total Revenue: $${auditData.financial.totalRevenue.toLocaleString()}
- Platform Fees: $${auditData.financial.platformFees.toLocaleString()}
- Monthly Growth: ${auditData.financial.monthlyGrowth}%

### Security Status
- Critical Vulnerabilities: ${auditData.security.vulnerabilities.critical}
- Rate Limit Effectiveness: ${auditData.security.rateLimitEffectiveness}%
- Encryption: ${auditData.security.encryptionStatus}

### Agent Performance
- Active Agents: ${auditData.agents.activeAgents}/${auditData.agents.totalAgents}
- Success Rate: ${auditData.agents.avgSuccessRate.toFixed(1)}%
- Revenue Generated: $${auditData.agents.totalRevenueGenerated.toLocaleString()}

### Compliance
- PCI-DSS: ${auditData.compliance.pciDss.status} (${auditData.compliance.pciDss.score}%)
- GDPR: ${auditData.compliance.gdpr.status} (${auditData.compliance.gdpr.score}%)
- AML/KYC: ${auditData.compliance.amlKyc.status} (${auditData.compliance.amlKyc.score}%)

## Issues Found
${auditData.modules.flatMap(m => m.issues.map(i => `- [${m.module}] ${i}`)).join("\n") || "No critical issues found."}

## Recommendations
${auditData.modules.flatMap(m => m.recommendations.map(r => `- [${m.module}] ${r}`)).join("\n") || "System is operating optimally."}
`;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allIssues = auditData?.modules.flatMap(m => 
    m.issues.map(issue => ({
      module: m.module,
      issue,
      recommendation: m.recommendations[0] || "Review and address manually"
    }))
  ) || [];

  if (loading && !auditData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Running system audit...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !auditData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <p className="text-destructive">Failed to load audit data</p>
            <Button onClick={refetch}>Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
              System Audit Dashboard
            </h1>
            <p className="text-muted-foreground">
              XP Infrastructure v1.0.0 • Comprehensive Analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3" />
              Live
            </Badge>
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExportReport("md")}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {auditData && <SystemHealthOverview data={auditData} />}

        <Tabs defaultValue="financial" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="financial" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <Gauge className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2">
              <Bot className="h-4 w-4" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="remediation" className="gap-2">
              <Wrench className="h-4 w-4" />
              Remediation
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financial">
            {auditData && <FinancialAuditPanel data={auditData.financial} />}
          </TabsContent>

          <TabsContent value="security">
            {auditData && (
              <SecurityAuditPanel 
                security={auditData.security} 
                compliance={auditData.compliance}
                onRunScan={refetch}
              />
            )}
          </TabsContent>

          <TabsContent value="performance">
            {auditData && (
              <PerformanceAuditPanel 
                data={auditData.performance}
                realTimeMetrics={realTimeMetrics}
              />
            )}
          </TabsContent>

          <TabsContent value="agents">
            {auditData && (
              <AgentAuditPanel 
                data={auditData.agents}
                onRemediate={runRemediation}
              />
            )}
          </TabsContent>

          <TabsContent value="remediation">
            <RemediationPanel 
              issues={allIssues}
              onRemediate={runRemediation}
            />
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { name: "Executive Summary", format: "md", icon: FileText },
                { name: "Technical Details", format: "json", icon: Activity },
                { name: "Financial Audit", format: "csv", icon: DollarSign },
                { name: "Security Report", format: "json", icon: Shield },
              ].map((report) => (
                <div
                  key={report.name}
                  className="p-6 rounded-lg bg-card/50 backdrop-blur border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => handleExportReport(report.format)}
                >
                  <report.icon className="h-8 w-8 mb-3 text-primary" />
                  <h3 className="font-medium">{report.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Export as .{report.format}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
