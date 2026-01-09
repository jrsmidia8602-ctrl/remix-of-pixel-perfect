import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CONNECT-ACCOUNT] ${step}${detailsStr}`);
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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { country = "US", business_name } = await req.json();
    logStep("Request data", { country, business_name });

    // Check if user already has a seller profile
    const { data: existingSeller } = await supabaseClient
      .from("sellers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    let stripeAccountId = existingSeller?.stripe_account_id;

    if (!stripeAccountId) {
      // Create new Stripe Connect Express account
      logStep("Creating new Stripe Connect account");
      const account = await stripe.accounts.create({
        type: "express",
        country: country,
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: business_name || undefined,
        },
      });
      stripeAccountId = account.id;
      logStep("Stripe account created", { accountId: stripeAccountId });

      // Create or update seller record
      if (existingSeller) {
        await supabaseClient
          .from("sellers")
          .update({
            stripe_account_id: stripeAccountId,
            stripe_account_status: "pending",
            email: user.email,
            country: country,
            business_name: business_name,
          })
          .eq("user_id", user.id);
      } else {
        await supabaseClient.from("sellers").insert({
          user_id: user.id,
          stripe_account_id: stripeAccountId,
          stripe_account_status: "pending",
          email: user.email,
          country: country,
          business_name: business_name,
        });
      }
      logStep("Seller record saved");
    } else {
      logStep("Using existing Stripe account", { accountId: stripeAccountId });
    }

    // Create account link for onboarding
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/sellers?refresh=true`,
      return_url: `${origin}/sellers?success=true`,
      type: "account_onboarding",
    });
    logStep("Account link created", { url: accountLink.url });

    return new Response(JSON.stringify({ 
      url: accountLink.url,
      account_id: stripeAccountId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
