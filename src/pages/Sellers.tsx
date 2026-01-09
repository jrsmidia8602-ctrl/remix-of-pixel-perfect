import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  ExternalLink, 
  Loader2,
  RefreshCw,
  CreditCard,
  Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ConnectStatus {
  has_account: boolean;
  stripe_account_id?: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  status: string;
  requirements?: string[];
  business_name?: string;
  country?: string;
}

const statusConfig = {
  active: { label: "Active", icon: CheckCircle, className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pending", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  pending_verification: { label: "Verifying", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  incomplete: { label: "Incomplete", icon: AlertCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  not_created: { label: "Not Created", icon: AlertCircle, className: "bg-muted text-muted-foreground border-muted" },
};

const countries = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "SG", name: "Singapore" },
];

export default function Sellers() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [businessName, setBusinessName] = useState("");
  const [country, setCountry] = useState("US");

  const checkStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-connect-status");
      
      if (error) throw error;
      setConnectStatus(data);
    } catch (err) {
      console.error("Error checking status:", err);
      toast({
        title: "Error",
        description: "Failed to check account status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Handle return from Stripe onboarding
    if (searchParams.get("success") === "true") {
      toast({
        title: "Onboarding Complete",
        description: "Your Stripe Connect account has been set up. Verifying status...",
      });
      checkStatus();
    } else if (searchParams.get("refresh") === "true") {
      toast({
        title: "Session Expired",
        description: "Please continue with your onboarding.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const handleCreateAccount = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-connect-account", {
        body: {
          country,
          business_name: businessName || undefined,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error creating account:", err);
      toast({
        title: "Error",
        description: "Failed to create Connect account",
        variant: "destructive",
      });
      setCreating(false);
    }
  };

  const handleContinueOnboarding = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-connect-account", {
        body: {
          country: connectStatus?.country || "US",
          business_name: connectStatus?.business_name,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: "Failed to generate onboarding link",
        variant: "destructive",
      });
      setCreating(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-connect-login-link");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: "Failed to open Stripe Dashboard",
        variant: "destructive",
      });
    }
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.not_created;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const status = getStatusConfig(connectStatus?.status || "not_created");
  const StatusIcon = status.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Seller Account</h1>
            <p className="text-muted-foreground">
              Manage your Stripe Connect account and start accepting payments.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={checkStatus}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
        </div>

        {/* Main Account Card */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Stripe Connect Account</CardTitle>
                  <CardDescription>
                    {connectStatus?.has_account 
                      ? `Account ID: ${connectStatus.stripe_account_id}`
                      : "Set up your seller account to start accepting payments"
                    }
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className={status.className}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!connectStatus?.has_account ? (
              /* No account - show create dialog */
              <div className="text-center py-8">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Seller Account Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create a Stripe Connect account to start accepting payments and receiving payouts.
                </p>
                
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 gradient-primary text-primary-foreground">
                      <Plus className="h-4 w-4" />
                      Create Seller Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Create Seller Account</DialogTitle>
                      <DialogDescription>
                        Set up your Stripe Connect account. You'll be redirected to Stripe to complete onboarding.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="business-name">Business Name (Optional)</Label>
                        <Input
                          id="business-name"
                          placeholder="Your Business Name"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="bg-muted/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger className="bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {countries.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={handleCreateAccount} 
                        disabled={creating}
                        className="w-full gradient-primary text-primary-foreground"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redirecting to Stripe...
                          </>
                        ) : (
                          <>
                            Continue to Stripe
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : connectStatus?.status === "active" ? (
              /* Active account */
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-border bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Charges Enabled</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You can accept payments
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Payouts Enabled</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You can receive payouts
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Details Submitted</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Account setup complete
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Incomplete/Pending account */
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className={`border-border ${connectStatus?.charges_enabled ? "bg-success/10" : "bg-muted/30"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {connectStatus?.charges_enabled ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <Clock className="h-4 w-4 text-warning" />
                        )}
                        <span className="text-sm font-medium">Charges</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {connectStatus?.charges_enabled ? "Enabled" : "Pending verification"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className={`border-border ${connectStatus?.payouts_enabled ? "bg-success/10" : "bg-muted/30"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {connectStatus?.payouts_enabled ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <Clock className="h-4 w-4 text-warning" />
                        )}
                        <span className="text-sm font-medium">Payouts</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {connectStatus?.payouts_enabled ? "Enabled" : "Pending verification"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className={`border-border ${connectStatus?.details_submitted ? "bg-success/10" : "bg-muted/30"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {connectStatus?.details_submitted ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className="text-sm font-medium">Details</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {connectStatus?.details_submitted ? "Submitted" : "Incomplete"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {connectStatus?.requirements && connectStatus.requirements.length > 0 && (
                  <div className="rounded-lg border border-warning/50 bg-warning/10 p-4">
                    <h4 className="font-medium text-warning mb-2">
                      Required Information
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {connectStatus.requirements.map((req, i) => (
                        <li key={i}>• {req.replace(/_/g, " ")}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button 
                  onClick={handleContinueOnboarding}
                  disabled={creating}
                  className="gradient-primary text-primary-foreground"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Continue Onboarding
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Actions for active accounts */}
            {connectStatus?.status === "active" && (
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button 
                  onClick={handleOpenDashboard}
                  variant="outline"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Stripe Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>1. Create your seller account and complete Stripe verification</p>
              <p>2. Once verified, you can accept card payments and crypto</p>
              <p>3. Payments are automatically split with platform fees</p>
              <p>4. Receive payouts directly to your bank account</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Supported Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary">Card Payments</Badge>
                <Badge className="bg-accent/10 text-accent">Transfers</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Accept credit cards, debit cards, and receive automatic payouts to your bank.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
