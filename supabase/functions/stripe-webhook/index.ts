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

// Credit pack mapping based on product IDs
const CREDIT_PACKS: Record<string, { credits: number; name: string }> = {
  'credits_1k': { credits: 1000, name: 'Starter Pack' },
  'credits_10k': { credits: 10500, name: 'Growth Pack' }, // 10000 + 500 bonus
  'credits_100k': { credits: 110000, name: 'Enterprise Pack' }, // 100000 + 10000 bonus
  'pro_monthly': { credits: 5000, name: 'Pro Subscription' },
  'enterprise_monthly': { credits: 50000, name: 'Enterprise Subscription' },
};

// Deliver credits to user wallet
async function deliverCredits(userId: string, productId: string, paymentIntentId: string, amountPaid: number) {
  const pack = CREDIT_PACKS[productId];
  if (!pack) {
    logStep("Unknown product, skipping credit delivery", { productId });
    return false;
  }

  logStep("Delivering credits", { userId, productId, credits: pack.credits });

  // Check if this payment was already processed (idempotency)
  const { data: existingTx } = await supabase
    .from("credit_transactions")
    .select("id")
    .eq("metadata->>stripe_payment_intent_id", paymentIntentId)
    .single();

  if (existingTx) {
    logStep("Payment already processed, skipping", { paymentIntentId });
    return true;
  }

  // Get or create user wallet
  const { data: wallet, error: walletError } = await supabase
    .from("user_wallets")
    .select("id, balance_credits")
    .eq("user_id", userId)
    .single();

  let currentBalance = 0;
  
  if (walletError && walletError.code === 'PGRST116') {
    // No wallet exists, create one
    logStep("Creating new wallet for user", { userId });
    const { error: createError } = await supabase
      .from("user_wallets")
      .insert({ user_id: userId, balance_credits: 0 });
    
    if (createError) {
      logStep("Error creating wallet", { error: createError.message });
      return false;
    }
  } else if (wallet) {
    currentBalance = Number(wallet.balance_credits) || 0;
  }

  const newBalance = currentBalance + pack.credits;

  // Update wallet balance
  const { error: updateError } = await supabase
    .from("user_wallets")
    .update({ 
      balance_credits: newBalance,
      last_transaction_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId);

  if (updateError) {
    logStep("Error updating wallet balance", { error: updateError.message });
    return false;
  }

  // Record transaction
  const { error: txError } = await supabase
    .from("credit_transactions")
    .insert({
      user_id: userId,
      amount: pack.credits,
      transaction_type: "credit",
      source: "stripe_purchase",
      balance_before: currentBalance,
      balance_after: newBalance,
      description: `Purchased ${pack.name}`,
      metadata: {
        stripe_payment_intent_id: paymentIntentId,
        product_id: productId,
        amount_paid_cents: amountPaid,
      }
    });

  if (txError) {
    logStep("Error recording transaction", { error: txError.message });
    // Don't fail - credits were delivered
  }

  logStep("Credits delivered successfully", { 
    userId, 
    credits: pack.credits, 
    newBalance 
  });

  return true;
}

// Get user ID from Stripe customer email
async function getUserIdFromEmail(email: string): Promise<string | null> {
  const { data: users } = await supabase.auth.admin.listUsers();
  
  if (users?.users) {
    const user = users.users.find(u => u.email === email);
    if (user) return user.id;
  }
  
  return null;
}

// Process v1 classic webhook events
async function processV1Event(event: Stripe.Event) {
  logStep("Processing v1 event", { type: event.type, id: event.id });

  switch (event.type) {
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      logStep("Processing account.updated", { accountId: account.id });

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

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.completed", { 
        sessionId: session.id,
        paymentIntent: session.payment_intent,
        amount: session.amount_total,
        customerEmail: session.customer_email,
        metadata: session.metadata
      });

      const paymentIntentId = typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent?.id || session.id;

      // Record the payment
      const { error: insertError } = await supabase
        .from("payments")
        .upsert({
          stripe_payment_intent_id: paymentIntentId,
          amount: session.amount_total || 0,
          currency: session.currency || 'usd',
          status: "succeeded",
          customer_email: session.customer_email || null,
          description: `Checkout: ${session.metadata?.productId || 'Unknown product'}`,
          metadata: session.metadata || {},
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "stripe_payment_intent_id"
        });

      if (insertError) {
        logStep("Error recording checkout payment", { error: insertError.message });
      } else {
        logStep("Checkout payment recorded successfully");
      }

      // CRITICAL: Deliver credits to user
      const productId = session.metadata?.productId;
      const customerEmail = session.customer_email;

      if (productId && customerEmail) {
        const userId = await getUserIdFromEmail(customerEmail);
        
        if (userId) {
          await deliverCredits(userId, productId, paymentIntentId, session.amount_total || 0);
        } else {
          logStep("Could not find user for email", { email: customerEmail });
        }
      } else {
        logStep("Missing productId or customerEmail for credit delivery", { 
          productId, 
          customerEmail 
        });
      }
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logStep("Processing payment_intent.succeeded", { 
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount 
      });

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
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      logStep("Processing charge.refunded", { chargeId: charge.id });

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
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Processing subscription event", { 
        subscriptionId: subscription.id,
        status: subscription.status 
      });

      // For active subscriptions, deliver monthly credits
      if (subscription.status === 'active') {
        const customerEmail = typeof subscription.customer === 'string'
          ? null  // Need to fetch customer
          : (subscription.customer as Stripe.Customer)?.email;

        if (customerEmail) {
          const userId = await getUserIdFromEmail(customerEmail);
          // Subscription credit logic can be added here
          logStep("Subscription activated", { userId, customerEmail });
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Processing subscription.deleted", { subscriptionId: subscription.id });
      break;
    }

    default:
      logStep("Unhandled v1 event type", { type: event.type });
  }
}

