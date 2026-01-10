// Volume Generator - XPEX Neural Supreme
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VolumeProfile {
  id: string;
  name: string;
  targetApi: string;
  callsPerHour: number;
  callDistribution: "uniform" | "burst" | "random";
  payloadVariations: Record<string, unknown>[];
  peakHours: number[];
  budget: number;
  active: boolean;
}

class VolumeGenerator {
  private supabase: ReturnType<typeof createClient>;
  private profiles: Map<string, VolumeProfile> = new Map();
  private stats = {
    totalCalls: 0,
    successfulCalls: 0,
    totalSpent: 0,
    startTime: new Date(),
  };

  constructor() {
    this.supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
  }

  async loadProfiles(): Promise<void> {
    // Default profiles for common use cases
    const defaultProfiles: VolumeProfile[] = [
      {
        id: "market_data",
        name: "Market Data Aggregator",
        targetApi: "market_data_api",
        callsPerHour: 360,
        callDistribution: "uniform",
        payloadVariations: [
          { symbol: "BTCUSD", interval: "1m" },
          { symbol: "ETHUSD", interval: "1m" },
          { symbol: "SOLUSD", interval: "1m" },
        ],
        peakHours: [9, 10, 11, 14, 15, 16],
        budget: 1000,
        active: true,
      },
      {
        id: "news_feed",
        name: "News Feed Monitor",
        targetApi: "news_api",
        callsPerHour: 60,
        callDistribution: "random",
        payloadVariations: [
          { category: "crypto", language: "en" },
          { category: "technology", language: "en" },
          { category: "finance", language: "en" },
        ],
        peakHours: [8, 12, 16, 20],
        budget: 500,
        active: true,
      },
      {
        id: "social_metrics",
        name: "Social Metrics Tracker",
        targetApi: "social_api",
        callsPerHour: 120,
        callDistribution: "burst",
        payloadVariations: [
          { platform: "twitter", metric: "mentions" },
          { platform: "reddit", metric: "posts" },
          { platform: "telegram", metric: "messages" },
        ],
        peakHours: [10, 11, 19, 20, 21],
        budget: 300,
        active: true,
      },
    ];

    defaultProfiles.forEach(profile => {
      this.profiles.set(profile.id, profile);
    });

    console.log(`📊 Loaded ${this.profiles.size} volume profiles`);
  }

  async executeProfileCalls(profileId: string, count: number = 1): Promise<{
    success: number;
    failed: number;
    cost: number;
  }> {
    const profile = this.profiles.get(profileId);
    
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    console.log(`📊 Executing ${count} calls for profile: ${profile.name}`);

    const currentHour = new Date().getHours();
    const isPeakHour = profile.peakHours.includes(currentHour);

    // Adjust call count based on peak hours
    let adjustedCount = count;
    if (!isPeakHour) {
      adjustedCount = Math.ceil(count * 0.3); // 30% during off-peak
    }

    let success = 0;
    let failed = 0;
    let totalCost = 0;

    for (let i = 0; i < adjustedCount; i++) {
      try {
        // Select random payload variation
        const payload = profile.payloadVariations[
          Math.floor(Math.random() * profile.payloadVariations.length)
        ];

        const result = await this.simulateApiCall(profile.targetApi, payload);
        
        if (result.success) {
          success++;
          this.stats.successfulCalls++;
        } else {
          failed++;
        }

        totalCost += result.cost;
        this.stats.totalCalls++;
        this.stats.totalSpent += result.cost;

        // Record the call
        await this.recordCall(profile, payload, result);

        // Add small delay between calls based on distribution
        if (profile.callDistribution === "uniform") {
          await new Promise(resolve => setTimeout(resolve, 100));
        } else if (profile.callDistribution === "burst") {
          // No delay for burst
        } else {
          // Random delay for random distribution
          await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
        }

      } catch (error) {
        console.error(`Call failed for ${profile.name}:`, error);
        failed++;
        this.stats.totalCalls++;
      }
    }

    return { success, failed, cost: totalCost };
  }

