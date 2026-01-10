// API Marketplace - XPEX Neural Supreme
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApiProduct {
  name: string;
  description?: string;
  api_endpoint: string;
  documentation_url?: string;
  price_model: "per_call" | "subscription" | "tiered" | "custom";
  price_per_call?: number;
  monthly_subscription_price?: number;
  tier_pricing?: Record<string, unknown>;
  rate_limit_per_minute?: number;
  rate_limit_per_hour?: number;
  monthly_call_limit?: number;
  request_method?: string;
  request_headers?: Record<string, string>;
  request_body_template?: Record<string, unknown>;
  response_format?: "json" | "xml" | "text" | "binary";
  auth_method?: "api_key" | "oauth2" | "jwt" | "none";
  auth_credentials?: Record<string, string>;
  tags?: string[];
  categories?: string[];
  is_public?: boolean;
  requires_approval?: boolean;
}

class ApiMarketplace {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
  }

  async listProducts(filters?: {
    category?: string;
    priceModel?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ products: unknown[]; total: number }> {
    let query = (this.supabase.from("api_products") as any)
      .select("*, sellers!inner(business_name, email)", { count: "exact" })
      .eq("is_active", filters?.isActive ?? true)
      .eq("is_public", true);

    if (filters?.category) {
      query = query.contains("categories", [filters.category]);
    }

    if (filters?.priceModel) {
      query = query.eq("price_model", filters.priceModel);
    }

    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    const { data, error, count } = await query
      .order("total_calls", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list products: ${error.message}`);
    }

    return { products: data || [], total: count || 0 };
  }

  async getProduct(productId: string): Promise<unknown> {
    const { data, error } = await (this.supabase.from("api_products") as any)
      .select("*, sellers!inner(business_name, email)")
      .eq("id", productId)
      .single();

    if (error) {
      throw new Error(`Product not found: ${error.message}`);
    }

    return data;
  }

  async createProduct(sellerId: string, product: ApiProduct): Promise<{ id: string }> {
    const { data, error } = await (this.supabase.from("api_products") as any)
      .insert({
        seller_id: sellerId,
        name: product.name,
        description: product.description,
        api_endpoint: product.api_endpoint,
        documentation_url: product.documentation_url,
        price_model: product.price_model,
        price_per_call: product.price_per_call || 0.001,
        monthly_subscription_price: product.monthly_subscription_price,
        tier_pricing: product.tier_pricing,
        rate_limit_per_minute: product.rate_limit_per_minute || 60,
        rate_limit_per_hour: product.rate_limit_per_hour || 1000,
        monthly_call_limit: product.monthly_call_limit,
        request_method: product.request_method || "POST",
        request_headers: product.request_headers || {},
        request_body_template: product.request_body_template,
        response_format: product.response_format || "json",
        auth_method: product.auth_method || "api_key",
        auth_credentials: product.auth_credentials,
        tags: product.tags || [],
        categories: product.categories || [],
        is_public: product.is_public ?? true,
        requires_approval: product.requires_approval ?? false,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return { id: (data as any).id };
  }

  async updateProduct(productId: string, updates: Partial<ApiProduct>): Promise<{ success: boolean }> {
    const { error } = await (this.supabase.from("api_products") as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return { success: true };
  }

  async deleteProduct(productId: string): Promise<{ success: boolean }> {
    const { error } = await (this.supabase.from("api_products") as any)
      .update({ is_active: false })
      .eq("id", productId);

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }

    return { success: true };
  }

  async callApi(productId: string, payload: Record<string, unknown>, consumerId: string): Promise<{
    success: boolean;
    data?: unknown;
    cost: number;
    responseTime: number;
    error?: string;
  }> {
    const { data: product, error: productError } = await (this.supabase.from("api_products") as any)
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // Check rate limits
    const canCall = await this.checkRateLimits(productId, consumerId, product);
    if (!canCall.allowed) {
      throw new Error(`Rate limit exceeded: ${canCall.reason}`);
    }

    const startTime = Date.now();
    let success = false;
    let responseData: unknown;
    let errorMessage: string | undefined;

    try {
      const response = await fetch(product.api_endpoint, {
        method: product.request_method || "POST",
        headers: {
          "Content-Type": "application/json",
          ...(product.request_headers || {}),
          ...this.getAuthHeaders(product),
        },
        body: JSON.stringify(payload),
      });

      success = response.ok;
      
      if (success) {
        responseData = await response.json();
      } else {
        errorMessage = `API returned ${response.status}: ${response.statusText}`;
      }
    } catch (err: unknown) {
      errorMessage = (err as Error).message;
    }

    const responseTime = Date.now() - startTime;
    const cost = Number(product.price_per_call) || 0.001;

    // Record usage
    await this.recordUsage(productId, consumerId, success, responseTime, cost);

    // Update product stats
    await (this.supabase.from("api_products") as any)
      .update({
        total_calls: (product.total_calls || 0) + 1,
        successful_calls: (product.successful_calls || 0) + (success ? 1 : 0),
        failed_calls: (product.failed_calls || 0) + (success ? 0 : 1),
        total_revenue: Number(product.total_revenue || 0) + (success ? cost : 0),
      })
      .eq("id", productId);

    return {
      success,
      data: responseData,
      cost: success ? cost : 0,
      responseTime,
      error: errorMessage,
    };
  }

  private async checkRateLimits(productId: string, consumerId: string, product: Record<string, unknown>): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const now = new Date();
    const minuteAgo = new Date(now.getTime() - 60000);
    const hourAgo = new Date(now.getTime() - 3600000);

    // Check per-minute rate limit
    const { count: minuteCount } = await (this.supabase.from("api_usage_metrics") as any)
      .select("*", { count: "exact", head: true })
      .eq("api_product_id", productId)
      .eq("consumer_id", consumerId)
      .gte("time_window", minuteAgo.toISOString());

    const ratePerMin = product.rate_limit_per_minute as number || 60;
    if ((minuteCount || 0) >= ratePerMin) {
      return { allowed: false, reason: `Per-minute limit (${ratePerMin}) exceeded` };
    }

    // Check per-hour rate limit
    const { count: hourCount } = await (this.supabase.from("api_usage_metrics") as any)
      .select("*", { count: "exact", head: true })
      .eq("api_product_id", productId)
      .eq("consumer_id", consumerId)
      .gte("time_window", hourAgo.toISOString());

    const ratePerHour = product.rate_limit_per_hour as number || 1000;
    if ((hourCount || 0) >= ratePerHour) {
      return { allowed: false, reason: `Per-hour limit (${ratePerHour}) exceeded` };
    }

    return { allowed: true };
  }

  private getAuthHeaders(product: Record<string, unknown>): Record<string, string> {
    const authMethod = product.auth_method as string;
    const credentials = product.auth_credentials as Record<string, string> | undefined;

    if (authMethod === "api_key" && credentials?.api_key) {
      return { "Authorization": `Bearer ${credentials.api_key}` };
    }

    return {};
  }

  private async recordUsage(
    productId: string,
    consumerId: string,
    success: boolean,
    responseTime: number,
    cost: number
  ): Promise<void> {
    const now = new Date();
    const hourWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    const { data: existing } = await (this.supabase.from("api_usage_metrics") as any)
      .select("*")
      .eq("api_product_id", productId)
      .eq("consumer_id", consumerId)
      .eq("time_window", hourWindow.toISOString())
      .single();

    if (existing) {
      await (this.supabase.from("api_usage_metrics") as any)
        .update({
          call_count: (existing.call_count || 0) + 1,
          success_count: (existing.success_count || 0) + (success ? 1 : 0),
          error_count: (existing.error_count || 0) + (success ? 0 : 1),
          avg_response_time_ms: 
            ((existing.avg_response_time_ms || 0) * (existing.call_count || 0) + responseTime) / 
            ((existing.call_count || 0) + 1),
          total_cost: Number(existing.total_cost || 0) + cost,
          total_revenue: Number(existing.total_revenue || 0) + (success ? cost : 0),
        })
        .eq("id", existing.id);
    } else {
      await (this.supabase.from("api_usage_metrics") as any)
        .insert({
          api_product_id: productId,
          consumer_id: consumerId,
          time_window: hourWindow.toISOString(),
          time_granularity: "hour",
          call_count: 1,
          success_count: success ? 1 : 0,
          error_count: success ? 0 : 1,
          avg_response_time_ms: responseTime,
          total_cost: cost,
          total_revenue: success ? cost : 0,
        });
    }
  }

  async getAnalytics(productId: string, days: number = 7): Promise<{
    totalCalls: number;
    successRate: number;
    avgResponseTime: number;
    totalRevenue: number;
    dailyMetrics: unknown[];
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data: metrics } = await (this.supabase.from("api_usage_metrics") as any)
      .select("*")
      .eq("api_product_id", productId)
      .gte("time_window", startDate.toISOString())
      .order("time_window", { ascending: true });

    if (!metrics || metrics.length === 0) {
      return {
        totalCalls: 0,
        successRate: 0,
        avgResponseTime: 0,
        totalRevenue: 0,
        dailyMetrics: [],
      };
    }

    const totalCalls = metrics.reduce((sum: number, m: any) => sum + (m.call_count || 0), 0);
    const successCalls = metrics.reduce((sum: number, m: any) => sum + (m.success_count || 0), 0);
    const totalRevenue = metrics.reduce((sum: number, m: any) => sum + Number(m.total_revenue || 0), 0);
    const avgResponseTime = totalCalls > 0 
      ? metrics.reduce((sum: number, m: any) => sum + (m.avg_response_time_ms || 0) * (m.call_count || 0), 0) / totalCalls 
      : 0;

    // Group by day
    const dailyMap = new Map<string, { calls: number; success: number; revenue: number }>();
    metrics.forEach((m: any) => {
      const day = new Date(m.time_window).toISOString().split("T")[0];
      const existing = dailyMap.get(day) || { calls: 0, success: 0, revenue: 0 };
      dailyMap.set(day, {
        calls: existing.calls + (m.call_count || 0),
        success: existing.success + (m.success_count || 0),
        revenue: existing.revenue + Number(m.total_revenue || 0),
      });
    });

    const dailyMetrics = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data,
      successRate: data.calls > 0 ? data.success / data.calls : 0,
    }));

    return {
      totalCalls,
      successRate: totalCalls > 0 ? successCalls / totalCalls : 0,
      avgResponseTime,
      totalRevenue,
      dailyMetrics,
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const marketplace = new ApiMarketplace();
    const url = new URL(req.url);
    const path = url.pathname.replace("/api-marketplace", "");

    // List products
    if (path === "/products" && req.method === "GET") {
      const category = url.searchParams.get("category") || undefined;
      const priceModel = url.searchParams.get("priceModel") || undefined;
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      const result = await marketplace.listProducts({
        category,
        priceModel,
        limit,
        offset,
      });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create product
    if (path === "/products" && req.method === "POST") {
      const body = await req.json();
      const { sellerId, ...product } = body;

      if (!sellerId) {
        return new Response(JSON.stringify({ error: "sellerId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await marketplace.createProduct(sellerId, product);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get single product
    if (path.startsWith("/products/") && req.method === "GET") {
      const productId = path.replace("/products/", "").split("/")[0];
      
      if (path.includes("/analytics")) {
        const days = parseInt(url.searchParams.get("days") || "7");
        const result = await marketplace.getAnalytics(productId, days);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const product = await marketplace.getProduct(productId);
      return new Response(JSON.stringify(product), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update product
    if (path.startsWith("/products/") && req.method === "PUT") {
      const productId = path.replace("/products/", "");
      const updates = await req.json();
      const result = await marketplace.updateProduct(productId, updates);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete product
    if (path.startsWith("/products/") && req.method === "DELETE") {
      const productId = path.replace("/products/", "");
      const result = await marketplace.deleteProduct(productId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call API
    if (path === "/call" && req.method === "POST") {
      const { productId, payload, consumerId } = await req.json();

      if (!productId || !consumerId) {
        return new Response(JSON.stringify({ error: "productId and consumerId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await marketplace.callApi(productId, payload || {}, consumerId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      message: "API Marketplace Service",
      endpoints: [
        "GET /products",
        "POST /products",
        "GET /products/:id",
        "PUT /products/:id",
        "DELETE /products/:id",
        "GET /products/:id/analytics",
        "POST /call",
      ],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("API Marketplace Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
