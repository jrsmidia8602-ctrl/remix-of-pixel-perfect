import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, DollarSign, Clock, Zap, Loader2 } from "lucide-react";
import type { DemandOpportunity } from "@/hooks/useDemandRadar";
import { useState } from "react";

interface HotDemandsListProps {
  opportunities: DemandOpportunity[];
  onGenerateOffer: (opportunityId: string) => Promise<unknown>;
}

const serviceTypeLabels: Record<string, string> = {
  api_on_demand: "API",
  ready_backend: "Backend",
  ai_automation: "AI Automation",
  white_label_saas: "White-label SaaS",
  express_consulting: "Consulting",
};

export function HotDemandsList({ opportunities, onGenerateOffer }: HotDemandsListProps) {
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const hotDemands = opportunities
    .filter((o) => o.temperature === "hot")
    .slice(0, 10);

  const handleGenerateOffer = async (opportunityId: string) => {
    setGeneratingFor(opportunityId);
    await onGenerateOffer(opportunityId);
    setGeneratingFor(null);
  };

  return (
    <Card className="border-border bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-red-500" />
          Hot Demands Now
          {hotDemands.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {hotDemands.length} Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hotDemands.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Flame className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No hot demands detected yet</p>
            <p className="text-sm">Process signals to detect opportunities</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hotDemands.map((demand) => (
              <div
                key={demand.id}
                className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">
                        {demand.title.replace("Demand: ", "")}
                      </h4>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 shrink-0">
                        Score: {demand.demand_score}
                      </Badge>
                    </div>
                    
                    {demand.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {demand.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs">
                      <div className="flex items-center gap-1 text-green-400">
                        <DollarSign className="h-3 w-3" />
                        <span>${demand.estimated_ticket}</span>
                      </div>
                      {demand.estimated_delivery_days && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{demand.estimated_delivery_days} days</span>
                        </div>
                      )}
                      {demand.recommended_service && (
                        <Badge variant="outline" className="text-xs">
                          {serviceTypeLabels[demand.recommended_service] || demand.recommended_service}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleGenerateOffer(demand.id)}
                    disabled={generatingFor === demand.id || demand.status === "offer_generated"}
                    className="shrink-0 bg-red-500 hover:bg-red-600 text-white"
                  >
                    {generatingFor === demand.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : demand.status === "offer_generated" ? (
                      "Offer Created"
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-1" />
                        Generate Offer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
