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
          <h1 className="text-3xl font-bold tracking-tight">XPEX Neural Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time autonomous revenue monitoring and agent control.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="status">System Status</TabsTrigger>
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

            {/* Quick Actions Card */}
            <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
              <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/50 p-4 transition-all hover:border-primary/50 hover:bg-muted">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium">Add Seller</span>
                </button>
                <button className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/50 p-4 transition-all hover:border-accent/50 hover:bg-muted">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-accent">
                    <Wallet className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <span className="text-sm font-medium">Connect Wallet</span>
                </button>
                <button className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/50 p-4 transition-all hover:border-success/50 hover:bg-muted">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-success">
                    <TrendingUp className="h-6 w-6 text-success-foreground" />
                  </div>
                  <span className="text-sm font-medium">New Strategy</span>
                </button>
                <button className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/50 p-4 transition-all hover:border-warning/50 hover:bg-muted">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning">
                    <Bot className="h-6 w-6 text-warning-foreground" />
                  </div>
                  <span className="text-sm font-medium">Deploy Agent</span>
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
