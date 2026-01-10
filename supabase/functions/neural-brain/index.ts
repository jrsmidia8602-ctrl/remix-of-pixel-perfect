// Neural Brain Orchestrator - XPEX Neural Supreme
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Agent {
  id: string;
  type: string;
  capabilities: string[];
  status: "idle" | "active" | "error" | "maintenance";
  performance: number;
  lastActive: Date;
  wallet: string;
  budget: number;
}

interface Task {
  id: string;
  priority: 1 | 2 | 3 | 4 | 5;
  type: "api_consumption" | "payment" | "nft_mint" | "volume_generation";
  target: string;
  budget: number;
  expectedRevenue: number;
  deadline: Date;
  metadata: Record<string, unknown>;
}

interface MarketOpportunity {
  id: string;
  apiProductId: string;
  demandScore: number;
  competition: number;
  potentialRevenue: number;
  executionComplexity: number;
  timeWindow: Date;
}

class NeuralBrain {
  private supabase: ReturnType<typeof createClient>;
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private opportunities: MarketOpportunity[] = [];

  constructor() {
    this.supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
  }

  async initialize() {
    console.log("🧠 Initializing Neural Brain...");

    // Load active agents from database
    const { data: agents, error } = await this.supabase
      .from("autonomous_agents")
      .select("*")
      .in("status", ["active", "idle"]);

    if (error) {
      console.error("Failed to load agents:", error);
      return;
    }

    agents?.forEach((agent) => {
      this.agents.set(agent.id, {
        id: agent.id,
        type: agent.agent_type,
        capabilities: agent.capabilities || [],
        status: agent.status,
        performance: agent.performance_score || 0.5,
        lastActive: new Date(agent.last_active_at),
        wallet: agent.wallet_address || "",
        budget: agent.daily_budget || 100,
      });
    });

    console.log(`🤖 Loaded ${this.agents.size} agents`);
  }

  async monitorMarket(): Promise<MarketOpportunity[]> {
    console.log("📈 Monitoring market opportunities...");
    
    this.opportunities = [];

    // Fetch all active API products
    const { data: apiProducts, error } = await this.supabase
      .from("api_products")
      .select("*")
      .eq("is_active", true);

    if (error || !apiProducts) {
      console.error("Failed to fetch API products:", error);
      return [];
    }

    // Analyze each product for opportunities
    for (const product of apiProducts) {
      const opportunity = await this.analyzeProductOpportunity(product);
      if (opportunity.demandScore > 0.5) {
        this.opportunities.push(opportunity);
        
        // Store in database
        await this.supabase.from("market_opportunities").insert({
          api_product_id: opportunity.apiProductId,
          demand_score: opportunity.demandScore,
          competition_score: opportunity.competition,
          complexity_score: opportunity.executionComplexity,
          potential_revenue: opportunity.potentialRevenue,
          estimated_cost: opportunity.potentialRevenue * 0.2,
          time_window_start: new Date(),
          time_window_end: opportunity.timeWindow,
          status: "detected",
          analysis_data: {
            analyzed_at: new Date().toISOString(),
            product_name: product.name,
          }
        });
      }
    }

    // Sort by potential revenue
    this.opportunities.sort((a, b) => b.potentialRevenue - a.potentialRevenue);
    
    console.log(`🎯 Found ${this.opportunities.length} opportunities`);
    return this.opportunities;
  }

