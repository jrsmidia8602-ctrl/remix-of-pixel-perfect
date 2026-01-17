import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BILLING-TRIGGER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");
    
    let action, agent_id, api_product_id, execution_id, amount;
    
    try {
      const body = await req.json();
      action = body.action;
      agent_id = body.agent_id;
      api_product_id = body.api_product_id;
      execution_id = body.execution_id;
      amount = body.amount;
    } catch {
      // If no body, return API info
      return new Response(
        JSON.stringify({
          name: "Billing Trigger API",
          version: "1.0.0",
          actions: ["create_execution_payment", "get_billing_summary"],
          status: "operational"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If no action provided, return billing summary by default
    if (!action) {
      action = "get_billing_summary";
    }
    
    logStep("Request payload", { action, agent_id, api_product_id, execution_id, amount });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    switch (action) {
      case "create_execution_payment": {
        // Get agent details
        const { data: agent, error: agentError } = await supabaseClient
          .from("autonomous_agents")
          .select("*")
          .eq("id", agent_id)
          .single();

        if (agentError || !agent) {
          throw new Error(`Agent not found: ${agentError?.message}`);
        }

        // Get API product details
        const { data: apiProduct, error: apiError } = await supabaseClient
          .from("api_products")
          .select("*")
          .eq("id", api_product_id)
          .single();

        if (apiError || !apiProduct) {
          throw new Error(`API product not found: ${apiError?.message}`);
        }

        const executionCost = amount || apiProduct.price_per_call || 0.001;
        const platformFee = executionCost * 0.05; // 5% platform fee
        const revenue = executionCost + platformFee;

        logStep("Creating execution", { 
          agent: agent.agent_name, 
          api: apiProduct.name, 
          cost: executionCost,
          revenue 
        });

        // Create execution record
        const { data: execution, error: execError } = await supabaseClient
          .from("executions")
          .insert({
            agent_id,
            api_product_id,
            cost: executionCost,
            revenue,
            status: "executing",
            metadata: {
              agent_name: agent.agent_name,
              api_name: apiProduct.name,
              platform_fee: platformFee
            }
          })
          .select()
          .single();

        if (execError) {
          throw new Error(`Failed to create execution: ${execError.message}`);
        }

        logStep("Execution created", { execution_id: execution.id });

        // Create payment intent for the execution
        const amountInCents = Math.round(revenue * 100);
        
        if (amountInCents >= 50) { // Stripe minimum is 50 cents
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: "usd",
            automatic_payment_methods: { enabled: true, allow_redirects: "never" },
            metadata: {
              execution_id: execution.id,
              agent_id,
              api_product_id,
              type: "agent_execution"
            },
            description: `XPEX Agent Execution: ${agent.agent_name} -> ${apiProduct.name}`
          });

          logStep("Payment intent created", { 
            payment_intent_id: paymentIntent.id,
            amount: amountInCents 
          });

          // Record the payment
          await supabaseClient
            .from("payments")
            .insert({
              stripe_payment_intent_id: paymentIntent.id,
              amount: amountInCents,
              currency: "usd",
              status: "pending",
              description: `Agent execution: ${agent.agent_name}`,
              metadata: {
                execution_id: execution.id,
                agent_id,
                api_product_id
              }
            });
        }

        // Update execution to completed
        const responseTime = Math.floor(Math.random() * 500) + 50; // Simulated response time
        await supabaseClient
          .from("executions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            response_time_ms: responseTime
          })
          .eq("id", execution.id);

        // Record autonomous revenue
        await supabaseClient
          .from("autonomous_revenue")
          .insert({
            agent_id,
            task_id: null,
            revenue_source: "api_calls",
            amount: revenue,
            platform_fee: platformFee,
            seller_amount: executionCost * 0.8,
            agent_reward: executionCost * 0.15,
            revenue_date: new Date().toISOString(),
            status: "collected",
            currency: "USD",
            metadata: {
              execution_id: execution.id,
              api_product_id
            }
          });

        // Update agent stats
        await supabaseClient
          .from("autonomous_agents")
          .update({
            total_tasks_completed: agent.total_tasks_completed + 1,
            total_revenue_generated: (agent.total_revenue_generated || 0) + revenue,
            last_active_at: new Date().toISOString(),
            status: "active"
          })
          .eq("id", agent_id);

        // Update API product stats
        await supabaseClient
          .from("api_products")
          .update({
            total_calls: (apiProduct.total_calls || 0) + 1,
            successful_calls: (apiProduct.successful_calls || 0) + 1,
            total_revenue: (apiProduct.total_revenue || 0) + revenue
          })
          .eq("id", api_product_id);

        logStep("Execution completed successfully", { 
          execution_id: execution.id,
          revenue 
        });

        return new Response(
          JSON.stringify({
            success: true,
            execution_id: execution.id,
            cost: executionCost,
            revenue,
            platform_fee: platformFee
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_billing_summary": {
        // Get today's revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: todayRevenue } = await supabaseClient
          .from("autonomous_revenue")
          .select("amount")
          .gte("created_at", today.toISOString());

        const { data: allRevenue } = await supabaseClient
          .from("autonomous_revenue")
          .select("amount, platform_fee");

        const { data: executions } = await supabaseClient
          .from("executions")
          .select("id, status")
          .gte("created_at", today.toISOString());

        const totalRevenue = allRevenue?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
        const totalPlatformFees = allRevenue?.reduce((sum, r) => sum + Number(r.platform_fee || 0), 0) || 0;
        const todayTotal = todayRevenue?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
        const todayExecutions = executions?.length || 0;
        const successfulExecutions = executions?.filter(e => e.status === "completed").length || 0;

        return new Response(
          JSON.stringify({
            success: true,
            summary: {
              total_revenue: totalRevenue,
              total_platform_fees: totalPlatformFees,
              today_revenue: todayTotal,
              today_executions: todayExecutions,
              successful_executions: successfulExecutions,
              success_rate: todayExecutions > 0 ? (successfulExecutions / todayExecutions) * 100 : 0
            }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
