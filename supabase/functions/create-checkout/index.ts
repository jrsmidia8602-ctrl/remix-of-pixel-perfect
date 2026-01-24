import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// XPEX Product Pricing Configuration
const PRODUCTS = {
  // One-time credit purchases
  credits_1k: { priceId: "price_1Sdj4zHDcsx7lyoo2Lgoo2pI", mode: "payment" as const },
  credits_10k: { priceId: "price_1Sdj6HHDcsx7lyoo3UlicrrD", mode: "payment" as const },
  credits_100k: { priceId: "price_1Sdj7IHDcsx7lyoo1ZqzErlX", mode: "payment" as const },
  // Subscription plans
  pro_monthly: { priceId: "price_1SdiUmHDcsx7lyooOieP0TLb", mode: "subscription" as const },
  enterprise_monthly: { priceId: "price_1SdigPHDcsx7lyoo9ciVaLVQ", mode: "subscription" as const },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Parse request body
    const { productId, quantity = 1 } = await req.json();
    logStep("Request received", { productId, quantity });

    if (!productId || !PRODUCTS[productId as keyof typeof PRODUCTS]) {
      throw new Error(`Invalid product ID: ${productId}. Valid options: ${Object.keys(PRODUCTS).join(", ")}`);
    }

    const product = PRODUCTS[productId as keyof typeof PRODUCTS];
    logStep("Product found", { productId, priceId: product.priceId, mode: product.mode });

    // Try to get authenticated user (required for credit delivery)
    let userEmail: string | undefined;
    let userId: string | undefined;
    let customerId: string | undefined;

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      if (data.user) {
        userId = data.user.id;
        userEmail = data.user.email;
        logStep("User authenticated", { userId, email: userEmail });
      }
    }

    // For credit purchases, user must be authenticated
    if (product.mode === "payment" && !userId) {
      logStep("Authentication required but user not logged in");
      return new Response(
        JSON.stringify({ 
          error: "Authentication required to purchase credits. Please log in first.",
          code: "AUTH_REQUIRED"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if user already exists as Stripe customer
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing Stripe customer found", { customerId });
      }
    }

    // Build checkout session configuration
    const origin = req.headers.get("origin") || "https://exact-frame-vision.lovable.app";
    
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      line_items: [
        {
          price: product.priceId,
          quantity: quantity,
        },
      ],
      mode: product.mode,
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-canceled`,
      metadata: {
        productId,
        source: "xpex_platform",
        user_id: userId || "",
      },
    };

    // Add customer info if available
    if (customerId) {
      sessionConfig.customer = customerId;
    } else if (userEmail) {
      sessionConfig.customer_email = userEmail;
    }

    // For subscriptions, allow promotion codes
    if (product.mode === "subscription") {
      sessionConfig.allow_promotion_codes = true;
    }

    logStep("Creating checkout session", { mode: product.mode, origin });

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        sessionId: session.id,
        mode: product.mode 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
