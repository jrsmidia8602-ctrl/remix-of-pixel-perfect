import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, RefreshCw, Zap, Settings } from "lucide-react";
import { useNeuralBrain } from "@/hooks/useNeuralBrain";
import { BrainStatsCards } from "@/components/neural/BrainStatsCards";
import { AgentStatusCard } from "@/components/neural/AgentStatusCard";
import { TaskMonitorTable } from "@/components/neural/TaskMonitorTable";
import { OpportunityTracker } from "@/components/neural/OpportunityTracker";
import { RealtimeMonitor } from "@/components/neural/RealtimeMonitor";
import { RevenueHeatmap } from "@/components/neural/RevenueHeatmap";
import { AgentPerformanceChart } from "@/components/neural/AgentPerformanceChart";
import { Skeleton } from "@/components/ui/skeleton";

export default function NeuralBrain() {
  const { 
    agents, 
    tasks, 
    opportunities, 
    loading, 
    stats,
    triggerBrainCycle,
    updateAgentStatus,
    refetch
  } = useNeuralBrain();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary glow-primary">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                Neural Brain
                <Badge 
                  variant="outline" 
                  className={stats.activeAgents > 0 
                    ? "bg-success/10 text-success border-success/20" 
                    : "bg-muted text-muted-foreground"
                  }
                >
                  {stats.activeAgents > 0 ? "Active" : "Idle"}
                </Badge>
              </h1>
              <p className="text-muted-foreground">
                Autonomous orchestration system for XPEX operations
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
              variant="outline"
              className="border-border hover:border-primary/50"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configure
            </Button>
            <Button 
              onClick={triggerBrainCycle}
              className="gap-2 gradient-primary text-primary-foreground hover:opacity-90 glow-primary"
            >
              <Zap className="h-4 w-4" />
              Trigger Cycle
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <BrainStatsCards stats={stats} />
        )}

        {/* Realtime Monitoring Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          <RealtimeMonitor />
          <RevenueHeatmap />
          <AgentPerformanceChart />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Task Monitor - Takes 2 columns */}
          <div className="lg:col-span-2">
            {loading ? (
              <Skeleton className="h-96 rounded-lg" />
            ) : (
              <TaskMonitorTable tasks={tasks} />
            )}
          </div>

          {/* Opportunity Tracker */}
          <div className="lg:col-span-1">
            {loading ? (
              <Skeleton className="h-96 rounded-lg" />
            ) : (
              <OpportunityTracker opportunities={opportunities} />
            )}
          </div>
        </div>

        {/* Agent Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-crypto-purple" />
            Autonomous Agents
          </h2>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-lg" />
              ))}
            </div>
          ) : agents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {agents.map((agent) => (
                <AgentStatusCard 
                  key={agent.id} 
                  agent={agent} 
                  onStatusChange={updateAgentStatus}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-lg border border-border bg-card/50">
              <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-lg font-medium mb-2">No Agents Configured</h3>
              <p className="text-muted-foreground mb-4">
                Deploy autonomous agents to start automated operations
              </p>
              <Button className="gradient-primary text-primary-foreground">
                Deploy First Agent
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
