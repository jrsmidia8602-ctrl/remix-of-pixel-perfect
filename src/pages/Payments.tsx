import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStripePayments } from "@/hooks/useStripePayments";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Wallet, ArrowUpRight, ExternalLink, CheckCircle, Clock, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";

interface CryptoTransaction {
  id: string;
  tx_hash: string | null;
  from_address: string;
  to_address: string;
  amount: string;
  token: string;
  chain: string;
  confirmations: number;
  status: string;
  created_at: string;
}

const fiatStatusConfig: Record<string, { icon: typeof CheckCircle; className: string }> = {
  succeeded: { icon: CheckCircle, className: "bg-success/10 text-success border-success/20" },
  requires_payment_method: { icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  requires_confirmation: { icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  processing: { icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  canceled: { icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  requires_action: { icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
};

const getExplorerUrl = (chain: string, txHash: string) => {
  const explorers: Record<string, string> = {
    base: `https://basescan.org/tx/${txHash}`,
    ethereum: `https://etherscan.io/tx/${txHash}`,
    polygon: `https://polygonscan.com/tx/${txHash}`,
  };
  return explorers[chain.toLowerCase()] || `https://basescan.org/tx/${txHash}`;
};

export default function Payments() {
  const { payments, stats, isLoading, error, refetch } = useStripePayments();
  const { user } = useAuth();
  const [cryptoTransactions, setCryptoTransactions] = useState<CryptoTransaction[]>([]);
  const [cryptoLoading, setCryptoLoading] = useState(false);

  useEffect(() => {
    const fetchCryptoTransactions = async () => {
      if (!user) return;
      setCryptoLoading(true);
      try {
        const { data, error } = await supabase
          .from('crypto_transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          setCryptoTransactions(data);
        }
      } catch (err) {
        console.error('Error fetching crypto transactions:', err);
      } finally {
        setCryptoLoading(false);
      }
    };

    fetchCryptoTransactions();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
            <p className="text-muted-foreground">
              View and manage all fiat and crypto transactions.
            </p>
          </div>
          <Button onClick={refetch} disabled={isLoading} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-crypto-purple" />
                <span className="text-sm text-muted-foreground">Fiat Today</span>
              </div>
              <div className="mt-2 text-2xl font-bold">${stats.totalToday.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-crypto-cyan" />
                <span className="text-sm text-muted-foreground">This Month</span>
              </div>
              <div className="mt-2 text-2xl font-bold">${stats.totalThisMonth.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">Success Rate</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{stats.pendingCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Tabs */}
        <Card className="border-border bg-card/50">
          <Tabs defaultValue="fiat" className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transactions</CardTitle>
                <TabsList className="bg-muted">
                  <TabsTrigger value="fiat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Fiat
                  </TabsTrigger>
                  <TabsTrigger value="crypto" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                    <Wallet className="mr-2 h-4 w-4" />
                    Crypto
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="fiat" className="m-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No payments found
                          </TableCell>
                        </TableRow>
                      ) : (
                        payments.map((tx) => {
                          const status = fiatStatusConfig[tx.status] || fiatStatusConfig.requires_action;
                          const StatusIcon = status.icon;
                          return (
                            <TableRow key={tx.id} className="border-border hover:bg-muted/30">
                              <TableCell className="font-mono text-sm">{tx.id.slice(0, 20)}...</TableCell>
                              <TableCell className="font-semibold">
                                ${(tx.amount / 100).toLocaleString()} {tx.currency.toUpperCase()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={status.className}>
                                  <StatusIcon className="mr-1 h-3 w-3" />
                                  {tx.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{tx.customer_email || '-'}</TableCell>
                              <TableCell>{tx.description || '-'}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(tx.created * 1000), 'MMM d, yyyy')}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              <TabsContent value="crypto" className="m-0">
                {cryptoLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Amount</TableHead>
                        <TableHead>Token</TableHead>
                        <TableHead>Tx Hash</TableHead>
                        <TableHead>Confirmations</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cryptoTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No crypto transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        cryptoTransactions.map((tx) => (
                          <TableRow key={tx.id} className="border-border hover:bg-muted/30">
                            <TableCell className="font-semibold">{tx.amount}</TableCell>
                            <TableCell>
                              <Badge className="bg-crypto-cyan/10 text-crypto-cyan border-crypto-cyan/20">
                                {tx.token}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {tx.tx_hash ? (
                                <Button 
                                  variant="link" 
                                  className="h-auto p-0 text-crypto-blue"
                                  onClick={() => window.open(getExplorerUrl(tx.chain, tx.tx_hash!), '_blank')}
                                >
                                  {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-6)}
                                  <ExternalLink className="ml-1 h-3 w-3" />
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={tx.confirmations >= 12 ? "text-success" : "text-warning"}>
                                {tx.confirmations}/12
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {tx.from_address.slice(0, 6)}...{tx.from_address.slice(-4)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(tx.created_at), 'MMM d, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
}
