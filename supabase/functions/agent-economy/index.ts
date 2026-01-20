import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[AGENT-ECONOMY] ${step}:`, details ? JSON.stringify(details) : "");
};

interface ExecutionRequest {
  agent_id: string;
  user_id?: string;
  api_key?: string;
  parameters?: Record<string, unknown>;
}

interface CreditPurchaseRequest {
  user_id: string;
  pack_id: string;
  payment_intent_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.replace("/agent-economy", "");
    
    let body = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const action = (body as any).action || path.replace("/", "") || "status";
    logStep("Processing action", { action, path });

    switch (action) {
      // ==========================================
      // MARKETPLACE ENDPOINTS
      // ==========================================
      
      case "list_agents":
      case "/v1/agents": {
        const { data: agents, error } = await supabase
          .from("agent_marketplace")
          .select(`
            *,
            agent:autonomous_agents(
              id,
              agent_type,
              status,
              performance_score,
              success_rate
            )
          `)
          .eq("status", "active")
          .eq("is_public", true)
          .order("is_featured", { ascending: false })
          .order("execution_count", { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          agents: agents || [],
          total: agents?.length || 0
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_agent": {
        const agentId = (body as any).agent_id;
        if (!agentId) {
          return new Response(JSON.stringify({ error: "agent_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: agent, error } = await supabase
          .from("agent_marketplace")
          .select(`
            *,
            agent:autonomous_agents(*)
          `)
          .eq("agent_id", agentId)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, agent }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ==========================================
      // EXECUTION ENDPOINTS
      // ==========================================

      case "execute":
      case "/v1/execute": {
        const { agent_id, user_id, api_key, parameters } = body as ExecutionRequest;
        
        if (!agent_id) {
          return new Response(JSON.stringify({ error: "agent_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get agent marketplace info
        const { data: marketplaceAgent, error: agentError } = await supabase
          .from("agent_marketplace")
          .select("*, agent:autonomous_agents(*)")
          .eq("agent_id", agent_id)
          .single();

        if (agentError || !marketplaceAgent) {
          return new Response(JSON.stringify({ error: "Agent not found in marketplace" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Determine user (from api_key or user_id)
        let effectiveUserId = user_id;
        if (api_key && !user_id) {
          const { data: keyData } = await supabase
            .from("api_keys")
            .select("owner_id")
            .eq("key_prefix", api_key.substring(0, 8))
            .eq("is_active", true)
            .single();
          
          if (keyData) {
            effectiveUserId = keyData.owner_id;
          }
        }

        const executionCost = marketplaceAgent.price_per_execution;

        // Check wallet balance if user is identified
        if (effectiveUserId) {
          const { data: wallet } = await supabase
            .from("user_wallets")
            .select("balance_credits")
            .eq("user_id", effectiveUserId)
            .single();

          if (!wallet || wallet.balance_credits < executionCost) {
            return new Response(JSON.stringify({
              error: "Insufficient credits",
              required: executionCost,
              available: wallet?.balance_credits || 0
            }), {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        // Create execution record
        const { data: execution, error: execError } = await supabase
          .from("executions")
          .insert({
            agent_id,
            cost: executionCost,
            status: "pending",
            metadata: { parameters, source: "marketplace" }
          })
          .select()
          .single();

        if (execError) throw execError;

        // Simulate execution (in production, this would call the actual agent)
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
        const responseTime = Date.now() - startTime;
        
        const success = Math.random() > 0.05; // 95% success rate
        const revenue = success ? executionCost * 1.2 : 0;

        // Update execution
        await supabase
          .from("executions")
          .update({
            status: success ? "completed" : "failed",
            completed_at: new Date().toISOString(),
            response_time_ms: responseTime,
            revenue
          })
          .eq("id", execution.id);

        // Deduct credits if user identified and successful
        if (effectiveUserId && success) {
          const { data: wallet } = await supabase
            .from("user_wallets")
            .select("balance_credits")
            .eq("user_id", effectiveUserId)
            .single();

          await supabase.from("credit_transactions").insert({
            user_id: effectiveUserId,
            agent_id,
            execution_id: execution.id,
            amount: executionCost,
            transaction_type: "debit",
            source: "agent_execution",
            description: `Execution of ${marketplaceAgent.name}`,
            balance_before: wallet?.balance_credits || 0,
            balance_after: (wallet?.balance_credits || 0) - executionCost
          });
        }

        // Record revenue
        await supabase.from("autonomous_revenue").insert({
          agent_id,
          amount: revenue,
          revenue_source: "api_calls",
          revenue_date: new Date().toISOString(),
          platform_fee: revenue * 0.05,
          seller_amount: revenue * 0.85,
          agent_reward: revenue * 0.10,
          status: "collected",
          collected_at: new Date().toISOString()
        });

        // Log API usage
        await supabase.from("api_usage_logs").insert({
          user_id: effectiveUserId,
          endpoint: "/v1/execute",
          method: "POST",
          credits_consumed: executionCost,
          response_status: success ? 200 : 500,
          response_time_ms: responseTime,
          request_metadata: { agent_id, parameters }
        });

        logStep("Execution completed", { execution_id: execution.id, success, revenue });

        return new Response(JSON.stringify({
          success,
          execution_id: execution.id,
          cost: executionCost,
          response_time_ms: responseTime,
          result: success ? { message: "Execution completed successfully" } : { error: "Execution failed" }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ==========================================
      // WALLET ENDPOINTS
      // ==========================================

      case "get_wallet":
      case "/v1/wallet": {
        const userId = (body as any).user_id;
        if (!userId) {
          return new Response(JSON.stringify({ error: "user_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get or create wallet
        let { data: wallet } = await supabase
          .from("user_wallets")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (!wallet) {
          const { data: newWallet, error } = await supabase
            .from("user_wallets")
            .insert({ user_id: userId, balance_credits: 10 })
            .select()
            .single();
          
          if (error) throw error;
          wallet = newWallet;
        }

        // Get recent transactions
        const { data: transactions } = await supabase
          .from("credit_transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);

        return new Response(JSON.stringify({
          success: true,
          wallet,
          transactions: transactions || []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add_credits": {
        const { user_id, amount, source, description } = body as any;
        
        if (!user_id || !amount) {
          return new Response(JSON.stringify({ error: "user_id and amount required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get current balance
        let { data: wallet } = await supabase
          .from("user_wallets")
          .select("balance_credits")
          .eq("user_id", user_id)
          .single();

        if (!wallet) {
          await supabase.from("user_wallets").insert({ user_id, balance_credits: 0 });
          wallet = { balance_credits: 0 };
        }

        // Create transaction (trigger will update wallet)
        await supabase.from("credit_transactions").insert({
          user_id,
          amount,
          transaction_type: "credit",
          source: source || "purchase",
          description: description || "Credits added",
          balance_before: wallet.balance_credits,
          balance_after: wallet.balance_credits + amount
        });

        logStep("Credits added", { user_id, amount });

        return new Response(JSON.stringify({
          success: true,
          new_balance: wallet.balance_credits + amount
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ==========================================
      // CREDIT PACKS
      // ==========================================

      case "list_credit_packs": {
        const { data: packs, error } = await supabase
          .from("credit_packs")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          packs: packs || []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "purchase_credits": {
        const { user_id, pack_id, payment_intent_id } = body as CreditPurchaseRequest;

        if (!user_id || !pack_id) {
          return new Response(JSON.stringify({ error: "user_id and pack_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: pack, error: packError } = await supabase
          .from("credit_packs")
          .select("*")
          .eq("id", pack_id)
          .single();

        if (packError || !pack) {
          return new Response(JSON.stringify({ error: "Pack not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const totalCredits = pack.credits_amount + (pack.bonus_credits || 0);

        // Get or create wallet
        let { data: wallet } = await supabase
          .from("user_wallets")
          .select("balance_credits")
          .eq("user_id", user_id)
          .single();

        if (!wallet) {
          await supabase.from("user_wallets").insert({ user_id, balance_credits: 0 });
          wallet = { balance_credits: 0 };
        }

        // Add credits transaction
        await supabase.from("credit_transactions").insert({
          user_id,
          amount: totalCredits,
          transaction_type: "credit",
          source: "purchase",
          description: `Purchased ${pack.name} pack`,
          balance_before: wallet.balance_credits,
          balance_after: wallet.balance_credits + totalCredits,
          metadata: { pack_id, pack_name: pack.name, payment_intent_id }
        });

        // Record revenue
        await supabase.from("autonomous_revenue").insert({
          amount: pack.price_usd,
          revenue_source: "other",
          revenue_date: new Date().toISOString(),
          platform_fee: pack.price_usd,
          status: "collected",
          collected_at: new Date().toISOString(),
          metadata: { type: "credit_pack_purchase", pack_id, user_id }
        });

        logStep("Credits purchased", { user_id, pack: pack.name, credits: totalCredits });

        return new Response(JSON.stringify({
          success: true,
          credits_added: totalCredits,
          new_balance: wallet.balance_credits + totalCredits
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ==========================================
      // ECONOMY STATS
      // ==========================================

      case "economy_stats": {
        const [
          { data: wallets },
          { data: transactions },
          { data: marketplace },
          { data: revenue }
        ] = await Promise.all([
          supabase.from("user_wallets").select("balance_credits, total_spent, total_earned"),
          supabase.from("credit_transactions").select("amount, transaction_type, source").limit(1000),
          supabase.from("agent_marketplace").select("execution_count, total_revenue"),
          supabase.from("autonomous_revenue").select("amount, platform_fee").limit(1000)
        ]);

        const totalCreditsInCirculation = wallets?.reduce((sum, w) => sum + Number(w.balance_credits), 0) || 0;
        const totalSpent = wallets?.reduce((sum, w) => sum + Number(w.total_spent), 0) || 0;
        const totalMarketplaceExecutions = marketplace?.reduce((sum, m) => sum + m.execution_count, 0) || 0;
        const totalMarketplaceRevenue = marketplace?.reduce((sum, m) => sum + Number(m.total_revenue), 0) || 0;
        const totalPlatformRevenue = revenue?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
        const totalPlatformFees = revenue?.reduce((sum, r) => sum + Number(r.platform_fee), 0) || 0;

        return new Response(JSON.stringify({
          success: true,
          economy: {
            total_credits_in_circulation: totalCreditsInCirculation,
            total_credits_spent: totalSpent,
            total_wallets: wallets?.length || 0,
            marketplace: {
              total_agents: marketplace?.length || 0,
              total_executions: totalMarketplaceExecutions,
              total_revenue: totalMarketplaceRevenue
            },
            platform: {
              total_revenue: totalPlatformRevenue,
              total_fees: totalPlatformFees
            }
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "status":
      default:
        return new Response(JSON.stringify({
          service: "XPEX Agent Economy",
          version: "1.0.0",
          status: "operational",
          endpoints: [
            "GET /v1/agents - List marketplace agents",
            "POST /v1/execute - Execute agent (requires credits)",
            "GET /v1/wallet - Get user wallet",
            "POST add_credits - Add credits to wallet",
            "GET list_credit_packs - List available credit packs",
            "POST purchase_credits - Purchase credit pack",
            "GET economy_stats - Get economy statistics"
          ]
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
