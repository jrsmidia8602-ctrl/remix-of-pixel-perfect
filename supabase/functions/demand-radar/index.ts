// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= CONFIGURATION =============
const CONFIG = {
  autonomous: true,
  scanIntervalMinutes: 10,
  maxSignalsPerCycle: 50,
  autoGenerateOffers: true,
  autoSellOffers: true,
  aiPipeline: {
    classifyIntent: {
      purchaseKeywords: ["urgent", "need", "buy", "hire", "budget", "pay", "asap", "looking for"],
      researchKeywords: ["how to", "best", "compare", "review", "which"],
      solutionKeywords: ["integration", "api", "service", "solution", "tool"],
      curiosityKeywords: ["what is", "learn", "understand", "about"],
      boosts: {
        velocityScoreThreshold: 2,
        volumeThreshold: 200,
        velocityBoost: 0.2,
        volumeBoost: 0.15,
      },
    },
    trendPrediction: {
      momentumMultiplier: 20,
      growthMapping: { high: 15, medium: 8, low: 3 },
    },
    demandScoring: {
      weights: { volume: 0.3, intent: 0.4, trend: 0.3 },
      temperatureThresholds: { hot: 70, warm: 40, cold: 0 },
    },
    serviceMapping: {
      rules: [
        { match: ["api", "backend"], type: "api_on_demand", price: 500, deliveryDays: 7 },
        { match: ["saas", "white label"], type: "white_label_saas", price: 2000, deliveryDays: 14 },
        { match: ["ai", "automation"], type: "ai_automation", price: 800, deliveryDays: 5 },
        { match: ["consult", "help"], type: "express_consulting", price: 200, deliveryDays: 1 },
        { match: [], type: "ready_backend", price: 600, deliveryDays: 7 },
      ],
      priceMultiplier: { hot: 1.5, warm: 1.2, cold: 1 },
    },
  },
  scraping: {
    keywords: ["api", "saas", "automation", "consult", "backend", "integration", "webhook"],
    sources: ["reddit", "twitter", "freelance_marketplace", "google_trends"],
  },
  marketplace: {
    autoPublish: true,
    autoSell: true,
    currency: "USD",
  },
};

interface DemandSignal {
  id: string;
  source: string;
  keyword: string;
  signal_text: string;
  signal_volume: number;
  velocity_score: number;
}

interface DemandOpportunity {
  id: string;
  signal_id: string;
  demand_score: number;
  temperature: string;
  title: string;
  description: string;
  estimated_delivery_days: number;
  suggested_price: number;
  recommended_service: string;
  status: string;
  demand_signals?: DemandSignal;
}

