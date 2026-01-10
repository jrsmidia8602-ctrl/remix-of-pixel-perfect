import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EXECUTION-RUNNER] ${step}${detailsStr}`);
};

interface ExecutionResult {
  success: boolean;
  response_time_ms: number;
  data?: unknown;
  error?: string;
}

// Simulate API call execution
async function executeApiCall(apiProduct: {
  api_endpoint: string;
  request_method: string | null;
  request_headers: Record<string, string> | null;
  request_body_template: unknown | null;
  auth_method: string | null;
}): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  try {
    logStep("Executing API call", { endpoint: apiProduct.api_endpoint, method: apiProduct.request_method });
    
    // For demo purposes, we simulate the API call
    // In production, this would make actual HTTP requests
    const simulatedDelay = Math.floor(Math.random() * 300) + 50;
    await new Promise(resolve => setTimeout(resolve, simulatedDelay));
    
    // Simulate 95% success rate
    const isSuccess = Math.random() > 0.05;
    
    if (!isSuccess) {
      throw new Error("Simulated API failure");
    }
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      response_time_ms: responseTime,
      data: {
        timestamp: new Date().toISOString(),
        endpoint: apiProduct.api_endpoint,
        simulated: true
      }
    };
  } catch (error) {
    return {
      success: false,
      response_time_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

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
    logStep("Runner started");
    
    const { action, agent_id, api_product_id, task_id } = await req.json();
    logStep("Request payload", { action, agent_id, api_product_id, task_id });

    switch (action) {
      case "execute_task": {
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

        logStep("Executing task", { 
          agent: agent.agent_name, 
          api: apiProduct.name 
        });

        // Execute the API call
        const result = await executeApiCall(apiProduct);
        
        logStep("Execution result", result);

        // Create execution record
        const { data: execution, error: execError } = await supabaseClient
          .from("executions")
          .insert({
            agent_id,
            api_product_id,
            cost: apiProduct.price_per_call || 0.001,
            revenue: 0, // Will be updated by billing-trigger
            status: result.success ? "completed" : "failed",
            response_time_ms: result.response_time_ms,
            completed_at: new Date().toISOString(),
            error_message: result.error || null,
            metadata: {
              agent_name: agent.agent_name,
              api_name: apiProduct.name,
              result_data: result.data
            }
          })
          .select()
          .single();

        if (execError) {
          throw new Error(`Failed to create execution: ${execError.message}`);
        }

        // If successful, trigger billing
        if (result.success) {
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
                agent_id,
                api_product_id,
                execution_id: execution.id
              })
            }
          );

          const billingResult = await billingResponse.json();
          logStep("Billing triggered", billingResult);
        } else {
          // Update agent error count
          await supabaseClient
            .from("autonomous_agents")
            .update({
              error_count: (agent.error_count || 0) + 1,
              last_error: result.error,
              last_active_at: new Date().toISOString()
            })
            .eq("id", agent_id);
        }

        // Update agent heartbeat
        await supabaseClient
          .from("autonomous_agents")
          .update({ 
            last_heartbeat_at: new Date().toISOString(),
            last_active_at: new Date().toISOString()
          })
          .eq("id", agent_id);

        return new Response(
          JSON.stringify({
            success: result.success,
            execution_id: execution.id,
            response_time_ms: result.response_time_ms,
            error: result.error
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "batch_execute": {
        // Execute multiple tasks in parallel
        const { tasks } = await req.json();
        
        if (!Array.isArray(tasks) || tasks.length === 0) {
          throw new Error("No tasks provided for batch execution");
        }

        const results = await Promise.all(
          tasks.map(async (task: { agent_id: string; api_product_id: string }) => {
            try {
              const response = await fetch(req.url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": req.headers.get("Authorization") || ""
                },
                body: JSON.stringify({
                  action: "execute_task",
                  agent_id: task.agent_id,
                  api_product_id: task.api_product_id
                })
              });
              return await response.json();
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
              };
            }
          })
        );

        const successCount = results.filter(r => r.success).length;
        
        return new Response(
          JSON.stringify({
            success: true,
            total: tasks.length,
            successful: successCount,
            failed: tasks.length - successCount,
            results
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_execution_status": {
        const { execution_id } = await req.json();
        
        const { data: execution, error } = await supabaseClient
          .from("executions")
          .select("*")
          .eq("id", execution_id)
          .single();

        if (error) {
          throw new Error(`Execution not found: ${error.message}`);
        }

        return new Response(
          JSON.stringify({ success: true, execution }),
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
