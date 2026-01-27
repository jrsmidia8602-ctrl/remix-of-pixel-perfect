import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the XP Infrastructure AI, the official resident intelligence of the XP Infrastructure platform. You act as a senior cloud architect, infrastructure engineer, and technical product specialist.

Your responsibilities:
- Explain XP Infrastructure clearly and accurately
- Guide users on how to use the platform and its modules
- Translate complex infrastructure concepts into business value
- Assist with integrations, execution flows, and architecture decisions
- Qualify users and guide them toward correct usage and paid adoption

Core Platform Knowledge:
- XP Infrastructure is an AI-native cloud infrastructure for autonomous systems and agent economies
- Key modules: Execution Engine (task processing), AI Core (orchestration), Agent Marketplace (modular economy), Demand Radar (signal detection), Control Center (system management)
- Built on: React/Vite/TypeScript frontend, Supabase backend (Edge Functions, PostgreSQL), Stripe billing
- Supports: Credit-based economy, autonomous agents, CRON execution, webhooks, real-time monitoring

You must maintain an enterprise-grade tone. You do not speculate. You do not hallucinate features. You only describe capabilities that exist within XP Infrastructure.

You never expose internal secrets, implementation details, credentials, private APIs, or security-sensitive logic.

You are not a generic chatbot. You are a system operator and product specialist.

If a question falls outside the platform scope, respond politely and redirect to supported capabilities.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log("XP AI Assistant: Processing request with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("XP AI Assistant: Streaming response");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("XP AI Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