  async analyzeProductOpportunity(product: Record<string, unknown>): Promise<MarketOpportunity> {
    // Get product usage metrics
    const { data: metrics } = await this.supabase
      .from("api_usage_metrics")
      .select("*")
      .eq("api_product_id", product.id)
      .order("created_at", { ascending: false })
      .limit(100);

    const totalCalls = metrics?.reduce((sum, m) => sum + (m.call_count || 0), 0) || 0;
    const avgSuccessRate = metrics && metrics.length > 0
      ? metrics.reduce((sum, m) => sum + ((m.success_count || 0) / Math.max(m.call_count || 1, 1)), 0) / metrics.length
      : 0.8;

    // Calculate demand score based on usage patterns
    const callsPerDay = totalCalls / Math.max(metrics?.length || 1, 1);
    const demandScore = Math.min(1, callsPerDay / 100);
    
    // Calculate competition (fewer active consumers = less competition)
    const activeConsumers = (product.active_consumers as number) || 0;
    const competition = Math.min(1, activeConsumers / 50);
    
    // Calculate complexity based on price and rate limits
    const pricePerCall = Number(product.price_per_call) || 0.001;
    const rateLimitPerMin = (product.rate_limit_per_minute as number) || 60;
    const complexity = 1 - Math.min(1, rateLimitPerMin / 100);
    
    // Estimate potential revenue
    const potentialRevenue = callsPerDay * pricePerCall * 30 * avgSuccessRate;

    return {
      id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      apiProductId: product.id as string,
      demandScore: Math.round(demandScore * 100) / 100,
      competition: Math.round(competition * 100) / 100,
      potentialRevenue: Math.round(potentialRevenue * 100) / 100,
      executionComplexity: Math.round(complexity * 100) / 100,
      timeWindow: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  async createTaskFromOpportunity(opportunity: MarketOpportunity): Promise<Task | null> {
    // Determine best agent type
    let agentType = "api_consumer";
    let taskType: Task["type"] = "api_consumption";

    if (opportunity.demandScore > 0.8) {
      agentType = "volume_generator";
      taskType = "volume_generation";
    } else if (opportunity.potentialRevenue > 1000) {
      agentType = "payment_bot";
      taskType = "payment";
    }

    // Find available agent
    const availableAgents = Array.from(this.agents.values())
      .filter(a => a.type === agentType && a.status === "idle")
      .sort((a, b) => b.performance - a.performance);

    if (availableAgents.length === 0) {
      console.log(`⚠️ No available ${agentType} agents for opportunity`);
      return null;
    }

    const agent = availableAgents[0];

    // Create task
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      priority: opportunity.demandScore > 0.9 ? 1 : opportunity.demandScore > 0.7 ? 2 : 3,
      type: taskType,
      target: opportunity.apiProductId,
      budget: Math.min(agent.budget * 0.1, opportunity.potentialRevenue * 0.05),
      expectedRevenue: opportunity.potentialRevenue,
      deadline: opportunity.timeWindow,
      metadata: {
        opportunityId: opportunity.id,
        productId: opportunity.apiProductId,
        demandScore: opportunity.demandScore,
      }
    };

    this.tasks.set(task.id, task);

    // Store task in database
    await this.supabase.from("brain_tasks").insert({
      task_type: taskType,
      priority: task.priority,
      target_api_id: task.target,
      assigned_agent_id: agent.id,
      status: "assigned",
      allocated_budget: task.budget,
      expected_revenue: task.expectedRevenue,
      deadline: task.deadline.toISOString(),
      metadata: task.metadata,
    });

    // Update agent status
    await this.supabase
      .from("autonomous_agents")
      .update({
        status: "active",
        current_task_id: task.id,
        last_active_at: new Date().toISOString(),
      })
      .eq("id", agent.id);

    agent.status = "active";
    
    console.log(`🎯 Assigned task ${task.id} to agent ${agent.id}`);
    return task;
  }

  async optimizeAgents(): Promise<{ optimizations: number; allocations: Record<string, string> }> {
    console.log("⚡ Optimizing agent allocation...");

    const { data: performance } = await this.supabase
      .from("agent_performance")
      .select("*")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const allocations: Record<string, string> = {};
    const revenueByType: Record<string, number> = {};

    // Calculate revenue per agent type
    performance?.forEach(p => {
      const type = p.metadata?.agent_type || "api_consumer";
      revenueByType[type] = (revenueByType[type] || 0) + (p.total_revenue || 0);
    });

    // Sort types by revenue
    const sortedTypes = Object.entries(revenueByType)
      .sort(([, a], [, b]) => b - a)
      .map(([type]) => type);

    // Allocate agents based on performance
    const agentsByPerformance = Array.from(this.agents.values())
      .filter(a => a.status === "idle")
      .sort((a, b) => b.performance - a.performance);

    let optimizations = 0;
    for (const agent of agentsByPerformance) {
      const targetType = sortedTypes[0] || "api_consumer";
      if (agent.type !== targetType) {
        allocations[agent.id] = targetType;
        optimizations++;
      }
    }

    return { optimizations, allocations };
  }

  async generateRevenueReport() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: revenue } = await this.supabase
      .from("autonomous_revenue")
      .select("*")
      .gte("revenue_date", yesterday.toISOString());

