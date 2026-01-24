import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Rocket, Crown, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval?: string;
  features: string[];
  popular?: boolean;
  icon: React.ElementType;
}

const creditPackages: PricingTier[] = [
  {
    id: "credits_1k",
    name: "Starter Pack",
    description: "Perfect for trying out XPEX agents",
    price: 9.99,
    currency: "USD",
    features: [
      "1,000 API Credits",
      "Basic agent execution",
      "Standard support",
      "Valid for 30 days",
    ],
    icon: Zap,
  },
  {
    id: "credits_10k",
    name: "Growth Pack",
    description: "For growing businesses and power users",
    price: 69.99,
    currency: "USD",
    features: [
      "10,000 API Credits",
      "Priority agent execution",
      "Email support",
      "Valid for 90 days",
      "Usage analytics",
    ],
    popular: true,
    icon: Rocket,
  },
  {
    id: "credits_100k",
    name: "Enterprise Pack",
    description: "Maximum power for heavy workloads",
    price: 499.99,
    currency: "USD",
    features: [
      "100,000 API Credits",
      "Highest priority execution",
      "Dedicated support",
      "Never expires",
      "Advanced analytics",
      "Custom integrations",
    ],
    icon: Crown,
  },
];

const subscriptionPlans: PricingTier[] = [
  {
    id: "pro_monthly",
    name: "Pro Plan",
    description: "Unlock the full potential of XPEX",
    price: 29,
    currency: "USD",
    interval: "month",
    features: [
      "5,000 credits/month included",
      "All agent types enabled",
      "Real-time monitoring",
      "Priority support",
      "API access",
      "Webhook integrations",
    ],
    popular: true,
    icon: Sparkles,
  },
  {
    id: "enterprise_monthly",
    name: "Enterprise",
    description: "For large-scale operations",
    price: 199,
    currency: "USD",
    interval: "month",
    features: [
      "50,000 credits/month included",
      "Unlimited agent deployments",
      "Custom agent development",
      "24/7 dedicated support",
      "SLA guarantee",
      "White-label options",
      "Custom integrations",
      "On-premise deployment",
    ],
    icon: Crown,
  },
];

function PricingCard({ tier, onSelect, loading }: { tier: PricingTier; onSelect: (id: string) => void; loading: boolean }) {
  const Icon = tier.icon;
  
  return (
    <Card className={`relative flex flex-col ${tier.popular ? 'border-primary shadow-lg shadow-primary/20 scale-105' : 'border-border'}`}>
      {tier.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      )}
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-xl">{tier.name}</CardTitle>
        <CardDescription>{tier.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-6 text-center">
          <span className="text-4xl font-bold">${tier.price}</span>
          {tier.interval && (
            <span className="text-muted-foreground">/{tier.interval}</span>
          )}
        </div>
        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant={tier.popular ? "default" : "outline"}
          onClick={() => onSelect(tier.id)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Pricing() {
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async (productId: string) => {
    // Check if user is logged in before making the request
    if (!user) {
      toast.error("Please log in to purchase credits", {
        action: {
          label: "Log in",
          onClick: () => navigate("/auth"),
        },
      });
      return;
    }

    setLoadingProduct(productId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { productId },
      });

      if (error) {
        // Handle specific error codes
        if (error.message?.includes("AUTH_REQUIRED") || error.message?.includes("Authentication required")) {
          toast.error("Please log in to purchase credits", {
            action: {
              label: "Log in",
              onClick: () => navigate("/auth"),
            },
          });
          return;
        }
        throw error;
      }

      if (data?.url) {
        // Open Stripe Checkout in new tab
        window.open(data.url, '_blank');
        toast.success("Redirecting to checkout...");
      } else if (data?.error) {
        // Handle error from function response
        if (data.code === "AUTH_REQUIRED") {
          toast.error("Please log in to purchase credits", {
            action: {
              label: "Log in",
              onClick: () => navigate("/auth"),
            },
          });
        } else {
          throw new Error(data.error);
        }
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoadingProduct(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Flexible Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Power Your{" "}
              <span className="text-gradient-primary">Autonomous Revenue</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Choose the plan that fits your needs. Start with credits or unlock 
              unlimited potential with a subscription.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-16">
        <Tabs defaultValue="credits" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
            <TabsTrigger value="credits">Credit Packs</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>

          <TabsContent value="credits">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {creditPackages.map((tier) => (
                <PricingCard 
                  key={tier.id} 
                  tier={tier} 
                  onSelect={handleCheckout}
                  loading={loadingProduct === tier.id}
                />
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">
              Credits are one-time purchases. Perfect for testing or occasional usage.
            </p>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {subscriptionPlans.map((tier) => (
                <PricingCard 
                  key={tier.id} 
                  tier={tier} 
                  onSelect={handleCheckout}
                  loading={loadingProduct === tier.id}
                />
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">
              Subscriptions include monthly credits and unlock premium features.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* FAQ Section */}
      <div className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What are XPEX Credits?</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Credits are used to power agent executions on the platform. Each API call, 
                payment processing, or automation task consumes credits based on complexity.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I upgrade my plan?</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Yes! You can upgrade your subscription at any time. The difference will be 
                prorated and applied to your next billing cycle.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do credits expire?</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Credit pack validity varies by tier. Starter packs are valid for 30 days, 
                Growth packs for 90 days, and Enterprise packs never expire.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                We accept all major credit cards, debit cards, and various local payment 
                methods through our secure Stripe integration.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
