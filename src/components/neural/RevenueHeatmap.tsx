import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HourlyData {
  hour: number;
  day: number;
  revenue: number;
  executions: number;
}

export function RevenueHeatmap() {
  const [data, setData] = useState<HourlyData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [peakHour, setPeakHour] = useState<{ hour: number; day: number; revenue: number } | null>(null);

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  const fetchHeatmapData = async () => {
    const { data: executions, error } = await supabase
      .from("executions")
      .select("created_at, revenue")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error("Error fetching heatmap data:", error);
      return;
    }

    // Group by hour and day
    const hourlyMap = new Map<string, HourlyData>();
    let total = 0;
    let peak: HourlyData | null = null;

    (executions || []).forEach(exec => {
      const date = new Date(exec.created_at);
      const hour = date.getHours();
      const day = date.getDay();
      const key = `${day}-${hour}`;
      const revenue = Number(exec.revenue) || 0;

      total += revenue;

      if (!hourlyMap.has(key)) {
        hourlyMap.set(key, { hour, day, revenue: 0, executions: 0 });
      }
      const entry = hourlyMap.get(key)!;
      entry.revenue += revenue;
      entry.executions += 1;

      if (!peak || entry.revenue > peak.revenue) {
        peak = entry;
      }
    });

    setData(Array.from(hourlyMap.values()));
    setTotalRevenue(total);
    setPeakHour(peak);
  };

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getRevenue = (day: number, hour: number) => {
    return data.find(d => d.day === day && d.hour === hour)?.revenue || 0;
  };

  const getExecutions = (day: number, hour: number) => {
    return data.find(d => d.day === day && d.hour === hour)?.executions || 0;
  };

  const maxRevenue = Math.max(...data.map(d => d.revenue), 0.001);

  const getIntensity = (revenue: number) => {
    const ratio = revenue / maxRevenue;
    if (ratio === 0) return "bg-muted/20";
    if (ratio < 0.25) return "bg-crypto-purple/20";
    if (ratio < 0.5) return "bg-crypto-purple/40";
    if (ratio < 0.75) return "bg-crypto-purple/60";
    return "bg-crypto-purple";
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-crypto-cyan" />
            Revenue Heatmap
          </CardTitle>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            ${totalRevenue.toFixed(2)} total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Peak Performance */}
        {peakHour && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-crypto-purple/20 to-transparent">
            <TrendingUp className="h-4 w-4 text-crypto-purple" />
            <span className="text-sm">
              Peak: <strong>{days[peakHour.day]} {peakHour.hour}:00</strong> with ${peakHour.revenue.toFixed(3)}
            </span>
          </div>
        )}

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <TooltipProvider>
            <div className="min-w-[500px]">
              {/* Hour labels */}
              <div className="flex mb-1">
                <div className="w-10" />
                {hours.filter(h => h % 3 === 0).map(hour => (
                  <div 
                    key={hour} 
                    className="flex-1 text-center text-[10px] text-muted-foreground"
                  >
                    {hour}:00
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              {days.map((day, dayIdx) => (
                <div key={day} className="flex gap-0.5 mb-0.5">
                  <div className="w-10 text-xs text-muted-foreground flex items-center">
                    {day}
                  </div>
                  {hours.map(hour => {
                    const revenue = getRevenue(dayIdx, hour);
                    const executions = getExecutions(dayIdx, hour);
                    return (
                      <Tooltip key={`${day}-${hour}`}>
                        <TooltipTrigger asChild>
                          <div 
                            className={`flex-1 h-5 rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-primary ${getIntensity(revenue)}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{day} {hour}:00</p>
                          <p className="text-success">${revenue.toFixed(4)}</p>
                          <p className="text-muted-foreground">{executions} executions</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center justify-end gap-2 mt-3">
                <span className="text-[10px] text-muted-foreground">Less</span>
                <div className="flex gap-0.5">
                  <div className="w-3 h-3 rounded-sm bg-muted/20" />
                  <div className="w-3 h-3 rounded-sm bg-crypto-purple/20" />
                  <div className="w-3 h-3 rounded-sm bg-crypto-purple/40" />
                  <div className="w-3 h-3 rounded-sm bg-crypto-purple/60" />
                  <div className="w-3 h-3 rounded-sm bg-crypto-purple" />
                </div>
                <span className="text-[10px] text-muted-foreground">More</span>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