    const totalRevenue = revenue?.reduce((sum, r) => sum + Number(r.amount || 0), 0) || 0;
    const platformFees = revenue?.reduce((sum, r) => sum + Number(r.platform_fee || 0), 0) || 0;
    const agentCount = this.agents.size;
    const activeTasks = Array.from(this.tasks.values()).filter(t =>
      new Date(t.deadline) > new Date()
    ).length;

    const report = {
      timestamp: now.toISOString(),
      period_start: yesterday.toISOString(),
      period_end: now.toISOString(),
      report_type: "daily",
      total_revenue: totalRevenue,
      platform_fees: platformFees,
      net_profit: totalRevenue - platformFees,
      active_agents: Array.from(this.agents.values()).filter(a => a.status === "active").length,
      idle_agents: Array.from(this.agents.values()).filter(a => a.status === "idle").length,
      total_tasks_completed: activeTasks,
      opportunities_detected: this.opportunities.length,
      system_efficiency_score: this.calculateEfficiencyScore(),
      insights: {
        top_performing_type: this.getTopPerformingType(),
        revenue_trend: totalRevenue > 0 ? "positive" : "neutral",
      },
      recommendations: {
        suggested_action: totalRevenue < 100 
          ? "Increase agent budget allocations" 
          : "Maintain current strategy",
      },
    };

    // Store report
    await this.supabase.from("brain_reports").insert(report);

    return report;
  }

  private calculateEfficiencyScore(): number {
    const activeAgents = Array.from(this.agents.values()).filter(a => a.status === "active");
    if (activeAgents.length === 0) return 0.5;

    const avgPerformance = activeAgents.reduce((sum, a) => sum + a.performance, 0) / activeAgents.length;
    const budgetUtilization = activeAgents.reduce((sum, a) => sum + (a.budget > 0 ? 1 : 0), 0) / activeAgents.length;

    return Math.round((avgPerformance * 0.7 + budgetUtilization * 0.3) * 100) / 100;
  }

  private getTopPerformingType(): string {
    const typePerformance: Record<string, number[]> = {};
    
    for (const agent of this.agents.values()) {
      if (!typePerformance[agent.type]) {
        typePerformance[agent.type] = [];
      }
      typePerformance[agent.type].push(agent.performance);
    }

    let topType = "api_consumer";
    let topAvg = 0;

    for (const [type, scores] of Object.entries(typePerformance)) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > topAvg) {
        topAvg = avg;
        topType = type;
      }
    }

    return topType;
  }

  getStatus() {
    return {
      activeAgents: Array.from(this.agents.values()).filter(a => a.status === "active").length,
      idleAgents: Array.from(this.agents.values()).filter(a => a.status === "idle").length,
      totalAgents: this.agents.size,
      pendingTasks: this.tasks.size,
      opportunities: this.opportunities.length,
      efficiencyScore: this.calculateEfficiencyScore(),
    };
  }

  getAgents() {
    return Array.from(this.agents.values());
  }

  getOpportunities() {
    return this.opportunities;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const brain = new NeuralBrain();
    await brain.initialize();

    const url = new URL(req.url);
    const path = url.pathname.replace("/neural-brain", "");

    // Status endpoint
    if (path === "/status" || path === "") {
      const status = brain.getStatus();
      return new Response(JSON.stringify(status), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Agents endpoint
    if (path === "/agents") {
      const agents = brain.getAgents();
      return new Response(JSON.stringify({ agents }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Monitor market endpoint
    if (path === "/monitor" && req.method === "POST") {
      const opportunities = await brain.monitorMarket();
      return new Response(JSON.stringify({ opportunities }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Opportunities endpoint
    if (path === "/opportunities") {
      const opportunities = brain.getOpportunities();
      return new Response(JSON.stringify({ opportunities }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optimize endpoint
    if (path === "/optimize" && req.method === "POST") {
      const result = await brain.optimizeAgents();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Report endpoint
    if (path === "/report") {
      const report = await brain.generateRevenueReport();
      return new Response(JSON.stringify(report), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create task from opportunity
    if (path === "/create-task" && req.method === "POST") {
      const body = await req.json();
      const { opportunity } = body;
      
      if (!opportunity) {
        return new Response(JSON.stringify({ error: "Opportunity required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const task = await brain.createTaskFromOpportunity(opportunity);
      return new Response(JSON.stringify({ task }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      message: "Neural Brain Active",
      endpoints: ["/status", "/agents", "/monitor", "/opportunities", "/optimize", "/report", "/create-task"]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Neural Brain Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
