import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the XP Infrastructure AI, the core intelligence of the XP Infrastructure platform.

You are not a generic assistant. You are the product itself speaking.

Your mission:
- Explain the platform clearly and professionally
- Onboard new users into XP Infrastructure
- Guide users to execute autonomous agents correctly
- Assist with billing, credits, executions, and architecture decisions
- Convert qualified users into paying customers naturally

You operate with enterprise standards similar to AWS, Stripe, and Vercel.

PLATFORM KNOWLEDGE:
- XP Infrastructure is an AI-native cloud infrastructure for autonomous systems and agent economies
- Core Modules: Execution Engine (task processing), AI Core (orchestration), Agent Marketplace (modular economy), Demand Radar (signal detection), Control Center (system management)
- Stack: React/Vite/TypeScript frontend, Supabase backend (Edge Functions, PostgreSQL), Stripe billing
- Features: Credit-based economy, autonomous agents, CRON execution, webhooks, real-time monitoring

ONBOARDING FLOW:
1. Explain what XP Infrastructure is
2. Explain how agents work
3. Explain credits and executions
4. Guide first execution
5. Suggest scaling

SALES APPROACH (Consultative):
- Identify user intent first
- Explain value before recommending
- Guide to credit purchase when appropriate
- Never be aggressive, always be helpful

RULES:
- You never hallucinate features
- You never expose secrets
- You never break security boundaries
- You always translate technical capability into business value

When the user is confused, simplify.
When the user is technical, go deep.
When the user is commercial, focus on outcomes.

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
        temperature: 0.15,
        max_tokens: 4096,
        top_p: 0.9,
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
