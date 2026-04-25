import { useEffect, useRef } from 'react';
import { fetchMondayBoard } from '../lib/monday/client';
import { supabase } from '../lib/supabase/client';

// Maps Monday group titles → baseball card categories (must match BOARD_CATEGORIES ids exactly)
const GROUP_TO_CATEGORY: Record<string, string> = {
  'Production Priorities':          'Production Priorities',
  'Data Enhancements (Schedule E)': 'Data Enhancements (Schedule E)',
  'Innovation Roadmap':             'Innovation Roadmap',
  'Completed':                      'Completed',
  'Extraneous':                     'Extraneous',
};

// Maps Monday status label → mma_status
function mapStatus(label: string): string {
  if (!label) return 'TBD';
  const l = label.toLowerCase();
  if (l.includes('done') || l.includes('complete')) return 'Done';
  if (l.includes('stuck') || l.includes('blocked')) return 'Stuck';
  if (l.includes('working') || l.includes('progress') || l.includes('in flight')) return 'Working on it';
  return label || 'TBD';
}

// Maps Monday stakes/priority → mma_priority
function mapPriority(val: string): 'High' | 'Medium' | 'Low' {
  const v = (val || '').toLowerCase();
  if (v === 'high') return 'High';
  if (v === 'low') return 'Low';
  return 'Medium';
}

// Maps mma_status → card status field
function cardStatus(mmaStatus: string): 'active' | 'completed' | 'archived' {
  if (mmaStatus === 'Done') return 'completed';
  return 'active';
}

export function useMondaySync() {
  const syncedRef = useRef(false);

  useEffect(() => {
    if (syncedRef.current) return;
    const apiKey = import.meta.env.VITE_MONDAY_API_KEY;
    if (!apiKey) return;

    syncedRef.current = true;

    (async () => {
      try {
        const items = await fetchMondayBoard();
        if (!items.length) return;

        const now = new Date().toISOString();

        const rows = items.map(item => {
          const category = GROUP_TO_CATEGORY[item.groupTitle] ?? 'production-priorities';
          const mmaStatus = mapStatus(item.status);
          return {
            // Use Monday item ID as stable UUID-like key via upsert
            id: `monday-${item.id}`,
            name: item.name,
            description: item.description || '',
            status: cardStatus(mmaStatus),
            category,
            priority: mapPriority(item.stakes).toLowerCase() as 'high' | 'medium' | 'low',
            pinned: false,
            manual_rank: null,
            last_activity_at: now,
            created_at: now,
            target_date: item.targetDate || null,
            start_date: item.startDate || null,
            end_date: item.targetDate || null,
            tags: [],
            archived_at: null,
            mma_version: '',
            mma_status: mmaStatus,
            mma_priority: mapPriority(item.stakes),
            mma_contract_ref: item.contractElement || '',
            mma_accountable: item.accountable || '',
            mma_responsible: item.responsible || '',
            mma_contributor: item.contributor || '',
            mma_informed: item.informed || '',
            mma_estimated_turn_time: '',
            mma_comments: item.comments || '',
            mma_date: item.startDate || now.slice(0, 10),
          };
        });

        const { error } = await supabase
          .from('projects')
          .upsert(rows, { onConflict: 'id', ignoreDuplicates: false });

        if (error) {
          console.error('Monday→Supabase sync error:', error.message);
        } else {
          console.log(`Monday sync: upserted ${rows.length} projects`);
        }
      } catch (err) {
        console.error('Monday sync failed:', err);
      }
    })();
  }, []);
}