// Process v2 thin event format
async function processV2Event(v2Event: Record<string, unknown>) {
  logStep("Processing v2 event", { 
    type: v2Event.type, 
    id: v2Event.id,
    relatedObject: v2Event.related_object
  });

  const eventType = v2Event.type as string;

  // Handle ping event for webhook verification
  if (eventType === "v2.core.event_destination.ping") {
    logStep("Received v2 ping event - webhook is configured correctly");
    return;
  }

  // For v2 "thin" events, we need to fetch the full object from Stripe
  const relatedObject = v2Event.related_object as { id?: string; type?: string } | undefined;
  
  if (!relatedObject?.id) {
    logStep("No related_object in v2 event, skipping");
    return;
  }

  // Map v2 event types to v1-style processing
  if (eventType.includes("checkout.session")) {
    try {
      const session = await stripe.checkout.sessions.retrieve(relatedObject.id);
      logStep("Fetched checkout session for v2 event", { sessionId: session.id });
      
      if (session.payment_status === "paid" && session.payment_intent) {
        const paymentIntentId = typeof session.payment_intent === 'string' 
          ? session.payment_intent 
          : session.payment_intent.id;

        const { error: insertError } = await supabase
          .from("payments")
          .upsert({
            stripe_payment_intent_id: paymentIntentId,
            amount: session.amount_total || 0,
            currency: session.currency || 'usd',
            status: "succeeded",
            customer_email: session.customer_email || null,
            description: `Checkout: ${session.metadata?.productId || 'Unknown product'}`,
            metadata: session.metadata || {},
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "stripe_payment_intent_id"
          });

        if (insertError) {
          logStep("Error recording v2 checkout payment", { error: insertError.message });
        } else {
          logStep("V2 checkout payment recorded successfully");
        }

        // CRITICAL: Deliver credits for v2 events too
        const productId = session.metadata?.productId;
        const customerEmail = session.customer_email;

        if (productId && customerEmail) {
          const userId = await getUserIdFromEmail(customerEmail);
          if (userId) {
            await deliverCredits(userId, productId, paymentIntentId, session.amount_total || 0);
          }
        }
      }
    } catch (err) {
      logStep("Error fetching checkout session for v2 event", { error: String(err) });
    }
  } else if (eventType.includes("payment_intent")) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(relatedObject.id);
      logStep("Fetched payment intent for v2 event", { 
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status 
      });
      
      const { error: insertError } = await supabase
        .from("payments")
        .upsert({
          stripe_payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status === "succeeded" ? "succeeded" : paymentIntent.status,
          customer_email: paymentIntent.receipt_email || null,
          description: paymentIntent.description || null,
          metadata: paymentIntent.metadata || {},
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "stripe_payment_intent_id"
        });

      if (insertError) {
        logStep("Error recording v2 payment", { error: insertError.message });
      } else {
        logStep("V2 payment recorded successfully");
      }
    } catch (err) {
      logStep("Error fetching payment intent for v2 event", { error: String(err) });
    }
  } else {
    logStep("Unhandled v2 event type", { type: eventType });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    logStep("Webhook received", { 
      signature: signature ? "present" : "missing",
      bodyLength: body.length 
    });

    // Parse the body first to detect format
    let parsedBody: Record<string, unknown>;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      logStep("Failed to parse webhook body");
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Detect if this is a v2 event (has "object": "v2.core.event")
    const isV2Event = parsedBody.object === "v2.core.event";
    
    logStep("Event format detected", { isV2: isV2Event, object: parsedBody.object });

    if (isV2Event) {
      // V2 events use a different signature format - Stripe-Signature header with webhook secret
      // For now, process v2 events with basic validation
      await processV2Event(parsedBody);
    } else {
      // V1 classic webhook event - verify signature
      const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
      let event: Stripe.Event;
      
      if (webhookSecret && signature) {
        try {
          event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
          logStep("V1 signature verified successfully");
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logStep("V1 signature verification failed", { error: errorMessage });
          return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${errorMessage}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }
      } else {
        logStep("WARNING: No signature verification - parsing event directly");
        event = parsedBody as Stripe.Event;
      }
      
      await processV1Event(event);
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
