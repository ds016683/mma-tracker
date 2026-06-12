import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const DATA_URL = '/mma-tracker/data/carrier-ranking.json';

interface CarrierRow {
  name: string;
  is_default: boolean;
  cb_v82: number | null;
  cb_v9: number | null;
  cb_delta: number | null;
  gy_v82: number | null;
  gy_v9: number | null;
  gy_delta: number | null;
  rank_pop_v82: number | null;
  rank_pop_v9: number | null;
  rank_pop_delta: number | null;
  rank_str_v82: number | null;
  rank_str_v9: number | null;
  rank_str_delta: number | null;
}

type SortKey = 'rank_pop_v9' | 'rank_str_v9' | 'gy_v9' | 'cb_v9';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'cb_v9',       label: '% Codebasket' },
  { key: 'gy_v9',       label: '% Green/Yellow' },
  { key: 'rank_pop_v9', label: 'Avg Rank (Pop-Weighted)' },
  { key: 'rank_str_v9', label: 'Avg Rank (Straight)' },
];

const ASCENDING_KEYS = new Set<SortKey>(['rank_pop_v9', 'rank_str_v9']);

function sortValue(row: CarrierRow, key: SortKey): number {
  const v = row[key];
  if (v === null || v === 0) return ASCENDING_KEYS.has(key) ? Infinity : -Infinity;
  return v;
}

function sortRows(rows: CarrierRow[], key: SortKey): CarrierRow[] {
  return [...rows].sort((a, b) => {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    return ASCENDING_KEYS.has(key) ? av - bv : bv - av;
  });
}

function fmt(v: number | null): string {
  if (v === null || v === undefined || v === 0) return '—';
  return v.toFixed(1);
}

function fmtPct(v: number | null): string {
  if (v === null || v === undefined || v === 0) return '—';
  return v.toFixed(1) + '%';
}

function Delta({ v, invert = false }: { v: number | null; invert?: boolean }) {
  if (v === null || v === undefined) return <span className="text-gray-400">—</span>;
  const pos = invert ? v < 0 : v > 0;
  const neg = invert ? v > 0 : v < 0;
  const abs = Math.abs(v).toFixed(2);
  if (pos) return (
    <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
      <ArrowUp className="h-3 w-3" />+{abs}
    </span>
  );
  if (neg) return (
    <span className="inline-flex items-center gap-0.5 text-red-500 font-medium">
      <ArrowDown className="h-3 w-3" />-{abs}
    </span>
  );
  return <span className="inline-flex items-center gap-0.5 text-gray-400"><Minus className="h-3 w-3" />0.00</span>;
}

function StatusBadge({ row }: { row: CarrierRow }) {
  const hasV9  = row.gy_v9  !== null && row.gy_v9  !== 0;
  const hasV82 = row.gy_v82 !== null && row.gy_v82 !== 0;
  if (!hasV82 && hasV9)  return <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700">New v9</span>;
  if (hasV82 && !hasV9)  return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">Dropped</span>;
  return null;
}

// Shared column widths — must match between both tables
const COL_WIDTHS = 'w-[40px] w-[260px] w-[72px] w-[72px] w-[60px] w-[72px] w-[72px] w-[60px] w-[72px] w-[72px] w-[60px] w-[72px] w-[72px] w-[60px]';
void COL_WIDTHS; // suppress unused warning — widths applied inline below

const colWidths = [40, 260, 72, 72, 60, 72, 72, 60, 72, 72, 60, 72, 72, 60];