interface ServiceOffer {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery_days: number;
}

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [DEMAND-RADAR] ${step}`, details ? JSON.stringify(details) : "");
};

// ============= AI PIPELINE FUNCTIONS =============

function classifyIntent(signal: DemandSignal): { level: string; confidence: number; reasoning: string; keywordsMatched: string[] } {
  const text = (signal.signal_text || "").toLowerCase();
  const keyword = signal.keyword.toLowerCase();
  const cfg = CONFIG.aiPipeline.classifyIntent;
  
  let purchaseScore = 0;
  let researchScore = 0;
  let solutionScore = 0;
  let curiosityScore = 0;
  const keywordsMatched: string[] = [];
  
  cfg.purchaseKeywords.forEach(kw => {
    if (text.includes(kw) || keyword.includes(kw)) {
      purchaseScore += 0.25;
      keywordsMatched.push(kw);
    }
  });
  
  cfg.researchKeywords.forEach(kw => {
    if (text.includes(kw) || keyword.includes(kw)) {
      researchScore += 0.2;
      keywordsMatched.push(kw);
    }
  });
  
  cfg.solutionKeywords.forEach(kw => {
    if (text.includes(kw) || keyword.includes(kw)) {
      solutionScore += 0.15;
      keywordsMatched.push(kw);
    }
  });
  
  cfg.curiosityKeywords.forEach(kw => {
    if (text.includes(kw) || keyword.includes(kw)) {
      curiosityScore += 0.1;
      keywordsMatched.push(kw);
    }
  });
  
  if (signal.velocity_score > cfg.boosts.velocityScoreThreshold) {
    purchaseScore += cfg.boosts.velocityBoost;
  }
  if (signal.signal_volume > cfg.boosts.volumeThreshold) {
    purchaseScore += cfg.boosts.volumeBoost;
  }
  
  const scores = [
    { level: "purchase_intent", score: purchaseScore },
    { level: "solution_search", score: solutionScore },
    { level: "research", score: researchScore },
    { level: "curiosity", score: curiosityScore },
  ];
  
  scores.sort((a, b) => b.score - a.score);
  const topScore = scores[0];
  
  const confidence = Math.min(0.95, Math.max(0.3, topScore.score + 0.3));
  
  return {
    level: topScore.level,
    confidence,
    reasoning: `Classified as ${topScore.level} with ${Math.round(confidence * 100)}% confidence. Matched keywords: ${keywordsMatched.join(", ") || "none"}. Velocity: ${signal.velocity_score}, Volume: ${signal.signal_volume}.`,
    keywordsMatched,
  };
}

function predictTrend(signal: DemandSignal): { score: number; momentum: number; growth: number } {
  const cfg = CONFIG.aiPipeline.trendPrediction;
  
  const normalizedVolume = Math.min(100, (signal.signal_volume / 500) * 100);
  const momentum = signal.velocity_score * cfg.momentumMultiplier;
  const trendScore = Math.min(100, (normalizedVolume * 0.5) + (momentum * 0.5));
  
  let growthRate: number;
  if (signal.velocity_score > 2) {
    growthRate = cfg.growthMapping.high;
  } else if (signal.velocity_score > 1) {
    growthRate = cfg.growthMapping.medium;
  } else {
    growthRate = cfg.growthMapping.low;
  }
  
  return { score: trendScore, momentum, growth: growthRate };
}

function calculateDemandScore(signalVolume: number, intentConfidence: number, trendScore: number): { score: number; temperature: string } {
  const cfg = CONFIG.aiPipeline.demandScoring;
  const normalizedVolume = Math.min(100, (signalVolume / 500) * 100);
  
  const score = (normalizedVolume * cfg.weights.volume) + 
                (intentConfidence * 100 * cfg.weights.intent) + 
                (trendScore * cfg.weights.trend);
  
  let temperature: string;
  if (score >= cfg.temperatureThresholds.hot) {
    temperature = "hot";
  } else if (score >= cfg.temperatureThresholds.warm) {
    temperature = "warm";
  } else {
    temperature = "cold";
  }
  
  return { score: Math.round(score * 10) / 10, temperature };
}

function mapToService(keyword: string, temperature: string): { type: string; price: number; deliveryDays: number } {
  const cfg = CONFIG.aiPipeline.serviceMapping;
  const keywordLower = keyword.toLowerCase();
  
  let matchedRule = cfg.rules[cfg.rules.length - 1];
  
  for (const rule of cfg.rules) {
    if (rule.match.some(m => keywordLower.includes(m))) {
      matchedRule = rule;
      break;
    }
  }
  
  const multiplier = cfg.priceMultiplier[temperature as keyof typeof cfg.priceMultiplier] || 1;
  
  return {
    type: matchedRule.type,
    price: Math.round(matchedRule.price * multiplier),
    deliveryDays: matchedRule.deliveryDays,
  };
}

// ============= AUTONOMOUS FUNCTIONS =============

async function generateSimulatedSignals(supabase: any): Promise<number> {
  logStep("Generating simulated demand signals");
  
  const simulatedSignals = [
    { keyword: "AI chatbot API integration", source: "reddit", volume: Math.floor(Math.random() * 300) + 100, velocity: Math.random() * 3 + 0.5 },
    { keyword: "SaaS white label solution urgent", source: "freelance_marketplace", volume: Math.floor(Math.random() * 400) + 150, velocity: Math.random() * 4 + 1 },
    { keyword: "Backend automation service need", source: "twitter", volume: Math.floor(Math.random() * 250) + 80, velocity: Math.random() * 2.5 + 0.3 },
    { keyword: "API webhook integration help", source: "google_trends", volume: Math.floor(Math.random() * 350) + 120, velocity: Math.random() * 3.5 + 0.8 },
    { keyword: "Custom dashboard development", source: "reddit", volume: Math.floor(Math.random() * 200) + 50, velocity: Math.random() * 2 + 0.2 },
  ];
  
  const randomSignals = simulatedSignals
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  let inserted = 0;
  for (const sig of randomSignals) {
    const { error } = await supabase.from("demand_signals").insert({
      source: sig.source,
      keyword: sig.keyword,
      signal_text: `Detected demand for ${sig.keyword} with high engagement`,
      signal_volume: sig.volume,
      velocity_score: Math.round(sig.velocity * 10) / 10,
    });
    
    if (!error) inserted++;
  }
  
  logStep(`Inserted ${inserted} simulated signals`);
  return inserted;
}

async function autoGenerateOffers(supabase: any): Promise<{ generated: number; published: number }> {
  logStep("Auto-generating offers for hot opportunities");
  
  const { data: hotOpps, error } = await supabase
    .from("demand_opportunities")
    .select("*, demand_signals(*)")
    .eq("temperature", "hot")
    .eq("status", "detected")
    .limit(10);
  
  if (error || !hotOpps) {
    logStep("No hot opportunities to process", error);
    return { generated: 0, published: 0 };
  }
  
  let generated = 0;
  let published = 0;
  
  for (const opp of hotOpps as DemandOpportunity[]) {
    const keyword = opp.demand_signals?.keyword || opp.title.replace("Demand: ", "");
    const offerType = opp.recommended_service || "ready_backend";
    
    const copyTemplate = `
