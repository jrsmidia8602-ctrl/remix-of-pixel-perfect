import { DollarSign, Users, Percent, TrendingUp, Wallet, Bot } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { PaymentMethodsChart } from "@/components/dashboard/PaymentMethodsChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your payment platform.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            title="Total Revenue"
            value="$125,430"
            change="+12.5% from last month"
            changeType="positive"
            icon={DollarSign}
            iconColor="primary"
          />
          <MetricCard
            title="Active Sellers"
            value="2,847"
            change="+85 this week"
            changeType="positive"
            icon={Users}
            iconColor="accent"
          />
          <MetricCard
            title="Platform Fees"
            value="$8,245"
            change="+8.2% from last month"
            changeType="positive"
            icon={Percent}
            iconColor="success"
          />
          <MetricCard
            title="Yield Generated"
            value="$4,890"
            change="APY: 12.4%"
            changeType="neutral"
            icon={TrendingUp}
            iconColor="accent"
          />
          <MetricCard
            title="Crypto Volume"
            value="45.2 ETH"
            change="≈ $158,200"
            changeType="neutral"
            icon={Wallet}
            iconColor="primary"
          />
          <MetricCard
            title="Active Bots"
            value="12"
            change="3 paused"
            changeType="neutral"
            icon={Bot}
            iconColor="warning"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <RevenueChart />
          <PaymentMethodsChart />
        </div>

        {/* Activity Section */}
        <div className="grid gap-4 lg:grid-cols-2">
          <RecentActivity />
          
          {/* Quick Actions Card */}
          <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
            <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
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
                <span className="text-sm font-medium">Deploy Bot</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
