import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Pricing configuration
const PRICING = {
  base_fee: 0.01,
  multipliers: {
    payment: 2.0,
    automation: 1.5,
    data: 1.0,
    ai: 3.0,
  } as Record<string, number>,
  platform_fee_percent: 5,
};

interface ApiKeyRecord {
  id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  owner_id: string | null;
  permissions: string[];
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  daily_budget: number;
  total_spent: number;
  total_executions: number;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AgentRecord {
  id: string;
  agent_name: string;
  agent_type: string;
  status: string;
  performance_score: number;
  total_tasks_completed: number;
  total_revenue_generated: number;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PHOENIX-API] ${step}${detailsStr}`);
};

// Hash API key for secure storage lookup
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Validate API key and return key record
// deno-lint-ignore no-explicit-any
async function validateApiKey(supabaseClient: SupabaseClient<any>, apiKey: string): Promise<{ valid: boolean; error?: string; keyRecord?: ApiKeyRecord }> {
  const keyHash = await hashApiKey(apiKey);
  
  const { data: keyRecord, error } = await supabaseClient
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .single();

  if (error || !keyRecord) {
    return { valid: false, error: "Invalid or inactive API key" };
  }

  const record = keyRecord as ApiKeyRecord;

  // Check expiration
  if (record.expires_at && new Date(record.expires_at) < new Date()) {
    return { valid: false, error: "API key has expired" };
  }

  // Check daily budget
  if (record.total_spent >= record.daily_budget) {
    return { valid: false, error: "Daily budget exceeded" };
  }

  return { valid: true, keyRecord: record };
}

// Calculate execution cost based on agent type
function calculateCost(agentType: string): number {
  const multiplier = PRICING.multipliers[agentType] || 1.0;
  return PRICING.base_fee * multiplier;
}

// Select best available agent for the task
// deno-lint-ignore no-explicit-any
async function selectAgent(supabaseClient: SupabaseClient<any>, taskType: string): Promise<AgentRecord | null> {
  // Map task types to agent types
  const agentTypeMap: Record<string, string> = {
    payment: "payment_bot",
    data: "api_consumer",
    automation: "volume_generator",
    ai: "api_consumer",
  };

  const agentType = agentTypeMap[taskType] || "api_consumer";

  const { data: agents, error } = await supabaseClient
    .from("autonomous_agents")
    .select("*")
    .eq("agent_type", agentType)
    .eq("status", "active")
    .order("performance_score", { ascending: false })
    .limit(1);

  if (error || !agents || agents.length === 0) {
    // Fallback: get any active agent
    const { data: fallbackAgents } = await supabaseClient
      .from("autonomous_agents")
      .select("*")
      .eq("status", "active")
      .order("performance_score", { ascending: false })
      .limit(1);

    if (fallbackAgents && fallbackAgents.length > 0) {
      return fallbackAgents[0] as AgentRecord;
    }
    return null;
  }

  return agents[0] as AgentRecord;
}

// Log execution step
// deno-lint-ignore no-explicit-any
async function logExecutionStep(
  supabaseClient: SupabaseClient<any>,
  executionId: string,
  apiKeyId: string,
  step: string,
  status: string,
  details?: Record<string, unknown>,
  durationMs?: number
) {
  await supabaseClient.from("execution_logs").insert({
    execution_id: executionId,
    api_key_id: apiKeyId,
    step,
    status,
    details,
    duration_ms: durationMs,
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const apiKey = req.headers.get("x-api-key");

    logStep("Request received", { path, method: req.method });

    // Root endpoint - API info
    if (path === "/" || path === "") {
      return new Response(
        JSON.stringify({
          name: "Phoenix Execution API",
          version: "1.0.0",
          owner: "XPEC Systems",
          endpoints: {
            execute: "POST /v1/execute",
            status: "GET /v1/status/{execution_id}",
            balance: "GET /v1/balance",
          },
          documentation: "https://xpec.systems/docs/api",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All v1 endpoints require API key
    if (path.startsWith("/v1")) {
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Missing API key. Include x-api-key header." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const authResult = await validateApiKey(supabase, apiKey);
      if (!authResult.valid) {
        return new Response(
          JSON.stringify({ error: authResult.error }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const keyRecord = authResult.keyRecord!;

      // POST /v1/execute - Submit execution request
      if (path === "/v1/execute" && req.method === "POST") {
        const startTime = Date.now();
        const body = await req.json();
        const { task_type = "data", payload = {}, priority = 5 } = body;

        logStep("Execute request", { task_type, priority });

        // Check permissions
        if (!keyRecord.permissions.includes("execute")) {
          return new Response(
            JSON.stringify({ error: "API key does not have execute permission" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Select agent
        const agent = await selectAgent(supabase, task_type);
        if (!agent) {
          return new Response(
            JSON.stringify({ error: "No available agents for this task type" }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Calculate cost
        const cost = calculateCost(task_type);
        const platformFee = cost * (PRICING.platform_fee_percent / 100);
        const revenue = cost;

        // Check if key has sufficient budget
        if (keyRecord.total_spent + cost > keyRecord.daily_budget) {
          return new Response(
            JSON.stringify({ 
              error: "Insufficient budget",
              required: cost,
              remaining: keyRecord.daily_budget - keyRecord.total_spent,
            }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create execution record
        const { data: execution, error: execError } = await supabase
          .from("executions")
          .insert({
            agent_id: agent.id,
            status: "pending",
            cost,
            revenue,
            metadata: {
              task_type,
              payload,
              priority,
              api_key_id: keyRecord.id,
              platform_fee: platformFee,
            },
          })
          .select()
          .single();

        if (execError || !execution) {
          logStep("Execution create error", execError);
          throw new Error("Failed to create execution");
        }

        const execRecord = execution as { id: string };

        // Log the request step
        await logExecutionStep(supabase, execRecord.id, keyRecord.id, "request_received", "success", { task_type, priority });

        // Simulate agent execution (in production, this would trigger the actual agent)
        const executeAgent = async () => {
          const execStartTime = Date.now();
          
          await logExecutionStep(supabase, execRecord.id, keyRecord.id, "agent_assigned", "success", { agent_id: agent.id, agent_name: agent.agent_name });
          
          // Simulate execution time (100-500ms)
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
          
          const success = Math.random() > 0.05; // 95% success rate
          const responseTimeMs = Date.now() - execStartTime;

          if (success) {
            // Update execution to completed
            await supabase
              .from("executions")
              .update({
                status: "completed",
                completed_at: new Date().toISOString(),
                response_time_ms: responseTimeMs,
              })
              .eq("id", execRecord.id);

            // Record revenue
            await supabase.from("autonomous_revenue").insert({
              agent_id: agent.id,
              amount: revenue,
              platform_fee: platformFee,
              revenue_source: "api_calls",
              revenue_date: new Date().toISOString(),
              status: "collected",
              metadata: {
                execution_id: execRecord.id,
                api_key_id: keyRecord.id,
                task_type,
              },
            });

            // Update API key usage
            await supabase
              .from("api_keys")
              .update({
                total_spent: keyRecord.total_spent + cost,
                total_executions: keyRecord.total_executions + 1,
                last_used_at: new Date().toISOString(),
              })
              .eq("id", keyRecord.id);

            // Update agent stats
            await supabase
              .from("autonomous_agents")
              .update({
                total_tasks_completed: agent.total_tasks_completed + 1,
                total_revenue_generated: agent.total_revenue_generated + revenue,
                last_active_at: new Date().toISOString(),
              })
              .eq("id", agent.id);

            await logExecutionStep(supabase, execRecord.id, keyRecord.id, "execution_completed", "success", { response_time_ms: responseTimeMs }, responseTimeMs);
          } else {
            await supabase
              .from("executions")
              .update({
                status: "failed",
                error_message: "Agent execution failed",
                completed_at: new Date().toISOString(),
                response_time_ms: responseTimeMs,
              })
              .eq("id", execRecord.id);

            await logExecutionStep(supabase, execRecord.id, keyRecord.id, "execution_failed", "error", { error: "Agent execution failed" }, responseTimeMs);
          }
        };

        // Fire and forget execution (async)
        executeAgent().catch(err => logStep("Async execution error", err));

        const totalTime = Date.now() - startTime;

        return new Response(
          JSON.stringify({
            success: true,
            execution_id: execRecord.id,
            status: "pending",
            agent: {
              id: agent.id,
              name: agent.agent_name,
              type: agent.agent_type,
            },
            cost: {
              amount: cost,
              currency: "USD",
              platform_fee: platformFee,
            },
            message: "Execution queued. Use /v1/status/{execution_id} to check progress.",
            request_time_ms: totalTime,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET /v1/status/{execution_id} - Check execution status
      if (path.startsWith("/v1/status/") && req.method === "GET") {
        const executionId = path.replace("/v1/status/", "");

        if (!keyRecord.permissions.includes("status")) {
          return new Response(
            JSON.stringify({ error: "API key does not have status permission" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: execution, error } = await supabase
          .from("executions")
          .select("*, autonomous_agents(agent_name, agent_type)")
          .eq("id", executionId)
          .single();

        if (error || !execution) {
          return new Response(
            JSON.stringify({ error: "Execution not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const exec = execution as {
          id: string;
          status: string;
          cost: number;
          revenue: number;
          response_time_ms: number | null;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
          autonomous_agents: { agent_name: string; agent_type: string } | null;
        };

        // Get execution logs
        const { data: logs } = await supabase
          .from("execution_logs")
          .select("step, status, details, duration_ms, created_at")
          .eq("execution_id", executionId)
          .order("created_at", { ascending: true });

        return new Response(
          JSON.stringify({
            execution_id: exec.id,
            status: exec.status,
            agent: exec.autonomous_agents ? {
              name: exec.autonomous_agents.agent_name,
              type: exec.autonomous_agents.agent_type,
            } : null,
            cost: exec.cost,
            revenue: exec.revenue,
            response_time_ms: exec.response_time_ms,
            error_message: exec.error_message,
            created_at: exec.created_at,
            completed_at: exec.completed_at,
            logs: logs || [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET /v1/balance - Check account balance and usage
      if (path === "/v1/balance" && req.method === "GET") {
        if (!keyRecord.permissions.includes("balance")) {
          return new Response(
            JSON.stringify({ error: "API key does not have balance permission" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get recent executions for this key
        const { data: recentExecutions } = await supabase
          .from("execution_logs")
          .select("execution_id, created_at")
          .eq("api_key_id", keyRecord.id)
          .order("created_at", { ascending: false })
          .limit(10);

        const executionIds = [...new Set((recentExecutions as { execution_id: string }[] || []).map(e => e.execution_id))];

        return new Response(
          JSON.stringify({
            api_key: {
              name: keyRecord.name,
              prefix: keyRecord.key_prefix,
              created_at: keyRecord.created_at,
              expires_at: keyRecord.expires_at,
            },
            usage: {
              total_spent: keyRecord.total_spent,
              daily_budget: keyRecord.daily_budget,
              remaining_budget: keyRecord.daily_budget - keyRecord.total_spent,
              total_executions: keyRecord.total_executions,
              last_used_at: keyRecord.last_used_at,
            },
            rate_limits: {
              per_minute: keyRecord.rate_limit_per_minute,
              per_hour: keyRecord.rate_limit_per_hour,
            },
            recent_execution_ids: executionIds,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Unknown endpoint
    return new Response(
      JSON.stringify({ error: "Not found", path }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    logStep("Error", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