🚀 ${keyword.toUpperCase()} - Premium Solution

Looking for ${keyword}? You've found the right place!

✅ Professional implementation by experts
✅ Delivery in ${opp.estimated_delivery_days || 7} days
✅ Full documentation & ongoing support
✅ 100% satisfaction guarantee

💰 Investment: $${opp.suggested_price || 500}

🔥 High demand detected - Limited availability!

📞 Get started now →
    `.trim();
    
    const { data: offer, error: offerError } = await supabase
      .from("service_offers")
      .insert({
        demand_opportunity_id: opp.id,
        offer_type: offerType,
        title: `${keyword} - Professional Solution`,
        description: `Complete ${keyword} solution with expert implementation and support`,
        price: opp.suggested_price || 500,
        delivery_days: opp.estimated_delivery_days || 7,
        copy_template: copyTemplate,
        status: CONFIG.marketplace.autoPublish ? "published" : "draft",
        published_at: CONFIG.marketplace.autoPublish ? new Date().toISOString() : null,
      })
      .select()
      .single();
    
    if (!offerError && offer) {
      generated++;
      
      await supabase
        .from("demand_opportunities")
        .update({ status: "offer_generated" })
        .eq("id", opp.id);
      
      if (CONFIG.marketplace.autoPublish && CONFIG.marketplace.autoSell) {
        const { error: mpError } = await supabase
          .from("agent_marketplace")
          .insert({
            agent_id: offer.id,
            name: offer.title,
            short_description: `${keyword} solution - ${opp.estimated_delivery_days} days delivery`,
            description: offer.description,
            category: offerType === "ai_automation" ? "automation" : offerType === "api_on_demand" ? "api" : "service",
            price_per_execution: offer.price,
            min_credits_required: Math.ceil(offer.price / 10),
            status: "active",
            is_public: true,
            is_featured: opp.demand_score >= 85,
            tags: [keyword, offerType, "demand-radar", "auto-generated"],
          });
        
        if (!mpError) {
          published++;
          logStep(`Published to marketplace: ${offer.title}`);
        }
      }
    }
  }
  
  logStep(`Auto-generated ${generated} offers, published ${published} to marketplace`);
  return { generated, published };
}

async function processSignalsPipeline(supabase: any): Promise<{ processed: number; results: any[] }> {
  logStep("Starting autonomous signal processing pipeline");
  
  const { data: signalsRaw, error: signalsError } = await supabase
    .from("demand_signals")
    .select("*")
    .order("detected_at", { ascending: false })
    .limit(CONFIG.maxSignalsPerCycle);
  
  if (signalsError) throw signalsError;
  
  const signals = (signalsRaw || []) as DemandSignal[];
  const results: any[] = [];
  
  for (const signal of signals) {
    const { data: existingOpp } = await supabase
      .from("demand_opportunities")
      .select("id")
      .eq("signal_id", signal.id)
      .maybeSingle();
    
    if (existingOpp) continue;
    
    logStep(`Processing signal: ${signal.keyword}`);
    
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
    
    if (intentError) {
      logStep(`Intent classification error`, intentError);
      continue;
    }
    
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
    
    if (trendError) {
      logStep(`Trend prediction error`, trendError);
      continue;
    }
    
    const demandResult = calculateDemandScore(signal.signal_volume, intentResult.confidence, trendResult.score);
    const serviceMapping = mapToService(signal.keyword, demandResult.temperature);
    
    const { data: opportunityData, error: oppError } = await supabase
      .from("demand_opportunities")
      .insert({
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
      })
      .select()
      .single();
    
    if (oppError) {
      logStep(`Opportunity creation error`, oppError);
      continue;
    }
    
    results.push({
      signalId: signal.id,
      opportunityId: opportunityData.id,
      demandScore: demandResult.score,
      temperature: demandResult.temperature,
      intentLevel: intentResult.level,
      intentConfidence: intentResult.confidence,
      serviceType: serviceMapping.type,
      suggestedPrice: serviceMapping.price,
    });
    
    logStep(`Created opportunity`, { id: opportunityData.id, score: demandResult.score, temp: demandResult.temperature });
  }
  
  return { processed: results.length, results };
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

    // GET /status
    if ((path === "status" || path === "demand-radar") && req.method === "GET") {
      const { count: signalsCount } = await supabase
        .from("demand_signals")
        .select("*", { count: "exact", head: true });

      const { count: opportunitiesCount } = await supabase
        .from("demand_opportunities")
        .select("*", { count: "exact", head: true });

      const { data: hotOpps } = await supabase
        .from("demand_opportunities")
        .select("id, demand_score")
        .eq("temperature", "hot");

      const { data: warmOpps } = await supabase
        .from("demand_opportunities")
        .select("id")
        .eq("temperature", "warm");

      const { count: offersCount } = await supabase
        .from("service_offers")
        .select("*", { count: "exact", head: true });

      const { data: recentSignals } = await supabase
        .from("demand_signals")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      const lastScanTime = recentSignals?.[0]?.created_at || null;
      const hotOppsTyped = (hotOpps || []) as { id: string; demand_score: number }[];

      return new Response(
        JSON.stringify({
          success: true,
          status: "operational",
          autonomous: CONFIG.autonomous,
          config: {
            scanIntervalMinutes: CONFIG.scanIntervalMinutes,
            maxSignalsPerCycle: CONFIG.maxSignalsPerCycle,
            autoGenerateOffers: CONFIG.autoGenerateOffers,
            autoSellOffers: CONFIG.autoSellOffers,
            marketplaceAutoPublish: CONFIG.marketplace.autoPublish,
          },
          metrics: {
            totalSignals: signalsCount || 0,
            totalOpportunities: opportunitiesCount || 0,
            hotOpportunities: hotOppsTyped.length,
            warmOpportunities: (warmOpps || []).length,
            coldOpportunities: (opportunitiesCount || 0) - hotOppsTyped.length - (warmOpps || []).length,
            totalOffers: offersCount || 0,
            avgHotScore: hotOppsTyped.length ? Math.round(hotOppsTyped.reduce((a, b) => a + b.demand_score, 0) / hotOppsTyped.length) : 0,
          },
          lastScanTime,
          endpoints: [
            "GET /status",
            "GET /signals",
            "GET /opportunities",
            "POST /scan",
            "POST /process",
            "POST /generate-offer",
            "POST /autonomous-cycle",
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /signals
    if (path === "signals" && req.method === "GET") {
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const source = url.searchParams.get("source");

      let query = supabase
        .from("demand_signals")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(limit);

      if (source) query = query.eq("source", source);

      const { data, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, count: (data || []).length, signals: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /opportunities
    if (path === "opportunities" && req.method === "GET") {
      const temperature = url.searchParams.get("temperature");
      const status = url.searchParams.get("status");
      const limit = parseInt(url.searchParams.get("limit") || "50");

      let query = supabase
        .from("demand_opportunities")
        .select("*, demand_signals(*), service_offers(*)")
        .order("demand_score", { ascending: false })
        .limit(limit);

      if (temperature) query = query.eq("temperature", temperature);
      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, count: (data || []).length, opportunities: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /scan
    if (path === "scan" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { simulate, source, keyword, signal_text, signal_volume, velocity_score } = body;

      if (simulate) {
        const inserted = await generateSimulatedSignals(supabase);
        return new Response(
          JSON.stringify({ success: true, mode: "simulated", signalsInserted: inserted }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!keyword) {
        return new Response(
          JSON.stringify({ success: false, error: "Keyword is required for manual signals" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("demand_signals")
        .insert({
          source: source || "manual_input",
          keyword,
          signal_text: signal_text || `Manual signal: ${keyword}`,
          signal_volume: signal_volume || 100,
          velocity_score: velocity_score || 1.5,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, mode: "manual", signal: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /process
    if (path === "process" && req.method === "POST") {
      const result = await processSignalsPipeline(supabase);

      let offersResult = { generated: 0, published: 0 };
      if (CONFIG.autoGenerateOffers && result.processed > 0) {
        offersResult = await autoGenerateOffers(supabase);
      }

      return new Response(
        JSON.stringify({
          success: true,
          pipeline: result,
          offers: offersResult,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /generate-offer
    if (path === "generate-offer" && req.method === "POST") {
      const body = await req.json();
      const { opportunity_id, auto_publish } = body;

      if (!opportunity_id) {
        return new Response(
          JSON.stringify({ success: false, error: "opportunity_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: opportunityRaw, error: oppError } = await supabase
        .from("demand_opportunities")
        .select("*, demand_signals(*)")
        .eq("id", opportunity_id)
        .single();

      if (oppError || !opportunityRaw) {
        return new Response(
          JSON.stringify({ success: false, error: "Opportunity not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const opportunity = opportunityRaw as DemandOpportunity;
      const keyword = opportunity.demand_signals?.keyword || opportunity.title.replace("Demand: ", "");
      const offerType = opportunity.recommended_service || "ready_backend";
      const shouldPublish = auto_publish ?? CONFIG.marketplace.autoPublish;

      const copyTemplate = `
