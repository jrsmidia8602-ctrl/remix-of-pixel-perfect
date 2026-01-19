import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Clock, RefreshCw, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnifiedDashboardData } from "@/hooks/useUnifiedDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const statusStyles: Record<string, { icon: typeof ArrowUpRight; color: string; bg: string }> = {
  succeeded: { icon: ArrowUpRight, color: "text-success", bg: "bg-success/10" },
  failed: { icon: ArrowDownRight, color: "text-destructive", bg: "bg-destructive/10" },
  processing: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  requires_payment_method: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/10" },
  requires_confirmation: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  canceled: { icon: ArrowDownRight, color: "text-muted-foreground", bg: "bg-muted/10" },
};

function formatAmount(amount: number, currency: string): string {
  const value = amount / 100;
  const prefix = currency.toUpperCase() === "USD" ? "$" : "";
  return `${prefix}${value.toFixed(2)} ${currency.toUpperCase()}`;
}

function getStatusBadge(status: string) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    succeeded: "default",
    failed: "destructive",
    processing: "secondary",
    requires_payment_method: "outline",
    requires_confirmation: "outline",
    canceled: "outline",
  };

  const labels: Record<string, string> = {
    succeeded: "Success",
    failed: "Failed",
    processing: "Processing",
    requires_payment_method: "Pending",
    requires_confirmation: "Confirming",
    canceled: "Canceled",
  };

  return (
    <Badge variant={variants[status] || "outline"} className="text-xs">
      {labels[status] || status}
    </Badge>
  );
}

export function RecentActivity() {
  const { stripePayments, loading, refetch } = useUnifiedDashboardData();

  if (loading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentPayments = stripePayments.slice(0, 5);

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Recent Stripe Payments</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/50 text-primary">
            Live
          </Badge>
          <Button variant="ghost" size="icon" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentPayments.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No payments yet</p>
              <p className="text-sm text-muted-foreground/70">
                Payments will appear here in real-time
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {recentPayments.map((payment) => {
              const style = statusStyles[payment.status] || statusStyles.processing;
              const Icon = style.icon;
              const timeAgo = formatDistanceToNow(new Date(payment.created * 1000), { addSuffix: true });

              return (
                <div 
                  key={payment.id} 
                  className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
                >
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", style.bg)}>
                    <Icon className={cn("h-5 w-5", style.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {payment.customer_email || payment.description || "Payment"}
                      </p>
                      {getStatusBadge(payment.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{timeAgo}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-semibold", payment.status === "succeeded" ? "text-success" : "text-foreground")}>
                      {payment.status === "succeeded" ? "+" : ""}{formatAmount(payment.amount, payment.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{payment.id.slice(-8)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
