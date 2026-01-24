import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, ThermometerSun, Snowflake } from "lucide-react";
import type { DemandOpportunity } from "@/hooks/useDemandRadar";

interface DemandHeatmapProps {
  opportunities: DemandOpportunity[];
}

export function DemandHeatmap({ opportunities }: DemandHeatmapProps) {
  const getTemperatureConfig = (temp: string) => {
    switch (temp) {
      case "hot":
        return {
          icon: Flame,
          color: "text-red-500",
          bg: "bg-red-500/20",
          border: "border-red-500/30",
          glow: "shadow-red-500/20",
        };
      case "warm":
        return {
          icon: ThermometerSun,
          color: "text-orange-500",
          bg: "bg-orange-500/20",
          border: "border-orange-500/30",
          glow: "shadow-orange-500/20",
        };
      default:
        return {
          icon: Snowflake,
          color: "text-blue-500",
          bg: "bg-blue-500/20",
          border: "border-blue-500/30",
          glow: "shadow-blue-500/20",
        };
    }
  };

  const grouped = {
    hot: opportunities.filter((o) => o.temperature === "hot"),
    warm: opportunities.filter((o) => o.temperature === "warm"),
    cold: opportunities.filter((o) => o.temperature === "cold"),
  };

  return (
    <Card className="border-border bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-red-500" />
          Demand Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* Hot Zone */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-400">HOT ({grouped.hot.length})</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {grouped.hot.slice(0, 5).map((opp) => {
                const config = getTemperatureConfig("hot");
                return (
                  <div
                    key={opp.id}
                    className={`p-2 rounded-lg ${config.bg} ${config.border} border shadow-lg ${config.glow}`}
                  >
                    <p className="text-xs font-medium truncate">{opp.title.replace("Demand: ", "")}</p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {opp.demand_score}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ${opp.estimated_ticket}
                      </span>
                    </div>
                  </div>
                );
              })}
              {grouped.hot.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No hot demands</p>
              )}
            </div>
          </div>

          {/* Warm Zone */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span className="text-sm font-medium text-orange-400">WARM ({grouped.warm.length})</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {grouped.warm.slice(0, 5).map((opp) => {
                const config = getTemperatureConfig("warm");
                return (
                  <div
                    key={opp.id}
                    className={`p-2 rounded-lg ${config.bg} ${config.border} border`}
                  >
                    <p className="text-xs font-medium truncate">{opp.title.replace("Demand: ", "")}</p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {opp.demand_score}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ${opp.estimated_ticket}
                      </span>
                    </div>
                  </div>
                );
              })}
              {grouped.warm.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No warm demands</p>
              )}
            </div>
          </div>

          {/* Cold Zone */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-blue-400">COLD ({grouped.cold.length})</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {grouped.cold.slice(0, 5).map((opp) => {
                const config = getTemperatureConfig("cold");
                return (
                  <div
                    key={opp.id}
                    className={`p-2 rounded-lg ${config.bg} ${config.border} border`}
                  >
                    <p className="text-xs font-medium truncate">{opp.title.replace("Demand: ", "")}</p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {opp.demand_score}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ${opp.estimated_ticket}
                      </span>
                    </div>
                  </div>
                );
              })}
              {grouped.cold.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No cold demands</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
