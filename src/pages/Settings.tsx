import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { User, CreditCard, Bell, Shield, Key, Webhook } from "lucide-react";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and platform configuration.
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-muted w-full justify-start h-auto p-1 flex-wrap">
            <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="profile" className="m-0">
              <Card className="border-border bg-card/50">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your account details and preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="John Doe" className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="john@example.com" className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" placeholder="XPEX Inc." className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input id="role" placeholder="Platform Admin" className="bg-muted/50" />
                    </div>
                  </div>
                  <Button className="gradient-primary text-primary-foreground">Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="m-0">
              <Card className="border-border bg-card/50">
                <CardHeader>
                  <CardTitle>Billing & Subscription</CardTitle>
                  <CardDescription>Manage your billing information and subscription.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-primary">Pro Plan</p>
                        <p className="text-sm text-muted-foreground">$299/month • Renews on Mar 15, 2024</p>
                      </div>
                      <Button variant="outline">Manage Plan</Button>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="mb-4 font-semibold">Payment Method</h4>
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-sm text-muted-foreground">Expires 12/25</p>
                        </div>
                      </div>
                      <Button variant="ghost">Edit</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="m-0">
              <Card className="border-border bg-card/50">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what notifications you receive.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { label: "Payment received", description: "Get notified for every successful payment" },
                    { label: "Seller onboarded", description: "When a new seller completes onboarding" },
                    { label: "Bot alerts", description: "Trading bot errors and important updates" },
                    { label: "Yield updates", description: "Daily yield earnings summary" },
                    { label: "Security alerts", description: "Suspicious activity and security events" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="m-0">
              <Card className="border-border bg-card/50">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your security preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Session Management</p>
                      <p className="text-sm text-muted-foreground">3 active sessions</p>
                    </div>
                    <Button variant="outline">Manage Sessions</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                    </div>
                    <Button variant="outline">Change Password</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="m-0">
              <Card className="border-border bg-card/50">
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage API keys for integrations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">Production Key</p>
                      <Button variant="ghost" size="sm">Regenerate</Button>
                    </div>
                    <code className="block rounded bg-muted p-3 text-sm font-mono">
                      xpex_live_sk_••••••••••••••••••••••••
                    </code>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">Test Key</p>
                      <Button variant="ghost" size="sm">Regenerate</Button>
                    </div>
                    <code className="block rounded bg-muted p-3 text-sm font-mono">
                      xpex_test_sk_••••••••••••••••••••••••
                    </code>
                  </div>
                  <Button className="gradient-primary text-primary-foreground">Create New Key</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="webhooks" className="m-0">
              <Card className="border-border bg-card/50">
                <CardHeader>
                  <CardTitle>Webhook Endpoints</CardTitle>
                  <CardDescription>Configure webhook URLs for real-time events.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-success" />
                        <p className="font-medium">Production Webhook</p>
                      </div>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                    <code className="block rounded bg-muted p-3 text-sm font-mono">
                      https://api.yourapp.com/webhooks/xpex
                    </code>
                  </div>
                  <Button className="gradient-primary text-primary-foreground">Add Webhook</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
