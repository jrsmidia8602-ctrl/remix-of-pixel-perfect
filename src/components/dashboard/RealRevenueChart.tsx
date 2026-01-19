import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useUnifiedDashboardData } from "@/hooks/useUnifiedDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RealRevenueChart() {
  const { revenueData, stats, loading, refetch } = useUnifiedDashboardData();

  if (loading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = revenueData.some(d => d.stripe > 0 || d.platform > 0 || d.yield > 0);

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Revenue Overview (Real-time)</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Total: ${stats.totalRevenue.toFixed(2)} | Stripe: ${stats.stripeRevenue.toFixed(2)}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={refetch}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">No revenue data yet</p>
              <p className="text-sm text-muted-foreground/70">
                Make sales through the pricing page to see real revenue
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorStripe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(263 70% 58%)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(263 70% 58%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPlatform" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142 76% 45%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(142 76% 45%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(215 20% 55%)" 
                  tick={{ fill: 'hsl(215 20% 55%)' }}
                  axisLine={{ stroke: 'hsl(217 33% 17%)' }}
                />
                <YAxis 
                  stroke="hsl(215 20% 55%)" 
                  tick={{ fill: 'hsl(215 20% 55%)' }}
                  axisLine={{ stroke: 'hsl(217 33% 17%)' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(222 47% 8%)', 
                    border: '1px solid hsl(217 33% 17%)',
                    borderRadius: '8px',
                    color: 'hsl(210 40% 98%)'
                  }}
                  labelStyle={{ color: 'hsl(210 40% 98%)' }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      stripe: 'Stripe',
                      platform: 'Platform',
                      yield: 'DeFi Yield',
                    };
                    return [`$${value.toFixed(2)}`, labels[name] || name];
                  }}
                />
                <Legend 
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      stripe: 'Stripe Payments',
                      platform: 'Platform Revenue',
                      yield: 'DeFi Yield',
                    };
                    return labels[value] || value;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="stripe" 
                  stroke="hsl(263 70% 58%)" 
                  fillOpacity={1} 
                  fill="url(#colorStripe)" 
                  strokeWidth={2}
                  stackId="1"
                />
                <Area 
                  type="monotone" 
                  dataKey="platform" 
                  stroke="hsl(217 91% 60%)" 
                  fillOpacity={1} 
                  fill="url(#colorPlatform)" 
                  strokeWidth={2}
                  stackId="1"
                />
                <Area 
                  type="monotone" 
                  dataKey="yield" 
                  stroke="hsl(142 76% 45%)" 
                  fillOpacity={1} 
                  fill="url(#colorYield)" 
                  strokeWidth={2}
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
