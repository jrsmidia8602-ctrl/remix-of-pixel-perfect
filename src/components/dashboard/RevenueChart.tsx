import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Jan", fiat: 4000, crypto: 2400 },
  { name: "Feb", fiat: 3000, crypto: 1398 },
  { name: "Mar", fiat: 2000, crypto: 9800 },
  { name: "Apr", fiat: 2780, crypto: 3908 },
  { name: "May", fiat: 1890, crypto: 4800 },
  { name: "Jun", fiat: 2390, crypto: 3800 },
  { name: "Jul", fiat: 3490, crypto: 4300 },
];

export function RevenueChart() {
  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorFiat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(263 70% 58%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(263 70% 58%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCrypto" x1="0" y1="0" x2="0" y2="1">
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
              />
              <Area 
                type="monotone" 
                dataKey="fiat" 
                stroke="hsl(263 70% 58%)" 
                fillOpacity={1} 
                fill="url(#colorFiat)" 
                strokeWidth={2}
                name="Fiat"
              />
              <Area 
                type="monotone" 
                dataKey="crypto" 
                stroke="hsl(187 92% 45%)" 
                fillOpacity={1} 
                fill="url(#colorCrypto)" 
                strokeWidth={2}
                name="Crypto"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-crypto-purple" />
            <span className="text-sm text-muted-foreground">Fiat Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-crypto-cyan" />
            <span className="text-sm text-muted-foreground">Crypto Payments</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
