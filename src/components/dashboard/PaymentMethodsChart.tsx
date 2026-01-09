import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const data = [
  { name: "Stripe", value: 45000, color: "hsl(263 70% 58%)" },
  { name: "ETH", value: 25000, color: "hsl(217 91% 60%)" },
  { name: "USDC", value: 20000, color: "hsl(187 92% 45%)" },
  { name: "USDT", value: 10000, color: "hsl(142 76% 45%)" },
];

export function PaymentMethodsChart() {
  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Payment Methods</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(222 47% 8%)', 
                  border: '1px solid hsl(217 33% 17%)',
                  borderRadius: '8px',
                  color: 'hsl(210 40% 98%)'
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span style={{ color: 'hsl(215 20% 55%)' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
