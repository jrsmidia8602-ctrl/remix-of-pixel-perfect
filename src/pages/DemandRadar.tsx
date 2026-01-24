import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radar, RefreshCw, Zap, Loader2 } from "lucide-react";
import { useDemandRadar } from "@/hooks/useDemandRadar";
import { RadarStatsCards } from "@/components/radar/RadarStatsCards";
import { DemandHeatmap } from "@/components/radar/DemandHeatmap";
import { HotDemandsList } from "@/components/radar/HotDemandsList";
import { TrendChart } from "@/components/radar/TrendChart";
import { SignalScanner } from "@/components/radar/SignalScanner";
import { SignalsTable } from "@/components/radar/SignalsTable";
import { Skeleton } from "@/components/ui/skeleton";

export default function DemandRadar() {
  const {
    signals,
    opportunities,
    stats,
    loading,
    processing,
    addSignal,
    processSignals,
    generateOffer,
    refetch,
  } = useDemandRadar();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary glow-primary">
              <Radar className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                Neural Demand Radar
                <Badge
                  variant="outline"
                  className={
                    stats.hotOpportunities > 0
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {stats.hotOpportunities > 0
                    ? `${stats.hotOpportunities} Hot`
                    : "Scanning"}
                </Badge>
              </h1>
              <p className="text-muted-foreground">
                Detect real demand signals and convert them into revenue opportunities
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={refetch}
              className="border-border hover:border-primary/50"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={processSignals}
              disabled={processing}
              className="gap-2 gradient-primary text-primary-foreground hover:opacity-90 glow-primary"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Process Signals
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {loading ? (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <RadarStatsCards stats={stats} />
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Heatmap */}
          {loading ? (
            <Skeleton className="h-80 rounded-lg" />
          ) : (
            <DemandHeatmap opportunities={opportunities} />
          )}

          {/* Trend Chart */}
          {loading ? (
            <Skeleton className="h-80 rounded-lg" />
          ) : (
            <TrendChart opportunities={opportunities} />
          )}
        </div>

        {/* Hot Demands */}
        {loading ? (
          <Skeleton className="h-64 rounded-lg" />
        ) : (
          <HotDemandsList opportunities={opportunities} onGenerateOffer={generateOffer} />
        )}

        {/* Signal Scanner + Table */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SignalScanner onAddSignal={addSignal} />
          </div>
          <div className="lg:col-span-2">
            {loading ? (
              <Skeleton className="h-96 rounded-lg" />
            ) : (
              <SignalsTable signals={signals} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
