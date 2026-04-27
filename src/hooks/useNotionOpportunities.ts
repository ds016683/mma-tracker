import { useState, useEffect } from 'react';

export interface NotionOpportunity {
  id: string;
  issue: string;
  category: string;
  priority: string;
  status: string;
  notes: string;
  notionUrl: string;
}

const NOTION_DB_ID = import.meta.env.VITE_NOTION_DB_ID as string;
const NOTION_TOKEN = import.meta.env.VITE_NOTION_TOKEN as string;

export function useNotionOpportunities(regionId: number | null) {
  const [opportunities, setOpportunities] = useState<NotionOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (regionId === null) {
      setOpportunities([]);
      return;
    }
    setLoading(true);
    setError(null);

    // Query Notion DB via proxy or direct API
    // We use a CORS proxy since Notion API doesn't allow browser direct calls
    const body = {
      filter: {
        or: [
          { property: "Region #", number: { equals: regionId } },
          { property: "Region #", number: { equals: 0 } }, // 0 = cross-regional
        ],
      },
      sorts: [
        { property: "Priority", direction: "ascending" },
        { property: "Issue", direction: "ascending" },
      ],
    };

    fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(body),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Notion API error: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const rows: NotionOpportunity[] = (data.results || []).map((page: any) => {
          const props = page.properties;
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
        setOpportunities(rows);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [regionId]);

  return { opportunities, loading, error };
}