🚀 ${keyword.toUpperCase()} - Premium Solution

Looking for ${keyword}? You've found the right place!

✅ Professional implementation by experts
✅ Delivery in ${opportunity.estimated_delivery_days || 7} days
✅ Full documentation & ongoing support
✅ 100% satisfaction guarantee

💰 Investment: $${opportunity.suggested_price || 500}

🔥 High demand detected - Limited availability!

📞 Get started now →
      `.trim();

      const { data: offer, error: offerError } = await supabase
        .from("service_offers")
        .insert({
          demand_opportunity_id: opportunity.id,
          offer_type: offerType,
          title: `${keyword} - Professional Solution`,
          description: `Complete ${keyword} solution with expert implementation and support`,
          price: opportunity.suggested_price || 500,
          delivery_days: opportunity.estimated_delivery_days || 7,
          copy_template: copyTemplate,
          status: shouldPublish ? "published" : "draft",
          published_at: shouldPublish ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (offerError) throw offerError;

      await supabase
        .from("demand_opportunities")
        .update({ status: "offer_generated" })
        .eq("id", opportunity_id);

      let marketplaceEntry = null;
      if (shouldPublish && CONFIG.marketplace.autoSell) {
        const { data: mpData, error: mpError } = await supabase
          .from("agent_marketplace")
          .insert({
            agent_id: offer.id,
            name: offer.title,
            short_description: `${keyword} solution - ${opportunity.estimated_delivery_days} days delivery`,
            description: offer.description,
            category: offerType === "ai_automation" ? "automation" : offerType === "api_on_demand" ? "api" : "service",
            price_per_execution: offer.price,
            min_credits_required: Math.ceil(offer.price / 10),
            status: "active",
            is_public: true,
            is_featured: opportunity.demand_score >= 85,
            tags: [keyword, offerType, "demand-radar"],
          })
          .select()
          .single();

        if (!mpError) marketplaceEntry = mpData;
      }

      return new Response(
        JSON.stringify({
          success: true,
          offer,
          marketplace: marketplaceEntry,
          published: shouldPublish,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /autonomous-cycle
    if (path === "autonomous-cycle" && req.method === "POST") {
      logStep("Starting full autonomous cycle");

      const signalsInserted = await generateSimulatedSignals(supabase);
      const pipelineResult = await processSignalsPipeline(supabase);
      const offersResult = await autoGenerateOffers(supabase);

      const { data: allOpps } = await supabase
        .from("demand_opportunities")
        .select("temperature");
      
      const oppsTyped = (allOpps || []) as { temperature: string }[];
      const stats = {
        hot: oppsTyped.filter(d => d.temperature === "hot").length,
        warm: oppsTyped.filter(d => d.temperature === "warm").length,
        cold: oppsTyped.filter(d => d.temperature === "cold").length,
      };

      return new Response(
        JSON.stringify({
          success: true,
          cycle: "complete",
          results: {
            signalsGenerated: signalsInserted,
            signalsProcessed: pipelineResult.processed,
            offersGenerated: offersResult.generated,
            offersPublished: offersResult.published,
          },
          currentStats: stats,
          nextCycleIn: `${CONFIG.scanIntervalMinutes} minutes`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demand Radar API",
        availableEndpoints: [
          "GET /status",
          "GET /signals", 
          "GET /opportunities",
          "POST /scan",
          "POST /process",
          "POST /generate-offer",
          "POST /autonomous-cycle",
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    logStep("Error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
