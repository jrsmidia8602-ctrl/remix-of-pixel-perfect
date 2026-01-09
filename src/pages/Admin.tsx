import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useAdminData } from "@/hooks/useAdminData";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  BarChart3,
  Wallet
} from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  active: { icon: CheckCircle, className: "bg-success/10 text-success border-success/20", label: "Active" },
  pending: { icon: Clock, className: "bg-warning/10 text-warning border-warning/20", label: "Pending" },
  incomplete: { icon: AlertTriangle, className: "bg-destructive/10 text-destructive border-destructive/20", label: "Incomplete" },
};

export default function Admin() {
  const { sellers, stats, isLoading, error, isAdmin, refetch } = useAdminData();

  if (!isAdmin && !isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Shield className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage sellers and view platform analytics.
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

        {/* Platform Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Sellers</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{stats.totalSellers}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">Active Sellers</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-success">{stats.activeSellers}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-warning">{stats.pendingSellers}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-crypto-cyan" />
                <span className="text-sm text-muted-foreground">Total Payments</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{stats.totalPayments}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-crypto-purple" />
                <span className="text-sm text-muted-foreground">Volume</span>
              </div>
              <div className="mt-2 text-2xl font-bold">${stats.totalVolume.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-accent" />
                <span className="text-sm text-muted-foreground">Vault Positions</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{stats.totalVaultDeposits}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="border-border bg-card/50">
          <Tabs defaultValue="sellers" className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Management</CardTitle>
                <TabsList className="bg-muted">
                  <TabsTrigger value="sellers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    Sellers
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="sellers" className="m-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Business</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Charges</TableHead>
                      <TableHead>Payouts</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No sellers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sellers.map((seller) => {
                        const status = statusConfig[seller.stripe_account_status as keyof typeof statusConfig] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={seller.id} className="border-border hover:bg-muted/30">
                            <TableCell className="font-medium">{seller.business_name || '-'}</TableCell>
                            <TableCell className="text-muted-foreground">{seller.email || '-'}</TableCell>
                            <TableCell>{seller.country || 'US'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={status.className}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {seller.charges_enabled ? (
                                <CheckCircle className="h-4 w-4 text-success" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell>
                              {seller.payouts_enabled ? (
                                <CheckCircle className="h-4 w-4 text-success" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(seller.created_at), 'MMM d, yyyy')}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="analytics" className="m-0">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">Seller Growth</CardTitle>
                      <CardDescription>New seller registrations over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center h-48 text-muted-foreground">
                        <p>Chart coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Volume</CardTitle>
                      <CardDescription>Total transaction volume by day</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center h-48 text-muted-foreground">
                        <p>Chart coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
}
