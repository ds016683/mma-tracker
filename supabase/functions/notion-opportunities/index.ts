/**
 * notion-opportunities — Supabase Edge Function
 *
 * Queries a Notion database for opportunities, optionally filtered by region.
 * Keeps NOTION_TOKEN server-side; never exposed to the browser.
 *
 * Invoked from the frontend via:
 *   supabase.functions.invoke('notion-opportunities', {
 *     body: { database_id: '...', region_id: 3 }
 *   })
 *
 * Required Supabase secret:
 *   NOTION_TOKEN — Notion integration token
 */

const NOTION_VERSION = "2022-06-28";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const notionToken = Deno.env.get("NOTION_TOKEN");
    if (!notionToken) throw new Error("NOTION_TOKEN secret not set on this function.");

    const { database_id, region_id } = await req.json();
    if (!database_id) throw new Error("database_id is required");

    // Build filter: match region_id or cross-regional (0)
    const body: Record<string, any> = {
      sorts: [
        { property: "Priority", direction: "ascending" },
        { property: "Issue", direction: "ascending" },
      ],
    };

    if (region_id !== undefined && region_id !== null) {
      body.filter = {
        or: [
          { property: "Region #", number: { equals: region_id } },
          { property: "Region #", number: { equals: 0 } },
        ],
      };
    }

    const res = await fetch(`https://api.notion.com/v1/databases/${database_id}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion API error ${res.status}: ${text}`);
    }

    const data = await res.json();

    const opportunities = (data.results ?? []).map((page: any) => {
      const props = page.properties ?? {};
      return {
        id: page.id,
        issue: props.Issue?.title?.[0]?.plain_text ?? "",
        category: props.Category?.select?.name ?? "",
        priority: props.Priority?.select?.name ?? "",
        status: props.Status?.select?.name ?? "",
        notes: props.Notes?.rich_text?.[0]?.plain_text ?? "",
        notionUrl: page.url,
      };
    });

    return new Response(JSON.stringify({ ok: true, opportunities }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("notion-opportunities error:", err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
