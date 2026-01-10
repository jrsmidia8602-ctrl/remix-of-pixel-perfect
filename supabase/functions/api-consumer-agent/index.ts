// API Consumer Agent - XPEX Neural Supreme
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgentConfig {
  id: string;
  name: string;
  wallet: string;
  dailyBudget: number;
  maxCallsPerMinute: number;
  preferredPaymentMethod: "stripe" | "crypto";
  targetApis: string[];
  behaviorProfile: "aggressive" | "moderate" | "conservative";
}

interface PerformanceStats {
  totalCalls: number;
  successfulCalls: number;
  totalSpent: number;
  totalRevenue: number;
  lastCallTime: Date;
}

class APIConsumerAgent {
  private supabase: ReturnType<typeof createClient>;
  private config: AgentConfig;
  private isActive: boolean = false;
  private performanceStats: PerformanceStats = {
    totalCalls: 0,
    successfulCalls: 0,
    totalSpent: 0,
    totalRevenue: 0,
    lastCallTime: new Date(),
  };

  constructor(config: AgentConfig) {
    this.config = config;
    this.supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
  }

  async register(): Promise<{ success: boolean; id: string }> {
    const { data, error } = await (this.supabase
      .from("autonomous_agents") as any)
      .upsert({
        id: this.config.id,
        agent_name: this.config.name,
        agent_type: "api_consumer",
        capabilities: ["api_calls", "data_processing", "payment_processing"],
        status: "idle",
        wallet_address: this.config.wallet,
        daily_budget: this.config.dailyBudget,
        max_concurrent_tasks: 5,
        performance_score: 0.5,
        metadata: {
          config: {
            behaviorProfile: this.config.behaviorProfile,
            preferredPaymentMethod: this.config.preferredPaymentMethod,
            maxCallsPerMinute: this.config.maxCallsPerMinute,
          },
          registered_at: new Date().toISOString(),
        }
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error("Failed to register agent:", error);
      return { success: false, id: "" };
    }

    console.log(`✅ Agent ${this.config.name} registered with ID: ${data?.id}`);
    this.isActive = true;
    return { success: true, id: data?.id || this.config.id };
  }

  async executeTask(task: Record<string, unknown>): Promise<{
    success: boolean;
    cost: number;
    revenue: number;
    metrics: Record<string, unknown>;
  }> {
    console.log(`🎯 Agent ${this.config.name} executing task: ${task.id}`);

    await (this.supabase.from("brain_tasks") as any)
      .update({ status: "executing", started_at: new Date().toISOString(), assigned_agent_id: this.config.id })
      .eq("id", task.id);

    try {
      const result = await this.consumeAPI(task.target_api_id as string);

      await (this.supabase.from("brain_tasks") as any)
        .update({ status: "completed", completed_at: new Date().toISOString(), actual_cost: result.cost, actual_revenue: result.revenue, success_indicators: result.metrics })
        .eq("id", task.id);

      this.performanceStats.totalCalls++;
      this.performanceStats.successfulCalls++;
      this.performanceStats.totalSpent += result.cost;
      this.performanceStats.totalRevenue += result.revenue;
      this.performanceStats.lastCallTime = new Date();

      await this.recordRevenue(task, result);
      await this.updateAgentStats();

      console.log(`✅ Task ${task.id} completed successfully`);
      return { success: true, ...result };

    } catch (err: unknown) {
      const error = err as Error;
      console.error(`❌ Task ${task.id} failed:`, error);

      await (this.supabase.from("brain_tasks") as any)
        .update({ status: "failed", error_details: error.message, completed_at: new Date().toISOString() })
        .eq("id", task.id);

      this.performanceStats.totalCalls++;
      return { success: false, cost: 0, revenue: 0, metrics: { error: error.message } };
    }
  }

  async consumeAPI(apiId: string): Promise<{ cost: number; revenue: number; metrics: Record<string, unknown> }> {
    const { data: apiProduct, error } = await (this.supabase.from("api_products") as any).select("*").eq("id", apiId).single();

    if (error || !apiProduct) {
      throw new Error(`API product not found: ${apiId}`);
    }

    const requestConfig: RequestInit = {
      method: apiProduct.request_method || "POST",
      headers: { "Content-Type": "application/json", ...this.getAuthHeaders(apiProduct), ...(apiProduct.request_headers || {}) },
    };

    if (apiProduct.request_body_template) {
      requestConfig.body = JSON.stringify(this.generateRequestBody(apiProduct.request_body_template));
    }

    const startTime = Date.now();
    const response = await fetch(apiProduct.api_endpoint, requestConfig);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      await this.recordApiUsage(apiId, 0, false);
      throw new Error(`API call failed: ${response.status}`);
    }

    const data = await response.json();
    const cost = Number(apiProduct.price_per_call) || 0.001;
    const revenue = this.calculateRevenueFromData(data, cost);

    await this.recordApiUsage(apiId, responseTime, true);

    return { cost, revenue, metrics: { responseTime, statusCode: response.status, dataSize: JSON.stringify(data).length, timestamp: new Date().toISOString() } };
  }

