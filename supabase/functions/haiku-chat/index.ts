/**
 * haiku-chat — Supabase Edge Function
 *
 * Proxies Claude Haiku (claude-haiku-4-5) calls. ANTHROPIC_API_KEY stays
 * server-side; never exposed to the browser.
 *
 * Invoked from the frontend via:
 *   supabase.functions.invoke('haiku-chat', {
 *     body: { messages: [...], projectContext: '...' }
 *   })
 *
 * Required Supabase secret:
 *   ANTHROPIC_API_KEY — Anthropic API key
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 1024;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY secret not set on this function.");

    const { messages, projectContext, systemPrompt } = await req.json();
    if (!messages || !Array.isArray(messages)) throw new Error("messages array is required");

    // Build system prompt: optional caller-supplied prefix + project context
    const system = [
      systemPrompt ?? "",
      projectContext ? `\n\n${projectContext}` : "",
    ].filter(Boolean).join("").trim();

    const body: Record<string, any> = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages,
    };
    if (system) body.system = system;

    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message ?? `Anthropic API error ${res.status}`);
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("haiku-chat error:", err);
    return new Response(
      JSON.stringify({ error: { message: err.message } }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
