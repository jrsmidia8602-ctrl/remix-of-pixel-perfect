import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, MoreVertical, CheckCircle, Clock, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Seller {
  id: string;
  name: string;
  email: string;
  stripeAccountId: string;
  status: "active" | "pending" | "restricted";
  totalVolume: string;
  walletConnected: boolean;
  joinedAt: string;
}

const mockSellers: Seller[] = [
  { id: "1", name: "TechStore Pro", email: "contact@techstore.com", stripeAccountId: "acct_1234", status: "active", totalVolume: "$45,230", walletConnected: true, joinedAt: "Jan 15, 2024" },
  { id: "2", name: "Fashion Hub", email: "hello@fashionhub.io", stripeAccountId: "acct_5678", status: "active", totalVolume: "$32,100", walletConnected: true, joinedAt: "Feb 2, 2024" },
  { id: "3", name: "Digital Goods Co", email: "sales@digitalgoods.co", stripeAccountId: "acct_9012", status: "pending", totalVolume: "$0", walletConnected: false, joinedAt: "Mar 8, 2024" },
  { id: "4", name: "Artisan Market", email: "info@artisanmarket.com", stripeAccountId: "acct_3456", status: "active", totalVolume: "$18,750", walletConnected: true, joinedAt: "Jan 28, 2024" },
  { id: "5", name: "Gaming Zone", email: "support@gamingzone.gg", stripeAccountId: "acct_7890", status: "restricted", totalVolume: "$8,200", walletConnected: false, joinedAt: "Feb 14, 2024" },
];

const statusConfig = {
  active: { label: "Active", icon: CheckCircle, className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pending", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  restricted: { label: "Restricted", icon: AlertCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function Sellers() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sellers</h1>
            <p className="text-muted-foreground">
              Manage your Stripe Connect sellers and their crypto wallets.
            </p>
          </div>
          <Button className="gap-2 gradient-primary text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            Add Seller
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">2,847</div>
              <div className="text-sm text-muted-foreground">Total Sellers</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-success">2,654</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-warning">156</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-destructive">37</div>
              <div className="text-sm text-muted-foreground">Restricted</div>
            </CardContent>
          </Card>
        </div>

        {/* Sellers Table */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Sellers</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search sellers..." className="pl-10 bg-muted/50" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Seller</TableHead>
                  <TableHead>Stripe Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSellers.map((seller) => {
                  const status = statusConfig[seller.status];
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={seller.id} className="border-border hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <div className="font-medium">{seller.name}</div>
                          <div className="text-sm text-muted-foreground">{seller.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {seller.stripeAccountId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.className}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{seller.totalVolume}</TableCell>
                      <TableCell>
                        {seller.walletConnected ? (
                          <Badge className="bg-crypto-cyan/10 text-crypto-cyan border-crypto-cyan/20">
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Not Connected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{seller.joinedAt}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>View Transactions</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Suspend</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
