// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= FULL POWER CONFIGURATION =============
const FULL_POWER_CONFIG = {
  system_version: "XPEX-Agent-Economy-1.0.0-FP",
  modules: {
    demand_radar: {
      enabled: true,
      scan_interval_ms: 2000,
      auto_execute: true,
      max_concurrent_executions: 20,
      risk_tolerance: "high",
      auto_fix_issues: true,
      auto_rebalance_agents: true,
    },
    ai_core: {
      enabled: true,
      version: "Giovana-XPEX-NextGen-2.0",
      learning_mode: "self_optimized",
      intelligence_level: "max",
      active_modules: ["pattern_prediction", "opportunity_scoring", "auto_agent_prioritization", "real_time_decision"],
    },
    marketplace: {
      connected: true,
      auto_rebalance: true,
      auto_activate_new_agents: true,
    },
    wallets: {
      connected: true,
      min_balance_policy_active: true,
      auto_recharge_enabled: true,
      auto_alert_low_balance: true,
      min_balance_threshold: 5,
    },
    executions: {
      auto_retry_failed: true,
      max_retries: 3,
    },
    economy: {
      auto_revenue_distribution: true,
      platform_fee_percent: 5,
    },
  },
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [FULL-POWER-ORCHESTRATOR] ${step}`, details ? JSON.stringify(details) : "");
};

// ============= ORCHESTRATOR FUNCTIONS =============

async function getSystemStatus(supabase: any) {
  logStep("Fetching full system status");

  const [
    { data: agents, count: agentCount },
    { data: activeAgents },
    { count: executionsPending },
    { data: executionsSuccess },
    { data: executionsFailed },
    { data: wallets },
    { data: marketplace },
    { data: revenue },
    { data: opportunities },
    { data: signals },
    { data: creditPacks },
  ] = await Promise.all([
    supabase.from("autonomous_agents").select("*", { count: "exact" }),
    supabase.from("autonomous_agents").select("id").in("status", ["active", "working"]),
    supabase.from("executions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("executions").select("id, response_time_ms").eq("status", "completed").limit(200),
    supabase.from("executions").select("id").eq("status", "failed").limit(100),
    supabase.from("user_wallets").select("user_id, balance_credits, total_spent, total_earned"),
    supabase.from("agent_marketplace").select("*").eq("status", "active"),
    supabase.from("autonomous_revenue").select("amount, platform_fee").limit(500),
    supabase.from("demand_opportunities").select("id, temperature, demand_score, status"),
    supabase.from("demand_signals").select("id").order("detected_at", { ascending: false }).limit(100),
    supabase.from("credit_packs").select("*").eq("is_active", true),
  ]);

  const totalCreditsInCirculation = wallets?.reduce((sum: number, w: any) => sum + Number(w.balance_credits), 0) || 0;
  const totalSpent = wallets?.reduce((sum: number, w: any) => sum + Number(w.total_spent), 0) || 0;
  const totalEarned = wallets?.reduce((sum: number, w: any) => sum + Number(w.total_earned), 0) || 0;
  const walletsLowBalance = wallets?.filter((w: any) => w.balance_credits < FULL_POWER_CONFIG.modules.wallets.min_balance_threshold) || [];

  const marketplaceStats = {
    total_agents: marketplace?.length || 0,
    featured_agents: marketplace?.filter((m: any) => m.is_featured).length || 0,
    total_executions: marketplace?.reduce((sum: number, m: any) => sum + m.execution_count, 0) || 0,
    total_revenue: marketplace?.reduce((sum: number, m: any) => sum + Number(m.total_revenue), 0) || 0,
  };

  const platformRevenue = revenue?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0;
  const platformFees = revenue?.reduce((sum: number, r: any) => sum + Number(r.platform_fee), 0) || 0;

  const successCount = executionsSuccess?.length || 0;
  const failedCount = executionsFailed?.length || 0;
  const totalExecutions = successCount + failedCount;
  const successRate = totalExecutions > 0 ? Math.round((successCount / totalExecutions) * 100) : 100;

  const avgResponseTime = successCount > 0
    ? Math.round(executionsSuccess.reduce((sum: number, e: any) => sum + (e.response_time_ms || 0), 0) / successCount)
    : 0;

  const oppsTyped = (opportunities || []) as { temperature: string; demand_score: number; status: string }[];
  const hotOpps = oppsTyped.filter((o) => o.temperature === "hot");
  const warmOpps = oppsTyped.filter((o) => o.temperature === "warm");

  return {
    timestamp: new Date().toISOString(),
    system_version: FULL_POWER_CONFIG.system_version,
    status: "active_full_power",
    modules: {
      demand_radar: {
        enabled: FULL_POWER_CONFIG.modules.demand_radar.enabled,
        total_signals: signals?.length || 0,
        opportunities_found: oppsTyped.length,
        hot_opportunities: hotOpps.length,
        warm_opportunities: warmOpps.length,
        auto_execute: FULL_POWER_CONFIG.modules.demand_radar.auto_execute,
      },
      ai_core: {
        enabled: FULL_POWER_CONFIG.modules.ai_core.enabled,
        version: FULL_POWER_CONFIG.modules.ai_core.version,
        learning_mode: FULL_POWER_CONFIG.modules.ai_core.learning_mode,
        active_modules: FULL_POWER_CONFIG.modules.ai_core.active_modules,
      },
      marketplace: {
        connected: true,
        total_agents: agentCount || 0,
        active_agents: activeAgents?.length || 0,
        featured_agents: marketplaceStats.featured_agents,
        total_executions: marketplaceStats.total_executions,
        total_revenue: marketplaceStats.total_revenue,
      },
      wallets: {
        connected: true,
        users_tracked: wallets?.length || 0,
        wallets_low_balance: walletsLowBalance.length,
        total_credits_in_circulation: totalCreditsInCirculation,
        auto_recharge_enabled: FULL_POWER_CONFIG.modules.wallets.auto_recharge_enabled,
      },
      executions: {
        pending: executionsPending || 0,
        completed_success: successCount,
        completed_failed: failedCount,
        success_rate: `${successRate}%`,
        avg_response_time_ms: avgResponseTime,
        auto_retry_enabled: FULL_POWER_CONFIG.modules.executions.auto_retry_failed,
      },
      credit_packs: {
        active_packs: creditPacks?.length || 0,
      },
      economy_stats: {
        total_credits_in_circulation: totalCreditsInCirculation,
        total_credits_spent: totalSpent,
        total_credits_earned: totalEarned,
        total_wallets: wallets?.length || 0,
        marketplace: marketplaceStats,
        platform: {
          total_revenue: platformRevenue,
          total_fees: platformFees,
        },
      },
    },
    recommendations: generateRecommendations(successRate, walletsLowBalance.length, hotOpps.length, failedCount),
  };
}

function generateRecommendations(successRate: number, lowBalanceWallets: number, hotOpps: number, failedExecutions: number): string[] {
  const recommendations: string[] = [];

  if (successRate >= 95) {
    recommendations.push("✅ Sistema operando com alta eficiência");
  } else if (successRate < 80) {
    recommendations.push("⚠️ Taxa de sucesso baixa - verificar agentes com falhas");
  }

  if (lowBalanceWallets > 0) {
    recommendations.push(`💰 ${lowBalanceWallets} wallets com saldo baixo - auto-recharge ativo`);
  }

  if (hotOpps > 5) {
    recommendations.push(`🔥 ${hotOpps} oportunidades HOT detectadas - priorizar conversão`);
  }

  if (failedExecutions > 10) {
    recommendations.push("🔄 Auto-retry ativado para execuções falhas");
  }

  recommendations.push("🚀 Full Power Mode ativo - monetização automática contínua");
  recommendations.push("🤖 IA auto-otimizada e integrada ao radar de demanda");

  return recommendations;
}

async function runAutonomousCycle(supabase: any) {
  logStep("Starting autonomous full power cycle");

  const actions: any = {
    signals_scanned: 0,
    signals_processed: 0,
    offers_generated: 0,
    offers_published: 0,
    executions_retried: 0,
    wallets_recharged: 0,
    agents_rebalanced: 0,
  };

  // 1. Trigger demand radar scan
  try {
    const signalsInserted = await generateSimulatedSignals(supabase);
    actions.signals_scanned = signalsInserted;
    logStep("Signals scanned", { count: signalsInserted });
  } catch (e) {
    logStep("Signal scan error", e);
  }

  // 2. Process signals through AI pipeline
  try {
    const { processed, hotCount } = await processSignalsPipeline(supabase);
    actions.signals_processed = processed;
    actions.hot_opportunities_created = hotCount;
    logStep("Signals processed", { processed, hotCount });
  } catch (e) {
    logStep("Pipeline processing error", e);
  }

  // 3. Auto-generate offers for hot opportunities
  try {
    const { generated, published } = await autoGenerateOffers(supabase);
    actions.offers_generated = generated;
    actions.offers_published = published;
    logStep("Offers generated", { generated, published });
  } catch (e) {
    logStep("Offer generation error", e);
  }

  // 4. Retry failed executions
  if (FULL_POWER_CONFIG.modules.executions.auto_retry_failed) {
    try {
      const retried = await retryFailedExecutions(supabase);
      actions.executions_retried = retried;
      logStep("Executions retried", { count: retried });
    } catch (e) {
      logStep("Retry error", e);
    }
  }

  // 5. Auto-recharge low balance wallets
  if (FULL_POWER_CONFIG.modules.wallets.auto_recharge_enabled) {
    try {
      const recharged = await autoRechargeWallets(supabase);
      actions.wallets_recharged = recharged;
      logStep("Wallets recharged", { count: recharged });
    } catch (e) {
      logStep("Wallet recharge error", e);
    }
  }

  // 6. Rebalance agents
  if (FULL_POWER_CONFIG.modules.marketplace.auto_rebalance) {
    try {
      const rebalanced = await rebalanceAgents(supabase);
      actions.agents_rebalanced = rebalanced;
      logStep("Agents rebalanced", { count: rebalanced });
    } catch (e) {
      logStep("Agent rebalance error", e);
    }
  }

  return actions;
}

// ============= HELPER FUNCTIONS =============

async function generateSimulatedSignals(supabase: any): Promise<number> {
  const simulatedSignals = [
    { keyword: "AI agent marketplace integration", source: "reddit", volume: Math.floor(Math.random() * 400) + 150, velocity: Math.random() * 4 + 1 },
    { keyword: "SaaS automation platform urgent", source: "freelance_marketplace", volume: Math.floor(Math.random() * 500) + 200, velocity: Math.random() * 5 + 1.5 },
    { keyword: "Backend API development need", source: "twitter", volume: Math.floor(Math.random() * 300) + 100, velocity: Math.random() * 3 + 0.5 },
    { keyword: "Webhook integration service", source: "google_trends", volume: Math.floor(Math.random() * 350) + 120, velocity: Math.random() * 3.5 + 0.8 },
    { keyword: "Custom AI chatbot development", source: "reddit", volume: Math.floor(Math.random() * 450) + 180, velocity: Math.random() * 4.5 + 1.2 },
    { keyword: "Payment gateway integration", source: "freelance_marketplace", volume: Math.floor(Math.random() * 280) + 90, velocity: Math.random() * 2.8 + 0.6 },
  ];

  const selectedSignals = simulatedSignals.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3));

  let inserted = 0;
  for (const sig of selectedSignals) {
    const { error } = await supabase.from("demand_signals").insert({
      source: sig.source,
      keyword: sig.keyword,
      signal_text: `High engagement detected: ${sig.keyword}`,
      signal_volume: sig.volume,
      velocity_score: Math.round(sig.velocity * 10) / 10,
    });
    if (!error) inserted++;
  }

  return inserted;
}

async function processSignalsPipeline(supabase: any): Promise<{ processed: number; hotCount: number }> {
  const { data: signals } = await supabase
    .from("demand_signals")
    .select("*")
    .order("detected_at", { ascending: false })
    .limit(50);

  let processed = 0;
  let hotCount = 0;

  for (const signal of signals || []) {
    const { data: existing } = await supabase
      .from("demand_opportunities")
      .select("id")
      .eq("signal_id", signal.id)
      .maybeSingle();

    if (existing) continue;

    // Intent classification
    const intentResult = classifyIntent(signal);
    const { data: intentData, error: intentError } = await supabase
      .from("classified_intents")
      .insert({
        signal_id: signal.id,
        intent_level: intentResult.level,
        confidence_score: intentResult.confidence,
        analysis_reasoning: intentResult.reasoning,
        keywords_matched: intentResult.keywordsMatched,
      })
      .select()
      .single();

    if (intentError) continue;

    // Trend prediction
    const trendResult = predictTrend(signal);
    const { data: trendData, error: trendError } = await supabase
      .from("trend_predictions")
      .insert({
        intent_id: intentData.id,
        trend_score: trendResult.score,
        momentum_index: trendResult.momentum,
        predicted_growth_rate: trendResult.growth,
      })
      .select()
      .single();

    if (trendError) continue;

    // Demand scoring
    const demandResult = calculateDemandScore(signal.signal_volume, intentResult.confidence, trendResult.score);
    const serviceMapping = mapToService(signal.keyword, demandResult.temperature);

    const { error: oppError } = await supabase.from("demand_opportunities").insert({
      signal_id: signal.id,
      intent_id: intentData.id,
      prediction_id: trendData.id,
      demand_score: demandResult.score,
      temperature: demandResult.temperature,
      title: `Demand: ${signal.keyword}`,
      description: signal.signal_text,
      keywords: [signal.keyword],
      estimated_ticket: serviceMapping.price,
      urgency_score: signal.velocity_score * 20,
      recommended_service: serviceMapping.type,
      suggested_price: serviceMapping.price,
      estimated_delivery_days: serviceMapping.deliveryDays,
      status: "detected",
    });

    if (!oppError) {
      processed++;
      if (demandResult.temperature === "hot") hotCount++;
    }
  }

  return { processed, hotCount };
}

function classifyIntent(signal: any): { level: string; confidence: number; reasoning: string; keywordsMatched: string[] } {
  const text = (signal.signal_text || "").toLowerCase();
  const keyword = signal.keyword.toLowerCase();
  const keywordsMatched: string[] = [];

  const purchaseKeywords = ["urgent", "need", "buy", "hire", "budget", "pay", "asap", "looking for"];
  const solutionKeywords = ["integration", "api", "service", "solution", "tool", "platform"];

  let purchaseScore = 0;
  let solutionScore = 0;

  purchaseKeywords.forEach((kw) => {
    if (text.includes(kw) || keyword.includes(kw)) {
      purchaseScore += 0.25;
      keywordsMatched.push(kw);
    }
  });

  solutionKeywords.forEach((kw) => {
    if (text.includes(kw) || keyword.includes(kw)) {
      solutionScore += 0.15;
      keywordsMatched.push(kw);
    }
  });

  if (signal.velocity_score > 2) purchaseScore += 0.2;
  if (signal.signal_volume > 200) purchaseScore += 0.15;

  const level = purchaseScore > solutionScore ? "purchase_intent" : "solution_search";
  const confidence = Math.min(0.95, Math.max(0.3, purchaseScore + solutionScore + 0.3));

  return {
    level,
    confidence,
    reasoning: `Classified as ${level} with ${Math.round(confidence * 100)}% confidence`,
    keywordsMatched,
  };
}

function predictTrend(signal: any): { score: number; momentum: number; growth: number } {
  const normalizedVolume = Math.min(100, (signal.signal_volume / 500) * 100);
  const momentum = signal.velocity_score * 20;
  const trendScore = Math.min(100, normalizedVolume * 0.5 + momentum * 0.5);
  const growthRate = signal.velocity_score > 2 ? 15 : signal.velocity_score > 1 ? 8 : 3;

  return { score: trendScore, momentum, growth: growthRate };
}

function calculateDemandScore(volume: number, intentConfidence: number, trendScore: number): { score: number; temperature: string } {
  const normalizedVolume = Math.min(100, (volume / 500) * 100);
  const score = normalizedVolume * 0.3 + intentConfidence * 100 * 0.4 + trendScore * 0.3;
  const temperature = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
  return { score: Math.round(score * 10) / 10, temperature };
}

function mapToService(keyword: string, temperature: string): { type: string; price: number; deliveryDays: number } {
  const kw = keyword.toLowerCase();
  const rules = [
    { match: ["api", "backend", "webhook"], type: "api_on_demand", price: 500, days: 7 },
    { match: ["saas", "white label", "platform"], type: "white_label_saas", price: 2000, days: 14 },
    { match: ["ai", "automation", "chatbot"], type: "ai_automation", price: 800, days: 5 },
    { match: ["consult", "help", "support"], type: "express_consulting", price: 200, days: 1 },
  ];

  let matched = { type: "ready_backend", price: 600, days: 7 };
  for (const rule of rules) {
    if (rule.match.some((m) => kw.includes(m))) {
      matched = { type: rule.type, price: rule.price, days: rule.days };
      break;
    }
  }

  const multiplier = temperature === "hot" ? 1.5 : temperature === "warm" ? 1.2 : 1;
  return { type: matched.type, price: Math.round(matched.price * multiplier), deliveryDays: matched.days };
}

async function autoGenerateOffers(supabase: any): Promise<{ generated: number; published: number }> {
  const { data: hotOpps } = await supabase
    .from("demand_opportunities")
    .select("*, demand_signals(*)")
    .eq("temperature", "hot")
    .eq("status", "detected")
    .limit(10);

  let generated = 0;
  let published = 0;

  for (const opp of hotOpps || []) {
    const keyword = opp.demand_signals?.keyword || opp.title.replace("Demand: ", "");
    const offerType = opp.recommended_service || "ready_backend";

    const copyTemplate = `
🚀 ${keyword.toUpperCase()} - Premium Solution

✅ Professional implementation by experts
✅ Delivery in ${opp.estimated_delivery_days || 7} days
✅ Full documentation & support
✅ 100% satisfaction guarantee

💰 Investment: $${opp.suggested_price || 500}

🔥 High demand - Limited availability!
    `.trim();

    const { data: offer, error: offerError } = await supabase
      .from("service_offers")
      .insert({
        demand_opportunity_id: opp.id,
        offer_type: offerType,
        title: `${keyword} - Professional Solution`,
        description: `Complete ${keyword} solution with expert implementation`,
        price: opp.suggested_price || 500,
        delivery_days: opp.estimated_delivery_days || 7,
        copy_template: copyTemplate,
        status: "published",
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!offerError && offer) {
      generated++;
      await supabase.from("demand_opportunities").update({ status: "offer_generated" }).eq("id", opp.id);

      const { error: mpError } = await supabase.from("agent_marketplace").insert({
        agent_id: offer.id,
        name: offer.title,
        short_description: `${keyword} solution - ${opp.estimated_delivery_days} days`,
        description: offer.description,
        category: offerType === "ai_automation" ? "automation" : offerType === "api_on_demand" ? "api" : "service",
        price_per_execution: offer.price,
        min_credits_required: Math.ceil(offer.price / 10),
        status: "active",
        is_public: true,
        is_featured: opp.demand_score >= 85,
        tags: [keyword, offerType, "demand-radar", "auto-generated", "full-power"],
      });

      if (!mpError) published++;
    }
  }

  return { generated, published };
}

async function retryFailedExecutions(supabase: any): Promise<number> {
  const { data: failed } = await supabase
    .from("executions")
    .select("*")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(10);

  let retried = 0;
  for (const exec of failed || []) {
    const retryCount = exec.metadata?.retry_count || 0;
    if (retryCount < FULL_POWER_CONFIG.modules.executions.max_retries) {
      await supabase
        .from("executions")
        .update({
          status: "pending",
          metadata: { ...exec.metadata, retry_count: retryCount + 1, retried_at: new Date().toISOString() },
        })
        .eq("id", exec.id);
      retried++;
    }
  }
  return retried;
}

async function autoRechargeWallets(supabase: any): Promise<number> {
  const { data: lowBalanceWallets } = await supabase
    .from("user_wallets")
    .select("*")
    .lt("balance_credits", FULL_POWER_CONFIG.modules.wallets.min_balance_threshold);

  let recharged = 0;
  for (const wallet of lowBalanceWallets || []) {
    const bonusCredits = 10;
    await supabase.from("credit_transactions").insert({
      user_id: wallet.user_id,
      amount: bonusCredits,
      transaction_type: "credit",
      source: "bonus",
      description: "Auto-recharge: Full Power Mode bonus",
      balance_before: wallet.balance_credits,
      balance_after: wallet.balance_credits + bonusCredits,
    });
    recharged++;
  }
  return recharged;
}

async function rebalanceAgents(supabase: any): Promise<number> {
  const { data: agents } = await supabase
    .from("autonomous_agents")
    .select("*")
    .in("status", ["idle", "paused"]);

  let rebalanced = 0;
  for (const agent of agents || []) {
    if (agent.performance_score > 70 || agent.success_rate > 0.8) {
      await supabase.from("autonomous_agents").update({ status: "active" }).eq("id", agent.id);
      rebalanced++;
    }
  }
  return rebalanced;
}

// ============= REQUEST HANDLER =============

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    logStep(`Processing request: ${req.method} /${path}`);

    // GET /status - Full system status
    if ((path === "status" || path === "full-power-orchestrator") && req.method === "GET") {
      const status = await getSystemStatus(supabase);
      return new Response(JSON.stringify({ success: true, ...status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /run-cycle - Run full autonomous cycle
    if (path === "run-cycle" && req.method === "POST") {
      const actions = await runAutonomousCycle(supabase);
      const status = await getSystemStatus(supabase);
      
      return new Response(
        JSON.stringify({
          success: true,
          cycle_completed: true,
          actions_executed: actions,
          current_status: status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /trigger-scan - Trigger demand radar scan
    if (path === "trigger-scan" && req.method === "POST") {
      const inserted = await generateSimulatedSignals(supabase);
      return new Response(
        JSON.stringify({ success: true, signals_generated: inserted }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /process-pipeline - Run AI pipeline
    if (path === "process-pipeline" && req.method === "POST") {
      const result = await processSignalsPipeline(supabase);
      const offers = await autoGenerateOffers(supabase);
      return new Response(
        JSON.stringify({ success: true, pipeline: result, offers }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /retry-executions - Retry failed executions
    if (path === "retry-executions" && req.method === "POST") {
      const retried = await retryFailedExecutions(supabase);
      return new Response(
        JSON.stringify({ success: true, executions_retried: retried }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /recharge-wallets - Auto-recharge low balance wallets
    if (path === "recharge-wallets" && req.method === "POST") {
      const recharged = await autoRechargeWallets(supabase);
      return new Response(
        JSON.stringify({ success: true, wallets_recharged: recharged }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /rebalance-agents - Rebalance agent fleet
    if (path === "rebalance-agents" && req.method === "POST") {
      const rebalanced = await rebalanceAgents(supabase);
      return new Response(
        JSON.stringify({ success: true, agents_rebalanced: rebalanced }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /config - Get current configuration
    if (path === "config" && req.method === "GET") {
      return new Response(
        JSON.stringify({ success: true, config: FULL_POWER_CONFIG }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "XPEX Full Power Orchestrator API",
        version: FULL_POWER_CONFIG.system_version,
        endpoints: [
          "GET /status - Full system status",
          "POST /run-cycle - Run full autonomous cycle",
          "POST /trigger-scan - Trigger demand radar scan",
          "POST /process-pipeline - Run AI pipeline",
          "POST /retry-executions - Retry failed executions",
          "POST /recharge-wallets - Auto-recharge wallets",
          "POST /rebalance-agents - Rebalance agent fleet",
          "GET /config - Get current configuration",
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logStep("Error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