  private getAuthHeaders(apiProduct: Record<string, unknown>): Record<string, string> {
    const authMethod = apiProduct.auth_method as string;
    const credentials = apiProduct.auth_credentials as Record<string, string> | undefined;

    if (authMethod === "api_key" && credentials?.api_key) {
      return { "Authorization": `Bearer ${credentials.api_key}` };
    }

    if (authMethod === "oauth2" && credentials?.access_token) {
      return { "Authorization": `Bearer ${credentials.access_token}` };
    }

    if (authMethod === "jwt" && credentials?.token) {
      return { "Authorization": `Bearer ${credentials.token}` };
    }

    return {};
  }

  private generateRequestBody(template: Record<string, unknown>): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(template)) {
      if (typeof value === "string" && value.startsWith("{{") && value.endsWith("}}")) {
        const placeholder = value.slice(2, -2).trim();
        if (placeholder === "timestamp") {
          body[key] = new Date().toISOString();
        } else if (placeholder === "random") {
          body[key] = Math.random().toString(36).substring(7);
        } else if (placeholder === "agent_id") {
          body[key] = this.config.id;
        } else {
          body[key] = value;
        }
      } else {
        body[key] = value;
      }
    }

    return body;
  }

  private calculateRevenueFromData(data: unknown, cost: number): number {
    // Calculate potential revenue based on data quality/value
    // This is a simplified model - real implementation would analyze data utility
    const baseRevenue = cost * 1.5; // 50% markup
    
    if (typeof data === "object" && data !== null) {
      const dataSize = JSON.stringify(data).length;
      const qualityBonus = Math.min(dataSize / 1000, 0.5); // Up to 50% bonus for larger responses
      return baseRevenue * (1 + qualityBonus);
    }

    return baseRevenue;
  }

  private async recordApiUsage(apiId: string, responseTime: number, success: boolean): Promise<void> {
    const now = new Date();
    const hourWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    await (this.supabase.from("api_usage_metrics") as any)
      .insert({
        api_product_id: apiId,
        consumer_id: this.config.id,
        time_window: hourWindow.toISOString(),
        time_granularity: "hour",
        call_count: 1,
        success_count: success ? 1 : 0,
        error_count: success ? 0 : 1,
        avg_response_time_ms: responseTime,
        total_cost: success ? 0.001 : 0,
        total_revenue: success ? 0.001 : 0,
      });
  }

  private async recordRevenue(task: Record<string, unknown>, result: { cost: number; revenue: number }): Promise<void> {
    await (this.supabase.from("autonomous_revenue") as any)
      .insert({
        agent_id: this.config.id,
        task_id: task.id,
        revenue_source: "api_calls",
        amount: result.revenue,
        currency: "USD",
        revenue_date: new Date().toISOString().split("T")[0],
        platform_fee: result.revenue * 0.1,
        seller_amount: result.revenue * 0.7,
        agent_reward: result.revenue * 0.2,
        status: "pending",
        metadata: {
          cost: result.cost,
          net_profit: result.revenue - result.cost,
        }
      });
  }

  private async updateAgentStats(): Promise<void> {
    const successRate = this.performanceStats.totalCalls > 0
      ? this.performanceStats.successfulCalls / this.performanceStats.totalCalls
      : 0;

    await (this.supabase.from("autonomous_agents") as any)
      .update({
        total_tasks_completed: this.performanceStats.successfulCalls,
        total_revenue_generated: this.performanceStats.totalRevenue,
        success_rate: successRate,
        performance_score: successRate * 0.7 + 0.3, // Weight success rate
        last_active_at: new Date().toISOString(),
        last_heartbeat_at: new Date().toISOString(),
      })
      .eq("id", this.config.id);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/api-consumer-agent", "");

    // Register new agent
    if (path === "/register" && req.method === "POST") {
      const config: AgentConfig = await req.json();
      const agent = new APIConsumerAgent(config);
      const result = await agent.register();
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Execute task
    if (path === "/execute" && req.method === "POST") {
      const body = await req.json();
      const { agentConfig, task } = body;

      if (!agentConfig || !task) {
        return new Response(JSON.stringify({ error: "Agent config and task required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const agent = new APIConsumerAgent(agentConfig);
      const result = await agent.executeTask(task);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get agent status
    if (path.startsWith("/status/") && req.method === "GET") {
      const agentId = path.replace("/status/", "");
      
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data, error } = await (supabase
        .from("autonomous_agents") as any)
        .select("*")
        .eq("id", agentId)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Agent not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      message: "API Consumer Agent Service",
      endpoints: ["/register", "/execute", "/status/:id"],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("API Consumer Agent Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
