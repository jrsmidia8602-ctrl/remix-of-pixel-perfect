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
import { CreditCard, Wallet, ArrowUpRight, ExternalLink, CheckCircle, Clock, XCircle } from "lucide-react";

interface FiatTransaction {
  id: string;
  amount: string;
  status: "succeeded" | "pending" | "failed";
  seller: string;
  customer: string;
  date: string;
}

interface CryptoTransaction {
  id: string;
  amount: string;
  token: string;
  txHash: string;
  confirmations: number;
  from: string;
  date: string;
}

const fiatTransactions: FiatTransaction[] = [
  { id: "pi_1234", amount: "$2,500.00", status: "succeeded", seller: "TechStore Pro", customer: "john@example.com", date: "Mar 9, 2024" },
  { id: "pi_5678", amount: "$890.00", status: "succeeded", seller: "Fashion Hub", customer: "jane@example.com", date: "Mar 9, 2024" },
  { id: "pi_9012", amount: "$1,200.00", status: "pending", seller: "Digital Goods", customer: "bob@example.com", date: "Mar 9, 2024" },
  { id: "pi_3456", amount: "$450.00", status: "failed", seller: "Artisan Market", customer: "alice@example.com", date: "Mar 8, 2024" },
  { id: "pi_7890", amount: "$3,400.00", status: "succeeded", seller: "Gaming Zone", customer: "charlie@example.com", date: "Mar 8, 2024" },
];

const cryptoTransactions: CryptoTransaction[] = [
  { id: "1", amount: "0.5", token: "ETH", txHash: "0x1234...abcd", confirmations: 12, from: "0xabc...123", date: "Mar 9, 2024" },
  { id: "2", amount: "1,500", token: "USDC", txHash: "0x5678...efgh", confirmations: 8, from: "0xdef...456", date: "Mar 9, 2024" },
  { id: "3", amount: "0.25", token: "ETH", txHash: "0x9012...ijkl", confirmations: 3, from: "0xghi...789", date: "Mar 9, 2024" },
  { id: "4", amount: "2,000", token: "USDT", txHash: "0x3456...mnop", confirmations: 15, from: "0xjkl...012", date: "Mar 8, 2024" },
  { id: "5", amount: "1.2", token: "ETH", txHash: "0x7890...qrst", confirmations: 20, from: "0xmno...345", date: "Mar 8, 2024" },
];

const fiatStatusConfig = {
  succeeded: { icon: CheckCircle, className: "bg-success/10 text-success border-success/20" },
  pending: { icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  failed: { icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function Payments() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            View and manage all fiat and crypto transactions.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-crypto-purple" />
                <span className="text-sm text-muted-foreground">Fiat Today</span>
              </div>
              <div className="mt-2 text-2xl font-bold">$24,580</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-crypto-cyan" />
                <span className="text-sm text-muted-foreground">Crypto Today</span>
              </div>
              <div className="mt-2 text-2xl font-bold">4.2 ETH</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">Success Rate</span>
              </div>
              <div className="mt-2 text-2xl font-bold">98.5%</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <div className="mt-2 text-2xl font-bold">23</div>
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
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fiatTransactions.map((tx) => {
                      const status = fiatStatusConfig[tx.status];
                      const StatusIcon = status.icon;
                      return (
                        <TableRow key={tx.id} className="border-border hover:bg-muted/30">
                          <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                          <TableCell className="font-semibold">{tx.amount}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={status.className}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{tx.seller}</TableCell>
                          <TableCell className="text-muted-foreground">{tx.customer}</TableCell>
                          <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="crypto" className="m-0">
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
                    {cryptoTransactions.map((tx) => (
                      <TableRow key={tx.id} className="border-border hover:bg-muted/30">
                        <TableCell className="font-semibold">{tx.amount}</TableCell>
                        <TableCell>
                          <Badge className="bg-crypto-cyan/10 text-crypto-cyan border-crypto-cyan/20">
                            {tx.token}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="link" className="h-auto p-0 text-crypto-blue">
                            {tx.txHash}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <span className={tx.confirmations >= 12 ? "text-success" : "text-warning"}>
                            {tx.confirmations}/12
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{tx.from}</TableCell>
                        <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
}
