import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Radio, TrendingUp, Volume2 } from "lucide-react";
import type { DemandSignal } from "@/hooks/useDemandRadar";
import { formatDistanceToNow } from "date-fns";

interface SignalsTableProps {
  signals: DemandSignal[];
}

const sourceLabels: Record<string, { label: string; color: string }> = {
  google_trends: { label: "Google", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  twitter: { label: "X/Twitter", color: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  reddit: { label: "Reddit", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  freelance_marketplace: { label: "Freelance", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  manual_input: { label: "Manual", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

export function SignalsTable({ signals }: SignalsTableProps) {
  return (
    <Card className="border-border bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Radio className="h-5 w-5 text-primary" />
          Recent Signals
          <Badge variant="outline" className="ml-2">
            {signals.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Keyword</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-center">Volume</TableHead>
                <TableHead className="text-center">Velocity</TableHead>
                <TableHead>Detected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {signals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No signals detected yet
                  </TableCell>
                </TableRow>
              ) : (
                signals.slice(0, 15).map((signal) => {
                  const sourceConfig = sourceLabels[signal.source] || sourceLabels.manual_input;
                  return (
                    <TableRow key={signal.id}>
                      <TableCell>
                        <div className="font-medium">{signal.keyword}</div>
                        {signal.signal_text && (
                          <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                            {signal.signal_text}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={sourceConfig.color}>
                          {sourceConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Volume2 className="h-3 w-3 text-muted-foreground" />
                          <span>{signal.signal_volume}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp
                            className={`h-3 w-3 ${
                              signal.velocity_score > 2
                                ? "text-green-500"
                                : signal.velocity_score > 1
                                ? "text-yellow-500"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span>{signal.velocity_score.toFixed(1)}x</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(signal.detected_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
