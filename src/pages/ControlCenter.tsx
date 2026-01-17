import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CronConfigurator } from "@/components/control/CronConfigurator";
import { StripeWebhookManager } from "@/components/control/StripeWebhookManager";
import { AgentFleetControl } from "@/components/control/AgentFleetControl";
import { ApiMarketplace } from "@/components/control/ApiMarketplace";
import { RevenueTracker } from "@/components/control/RevenueTracker";
import { SystemHealthMonitor } from "@/components/control/SystemHealthMonitor";
import { Rocket, Clock, CreditCard, Bot, Store, DollarSign, Activity, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export default function ControlCenter() {
  const [activating, setActivating] = useState(false);

  const activateFullSystem = async () => {
    setActivating(true);
    try {
      // 1. Activate all agents with increased budgets
      const { error: agentError } = await supabase
        .from("autonomous_agents")
        .update({ status: "active", daily_budget: 100 })
        .neq("status", "active");

      if (agentError) throw agentError;

      // 2. Activate all API products
      const { error: apiError } = await supabase
        .from("api_products")
        .update({ is_active: true })
        .eq("is_active", false);

      if (apiError) throw apiError;

      // 3. Run a test cycle
      const { error: cycleError } = await supabase.functions.invoke("agent-scheduler", {
        body: { action: "run_scheduled_cycle" },
      });

      if (cycleError) throw cycleError;

      toast.success("🚀 Full System Activated!", {
        description: "All agents and APIs are now running. Configure CRON for 24/7 operation.",
      });
    } catch (error) {
      console.error("Activation error:", error);
      toast.error("Activation failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setActivating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Rocket className="h-8 w-8 text-crypto-purple" />
              XPEX Neural Control Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Complete system activation, configuration, and monitoring dashboard
            </p>
          </div>
          <Button
            size="lg"
            onClick={activateFullSystem}
            disabled={activating}
            className="bg-gradient-to-r from-crypto-purple to-crypto-cyan hover:opacity-90"
          >
            {activating ? (
              <Activity className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Zap className="h-5 w-5 mr-2" />
            )}
            Activate Full System
          </Button>
        </div>

        {/* Quick Status Bar */}
        <Card className="border-crypto-purple/30 bg-gradient-to-r from-crypto-purple/10 to-crypto-cyan/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">System Status</Badge>
                <Badge className="bg-success/20 text-success border-success/30">92% Ready</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Critical:</span>
                <Badge variant="destructive">CRON Not Configured</Badge>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Est. Revenue After Activation:</span>
              <span className="text-crypto-green font-bold">$8-20/day</span>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2 h-auto p-2 bg-muted/30">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="cron" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">CRON</span>
            </TabsTrigger>
            <TabsTrigger value="stripe" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Stripe</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Agents</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">APIs</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Revenue</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <SystemHealthMonitor />
              <RevenueTracker />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <CronConfigurator />
              <StripeWebhookManager />
            </div>
          </TabsContent>

          <TabsContent value="cron">
            <CronConfigurator />
          </TabsContent>

          <TabsContent value="stripe">
            <StripeWebhookManager />
          </TabsContent>

          <TabsContent value="agents">
            <AgentFleetControl />
          </TabsContent>

          <TabsContent value="marketplace">
            <ApiMarketplace />
          </TabsContent>

          <TabsContent value="revenue">
            <RevenueTracker />
          </TabsContent>
        </Tabs>

        {/* Activation Checklist */}
        <Card className="border-warning/30">
          <CardHeader>
            <CardTitle className="text-warning flex items-center gap-2">
              ⚡ Quick Activation Checklist
            </CardTitle>
            <CardDescription>
              Complete these steps to achieve full 24/7 autonomous operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <div className="h-6 w-6 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">
                  1
                </div>
                <div>
                  <p className="font-medium">Configure CRON on cron-job.org</p>
                  <p className="text-xs text-muted-foreground">Enable 24/7 automation</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <div className="h-6 w-6 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">
                  2
                </div>
                <div>
                  <p className="font-medium">Register Stripe Webhook</p>
                  <p className="text-xs text-muted-foreground">Enable payment processing</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center text-success">
                  ✓
                </div>
                <div>
                  <p className="font-medium">Agents Configured</p>
                  <p className="text-xs text-muted-foreground">4 agents ready</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center text-success">
                  ✓
                </div>
                <div>
                  <p className="font-medium">API Products Live</p>
                  <p className="text-xs text-muted-foreground">4 products available</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center text-success">
                  ✓
                </div>
                <div>
                  <p className="font-medium">Edge Functions Deployed</p>
                  <p className="text-xs text-muted-foreground">All 7 functions active</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center text-success">
                  ✓
                </div>
                <div>
                  <p className="font-medium">Database Ready</p>
                  <p className="text-xs text-muted-foreground">All tables configured</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
