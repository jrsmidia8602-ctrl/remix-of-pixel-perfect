import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Clock, 
  DollarSign, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Timer,
  TrendingUp,
  Bot,
  Radio
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ExecutionEvent {
  id: string;
  timestamp: Date;
  agent_name: string;
  api_name: string;
  status: "success" | "failed" | "pending";
  revenue: number;
  cost: number;
  response_time_ms: number;
}

interface CronMetrics {
  lastExecution: Date | null;
  nextExpected: Date | null;
  cyclesCompleted: number;
  totalRevenue: number;
  totalExecutions: number;
  successRate: number;
  avgResponseTime: number;
  isHealthy: boolean;
}

export function RealtimeMonitor() {
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [metrics, setMetrics] = useState<CronMetrics>({
    lastExecution: null,
    nextExpected: null,
    cyclesCompleted: 0,
    totalRevenue: 0,
    totalExecutions: 0,
    successRate: 100,
    avgResponseTime: 0,
    isHealthy: true,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial data and metrics
  const fetchMetrics = async () => {
    // Fetch recent executions
    const { data: executions, error } = await supabase
      .from("executions")
      .select(`
        id,
        created_at,
        status,
        revenue,
        cost,
        response_time_ms,
        agent_id,
        api_product_id
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching executions:", error);
      return;
    }

    // Fetch agents and APIs for names
    const { data: agents } = await supabase.from("autonomous_agents").select("id, agent_name");
    const { data: apis } = await supabase.from("api_products").select("id, name");

    const agentMap = new Map(agents?.map(a => [a.id, a.agent_name]) || []);
    const apiMap = new Map(apis?.map(a => [a.id, a.name]) || []);

    const mappedEvents: ExecutionEvent[] = (executions || []).map(e => ({
      id: e.id,
      timestamp: new Date(e.created_at),
      agent_name: agentMap.get(e.agent_id || "") || "Unknown Agent",
      api_name: apiMap.get(e.api_product_id || "") || "Unknown API",
      status: e.status === "completed" ? "success" : e.status === "failed" ? "failed" : "pending",
      revenue: Number(e.revenue) || 0,
      cost: Number(e.cost) || 0,
      response_time_ms: Number(e.response_time_ms) || 0,
    }));

    setEvents(mappedEvents.slice(0, 20));

    // Calculate metrics
    const successful = executions?.filter(e => e.status === "completed") || [];
    const totalRev = executions?.reduce((sum, e) => sum + Number(e.revenue || 0), 0) || 0;
    const avgTime = successful.length > 0 
      ? successful.reduce((sum, e) => sum + Number(e.response_time_ms || 0), 0) / successful.length 
      : 0;

    const lastExec = executions?.[0]?.created_at ? new Date(executions[0].created_at) : null;

    setMetrics({
      lastExecution: lastExec,
      nextExpected: lastExec ? new Date(lastExec.getTime() + 5 * 60 * 1000) : null,
      cyclesCompleted: Math.floor((executions?.length || 0) / 4), // ~4 agents per cycle
      totalRevenue: totalRev,
      totalExecutions: executions?.length || 0,
      successRate: executions?.length 
        ? (successful.length / executions.length) * 100 
        : 100,
      avgResponseTime: avgTime,
      isHealthy: lastExec ? (Date.now() - lastExec.getTime()) < 10 * 60 * 1000 : false,
    });
  };

  useEffect(() => {
    fetchMetrics();

    // Set up realtime subscription for executions
    const channel = supabase
      .channel("realtime-executions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "executions" },
        async (payload) => {
          console.log("New execution:", payload);
          setPulseActive(true);
          setTimeout(() => setPulseActive(false), 1000);
          
          // Fetch agent and api names for the new execution
          const { data: agents } = await supabase
            .from("autonomous_agents")
            .select("id, agent_name")
            .eq("id", payload.new.agent_id)
            .single();
          
          const { data: apis } = await supabase
            .from("api_products")
            .select("id, name")
            .eq("id", payload.new.api_product_id)
            .single();

          const newEvent: ExecutionEvent = {
            id: payload.new.id,
            timestamp: new Date(payload.new.created_at),
            agent_name: agents?.agent_name || "Unknown Agent",
            api_name: apis?.name || "Unknown API",
            status: payload.new.status === "completed" ? "success" : "failed",
            revenue: Number(payload.new.revenue) || 0,
            cost: Number(payload.new.cost) || 0,
            response_time_ms: Number(payload.new.response_time_ms) || 0,
          };

          setEvents(prev => [newEvent, ...prev].slice(0, 20));
          
          // Update metrics
          setMetrics(prev => ({
            ...prev,
            lastExecution: newEvent.timestamp,
            nextExpected: new Date(newEvent.timestamp.getTime() + 5 * 60 * 1000),
            totalExecutions: prev.totalExecutions + 1,
            totalRevenue: prev.totalRevenue + newEvent.revenue,
            isHealthy: true,
          }));
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const getStatusIcon = (status: ExecutionEvent["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Timer className="h-4 w-4 text-warning" />;
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "Never";
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Radio className={`h-5 w-5 ${pulseActive ? "text-success animate-pulse" : "text-crypto-purple"}`} />
            Realtime Monitor
          </CardTitle>
          <Badge 
            variant="outline" 
            className={isConnected 
              ? "bg-success/10 text-success border-success/20" 
              : "bg-destructive/10 text-destructive border-destructive/20"
            }
          >
            <span className={`mr-2 h-2 w-2 rounded-full ${isConnected ? "bg-success animate-pulse" : "bg-destructive"}`} />
            {isConnected ? "Live" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CRON Health Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last CRON Cycle
            </div>
            <p className="text-sm font-medium">{formatTime(metrics.lastExecution)}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Timer className="h-3 w-3" />
              Next Expected
            </div>
            <p className="text-sm font-medium">
              {metrics.nextExpected && metrics.nextExpected > new Date() 
                ? formatTime(metrics.nextExpected)
                : "Any moment..."}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-lg bg-gradient-to-b from-crypto-purple/10 to-transparent">
            <Zap className="h-4 w-4 mx-auto mb-1 text-crypto-purple" />
            <p className="text-lg font-bold">{metrics.cyclesCompleted}</p>
            <p className="text-[10px] text-muted-foreground">Cycles</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-gradient-to-b from-success/10 to-transparent">
            <DollarSign className="h-4 w-4 mx-auto mb-1 text-success" />
            <p className="text-lg font-bold">${metrics.totalRevenue.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Revenue</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-gradient-to-b from-crypto-cyan/10 to-transparent">
            <Activity className="h-4 w-4 mx-auto mb-1 text-crypto-cyan" />
            <p className="text-lg font-bold">{metrics.totalExecutions}</p>
            <p className="text-[10px] text-muted-foreground">Executions</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-gradient-to-b from-warning/10 to-transparent">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-warning" />
            <p className="text-lg font-bold">{metrics.successRate.toFixed(0)}%</p>
            <p className="text-[10px] text-muted-foreground">Success</p>
          </div>
        </div>

        {/* Health Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">System Health</span>
            <span className={metrics.isHealthy ? "text-success" : "text-destructive"}>
              {metrics.isHealthy ? "Operational" : "Stale"}
            </span>
          </div>
          <Progress 
            value={metrics.isHealthy ? 100 : 30} 
            className="h-2"
          />
        </div>

        {/* Live Event Feed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Live Executions
            </h4>
            <span className="text-xs text-muted-foreground">
              {metrics.avgResponseTime.toFixed(0)}ms avg
            </span>
          </div>
          <ScrollArea className="h-48" ref={scrollRef}>
            <div className="space-y-2">
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Waiting for executions...
                </div>
              ) : (
                events.map((event, idx) => (
                  <div 
                    key={event.id}
                    className={`flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50 transition-all ${
                      idx === 0 && pulseActive ? "ring-2 ring-success/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(event.status)}
                      <div>
                        <p className="text-xs font-medium">{event.agent_name}</p>
                        <p className="text-[10px] text-muted-foreground">{event.api_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-success">
                        +${event.revenue.toFixed(4)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
