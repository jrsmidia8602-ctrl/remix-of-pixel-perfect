import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Copy, ExternalLink, CheckCircle, AlertCircle, Webhook } from "lucide-react";
import { toast } from "sonner";

const WEBHOOK_URL = "https://ggzdhmltktbcpuwgvljn.supabase.co/functions/v1/stripe-webhook";

const REQUIRED_EVENTS = [
  { name: "payment_intent.succeeded", description: "Payment completed successfully" },
  { name: "payment_intent.payment_failed", description: "Payment failed" },
  { name: "charge.succeeded", description: "Charge was successful" },
  { name: "charge.refunded", description: "Charge was refunded" },
  { name: "account.updated", description: "Connect account updated" },
  { name: "customer.subscription.created", description: "New subscription created" },
  { name: "customer.subscription.updated", description: "Subscription modified" },
  { name: "customer.subscription.deleted", description: "Subscription cancelled" },
];

export function StripeWebhookManager() {
  const [webhookConfigured, setWebhookConfigured] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const markAsConfigured = () => {
    setWebhookConfigured(true);
    toast.success("Webhook marked as configured", {
      description: "Make sure you've actually configured it in Stripe Dashboard",
    });
  };

  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-crypto-green" />
          Stripe Webhook Manager
        </CardTitle>
        <CardDescription>
          Configure Stripe webhooks to receive payment notifications automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <Webhook className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Webhook Status</p>
              <p className="text-sm text-muted-foreground">Stripe → Edge Function</p>
            </div>
          </div>
          {webhookConfigured ? (
            <Badge className="bg-success/20 text-success border-success/30">
              <CheckCircle className="w-3 h-3 mr-1" /> Configured
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" /> Not Configured
            </Badge>
          )}
        </div>

        {/* Setup Instructions */}
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <h4 className="font-semibold text-destructive mb-2">⚠️ Critical: Configure Webhook</h4>
          <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-2">
            <li>Go to <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary underline">Stripe Dashboard → Webhooks</a></li>
            <li>Click "Add endpoint"</li>
            <li>Paste the webhook URL below</li>
            <li>Select the events listed below</li>
            <li>Save and copy the webhook signing secret</li>
            <li>Add the secret to Supabase Edge Function secrets as STRIPE_WEBHOOK_SECRET</li>
          </ol>
        </div>

        {/* Webhook URL */}
        <div>
          <Label className="text-sm font-medium">Webhook Endpoint URL</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={WEBHOOK_URL}
              readOnly
              className="font-mono text-sm bg-background"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => copyToClipboard(WEBHOOK_URL)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Required Events */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Required Events to Subscribe</Label>
          <div className="grid gap-2">
            {REQUIRED_EVENTS.map((event) => (
              <div
                key={event.name}
                className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border"
              >
                <div>
                  <code className="text-sm font-mono text-crypto-cyan">{event.name}</code>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyToClipboard(event.name)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Stripe Dashboard
            </a>
          </Button>
          <Button
            className="flex-1"
            onClick={markAsConfigured}
            disabled={webhookConfigured}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Configured
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
