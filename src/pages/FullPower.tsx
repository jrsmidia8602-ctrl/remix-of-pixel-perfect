import { useFullPowerOrchestrator } from "@/hooks/useFullPowerOrchestrator";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Zap, 
  Play, 
  RefreshCw, 
  Brain, 
  Radar, 
  Wallet, 
  ShoppingCart, 
  TrendingUp,
  BarChart3,
  Bot,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2,
  AlertTriangle,
  DollarSign,
  Target,
  Sparkles
} from "lucide-react";

export default function FullPower() {
  const {
    status,
    loading,
    running,
    lastCycleResult,
    runCycle,
    triggerScan,
    processPipeline,
    retryExecutions,
    rechargeWallets,
    rebalanceAgents,
    fetchStatus,
  } = useFullPowerOrchestrator();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const successRate = status?.modules.executions.success_rate || "0%";
  const successRateNum = parseInt(successRate.replace("%", ""));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              Orchestrator
            </h1>
            <p className="text-muted-foreground text-sm">
              {status?.system_version || "XP-INFRA-1.0"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status?.status === "active_full_power" ? "default" : "secondary"} className="gap-1">
              {status?.status === "active_full_power" ? (
                <>
                  <Activity className="h-3 w-3" />
                  Orchestrator Active
                </>
              ) : (
                "Standby"
              )}
            </Badge>
            <Button variant="outline" size="sm" onClick={fetchStatus}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Action Button */}
        <Card className="border-2 border-primary/50 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Autonomous Cycle
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Run complete autonomous cycle: Scan → Process → Generate → Publish → Optimize
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={runCycle} 
                disabled={running}
                className="gradient-primary hover:opacity-90"
              >
                {running ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Run Full Cycle
                  </>
                )}
              </Button>
            </div>
            
            {lastCycleResult && (
              <div className="mt-4 p-3 bg-background/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Last Cycle Results:</p>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{lastCycleResult.actions_executed.signals_processed}</p>
                    <p className="text-muted-foreground">Signals Processed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-500">{lastCycleResult.actions_executed.hot_opportunities_created || 0}</p>
                    <p className="text-muted-foreground">Hot Opportunities</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">{lastCycleResult.actions_executed.offers_published}</p>
                    <p className="text-muted-foreground">Offers Published</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-500">{lastCycleResult.actions_executed.agents_rebalanced}</p>
                    <p className="text-muted-foreground">Agents Optimized</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Module Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Demand Radar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Radar className="h-4 w-4 text-blue-500" />
                  Demand Radar
                </span>
                <Badge variant={status?.modules.demand_radar.enabled ? "default" : "secondary"} className="text-xs">
                  {status?.modules.demand_radar.enabled ? "Active" : "Off"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Signals</span>
                  <span className="font-medium">{status?.modules.demand_radar.total_signals || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Opportunities</span>
                  <span className="font-medium">{status?.modules.demand_radar.opportunities_found || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-orange-500" /> Hot
                  </span>
                  <span className="font-medium text-orange-500">{status?.modules.demand_radar.hot_opportunities || 0}</span>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-2" onClick={triggerScan}>
                  <Radar className="h-3 w-3 mr-1" />
                  Trigger Scan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Core */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  AI Core
                </span>
                <Badge variant="default" className="text-xs bg-purple-500">
                  {status?.modules.ai_core.learning_mode || "Self-Optimized"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{status?.modules.ai_core.version}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {status?.modules.ai_core.active_modules.map((mod) => (
                    <Badge key={mod} variant="outline" className="text-xs">
                      {mod.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="w-full mt-2" onClick={processPipeline}>
                  <Brain className="h-3 w-3 mr-1" />
                  Process Pipeline
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Marketplace */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-green-500" />
                  Marketplace
                </span>
                <Badge variant={status?.modules.marketplace.connected ? "default" : "secondary"} className="text-xs">
                  Connected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Agents</span>
                  <span className="font-medium">{status?.modules.marketplace.total_agents || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-medium text-green-500">{status?.modules.marketplace.active_agents || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Featured</span>
                  <span className="font-medium text-yellow-500">{status?.modules.marketplace.featured_agents || 0}</span>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-2" onClick={rebalanceAgents}>
                  <Bot className="h-3 w-3 mr-1" />
                  Rebalance Agents
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wallets */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-cyan-500" />
                  Wallets
                </span>
                <Badge variant={status?.modules.wallets.auto_recharge_enabled ? "default" : "secondary"} className="text-xs">
                  Auto-Recharge
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Users Tracked</span>
                  <span className="font-medium">{status?.modules.wallets.users_tracked || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Credits</span>
                  <span className="font-medium">{status?.modules.wallets.total_credits_in_circulation?.toFixed(2) || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Low Balance</span>
                  <span className={`font-medium ${(status?.modules.wallets.wallets_low_balance || 0) > 0 ? "text-orange-500" : "text-green-500"}`}>
                    {status?.modules.wallets.wallets_low_balance || 0}
                  </span>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-2" onClick={rechargeWallets}>
                  <DollarSign className="h-3 w-3 mr-1" />
                  Recharge Low Wallets
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Executions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-pink-500" />
                  Executions
                </span>
                <Badge variant={status?.modules.executions.auto_retry_enabled ? "default" : "secondary"} className="text-xs">
                  Auto-Retry
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium">{status?.modules.executions.pending || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className={`font-medium ${successRateNum >= 90 ? "text-green-500" : successRateNum >= 70 ? "text-yellow-500" : "text-red-500"}`}>
                    {successRate}
                  </span>
                </div>
                <Progress value={successRateNum} className="h-2" />
                <Button size="sm" variant="outline" className="w-full mt-2" onClick={retryExecutions}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Failed
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Economy Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-500" />
                  Economy
                </span>
                <Badge variant="default" className="text-xs bg-indigo-500">
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Revenue</span>
                  <span className="font-medium text-green-500">${status?.modules.economy_stats.platform.total_revenue?.toFixed(2) || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Marketplace Revenue</span>
                  <span className="font-medium">${status?.modules.economy_stats.marketplace.total_revenue?.toFixed(2) || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Executions</span>
                  <span className="font-medium">{status?.modules.economy_stats.marketplace.total_executions || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        {status?.recommendations && status.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                System Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {status.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    {rec.includes("✅") ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : rec.includes("⚠️") ? (
                      <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    ) : rec.includes("🔥") ? (
                      <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    ) : (
                      <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                    <span>{rec.replace(/[✅⚠️🔥🚀🤖💰🔄]/g, "").trim()}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
