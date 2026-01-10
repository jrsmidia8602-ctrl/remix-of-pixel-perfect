// Payment Bot - XPEX Neural Supreme
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentResult {
  transactionId: string;
  amount: number;
  platformFee: number;
  status: string;
  method: "stripe" | "crypto";
  timestamp: string;
}

class PaymentBot {
  private supabase: ReturnType<typeof createClient>;
  private stripe: Stripe;
  private stats = {
    totalPayments: 0,
    successfulPayments: 0,
    totalVolume: 0,
    platformFees: 0,
  };

  constructor() {
    this.supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    this.stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
  }

  async processPaymentQueue(): Promise<{ processed: number; failed: number }> {
    console.log("💰 Processing payment queue...");

    const { data: pendingPayments, error } = await (this.supabase
      .from("pending_payments") as any)
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(10);

    if (error || !pendingPayments) {
      console.error("Failed to fetch pending payments:", error);
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;

    for (const payment of pendingPayments) {
      try {
        await this.executePayment(payment);
        processed++;
      } catch (err: unknown) {
        const error = err as Error;
        console.error(`Payment ${payment.id} failed:`, error);
        failed++;
      }
    }

    return { processed, failed };
  }

  async executePayment(payment: Record<string, unknown>): Promise<PaymentResult> {
    console.log(`💸 Processing payment: ${payment.id} for $${payment.amount}`);

    // Update status to processing
    await (this.supabase.from("pending_payments") as any)
      .update({ status: "processing" })
      .eq("id", payment.id);

    try {
      let result: PaymentResult;

      if (payment.payment_method === "stripe") {
        result = await this.processStripePayment(payment);
      } else if (payment.payment_method === "crypto") {
        result = await this.processCryptoPayment(payment);
      } else {
        throw new Error(`Unknown payment method: ${payment.payment_method}`);
      }

      // Update payment status
      await (this.supabase.from("pending_payments") as any)
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          transaction_id: result.transactionId,
          metadata: { ...((payment.metadata as Record<string, unknown>) || {}), result },
        })
        .eq("id", payment.id);

      // Record revenue
      await this.recordPaymentRevenue(payment, result);

      // Update stats
      this.stats.totalPayments++;
      this.stats.successfulPayments++;
      this.stats.totalVolume += result.amount;
      this.stats.platformFees += result.platformFee;

      console.log(`✅ Payment ${payment.id} completed successfully`);
      return result;

    } catch (err: unknown) {
      const error = err as Error;
      console.error(`❌ Payment ${payment.id} failed:`, error);

      await (this.supabase.from("pending_payments") as any)
        .update({
          status: "failed",
          error_message: error.message,
          retry_count: ((payment.retry_count as number) || 0) + 1,
          next_retry_at: new Date(Date.now() + 300000).toISOString(),
        })
        .eq("id", payment.id);

      this.stats.totalPayments++;
      throw error;
    }
  }

  private async processStripePayment(payment: Record<string, unknown>): Promise<PaymentResult> {
    const { data: seller } = await (this.supabase
      .from("sellers") as any)
      .select("stripe_account_id")
      .eq("id", payment.seller_id)
      .single();

    if (!seller?.stripe_account_id) {
      throw new Error("Seller Stripe account not found");
    }

    const amount = Number(payment.amount);
    const amountCents = Math.round(amount * 100);
    const platformFeeCents = Math.round(amountCents * 0.05); // 5% platform fee

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: (payment.currency as string) || "usd",
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: seller.stripe_account_id,
      },
      metadata: {
        payment_id: payment.id as string,
        agent: "payment_bot",
        purpose: (payment.purpose as string) || "api_consumption",
      },
    });

    return {
      transactionId: paymentIntent.id,
      amount: amount,
      platformFee: platformFeeCents / 100,
      status: paymentIntent.status,
      method: "stripe",
      timestamp: new Date().toISOString(),
    };
  }

  private async processCryptoPayment(payment: Record<string, unknown>): Promise<PaymentResult> {
    // Simulate crypto payment (in production, would use actual blockchain)
    const amount = Number(payment.amount);
    const platformFee = amount * 0.03; // 3% for crypto

    console.log(`Simulating crypto payment: $${amount}`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      transactionId: `crypto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount,
      platformFee: platformFee,
      status: "simulated_success",
      method: "crypto",
      timestamp: new Date().toISOString(),
    };
  }

  private async recordPaymentRevenue(payment: Record<string, unknown>, result: PaymentResult) {
    await (this.supabase.from("autonomous_revenue") as any)
      .insert({
        revenue_source: "payment_fees",
        transaction_id: result.transactionId,
        amount: result.amount,
        currency: (payment.currency as string) || "USD",
        platform_fee: result.platformFee,
        seller_amount: result.amount - result.platformFee,
        revenue_date: new Date().toISOString().split("T")[0],
        status: "collected",
        metadata: {
          payment_id: payment.id,
          seller_id: payment.seller_id,
          method: result.method,
        },
      });
  }

  async optimizeYield(): Promise<{ strategies: unknown[] }> {
    console.log("💰 Analyzing yield opportunities...");

    const strategies = [
      { name: "Aave", apy: 3.5, risk: "low", minAmount: 100 },
      { name: "Compound", apy: 2.8, risk: "low", minAmount: 100 },
      { name: "Uniswap V3", apy: 5.2, risk: "medium", minAmount: 500 },
      { name: "Yearn", apy: 4.1, risk: "medium", minAmount: 1000 },
    ];

    const opportunities = [];

    for (const strategy of strategies) {
      const estimatedMonthlyYield = 1000 * (strategy.apy / 100 / 12);
      
      opportunities.push({
        ...strategy,
        estimatedMonthlyYield,
        score: strategy.apy * (strategy.risk === "low" ? 1 : 0.8),
      });
    }

    // Record yield strategies
    for (const opp of opportunities.slice(0, 2)) {
      await (this.supabase.from("yield_strategies") as any)
        .insert({
          wallet_id: "system",
          chain_id: 8453,
          strategy_name: opp.name,
          amount: 1000,
          apy: opp.apy,
          risk_level: opp.risk,
          estimated_monthly_yield: opp.estimatedMonthlyYield,
          status: "pending",
          metadata: { score: opp.score },
        });
    }

    return { strategies: opportunities.sort((a, b) => b.score - a.score) };
  }

  async monitorArbitrage(): Promise<{ opportunities: unknown[] }> {
    console.log("🔄 Monitoring cross-chain arbitrage...");

    // Simulated cross-chain prices
    const prices = [
      { chain: "Base", price: 1.000, gasCost: 0.01 },
      { chain: "Polygon", price: 0.999, gasCost: 0.005 },
      { chain: "Arbitrum", price: 1.001, gasCost: 0.02 },
      { chain: "Optimism", price: 1.0005, gasCost: 0.015 },
    ];

    const opportunities = [];
    const bridgeCost = 0.01;

    for (let i = 0; i < prices.length; i++) {
      for (let j = 0; j < prices.length; j++) {
        if (i !== j) {
          const profit = prices[j].price - prices[i].price - prices[i].gasCost - prices[j].gasCost - bridgeCost;
          
          if (profit > 0) {
            opportunities.push({
              buyChain: prices[i].chain,
              sellChain: prices[j].chain,
              buyPrice: prices[i].price,
              sellPrice: prices[j].price,
              profit,
              profitPercentage: (profit / prices[i].price) * 100,
            });
          }
        }
      }
    }

    // Record profitable opportunities
    for (const opp of opportunities.filter(o => o.profit > 0.001)) {
      await (this.supabase.from("arbitrage_opportunities") as any)
        .insert({
          buy_chain: opp.buyChain,
          sell_chain: opp.sellChain,
          buy_price: opp.buyPrice,
          sell_price: opp.sellPrice,
          estimated_profit: opp.profit * 1000, // For $1000 volume
          status: "detected",
          metadata: { profitPercentage: opp.profitPercentage },
        });
    }

    return { opportunities: opportunities.sort((a, b) => b.profit - a.profit) };
  }

  async schedulePayment(paymentData: {
    sellerId: string;
    amount: number;
    currency?: string;
    method?: "stripe" | "crypto";
    purpose?: string;
    scheduledFor?: string;
  }): Promise<{ id: string }> {
    const { data, error } = await (this.supabase.from("pending_payments") as any)
      .insert({
        seller_id: paymentData.sellerId,
        amount: paymentData.amount,
        currency: paymentData.currency || "USD",
        payment_method: paymentData.method || "stripe",
        purpose: paymentData.purpose,
        scheduled_for: paymentData.scheduledFor || new Date().toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to schedule payment: ${error.message}`);
    }

    return { id: (data as any).id };
  }

  getStats() {
    return this.stats;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bot = new PaymentBot();
    const url = new URL(req.url);
    const path = url.pathname.replace("/payment-bot", "");

    // Process payment queue
    if (path === "/process" && req.method === "POST") {
      const result = await bot.processPaymentQueue();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Schedule new payment
    if (path === "/schedule" && req.method === "POST") {
      const paymentData = await req.json();
      const result = await bot.schedulePayment(paymentData);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optimize yield
    if (path === "/yield" && req.method === "POST") {
      const result = await bot.optimizeYield();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Monitor arbitrage
    if (path === "/arbitrage" && req.method === "POST") {
      const result = await bot.monitorArbitrage();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get stats
    if (path === "/stats" && req.method === "GET") {
      const stats = bot.getStats();
      return new Response(JSON.stringify(stats), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      message: "Payment Bot Service",
      endpoints: ["/process", "/schedule", "/yield", "/arbitrage", "/stats"],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("Payment Bot Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
