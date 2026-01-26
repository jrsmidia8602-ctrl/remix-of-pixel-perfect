import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RealTimeMetrics } from "@/components/dashboard/RealTimeMetrics";
import { RealRevenueChart } from "@/components/dashboard/RealRevenueChart";
import { PaymentMethodsChart } from "@/components/dashboard/PaymentMethodsChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AgentControlPanel } from "@/components/dashboard/AgentControlPanel";
import { SystemStatusDashboard } from "@/components/dashboard/SystemStatusDashboard";
import { Users, Wallet, TrendingUp, Bot } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Real-time execution monitoring and agent control.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
            <TabsTrigger value="status" className="text-sm">System Status</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Real-time Metrics Grid */}
            <RealTimeMetrics />

            {/* Charts Row */}
            <div className="grid gap-4 lg:grid-cols-3">
              <RealRevenueChart />
              <PaymentMethodsChart />
            </div>

            {/* Agent Control & Activity Section */}
            <div className="grid gap-4 lg:grid-cols-2">
              <AgentControlPanel />
              <RecentActivity />
            </div>

            {/* Quick Actions */}
            <div className="fenix-panel p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 transition-all hover:border-primary/50 hover:bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                    <Users className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-xs font-medium">Add Seller</span>
                </button>
                <button className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 transition-all hover:border-primary/50 hover:bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Wallet className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="text-xs font-medium">Connect Wallet</span>
                </button>
                <button className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 transition-all hover:border-success/50 hover:bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-success">
                    <TrendingUp className="h-5 w-5 text-success-foreground" />
                  </div>
                  <span className="text-xs font-medium">New Strategy</span>
                </button>
                <button className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 transition-all hover:border-warning/50 hover:bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning">
                    <Bot className="h-5 w-5 text-warning-foreground" />
                  </div>
                  <span className="text-xs font-medium">Deploy Agent</span>
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="status">
            <SystemStatusDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Index;
