import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  Clock,
  Zap,
  CheckCircle,
  Timer
} from "lucide-react";
import type { MarketOpportunity } from "@/hooks/useNeuralBrain";

interface OpportunityTrackerProps {
  opportunities: MarketOpportunity[];
}

const statusConfig = {
  detected: { label: "Detected", color: "bg-crypto-cyan/10 text-crypto-cyan", icon: Target },
  scheduled: { label: "Scheduled", color: "bg-warning/10 text-warning", icon: Clock },
  executing: { label: "Executing", color: "bg-crypto-purple/10 text-crypto-purple", icon: Zap },
  completed: { label: "Completed", color: "bg-success/10 text-success", icon: CheckCircle },
  expired: { label: "Expired", color: "bg-muted text-muted-foreground", icon: Timer },
};

export function OpportunityTracker({ opportunities }: OpportunityTrackerProps) {
  const formatTime = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return "text-success";
    if (score >= 0.4) return "text-warning";
    return "text-destructive";
  };

  const profitMargin = (opp: MarketOpportunity) => {
    const profit = Number(opp.potential_revenue) - Number(opp.estimated_cost);
    const margin = (profit / Number(opp.estimated_cost)) * 100;
    return margin;
  };

  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-crypto-cyan" />
          Market Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.slice(0, 5).map((opp) => {
            const statusInfo = statusConfig[opp.status];
            const StatusIcon = statusInfo.icon;
            const margin = profitMargin(opp);

            return (
              <div 
                key={opp.id} 
                className="rounded-lg border border-border bg-muted/20 p-4 hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge variant="outline" className={statusInfo.color}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTime(opp.detection_time)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-crypto-cyan">
                      +${(Number(opp.potential_revenue) - Number(opp.estimated_cost)).toFixed(2)}
                    </p>
                    <p className={`text-xs ${margin > 50 ? "text-success" : margin > 20 ? "text-warning" : "text-muted-foreground"}`}>
                      {margin.toFixed(0)}% margin
                    </p>
                  </div>
                </div>

                {/* Score Bars */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24">Demand</span>
                    <Progress 
                      value={Number(opp.demand_score) * 100} 
                      className="h-2 flex-1"
                    />
                    <span className={`text-xs font-mono w-12 text-right ${getScoreColor(Number(opp.demand_score))}`}>
                      {(Number(opp.demand_score) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24">Competition</span>
                    <Progress 
                      value={(1 - Number(opp.competition_score)) * 100} 
                      className="h-2 flex-1"
                    />
                    <span className={`text-xs font-mono w-12 text-right ${getScoreColor(1 - Number(opp.competition_score))}`}>
                      {((1 - Number(opp.competition_score)) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24">Complexity</span>
                    <Progress 
                      value={(1 - Number(opp.complexity_score)) * 100} 
                      className="h-2 flex-1"
                    />
                    <span className={`text-xs font-mono w-12 text-right ${getScoreColor(1 - Number(opp.complexity_score))}`}>
                      {((1 - Number(opp.complexity_score)) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Cost/Revenue Summary */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Cost: <span className="text-foreground font-medium">${Number(opp.estimated_cost).toFixed(2)}</span>
                  </span>
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-muted-foreground">
                    Revenue: <span className="text-success font-medium">${Number(opp.potential_revenue).toFixed(2)}</span>
                  </span>
                </div>
              </div>
            );
          })}

          {opportunities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No opportunities detected yet</p>
              <p className="text-xs">Trigger a brain cycle to scan for opportunities</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
