import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Timer,
  AlertCircle
} from "lucide-react";
import type { BrainTask } from "@/hooks/useNeuralBrain";

interface TaskMonitorTableProps {
  tasks: BrainTask[];
}

const taskTypeConfig = {
  api_consumption: { label: "API Call", color: "bg-crypto-purple/10 text-crypto-purple" },
  payment: { label: "Payment", color: "bg-crypto-cyan/10 text-crypto-cyan" },
  nft_mint: { label: "NFT Mint", color: "bg-crypto-pink/10 text-crypto-pink" },
  volume_generation: { label: "Volume Gen", color: "bg-crypto-blue/10 text-crypto-blue" },
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground", icon: Clock },
  assigned: { label: "Assigned", color: "bg-warning/10 text-warning", icon: Timer },
  executing: { label: "Executing", color: "bg-crypto-cyan/10 text-crypto-cyan", icon: Loader2 },
  completed: { label: "Completed", color: "bg-success/10 text-success", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-destructive/10 text-destructive", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: AlertCircle },
};

export function TaskMonitorTable({ tasks }: TaskMonitorTableProps) {
  const formatTime = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false 
    });
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) return "-";
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diff = endDate.getTime() - startDate.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 text-crypto-cyan animate-spin" />
          Task Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[80px]">Priority</TableHead>
                <TableHead className="w-[90px]">Budget</TableHead>
                <TableHead className="w-[90px]">Revenue</TableHead>
                <TableHead className="w-[80px]">Duration</TableHead>
                <TableHead className="w-[70px]">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.slice(0, 10).map((task) => {
                const typeInfo = taskTypeConfig[task.task_type];
                const statusInfo = statusConfig[task.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <TableRow key={task.id} className="hover:bg-muted/20">
                    <TableCell>
                      <Badge variant="outline" className={typeInfo.color}>
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusInfo.color}>
                        <StatusIcon className={`mr-1 h-3 w-3 ${task.status === "executing" ? "animate-spin" : ""}`} />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-mono ${task.priority >= 8 ? "text-destructive" : task.priority >= 5 ? "text-warning" : "text-muted-foreground"}`}>
                        P{task.priority}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">
                      ${Number(task.allocated_budget).toFixed(2)}
                    </TableCell>
                    <TableCell className={`font-mono ${task.actual_revenue ? "text-success" : "text-muted-foreground"}`}>
                      {task.actual_revenue 
                        ? `$${Number(task.actual_revenue).toFixed(2)}` 
                        : task.expected_revenue 
                          ? `~$${Number(task.expected_revenue).toFixed(2)}`
                          : "-"
                      }
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDuration(task.started_at, task.completed_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatTime(task.created_at)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No tasks found. Trigger a brain cycle to start.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
