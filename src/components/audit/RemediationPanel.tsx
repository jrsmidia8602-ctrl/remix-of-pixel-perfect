import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wrench, 
  RefreshCw, 
  Scale, 
  ShieldAlert, 
  Database, 
  Rocket,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useState } from "react";

interface RemediationAction {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  severity: "low" | "medium" | "high";
  requiresApproval: boolean;
}

interface RemediationPanelProps {
  issues: Array<{ module: string; issue: string; recommendation: string }>;
  onRemediate: (action: string, params?: Record<string, unknown>) => Promise<{ success: boolean; message: string }>;
}

export function RemediationPanel({ issues, onRemediate }: RemediationPanelProps) {
  const [executing, setExecuting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const actions: RemediationAction[] = [
    {
      id: "restart_failed_agents",
      name: "Restart Failed Agents",
      description: "Reset error state and restart all failed agents",
      icon: RefreshCw,
      severity: "low",
      requiresApproval: false,
    },
    {
      id: "scale_resources",
      name: "Scale Resources",
      description: "Increase compute capacity for edge functions",
      icon: Scale,
      severity: "medium",
      requiresApproval: false,
    },
    {
      id: "clear_pending_payments",
      name: "Process Pending Payments",
      description: "Retry all stuck pending payments",
      icon: Database,
      severity: "medium",
      requiresApproval: false,
    },
    {
      id: "trigger_backup",
      name: "Trigger Backup",
      description: "Create immediate database backup",
      icon: Database,
      severity: "low",
      requiresApproval: false,
    },
    {
      id: "redeploy_functions",
      name: "Redeploy Functions",
      description: "Redeploy all edge functions",
      icon: Rocket,
      severity: "medium",
      requiresApproval: false,
    },
    {
      id: "block_suspicious_activity",
      name: "Block Suspicious Activity",
      description: "Enable enhanced security measures",
      icon: ShieldAlert,
      severity: "high",
      requiresApproval: true,
    },
  ];

  const handleAction = async (action: RemediationAction) => {
    if (action.requiresApproval) {
      const confirmed = window.confirm(`This action requires approval: ${action.name}\n\n${action.description}\n\nProceed?`);
      if (!confirmed) return;
    }

    setExecuting(action.id);
    try {
      const result = await onRemediate(action.id);
      setResults(prev => ({ ...prev, [action.id]: result }));
    } finally {
      setExecuting(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-red-500/50 text-red-400";
      case "medium":
        return "border-yellow-500/50 text-yellow-400";
      default:
        return "border-green-500/50 text-green-400";
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-amber-500" />
          Automated Remediation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Active Issues ({issues.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {issues.map((issue, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {issue.module}
                    </Badge>
                  </div>
                  <p className="text-sm">{issue.issue}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    → {issue.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Available Actions</h4>
          <div className="grid gap-3">
            {actions.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <action.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{action.name}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getSeverityColor(action.severity)}>
                    {action.severity}
                  </Badge>
                  {results[action.id] && (
                    results[action.id].success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )
                  )}
                  <Button
                    size="sm"
                    variant={action.requiresApproval ? "destructive" : "outline"}
                    onClick={() => handleAction(action)}
                    disabled={executing === action.id}
                  >
                    {executing === action.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      "Execute"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <h4 className="text-sm font-medium mb-2">Actions Requiring Approval</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Database schema changes</li>
            <li>• Smart contract upgrades</li>
            <li>• Fee structure modifications</li>
            <li>• Agent budget increases</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
