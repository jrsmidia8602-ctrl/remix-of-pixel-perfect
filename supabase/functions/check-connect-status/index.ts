import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-CONNECT-STATUS] ${step}${detailsStr}`);
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

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get seller record
    const { data: seller, error: sellerError } = await supabaseClient
      .from("sellers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (sellerError) throw new Error(`Database error: ${sellerError.message}`);

    if (!seller || !seller.stripe_account_id) {
      logStep("No seller account found");
      return new Response(JSON.stringify({ 
        has_account: false,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        status: "not_created"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Fetch account status from Stripe
    const account = await stripe.accounts.retrieve(seller.stripe_account_id);
    logStep("Stripe account retrieved", { 
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted
    });

    // Determine status
    let status = "pending";
    if (account.charges_enabled && account.payouts_enabled) {
      status = "active";
    } else if (account.details_submitted) {
      status = "pending_verification";
    } else if (account.requirements?.currently_due?.length) {
      status = "incomplete";
    }

    // Update seller record in database
    await supabaseClient
      .from("sellers")
      .update({
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        stripe_account_status: status,
      })
      .eq("user_id", user.id);
    logStep("Seller record updated");

    return new Response(JSON.stringify({
      has_account: true,
      stripe_account_id: seller.stripe_account_id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      status: status,
      requirements: account.requirements?.currently_due || [],
      business_name: seller.business_name,
      country: seller.country,
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
