import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LIST-STRIPE-PAYMENTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    logStep("User authenticated", { userId: userData.user.id });

    const { limit = 50 } = await req.json().catch(() => ({}));

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if user is admin or get their seller account
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = roleData?.role === "admin";

    let payments: Stripe.PaymentIntent[] = [];

    if (isAdmin) {
      // Admin can see all payments
      logStep("Fetching all payments (admin)");
      const paymentIntents = await stripe.paymentIntents.list({
        limit: Math.min(limit, 100),
      });
      payments = paymentIntents.data;
    } else {
      // Get user's seller account
      const { data: sellerData } = await supabaseClient
        .from("sellers")
        .select("stripe_account_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (sellerData?.stripe_account_id) {
        logStep("Fetching payments for seller", { stripeAccountId: sellerData.stripe_account_id });
        // Fetch payments for this connected account
        const paymentIntents = await stripe.paymentIntents.list({
          limit: Math.min(limit, 100),
        }, {
          stripeAccount: sellerData.stripe_account_id,
        });
        payments = paymentIntents.data;
      }
    }

    logStep("Payments fetched", { count: payments.length });

    const formattedPayments = payments.map((pi) => ({
      id: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      status: pi.status,
      created: pi.created,
      customer_email: pi.receipt_email,
      description: pi.description,
      metadata: pi.metadata,
    }));

    return new Response(JSON.stringify({ payments: formattedPayments }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
