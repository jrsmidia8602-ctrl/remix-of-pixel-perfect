import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DemandSignal {
  id: string;
  source: string;
  keyword: string;
  signal_text: string;
  signal_volume: number;
  velocity_score: number;
}

interface ClassifiedIntent {
  id: string;
  signal_id: string;
  intent_level: string;
  confidence_score: number;
}

interface TrendPrediction {
  id: string;
  intent_id: string;
  trend_score: number;
  momentum_index: number;
}

const logStep = (step: string, details?: unknown) => {
  console.log(`[DEMAND-RADAR] ${step}`, details ? JSON.stringify(details) : "");
};

// Simple rule-based intent classification (hybrid approach)
function classifyIntent(signal: DemandSignal): { level: string; confidence: number; reasoning: string } {
  const text = (signal.signal_text || "").toLowerCase();
  const keyword = signal.keyword.toLowerCase();
  
  // Purchase intent keywords
  const purchaseKeywords = ["urgent", "need", "looking for", "hire", "buy", "asap", "budget", "pay"];
  const researchKeywords = ["how to", "best", "compare", "review", "which"];
  const solutionKeywords = ["integration", "api", "service", "solution", "tool"];
  const curiosityKeywords = ["what is", "learn", "understand", "about"];
  
  let purchaseScore = 0;
  let researchScore = 0;
  let solutionScore = 0;
  let curiosityScore = 0;
  
  purchaseKeywords.forEach(kw => {
    if (text.includes(kw) || keyword.includes(kw)) purchaseScore += 0.25;
  });
  
  researchKeywords.forEach(kw => {
    if (text.includes(kw) || keyword.includes(kw)) researchScore += 0.2;
  });
  
  solutionKeywords.forEach(kw => {
    if (text.includes(kw) || keyword.includes(kw)) solutionScore += 0.15;
  });
  
  curiosityKeywords.forEach(kw => {
    if (text.includes(kw) || keyword.includes(kw)) curiosityScore += 0.1;
  });
  
  // Velocity and volume boost
  if (signal.velocity_score > 2) purchaseScore += 0.2;
  if (signal.signal_volume > 200) purchaseScore += 0.15;
  
  // Determine intent level
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
    reasoning: `Classified as ${topScore.level} based on keyword analysis and signal strength.`,
  };
}

// Trend prediction using simple momentum calculation
function predictTrend(signal: DemandSignal, intentConfidence: number): { score: number; momentum: number; growth: number } {
  // Normalize volume to 0-100 scale (assuming max 500)
  const normalizedVolume = Math.min(100, (signal.signal_volume / 500) * 100);
  
  // Calculate momentum from velocity
  const momentum = signal.velocity_score * 20; // 0-100 scale
  
  // Trend score based on volume trend and velocity
  const trendScore = Math.min(100, (normalizedVolume * 0.5) + (momentum * 0.5));
  
  // Growth rate estimation
  const growthRate = signal.velocity_score > 2 ? 15 : signal.velocity_score > 1 ? 8 : 3;
  
  return {
    score: trendScore,
    momentum,
    growth: growthRate,
  };
}

// Calculate final demand score
function calculateDemandScore(
  signalVolume: number,
  intentConfidence: number,
  trendScore: number
): { score: number; temperature: string } {
  // Normalize signal volume to 0-100 (max 500)
  const normalizedVolume = Math.min(100, (signalVolume / 500) * 100);
  
  // Apply formula: (signal_volume * 0.3) + (intent_confidence * 0.4) + (trend_score * 0.3)
  const score = (normalizedVolume * 0.3) + (intentConfidence * 100 * 0.4) + (trendScore * 0.3);
  
  // Determine temperature
  let temperature: string;
  if (score >= 70) {
    temperature = "hot";
  } else if (score >= 40) {
    temperature = "warm";
  } else {
    temperature = "cold";
  }
  
  return { score: Math.round(score * 10) / 10, temperature };
}

