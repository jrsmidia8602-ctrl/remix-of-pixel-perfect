import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle, XCircle, Lock, Eye, RefreshCw } from "lucide-react";
import type { SecurityMetrics, ComplianceStatus } from "@/hooks/useSystemAudit";

interface SecurityAuditPanelProps {
  security: SecurityMetrics;
  compliance: ComplianceStatus;
  onRunScan?: () => void;
}

export function SecurityAuditPanel({ security, compliance, onRunScan }: SecurityAuditPanelProps) {
  const vulnerabilityTotal = 
    security.vulnerabilities.critical + 
    security.vulnerabilities.high + 
    security.vulnerabilities.medium + 
    security.vulnerabilities.low;

  const securityScore = Math.max(0, 100 - 
    security.vulnerabilities.critical * 25 - 
    security.vulnerabilities.high * 10 - 
    security.vulnerabilities.medium * 3 - 
    security.vulnerabilities.low * 1);

  const complianceItems = [
    { name: "PCI-DSS", ...compliance.pciDss },
    { name: "GDPR", ...compliance.gdpr },
    { name: "AML/KYC", ...compliance.amlKyc },
    { name: "SOC 2", ...compliance.soc2 },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "partial":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "in_progress":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Security & Compliance
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRunScan}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Scan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <p className="text-3xl font-bold text-blue-400">{securityScore}</p>
            <p className="text-xs text-muted-foreground">Security Score</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-3xl font-bold">{vulnerabilityTotal}</p>
            <p className="text-xs text-muted-foreground">Total Issues</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-3xl font-bold text-green-500">{security.rateLimitEffectiveness}%</p>
            <p className="text-xs text-muted-foreground">Rate Limit Eff.</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-3xl font-bold">{security.authBreaches}</p>
            <p className="text-xs text-muted-foreground">Auth Breaches</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Vulnerabilities
          </h4>
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-2xl font-bold text-red-500">{security.vulnerabilities.critical}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
              <p className="text-2xl font-bold text-orange-500">{security.vulnerabilities.high}</p>
              <p className="text-xs text-muted-foreground">High</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
              <p className="text-2xl font-bold text-yellow-500">{security.vulnerabilities.medium}</p>
              <p className="text-xs text-muted-foreground">Medium</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
              <p className="text-2xl font-bold text-blue-500">{security.vulnerabilities.low}</p>
              <p className="text-xs text-muted-foreground">Low</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Compliance Status
          </h4>
          <div className="space-y-2">
            {complianceItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(item.status)}
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.score >= 90
                          ? "bg-green-500"
                          : item.score >= 70
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      item.status === "compliant"
                        ? "border-green-500/50 text-green-400"
                        : item.status === "partial"
                        ? "border-yellow-500/50 text-yellow-400"
                        : "border-blue-500/50 text-blue-400"
                    }
                  >
                    {item.score}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Last scan: {new Date(security.lastSecurityScan).toLocaleString()}
          </span>
          <Badge variant="outline" className="ml-auto">
            {security.encryptionStatus}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
