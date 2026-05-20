import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';

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

    supabase.functions
      .invoke('notion-opportunities', {
        body: { database_id: NOTION_DB_ID, region_id: regionId },
      })
      .then(({ data, error: fnError }) => {
        if (fnError) throw new Error(fnError.message);
        if (!data?.ok) throw new Error(data?.error ?? 'Unknown error from notion-opportunities');
        setOpportunities(data.opportunities ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [regionId]);

  return { opportunities, loading, error };
}