// Map demand to service offer
function mapToService(
  keyword: string,
  intentLevel: string,
  demandScore: number
): { type: string; price: number; deliveryDays: number } {
  const keywordLower = keyword.toLowerCase();
  
  let type: string;
  let basePrice: number;
  let deliveryDays: number;
  
  if (keywordLower.includes("api") || keywordLower.includes("backend")) {
    type = "api_on_demand";
    basePrice = 500;
    deliveryDays = 7;
  } else if (keywordLower.includes("saas") || keywordLower.includes("white label")) {
    type = "white_label_saas";
    basePrice = 2000;
    deliveryDays = 14;
  } else if (keywordLower.includes("ai") || keywordLower.includes("automation")) {
    type = "ai_automation";
    basePrice = 800;
    deliveryDays = 5;
  } else if (keywordLower.includes("consult") || keywordLower.includes("help")) {
    type = "express_consulting";
    basePrice = 200;
    deliveryDays = 1;
  } else {
    type = "ready_backend";
    basePrice = 600;
    deliveryDays = 7;
  }
  
  // Adjust price based on demand score (higher demand = higher price)
  const priceMultiplier = demandScore >= 70 ? 1.5 : demandScore >= 40 ? 1.2 : 1;
  
  return {
    type,
    price: Math.round(basePrice * priceMultiplier),
    deliveryDays,
  };
}

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

    logStep(`Processing request: ${path}`);

    // GET /status - System status
    if (path === "status" || path === "demand-radar") {
      const { count: signalsCount } = await supabase
        .from("demand_signals")
        .select("*", { count: "exact", head: true });

      const { count: opportunitiesCount } = await supabase
        .from("demand_opportunities")
        .select("*", { count: "exact", head: true });

      const { data: hotOpportunities } = await supabase
        .from("demand_opportunities")
        .select("*")
        .eq("temperature", "hot")
        .limit(5);

      return new Response(
        JSON.stringify({
          success: true,
          status: "operational",
          metrics: {
            totalSignals: signalsCount || 0,
            totalOpportunities: opportunitiesCount || 0,
            hotOpportunities: hotOpportunities?.length || 0,
          },
          endpoints: [
            "GET /status",
            "GET /signals",
            "GET /opportunities",
            "POST /scan",
            "POST /process",
            "POST /generate-offer",
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /signals - List all signals
    if (path === "signals") {
      const { data, error } = await supabase
        .from("demand_signals")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, signals: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /opportunities - List opportunities with filters
    if (path === "opportunities") {
      const temperature = url.searchParams.get("temperature");
      
      let query = supabase
        .from("demand_opportunities")
        .select("*, demand_signals(*), service_offers(*)")
        .order("demand_score", { ascending: false })
        .limit(50);

      if (temperature) {
        query = query.eq("temperature", temperature);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, opportunities: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /scan - Add manual signal
    if (path === "scan" && req.method === "POST") {
      const body = await req.json();
      const { source, keyword, signal_text, signal_volume, velocity_score } = body;

      if (!keyword) {
        return new Response(
          JSON.stringify({ success: false, error: "Keyword is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("demand_signals")
        .insert({
          source: source || "manual_input",
          keyword,
          signal_text: signal_text || "",
          signal_volume: signal_volume || 50,
          velocity_score: velocity_score || 1,
        })
        .select()
        .single();

      if (error) throw error;

      logStep("Signal added", { id: data.id });

      return new Response(
        JSON.stringify({ success: true, signal: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /process - Process unprocessed signals through the pipeline
    if (path === "process" && req.method === "POST") {
      logStep("Starting signal processing pipeline");

      // Get unprocessed signals (no linked opportunity)
      const { data: signals, error: signalsError } = await supabase
        .from("demand_signals")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(20);

      if (signalsError) throw signalsError;

      const results = [];

      for (const signal of signals || []) {
        // Check if already processed
        const { data: existingOpp } = await supabase
          .from("demand_opportunities")
          .select("id")
          .eq("signal_id", signal.id)
          .maybeSingle();

        if (existingOpp) {
          continue; // Already processed
        }

        logStep(`Processing signal: ${signal.keyword}`);

        // Step 1: Classify intent
        const intentResult = classifyIntent(signal);
        
        const { data: intentData, error: intentError } = await supabase
          .from("classified_intents")
          .insert({
            signal_id: signal.id,
            intent_level: intentResult.level,
            confidence_score: intentResult.confidence,
            analysis_reasoning: intentResult.reasoning,
            keywords_matched: [signal.keyword],
          })
          .select()
          .single();

        if (intentError) {
          logStep(`Intent classification error`, intentError);
          continue;
        }

        // Step 2: Predict trend
        const trendResult = predictTrend(signal, intentResult.confidence);

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

        // Step 3: Calculate demand score
        const demandResult = calculateDemandScore(
          signal.signal_volume,
          intentResult.confidence,
          trendResult.score
        );

        // Step 4: Map to service
        const serviceMapping = mapToService(signal.keyword, intentResult.level, demandResult.score);

        // Step 5: Create opportunity
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
        });

        logStep(`Created opportunity`, { id: opportunityData.id, score: demandResult.score });
      }

      return new Response(
        JSON.stringify({
          success: true,
          processed: results.length,
          results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /generate-offer - Generate service offer for hot opportunity
    if (path === "generate-offer" && req.method === "POST") {
      const body = await req.json();
      const { opportunity_id } = body;

      if (!opportunity_id) {
        return new Response(
          JSON.stringify({ success: false, error: "opportunity_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get opportunity
      const { data: opportunity, error: oppError } = await supabase
        .from("demand_opportunities")
        .select("*, demand_signals(*)")
        .eq("id", opportunity_id)
        .single();

      if (oppError || !opportunity) {
        return new Response(
          JSON.stringify({ success: false, error: "Opportunity not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate offer
      const offerType = opportunity.recommended_service || "ready_backend";
      const keyword = opportunity.demand_signals?.keyword || "service";

      const copyTemplate = `
🚀 ${keyword.toUpperCase()} Solution Available!

Are you looking for ${keyword}? We've got you covered.

✅ Fast delivery in ${opportunity.estimated_delivery_days} days
✅ Professional implementation
✅ Full documentation & support
✅ Satisfaction guaranteed

💰 Special offer: $${opportunity.suggested_price}

📞 Contact us now to get started!
      `.trim();

      const { data: offer, error: offerError } = await supabase
        .from("service_offers")
        .insert({
          demand_opportunity_id: opportunity.id,
          offer_type: offerType,
          title: `${keyword} - Professional Solution`,
          description: `Complete ${keyword} implementation with support`,
          price: opportunity.suggested_price || 500,
          delivery_days: opportunity.estimated_delivery_days || 7,
          copy_template: copyTemplate,
          status: "draft",
        })
        .select()
        .single();

      if (offerError) throw offerError;

      // Update opportunity status
      await supabase
        .from("demand_opportunities")
        .update({ status: "offer_generated" })
        .eq("id", opportunity_id);

      logStep("Offer generated", { offerId: offer.id });

      return new Response(
        JSON.stringify({ success: true, offer }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default response
    return new Response(
      JSON.stringify({
        success: false,
        error: "Unknown endpoint",
        available: ["/status", "/signals", "/opportunities", "/scan", "/process", "/generate-offer"],
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    const errStack = error instanceof Error ? error.stack : undefined;
    logStep("Error", { message: errMessage, stack: errStack });
    return new Response(
      JSON.stringify({ success: false, error: errMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
