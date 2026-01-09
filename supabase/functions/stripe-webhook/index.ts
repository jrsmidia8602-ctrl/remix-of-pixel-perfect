import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    logStep("Webhook received", { signature: signature ? "present" : "missing" });

    // For production, verify the webhook signature
    // const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    // For now, parse the event directly (add signature verification in production)
    const event = JSON.parse(body) as Stripe.Event;
    
    logStep("Event type", { type: event.type, id: event.id });

    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        logStep("Processing account.updated", { accountId: account.id });

        // Update seller record
        const { error: updateError } = await supabase
          .from("sellers")
          .update({
            stripe_account_status: account.details_submitted ? "active" : "pending",
            charges_enabled: account.charges_enabled || false,
            payouts_enabled: account.payouts_enabled || false,
            details_submitted: account.details_submitted || false,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_account_id", account.id);

        if (updateError) {
          logStep("Error updating seller", { error: updateError.message });
        } else {
          logStep("Seller updated successfully");
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Processing payment_intent.succeeded", { 
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount 
        });

        // Record the payment
        const { error: insertError } = await supabase
          .from("payments")
          .upsert({
            stripe_payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: "succeeded",
            customer_email: paymentIntent.receipt_email || null,
            description: paymentIntent.description || null,
            metadata: paymentIntent.metadata || {},
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "stripe_payment_intent_id"
          });

        if (insertError) {
          logStep("Error recording payment", { error: insertError.message });
        } else {
          logStep("Payment recorded successfully");
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Processing payment_intent.payment_failed", { 
          paymentIntentId: paymentIntent.id 
        });

        const { error: updateError } = await supabase
          .from("payments")
          .upsert({
            stripe_payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: "failed",
            customer_email: paymentIntent.receipt_email || null,
            metadata: paymentIntent.metadata || {},
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "stripe_payment_intent_id"
          });

        if (updateError) {
          logStep("Error updating failed payment", { error: updateError.message });
        }
        break;
      }

      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;
        logStep("Processing charge.succeeded", { chargeId: charge.id });
        // Handle charge success if needed
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        logStep("Processing charge.refunded", { chargeId: charge.id });

        // Update payment status
        if (charge.payment_intent) {
          const { error } = await supabase
            .from("payments")
            .update({
              status: "refunded",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_payment_intent_id", charge.payment_intent);

          if (error) {
            logStep("Error updating refund", { error: error.message });
          }
        }
        break;
      }

      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        logStep("Processing payout.paid", { payoutId: payout.id, amount: payout.amount });
        // Track payout if needed
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Webhook error", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
