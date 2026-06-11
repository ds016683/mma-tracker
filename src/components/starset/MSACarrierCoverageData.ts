export type BucketKey = 'TOTAL' | 'IP' | 'OP' | 'PROF';

export const BUCKET_LABELS: Record<BucketKey, string> = {
  TOTAL: 'Total',
  IP:    'Inpatient',
  OP:    'Outpatient',
  PROF:  'Professional',
};

export const BUCKET_ORDER: BucketKey[] = ['TOTAL', 'IP', 'OP', 'PROF'];

export const NATIONAL_CARRIERS = [
  'Aetna Choice POS',
  'Aetna Open Choice PPO',
  'BCBS PPO',
  'Cigna OAP',
  'Cigna PPO',
  'Cigna LocalPlus',
  'UHC PPO',
  'UHC Choice POS Plus',
  'UHC POS',
];

export interface CCRow {
  msa_id: string;
  msa_name: string;
  carrier: string;
  bucket: BucketKey;
  state: string;
  seg_pop: number | null;
  total_pop: number;
  ooa: boolean;              // out-of-area flag
  gy9:  number | null;       // % green/yellow v9
  gy8:  number | null;       // % green/yellow v8_2
  gyd:  number | null;       // delta
  cb9:  number | null;       // % codebasket v9
  cb8:  number | null;       // % codebasket v8_2
  cbd:  number | null;       // delta
  rate9: number | null;      // total weighted rate v9
  rank9: number | null;      // carrier rank in MSA (TOTAL only)
}

function pn(s: string): number | null {
  if (!s || s.trim() === '') return null;
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
}

export function parseCSV(text: string): CCRow[] {
  const lines = text.split('\n');
  if (lines.length < 2) return [];
  const rows: CCRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Simple CSV split respecting quoted fields
    const cols: string[] = [];
    let cur = '';
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cols.push(cur); cur = ''; continue; }
      cur += ch;
    }
    cols.push(cur);
    if (cols.length < 16) continue;
    rows.push({
      msa_id:   cols[0],
      msa_name: cols[1],
      carrier:  cols[2],
      bucket:   cols[3] as BucketKey,
      state:    cols[4],
      seg_pop:  pn(cols[5]),
      total_pop: pn(cols[6]) ?? 0,
      ooa:      cols[7] === '1',
      gy9:  pn(cols[8]),
      gy8:  pn(cols[9]),
      gyd:  pn(cols[10]),
      cb9:  pn(cols[11]),
      cb8:  pn(cols[12]),
      cbd:  pn(cols[13]),
      rate9: pn(cols[14]),
      rank9: pn(cols[15]),
    });
  }
  return rows;
}

// Color classes based on G/Y value
export function gyColorClasses(gy: number | null, ooa: boolean): string {
  if (ooa)       return 'bg-gray-50 border-gray-300 text-gray-500';
  if (gy === null) return 'bg-white border-gray-200 text-gray-400';
  if (gy >= 75)  return 'bg-emerald-50 border-emerald-200 text-emerald-900';
  if (gy >= 60)  return 'bg-green-50 border-green-200 text-green-900';
  if (gy >= 45)  return 'bg-yellow-50 border-yellow-300 text-yellow-900';
  if (gy >= 30)  return 'bg-orange-50 border-orange-300 text-orange-900';
  return 'bg-red-50 border-red-300 text-red-900';
}

export function deltaColor(d: number | null): string {
  if (d === null) return 'text-gray-400';
  if (d > 0.5)   return 'text-emerald-600';
  if (d < -0.5)  return 'text-red-600';
  return 'text-gray-500';
}

export function fmtPct(v: number | null): string {
  if (v === null) return '—';
  return v.toFixed(1) + '%';
}

export function fmtDelta(d: number | null): string {
  if (d === null) return '';
  const abs = Math.abs(d).toFixed(1);
  return (d > 0 ? '+' : d < 0 ? '−' : '') + abs;
}
