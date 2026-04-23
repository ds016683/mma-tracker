// Monday.com API client for MMA Tracker
// Board ID: 18409785203

const MONDAY_API_URL = 'https://api.monday.com/v2';
const BOARD_ID = '18409785203';

// Column ID map (canonical order set 2026-04-23)
export const MONDAY_COLS = {
  name:            'name',
  accountable:     'text_mm2pfpcj',
  responsible:     'text_mm2pdjpd',  // text version (not people col)
  startDate:       'date_mm2pfvqb',
  targetDate:      'date4',
  description:     'long_text_mm2p3103',
  status:          'status',
  stakes:          'text_mm2p3ea4',
  contributor:     'text_mm2pza0c',
  informed:        'text_mm2p5e89',
  contractElement: 'text_mm2ppz9v',
  comments:        'text_mm2pxwcn',
};

export const GROUP_ORDER = [
  { id: 'group_title',      label: 'Production Priorities' },
  { id: 'group_mm2padc3',   label: 'Data Enhancements (Schedule E)' },
  { id: 'group_mm2pm585',   label: 'Innovation Roadmap' },
  { id: 'group_mm2pgtvh',   label: 'Completed' },
  { id: 'group_mm2pm9jn',   label: 'Extraneous' },
];

export interface MondaySubitem {
  id: string;
  name: string;
  responsible: string;
  startDate: string;
  endDate: string;
  description: string;
  status: string;
}

export interface MondayItem {
  id: string;
  name: string;
  groupId: string;
  groupTitle: string;
  accountable: string;
  responsible: string;
  startDate: string;
  targetDate: string;
  description: string;
  status: string;
  stakes: string;
  contributor: string;
  informed: string;
  contractElement: string;
  comments: string;
  subitems: MondaySubitem[];
}

function getColText(columnValues: { id: string; text: string }[], colId: string): string {
  return columnValues.find(cv => cv.id === colId)?.text ?? '';
}

export async function fetchMondayBoard(): Promise<MondayItem[]> {
  // We call our Supabase edge function proxy to avoid CORS + keep API key server-side
  // For now, use the direct API with the key embedded (client-side, acceptable for private app)
  const apiKey = import.meta.env.VITE_MONDAY_API_KEY;
  if (!apiKey) {
    console.warn('VITE_MONDAY_API_KEY not set — Monday sync disabled');
    return [];
  }

  const query = `{
    boards(ids: [${BOARD_ID}]) {
      groups { id title }
      items_page(limit: 100) {
        items {
          id name
          group { id title }
          column_values { id text }
          subitems {
            id name
            column_values { id text }
          }
        }
      }
    }
  }`;

  const res = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
      'API-Version': '2024-01',
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`Monday API error: ${res.status}`);
  const data = await res.json();

  if (data.errors) {
    console.error('Monday GraphQL errors:', data.errors);
    return [];
  }

  const board = data.data.boards[0];
  const items: MondayItem[] = board.items_page.items.map((item: {
    id: string; name: string;
    group: { id: string; title: string };
    column_values: { id: string; text: string }[];
    subitems: { id: string; name: string; column_values: { id: string; text: string }[] }[];
  }) => {
    const cv = item.column_values;
    const subitems: MondaySubitem[] = (item.subitems ?? []).map(sub => ({
      id: sub.id,
      name: sub.name,
      responsible:  sub.column_values.find(c => c.id === 'text_mm2p3yp')?.text ?? '',
      startDate:    sub.column_values.find(c => c.id === 'date_mm2pn9z9')?.text ?? '',
      endDate:      sub.column_values.find(c => c.id === 'date4')?.text ?? '',
      description:  sub.column_values.find(c => c.id === 'text_mm2pxh7m')?.text ?? '',
      status:       sub.column_values.find(c => c.id === 'status')?.text ?? '',
    }));

    return {
      id:              item.id,
      name:            item.name,
      groupId:         item.group.id,
      groupTitle:      item.group.title,
      accountable:     getColText(cv, MONDAY_COLS.accountable),
      responsible:     getColText(cv, MONDAY_COLS.responsible),
      startDate:       getColText(cv, MONDAY_COLS.startDate),
      targetDate:      getColText(cv, MONDAY_COLS.targetDate),
      description:     getColText(cv, MONDAY_COLS.description),
      status:          getColText(cv, MONDAY_COLS.status),
      stakes:          getColText(cv, MONDAY_COLS.stakes),
      contributor:     getColText(cv, MONDAY_COLS.contributor),
      informed:        getColText(cv, MONDAY_COLS.informed),
      contractElement: getColText(cv, MONDAY_COLS.contractElement),
      comments:        getColText(cv, MONDAY_COLS.comments),
      subitems,
    };
  });

  return items;
}
