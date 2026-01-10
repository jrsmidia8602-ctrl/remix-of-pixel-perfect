import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RealRevenueChart() {
  const { revenueData, loading, refetch } = useDashboardData();

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

  const hasData = revenueData.some(d => d.fiat > 0 || d.crypto > 0);

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Revenue Overview (Real-time)</CardTitle>
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
                Activate agents to start generating revenue
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorFiatReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(263 70% 58%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(263 70% 58%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCryptoReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(187 92% 45%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(187 92% 45%)" stopOpacity={0}/>
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
                  formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="fiat" 
                  stroke="hsl(263 70% 58%)" 
                  fillOpacity={1} 
                  fill="url(#colorFiatReal)" 
                  strokeWidth={2}
                  name="API Revenue"
                />
                <Area 
                  type="monotone" 
                  dataKey="crypto" 
                  stroke="hsl(187 92% 45%)" 
                  fillOpacity={1} 
                  fill="url(#colorCryptoReal)" 
                  strokeWidth={2}
                  name="Yield Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-crypto-purple" />
            <span className="text-sm text-muted-foreground">API Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-crypto-cyan" />
            <span className="text-sm text-muted-foreground">Yield Revenue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