  private async simulateApiCall(apiId: string, payload: Record<string, unknown>): Promise<{
    success: boolean;
    cost: number;
    responseTime: number;
    data: Record<string, unknown>;
  }> {
    const startTime = Date.now();
    
    // Try to get actual API configuration
    const { data: apiConfig } = await this.supabase
      .from("api_products")
      .select("*")
      .eq("id", apiId)
      .single();

    let responseTime: number;
    let success = true;
    let data: Record<string, unknown> = {};

    if (apiConfig) {
      // Make actual API call if configured
      try {
        const response = await fetch(apiConfig.api_endpoint, {
          method: apiConfig.request_method || "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiConfig.request_headers || {}),
          },
          body: JSON.stringify(payload),
        });

        responseTime = Date.now() - startTime;
        success = response.ok;
        
        if (success) {
          data = await response.json();
        }
      } catch (error) {
        responseTime = Date.now() - startTime;
        success = false;
      }
    } else {
      // Simulate response for testing
      responseTime = 50 + Math.random() * 100;
      success = Math.random() > 0.05; // 95% success rate
      data = {
        simulated: true,
        payload,
        timestamp: new Date().toISOString(),
      };
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, responseTime));
    }

    const cost = apiConfig ? Number(apiConfig.price_per_call) || 0.001 : 0.001;

    return { success, cost, responseTime, data };
  }

  private async recordCall(
    profile: VolumeProfile,
    payload: Record<string, unknown>,
    result: { success: boolean; cost: number; responseTime: number }
  ): Promise<void> {
    await this.supabase
      .from("volume_generation_logs")
      .insert({
        profile_id: profile.id,
        api_id: profile.targetApi,
        payload,
        result: result.success ? "success" : "failure",
        response_time_ms: result.responseTime,
        cost: result.cost,
        generated_at: new Date().toISOString(),
        metadata: {
          profile_name: profile.name,
          distribution: profile.callDistribution,
        },
      });
  }

  async createProfile(profile: Omit<VolumeProfile, "id">): Promise<{ id: string }> {
    const id = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newProfile: VolumeProfile = { ...profile, id };
    
    this.profiles.set(id, newProfile);
    
    return { id };
  }

  async updateProfile(id: string, updates: Partial<VolumeProfile>): Promise<{ success: boolean }> {
    const profile = this.profiles.get(id);
    
    if (!profile) {
      throw new Error(`Profile not found: ${id}`);
    }

    this.profiles.set(id, { ...profile, ...updates });
    return { success: true };
  }

  async checkBudgets(): Promise<{ profiles: { id: string; spent: number; budget: number; remaining: number }[] }> {
    const results = [];
    const today = new Date().toISOString().split("T")[0];

    for (const [profileId, profile] of this.profiles) {
      const { data: todaySpend } = await this.supabase
        .from("volume_generation_logs")
        .select("cost")
        .eq("profile_id", profileId)
        .gte("generated_at", `${today}T00:00:00Z`)
        .lte("generated_at", `${today}T23:59:59Z`);

      const totalSpent = todaySpend?.reduce((sum, log) => sum + Number(log.cost || 0), 0) || 0;

      results.push({
        id: profileId,
        spent: totalSpent,
        budget: profile.budget,
        remaining: profile.budget - totalSpent,
      });

      // Deactivate if over budget
      if (totalSpent >= profile.budget * 0.9) {
        console.log(`⚠️ Profile ${profile.name} approaching budget limit`);
        profile.active = false;
      }
    }

    return { profiles: results };
  }

  async getPerformanceReport(): Promise<{
    uptime: number;
    totalCalls: number;
    successRate: number;
    totalSpent: number;
    callsPerHour: number;
    costPerCall: number;
  }> {
    const uptimeHours = (Date.now() - this.stats.startTime.getTime()) / (1000 * 60 * 60);
    const successRate = this.stats.totalCalls > 0 
      ? this.stats.successfulCalls / this.stats.totalCalls 
      : 0;
    const callsPerHour = this.stats.totalCalls / Math.max(uptimeHours, 0.01);
    const costPerCall = this.stats.totalCalls > 0 
      ? this.stats.totalSpent / this.stats.totalCalls 
      : 0;

    // Store performance record
    await this.supabase
      .from("brain_reports")
      .insert({
        report_type: "hourly",
        period_start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        period_end: new Date().toISOString(),
        total_tasks_completed: this.stats.totalCalls,
        avg_success_rate: successRate,
        total_cost: this.stats.totalSpent,
        system_efficiency_score: successRate,
        insights: {
          source: "volume_generator",
          calls_per_hour: callsPerHour,
        },
      });

    return {
      uptime: uptimeHours,
      totalCalls: this.stats.totalCalls,
      successRate,
      totalSpent: this.stats.totalSpent,
      callsPerHour,
      costPerCall,
    };
  }

  getProfiles(): VolumeProfile[] {
    return Array.from(this.profiles.values());
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const generator = new VolumeGenerator();
    await generator.loadProfiles();

    const url = new URL(req.url);
    const path = url.pathname.replace("/volume-generator", "");

    // Get all profiles
    if (path === "/profiles" && req.method === "GET") {
      const profiles = generator.getProfiles();
      return new Response(JSON.stringify({ profiles }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create new profile
    if (path === "/profiles" && req.method === "POST") {
      const profile = await req.json();
      const result = await generator.createProfile(profile);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Execute calls for a profile
    if (path === "/execute" && req.method === "POST") {
      const { profileId, count } = await req.json();
      
      if (!profileId) {
        return new Response(JSON.stringify({ error: "profileId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await generator.executeProfileCalls(profileId, count || 1);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check budgets
    if (path === "/budgets" && req.method === "GET") {
      const result = await generator.checkBudgets();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get performance report
    if (path === "/report" && req.method === "GET") {
      const report = await generator.getPerformanceReport();
      return new Response(JSON.stringify(report), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      message: "Volume Generator Service",
      endpoints: ["/profiles", "/execute", "/budgets", "/report"],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Volume Generator Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
