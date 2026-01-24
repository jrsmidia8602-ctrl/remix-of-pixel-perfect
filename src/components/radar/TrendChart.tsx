import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DemandOpportunity } from "@/hooks/useDemandRadar";
import { format, subDays } from "date-fns";

interface TrendChartProps {
  opportunities: DemandOpportunity[];
}

export function TrendChart({ opportunities }: TrendChartProps) {
  // Generate trend data for last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayLabel = format(date, "EEE");

    // Count opportunities by temperature for this day
    const dayOpportunities = opportunities.filter((o) => {
      const oppDate = format(new Date(o.created_at), "yyyy-MM-dd");
      return oppDate === dateStr;
    });

    const hot = dayOpportunities.filter((o) => o.temperature === "hot").length;
    const warm = dayOpportunities.filter((o) => o.temperature === "warm").length;
    const cold = dayOpportunities.filter((o) => o.temperature === "cold").length;

    // Calculate average score for the day
    const avgScore =
      dayOpportunities.length > 0
        ? Math.round(
            dayOpportunities.reduce((sum, o) => sum + o.demand_score, 0) /
              dayOpportunities.length
          )
        : 0;

    return {
      day: dayLabel,
      date: dateStr,
      hot,
      warm,
      cold,
      total: hot + warm + cold,
      avgScore,
    };
  });

  return (
    <Card className="border-border bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Demand Trend (7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorHot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorWarm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="day"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="hot"
                stackId="1"
                stroke="#ef4444"
                fill="url(#colorHot)"
                name="Hot"
              />
              <Area
                type="monotone"
                dataKey="warm"
                stackId="1"
                stroke="#f97316"
                fill="url(#colorWarm)"
                name="Warm"
              />
              <Area
                type="monotone"
                dataKey="cold"
                stackId="1"
                stroke="#3b82f6"
                fill="url(#colorCold)"
                name="Cold"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
