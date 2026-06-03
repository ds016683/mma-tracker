/**
 * notion-project-sync — Supabase Edge Function
 *
 * Queries the MMA Tracker Notion project-plan database and upserts all
 * rows (projects + child tasks) into the Supabase `projects` /
 * `project_tasks` tables.
 *
 * Triggered by the frontend via:
 *   supabase.functions.invoke('notion-project-sync')
 *
 * Required Supabase secrets (set via CLI or dashboard):
 *   NOTION_TOKEN   — Notion integration token
 *
 * The function always has access to SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * automatically from the Supabase runtime.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NOTION_PROJECT_DB_ID = "34f750fa-613d-811d-9455-c9d4916b8483";
const NOTION_VERSION = "2022-06-28";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function notionQueryAll(dbId: string, token: string): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined;

  while (true) {
    const body: Record<string, any> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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
    results.push(...(data.results ?? []));
    if (!data.has_more) break;
    cursor = data.next_cursor;
  }

  return results;
}

async function notionGetChildBlocks(pageId: string, token: string): Promise<any[]> {
  const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

// ---------------------------------------------------------------------------
// Property extractors — defensive, never throw
// ---------------------------------------------------------------------------

function getTitle(props: any, key: string): string {
  try { return props[key]?.title?.[0]?.plain_text ?? ""; } catch { return ""; }
}

function getRichText(props: any, key: string): string {
  try { return props[key]?.rich_text?.[0]?.plain_text ?? ""; } catch { return ""; }
}

function getSelect(props: any, key: string): string {
  try { return props[key]?.select?.name ?? ""; } catch { return ""; }
}

function getDate(props: any, key: string): string | null {
  try { return props[key]?.date?.start ?? null; } catch { return null; }
}

function getPeople(props: any, key: string): string {
  try {
    const people = props[key]?.people ?? [];
    return people.map((p: any) => p.name ?? "").filter(Boolean).join(", ");
  } catch { return ""; }
}

// Some fields may be either a person or rich_text depending on DB setup
function getPersonOrText(props: any, key: string): string {
  const person = getPeople(props, key);
  if (person) return person;
  return getRichText(props, key);
}

// ---------------------------------------------------------------------------
// Map a Notion page → projects row
// ---------------------------------------------------------------------------

function mapProject(page: any): Record<string, any> {
  const p = page.properties ?? {};

  // Category from Notion → we use as-is for the dashboard category grouping
  const category = getSelect(p, "Category");

  // Status: Notion "Status" select → mma_status; also drives `status` col
  const mmaStat = getSelect(p, "Status") || getSelect(p, "MMA Status") || "TBD";
  // Map to allowed `status` enum: active | pencils_down | on_hold | archived
  const statusMap: Record<string, string> = {
    "Completed": "pencils_down",
    "On Hold": "on_hold",
    "Archived": "archived",
    "Active": "active",
    "In Progress": "active",
    "Not Started": "active",
  };
  const status = statusMap[mmaStat] ?? "active";

  const priority = (getSelect(p, "Priority") || getSelect(p, "MMA Priority") || "medium").toLowerCase();
  const allowedPriority = ["low", "medium", "high", "urgent"].includes(priority) ? priority : "medium";

  // Parent item relation — first related page ID, if any
  const parentRelations = p["Parent item"]?.relation ?? [];
  const parentId = parentRelations.length > 0 ? parentRelations[0].id : null;

  return {
    id: page.id,
    parent_id: parentId,
    name: getTitle(p, "Project") || getTitle(p, "Name") || getTitle(p, "Title") || "(untitled)",
    description: getRichText(p, "Description") || getRichText(p, "Notes") || "",
    status,
    category,
    priority: allowedPriority,
    start_date: getDate(p, "Start Date") || getDate(p, "Start"),
    target_date: getDate(p, "Target Completion Date") || getDate(p, "Target Date") || getDate(p, "Target") || getDate(p, "End Date"),
    end_date: getDate(p, "End Date") || getDate(p, "Target Completion Date") || getDate(p, "Target Date") || getDate(p, "Target"),
    mma_status: mmaStat,
    mma_priority: getSelect(p, "Priority") || getSelect(p, "MMA Priority") || "Medium",
    mma_contract_ref: getSelect(p, "Contract Ref") || getRichText(p, "Contract Ref") || "",
    mma_accountable: getPersonOrText(p, "Accountable"),
    mma_responsible: getPersonOrText(p, "Responsible"),
    mma_contributor: getPersonOrText(p, "Contributor") || getPersonOrText(p, "Contributors") || "",
    mma_informed: getPersonOrText(p, "Informed") || "",
    mma_comments: getRichText(p, "Comments") || getRichText(p, "Notes") || "",
    mma_version: getRichText(p, "Version") || getSelect(p, "Version") || "",
    mma_date: getDate(p, "Date") || "",
    last_activity_at: page.last_edited_time ?? new Date().toISOString(),
    // preserve existing manual_rank and pinned — don't overwrite on sync
    // (omit them so Supabase upsert merge keeps existing values)
  };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const t0 = Date.now();

  try {
    // ── Optional: push comment edits FROM the frontend TO Notion first ──────
    let commentsPushed = 0;
    let bodyPayload: any = null;
    try {
      const contentType = req.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        bodyPayload = await req.json();
      }
    } catch { /* no body — that's fine */ }

    const commentUpdates: Array<{ pageId: string; comments: string }> =
      bodyPayload?.commentUpdates ?? [];

    if (commentUpdates.length > 0) {
      const notionTokenEarly = Deno.env.get("NOTION_TOKEN");
      if (notionTokenEarly) {
        await Promise.allSettled(
          commentUpdates.map(({ pageId, comments }) =>
            fetch(`https://api.notion.com/v1/pages/${pageId}`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${notionTokenEarly}`,
                "Content-Type": "application/json",
                "Notion-Version": NOTION_VERSION,
              },
              body: JSON.stringify({
                properties: {
                  Comments: {
                    rich_text: comments
                      ? [{ type: "text", text: { content: comments } }]
                      : [],
                  },
                },
              }),
            })
          )
        );
        commentsPushed = commentUpdates.length;
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    const notionToken = Deno.env.get("NOTION_TOKEN");
    if (!notionToken) throw new Error("NOTION_TOKEN secret not set on this function.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey);

    // 1. Pull all pages from Notion project-plan DB
    const pages = await notionQueryAll(NOTION_PROJECT_DB_ID, notionToken);

    // 2. Build rank map so dashboard order = Notion order exactly.
    //    - Top-level items: their position in the API response (* 1000 for spacing)
    //    - Sub-items: rank derived from their position in the parent's Sub-item
    //      relation array, which is the authoritative Notion-ordered list.
    const rankMap = new Map<string, number>();

    // First pass: assign top-level ranks
    let topLevelRank = 0;
    for (const page of pages) {
      const parentRels = page.properties["Parent item"]?.relation ?? [];
      if (parentRels.length === 0) {
        rankMap.set(page.id, topLevelRank * 1000);
        topLevelRank++;
      }
    }

    // Second pass: assign sub-item ranks from each parent's Sub-item array
    for (const page of pages) {
      const subItemRels: Array<{ id: string }> = page.properties["Sub-item"]?.relation ?? [];
      if (subItemRels.length > 0) {
        const parentRank = rankMap.get(page.id) ?? 0;
        subItemRels.forEach((rel, idx) => {
          rankMap.set(rel.id, parentRank + idx + 1);
        });
      }
    }

    // 3. Map → project rows, injecting manual_rank from rankMap
    const projectRows = pages.map((page) => ({
      ...mapProject(page),
      manual_rank: rankMap.get(page.id) ?? 99999,
    }));

    // 4. Upsert projects
    const { error: projErr } = await db
      .from("projects")
      .upsert(projectRows, { onConflict: "id", ignoreDuplicates: false });

    if (projErr) throw new Error(`projects upsert: ${projErr.message}`);

    // 5. Delete orphaned projects — rows in Supabase whose ID is no longer in Notion.
    //    Fetch existing IDs, diff against current Notion set, delete the delta.
    const notionIdSet = new Set(projectRows.map((p) => p.id));
    const { data: existingRows } = await db.from("projects").select("id");
    const orphanIds = (existingRows ?? [])
      .map((r: any) => r.id)
      .filter((id: string) => !notionIdSet.has(id));

    if (orphanIds.length > 0) {
      const { error: delErr } = await db
        .from("projects")
        .delete()
        .in("id", orphanIds);
      if (delErr) console.error("orphan delete error:", delErr.message);
    }

    // 4. For each page, fetch child blocks as tasks
    const taskRows: Record<string, any>[] = [];

    await Promise.allSettled(
      pages.map(async (page) => {
        const blocks = await notionGetChildBlocks(page.id, notionToken);
        for (const block of blocks) {
          // We treat to_do, bulleted_list_item, and child_page blocks as tasks
          const blockType = block.type;
          let text = "";
          let done = false;

          if (blockType === "to_do") {
            text = block.to_do?.rich_text?.[0]?.plain_text ?? "";
            done = block.to_do?.checked ?? false;
          } else if (blockType === "bulleted_list_item") {
            text = block.bulleted_list_item?.rich_text?.[0]?.plain_text ?? "";
          } else if (blockType === "numbered_list_item") {
            text = block.numbered_list_item?.rich_text?.[0]?.plain_text ?? "";
          } else if (blockType === "child_page") {
            text = block.child_page?.title ?? "";
          } else {
            // skip other block types (headings, dividers, etc.)
            return;
          }

          if (!text.trim()) return;

          taskRows.push({
            id: block.id,
            project_id: page.id,
            text,
            task_name: text,
            description: "",
            assigned_to: "",
            done,
          });
        }
      })
    );

    if (taskRows.length > 0) {
      // Delete existing tasks for these projects then re-insert
      // (cleaner than upsert for child blocks which can be reordered/deleted)
      const projectIds = [...new Set(taskRows.map((t) => t.project_id))];
      await db.from("project_tasks").delete().in("project_id", projectIds);

      const { error: taskErr } = await db.from("project_tasks").insert(taskRows);
      if (taskErr) {
        // Non-fatal: log and continue
        console.error("project_tasks insert error:", taskErr.message);
      }
    }

    const elapsed = Date.now() - t0;

    return new Response(
      JSON.stringify({
        ok: true,
        synced_projects: projectRows.length,
        synced_tasks: taskRows.length,
        comments_pushed: commentsPushed,
        elapsed_ms: elapsed,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err: any) {
    console.error("notion-project-sync error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
