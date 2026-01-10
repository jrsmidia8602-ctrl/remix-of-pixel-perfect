import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AGENT-SCHEDULER] ${step}${detailsStr}`);
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
    logStep("Scheduler started");
    
    // Support both JSON body and URL query params (for cron triggers)
    let action = "run_scheduled_cycle"; // Default action for cron
    let agent_id = null;
    
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        const body = await req.json();
        action = body.action || action;
        agent_id = body.agent_id || agent_id;
      } catch {
        // Use defaults if JSON parsing fails
      }
    }
    
    logStep("Action requested", { action, agent_id });

    switch (action) {
      case "activate_agent": {
        // Activate a specific agent
        const { data: agent, error } = await supabaseClient
          .from("autonomous_agents")
          .update({ 
            status: "active",
            last_active_at: new Date().toISOString(),
            last_heartbeat_at: new Date().toISOString()
          })
          .eq("id", agent_id)
          .select()
          .single();

        if (error) throw new Error(`Failed to activate agent: ${error.message}`);
        
        logStep("Agent activated", { agent_id, name: agent.agent_name });

        return new Response(
          JSON.stringify({ success: true, agent }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "deactivate_agent": {
        const { data: agent, error } = await supabaseClient
          .from("autonomous_agents")
          .update({ status: "idle" })
          .eq("id", agent_id)
          .select()
          .single();

        if (error) throw new Error(`Failed to deactivate agent: ${error.message}`);
        
        logStep("Agent deactivated", { agent_id });

        return new Response(
          JSON.stringify({ success: true, agent }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "run_scheduled_cycle": {
        // Get all active agents
        const { data: agents, error: agentsError } = await supabaseClient
          .from("autonomous_agents")
          .select("*")
          .eq("status", "active");

        if (agentsError) throw new Error(`Failed to fetch agents: ${agentsError.message}`);

        logStep("Found active agents", { count: agents?.length || 0 });

        // Get available API products
        const { data: apiProducts, error: apiError } = await supabaseClient
          .from("api_products")
          .select("*")
          .eq("is_active", true);

        if (apiError) throw new Error(`Failed to fetch API products: ${apiError.message}`);

        const results = [];

        // For each active agent, try to execute an API call
        for (const agent of agents || []) {
          // Check budget
          const { data: todaySpend } = await supabaseClient
            .from("executions")
            .select("cost")
            .eq("agent_id", agent.id)
            .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

          const totalSpent = todaySpend?.reduce((sum, e) => sum + Number(e.cost), 0) || 0;
          const remainingBudget = (agent.daily_budget || 100) - totalSpent;

          logStep("Agent budget check", { 
            agent: agent.agent_name, 
            spent: totalSpent, 
            remaining: remainingBudget 
          });

          if (remainingBudget <= 0) {
            logStep("Agent budget exhausted", { agent: agent.agent_name });
            continue;
          }

          // Select a random API product that fits the budget
          const affordableApis = apiProducts?.filter(api => 
            (api.price_per_call || 0.001) <= remainingBudget
          ) || [];

          if (affordableApis.length === 0) {
            logStep("No affordable APIs for agent", { agent: agent.agent_name });
            continue;
          }

          const selectedApi = affordableApis[Math.floor(Math.random() * affordableApis.length)];
          
          logStep("Executing API call", { 
            agent: agent.agent_name, 
            api: selectedApi.name 
          });

          // Trigger billing
          const billingResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/billing-trigger`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
              },
              body: JSON.stringify({
                action: "create_execution_payment",
                agent_id: agent.id,
                api_product_id: selectedApi.id
              })
            }
          );

          const billingResult = await billingResponse.json();
          results.push({
            agent: agent.agent_name,
            api: selectedApi.name,
            result: billingResult
          });

          // Update agent heartbeat
          await supabaseClient
            .from("autonomous_agents")
            .update({ last_heartbeat_at: new Date().toISOString() })
            .eq("id", agent.id);
        }

        logStep("Cycle completed", { executions: results.length });

        return new Response(
          JSON.stringify({ 
            success: true, 
            cycle_results: results,
            agents_processed: agents?.length || 0,
            executions: results.length
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_agent_status": {
        const { data: agents, error } = await supabaseClient
          .from("autonomous_agents")
          .select(`
            *,
            executions:executions(count),
            revenue:autonomous_revenue(amount)
          `)
          .order("created_at", { ascending: false });

        if (error) throw new Error(`Failed to fetch agents: ${error.message}`);

        const agentStats = agents?.map(agent => ({
          id: agent.id,
          name: agent.agent_name,
          type: agent.agent_type,
          status: agent.status,
          daily_budget: agent.daily_budget,
          total_revenue: agent.total_revenue_generated,
          total_tasks: agent.total_tasks_completed,
          success_rate: agent.success_rate,
          last_active: agent.last_active_at
        }));

        return new Response(
          JSON.stringify({ success: true, agents: agentStats }),
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