function ColGroup() {
  return (
    <colgroup>
      {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
    </colgroup>
  );
}

function TableHead({ sortKey }: { sortKey: SortKey }) {
  return (
    <thead>
      <tr className="bg-[#001A41] text-white">
        <th rowSpan={2} className="border-b border-white/10 px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-white/60">#</th>
        <th rowSpan={2} className="border-b border-white/10 px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white/80">Carrier</th>
        <th colSpan={3} className={`border-b border-white/10 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider ${sortKey === 'cb_v9' ? 'text-[#009DE0]' : 'text-white/60'}`}>% Codebasket (Spend-Wtd)</th>
        <th colSpan={3} className={`border-b border-white/10 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider ${sortKey === 'gy_v9' ? 'text-[#009DE0]' : 'text-white/60'}`}>% Green / Yellow (Spend-Wtd)</th>
        <th colSpan={3} className={`border-b border-white/10 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider ${sortKey === 'rank_pop_v9' ? 'text-[#009DE0]' : 'text-white/60'}`}>Avg Rank (Pop-Weighted)</th>
        <th colSpan={3} className={`border-b border-white/10 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider ${sortKey === 'rank_str_v9' ? 'text-[#009DE0]' : 'text-white/60'}`}>Avg Rank (Straight)</th>
      </tr>
      <tr className="bg-[#001A41]/80">
        {['v8.2','v9','Δ','v8.2','v9','Δ','v8.2','v9','Δ','v8.2','v9','Δ'].map((h, i) => (
          <th key={i} className="border-b border-white/10 px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-white/50">{h}</th>
        ))}
      </tr>
    </thead>
  );
}

function DataRow({ row, rank, isDefault, sortKey }: { row: CarrierRow; rank: number; isDefault: boolean; sortKey: SortKey }) {
  return (
    <tr className={`transition-colors hover:bg-blue-50/40 ${isDefault ? 'bg-[#001A41]/[0.05]' : (rank % 2 === 1 ? 'bg-white' : 'bg-gray-50/60')}`}>
      <td className="px-3 py-2.5 text-center text-xs font-bold text-gray-400">{rank}</td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isDefault ? 'text-[#001A41]' : 'text-gray-800'}`}>{row.name}</span>
          {isDefault && <span className="rounded bg-[#009DE0]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#009DE0]">Core</span>}
          <StatusBadge row={row} />
        </div>
      </td>
      <td className="px-3 py-2.5 text-center text-sm text-gray-500">{fmtPct(row.cb_v82)}</td>
      <td className={`px-3 py-2.5 text-center text-sm font-semibold ${sortKey === 'cb_v9' ? 'text-[#009DE0]' : 'text-gray-900'}`}>{fmtPct(row.cb_v9)}</td>
      <td className="px-3 py-2.5 text-center text-xs"><Delta v={row.cb_delta} /></td>
      <td className="px-3 py-2.5 text-center text-sm text-gray-500">{fmtPct(row.gy_v82)}</td>
      <td className={`px-3 py-2.5 text-center text-sm font-semibold ${sortKey === 'gy_v9' ? 'text-[#009DE0]' : 'text-gray-900'}`}>{fmtPct(row.gy_v9)}</td>
      <td className="px-3 py-2.5 text-center text-xs"><Delta v={row.gy_delta} /></td>
      <td className="px-3 py-2.5 text-center text-sm text-gray-500">{fmt(row.rank_pop_v82)}</td>
      <td className={`px-3 py-2.5 text-center text-sm font-semibold ${sortKey === 'rank_pop_v9' ? 'text-[#009DE0]' : 'text-gray-900'}`}>{fmt(row.rank_pop_v9)}</td>
      <td className="px-3 py-2.5 text-center text-xs"><Delta v={row.rank_pop_delta} invert /></td>
      <td className="px-3 py-2.5 text-center text-sm text-gray-500">{fmt(row.rank_str_v82)}</td>
      <td className={`px-3 py-2.5 text-center text-sm font-semibold ${sortKey === 'rank_str_v9' ? 'text-[#009DE0]' : 'text-gray-900'}`}>{fmt(row.rank_str_v9)}</td>
      <td className="px-3 py-2.5 text-center text-xs"><Delta v={row.rank_str_delta} invert /></td>
    </tr>
  );
}

export function CarrierRankingView() {
  const [data, setData]       = useState<CarrierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('rank_str_v9');

  useEffect(() => {
    fetch(DATA_URL)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: CarrierRow[]) => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const defaultRows = sortRows(data.filter(r => r.is_default), sortKey);
  const otherRows   = sortRows(data.filter(r => !r.is_default), sortKey);

  return (
    <div className="flex h-screen flex-col bg-gray-50/50">

      {/* ── Fixed top block ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-0 sm:px-6 sm:pt-6">

        {/* Title */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-[#001A41]">Carrier Ranking</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            v8.2 → v9 national summary · spend-weighted metrics &amp; MSA avg rank · 104 carriers
          </p>
        </div>

        {/* Sort controls */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sort by</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-all ${
                sortKey === opt.key
                  ? 'border-[#009DE0] bg-[#009DE0] text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-[#009DE0]/50 hover:text-[#009DE0]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#009DE0]/20 ring-1 ring-[#009DE0]/40" />
            Core network — pinned to top
          </span>
          <span className="flex items-center gap-1.5">
            <span className="rounded bg-emerald-100 px-1 py-0.5 text-[9px] font-semibold uppercase text-emerald-700">New v9</span>
            Added in v9
          </span>
          <span className="flex items-center gap-1.5">
            <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold uppercase text-amber-700">Dropped</span>
            Present in v8.2, absent in v9
          </span>
          <span className="ml-auto text-gray-400 italic">
            Rank = lower is better &nbsp;·&nbsp; % = higher is better &nbsp;·&nbsp; — = not in that version
          </span>
        </div>
      </div>

      {/* ── Fixed table: header + core rows + all-carriers divider ── */}
      {!loading && !error && (
        <div className="flex-shrink-0 overflow-x-auto px-4 sm:px-6">
          <div className="rounded-t-xl border border-b-0 border-gray-200 shadow-sm">
            <table className="w-full min-w-[1000px] table-fixed border-collapse">
              <ColGroup />
              <TableHead sortKey={sortKey} />
              {/* Core Networks divider */}
              <tbody>
                <tr>
                  <td colSpan={14} className="bg-[#001A41]/[0.06] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#001A41]/50">
                    Core Networks
                  </td>
                </tr>
                {defaultRows.map((row, i) => (
                  <DataRow key={row.name} row={row} rank={i + 1} isDefault sortKey={sortKey} />
                ))}
                {/* All Carriers divider — this is the lock line */}
                <tr>
                  <td colSpan={14} className="bg-gray-100 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    All Carriers ({otherRows.length})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Scrollable all-carriers rows ── */}
      {loading && (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">Loading carrier data…</div>
      )}
      {error && (
        <div className="flex flex-1 items-center justify-center text-sm text-red-500">Failed to load: {error}</div>
      )}
      {!loading && !error && (
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto px-4 pb-6 sm:px-6">
          <div className="rounded-b-xl border border-t-0 border-gray-200 shadow-sm">
            <table className="w-full min-w-[1000px] table-fixed border-collapse">
              <ColGroup />
              <tbody>
                {otherRows.map((row, i) => (
                  <DataRow key={row.name} row={row} rank={i + 1} isDefault={false} sortKey={sortKey} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
