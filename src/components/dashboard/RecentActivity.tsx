import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "incoming" | "outgoing" | "pending";
  amount: string;
  currency: string;
  description: string;
  time: string;
}

const recentTransactions: Transaction[] = [
  { id: "1", type: "incoming", amount: "+$2,500.00", currency: "USD", description: "Payment from seller_abc", time: "2 min ago" },
  { id: "2", type: "incoming", amount: "+0.5 ETH", currency: "ETH", description: "Crypto payment received", time: "5 min ago" },
  { id: "3", type: "outgoing", amount: "-$1,200.00", currency: "USD", description: "Payout to seller_xyz", time: "12 min ago" },
  { id: "4", type: "pending", amount: "$850.00", currency: "USDC", description: "Pending confirmation", time: "15 min ago" },
  { id: "5", type: "incoming", amount: "+$3,400.00", currency: "USD", description: "Subscription payment", time: "25 min ago" },
];

const typeStyles = {
  incoming: { icon: ArrowUpRight, color: "text-success", bg: "bg-success/10" },
  outgoing: { icon: ArrowDownRight, color: "text-destructive", bg: "bg-destructive/10" },
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
};

export function RecentActivity() {
  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <Badge variant="outline" className="border-primary/50 text-primary">
          Live
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.map((tx) => {
            const style = typeStyles[tx.type];
            const Icon = style.icon;
            return (
              <div key={tx.id} className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", style.bg)}>
                  <Icon className={cn("h-5 w-5", style.color)} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-sm text-muted-foreground">{tx.time}</p>
                </div>
                <div className="text-right">
                  <p className={cn("font-semibold", style.color)}>{tx.amount}</p>
                  <p className="text-xs text-muted-foreground">{tx.currency}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
