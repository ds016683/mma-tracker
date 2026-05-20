/**
 * monday-sync — Supabase Edge Function
 *
 * Proxies Monday.com GraphQL API calls. MONDAY_API_KEY stays server-side;
 * never exposed to the browser.
 *
 * Invoked from the frontend via:
 *   supabase.functions.invoke('monday-sync', {
 *     body: { query: '...', variables: {} }
 *   })
 *
 * Required Supabase secret:
 *   MONDAY_API_KEY — Monday.com API key
 */

const MONDAY_API_URL = "https://api.monday.com/v2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get("MONDAY_API_KEY");
    if (!apiKey) throw new Error("MONDAY_API_KEY secret not set on this function.");

    const { query, variables } = await req.json();
    if (!query) throw new Error("query is required");

    const res = await fetch(MONDAY_API_URL, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
        "API-Version": "2024-01",
      },
      body: JSON.stringify({ query, variables: variables ?? {} }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Monday API error ${res.status}: ${text}`);
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("monday-sync error:", err);
    return new Response(JSON.stringify({ errors: [{ message: err.message }] }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
