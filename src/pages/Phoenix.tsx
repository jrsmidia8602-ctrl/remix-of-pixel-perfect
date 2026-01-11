import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Flame, Play, RefreshCw, Activity, DollarSign, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const TASK_TYPES = [
  { value: "data", label: "Data Processing" },
  { value: "payment", label: "Payment" },
  { value: "nft", label: "NFT Mint" },
  { value: "volume", label: "Volume Generation" },
];

export default function Phoenix() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [taskType, setTaskType] = useState("data");
  const [priority, setPriority] = useState(5);
  const [apiKey, setApiKey] = useState("");

  // Fetch API status
  const { data: apiStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ["phoenix-status"],
    queryFn: async () => {
      const response = await supabase.functions.invoke("phoenix-api", {
        headers: apiKey ? { "x-api-key": apiKey } : {},
      });
      return response.data;
    },
    enabled: true,
  });

  // Fetch execution logs
  const { data: executionLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["execution-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("execution_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  // Execute agent mutation
  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!apiKey) {
        throw new Error("API Key is required");
      }

      const response = await supabase.functions.invoke("phoenix-api/v1/execute", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: {
          task_type: taskType,
          priority: priority,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Execution failed");
      }

      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Execução iniciada com sucesso",
        description: `Execution ID: ${data?.execution_id || "N/A"}`,
      });
      refetchLogs();
      refetchStatus();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na execução",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      success: "default",
      pending: "secondary",
      running: "secondary",
      failed: "destructive",
      error: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Phoenix Execution Engine</h1>
            <p className="text-muted-foreground">
              Interface oficial de execução de agentes. Cada disparo gera log, status e rastreio financeiro.
            </p>
          </div>
        </div>

        {/* API Key Input */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">API Key Configuration</CardTitle>
            <CardDescription>Enter your Phoenix API key to execute agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="password"
                  placeholder="Enter your API key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Execution Form */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Execute Agent
              </CardTitle>
              <CardDescription>Configure and trigger agent execution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-type">Tipo de Tarefa</Label>
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger id="task-type">
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade (1–10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min={1}
                  max={10}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                />
              </div>

              <Button
                onClick={() => executeMutation.mutate()}
                disabled={!apiKey || executeMutation.isPending}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                {executeMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Flame className="mr-2 h-4 w-4" />
                    EXECUTAR AGENTE
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Status Panel */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Status da Execução
                </CardTitle>
                <CardDescription>Phoenix API status and info</CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => refetchStatus()}>
                <RefreshCw className={`h-4 w-4 ${statusLoading ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : apiStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">System</p>
                      <p className="font-semibold">{apiStatus.system || "Phoenix API"}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Version</p>
                      <p className="font-semibold">{apiStatus.version || "1.0.0"}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant="default" className="bg-green-500/20 text-green-400">
                        {apiStatus.status || "operational"}
                      </Badge>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Endpoints</p>
                      <p className="font-semibold">{apiStatus.endpoints?.length || 3}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">Unable to fetch API status</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Execution Logs Table */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Execution Logs
              </CardTitle>
              <CardDescription>Recent agent execution history</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={() => refetchLogs()}>
              <RefreshCw className={`h-4 w-4 ${logsLoading ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : executionLogs && executionLogs.length > 0 ? (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>ID</TableHead>
                      <TableHead>Step</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executionLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/20">
                        <TableCell className="font-mono text-xs">
                          {log.execution_id?.slice(0, 8) || log.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{log.step}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          {log.duration_ms ? `${log.duration_ms}ms` : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(log.created_at), "MMM dd, HH:mm:ss")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No execution logs yet</p>
                <p className="text-sm text-muted-foreground/70">Execute an agent to see logs here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <p className="text-sm text-muted-foreground text-center">
          Legenda: Este painel permite disparar agentes, acompanhar execuções e auditar resultados em tempo real.
        </p>
      </div>
    </DashboardLayout>
  );
}
