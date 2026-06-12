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
  { key: 'rank_pop_v9',  label: 'Avg Rank (Pop-Weighted)' },
  { key: 'rank_str_v9',  label: 'Avg Rank (Straight)' },
  { key: 'gy_v9',        label: '% Green/Yellow' },
  { key: 'cb_v9',        label: '% Codebasket' },
];

// Lower rank = better; higher % = better
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

function fmt(v: number | null, decimals = 1): string {
  if (v === null || v === undefined) return '—';
  if (v === 0) return '—';
  return v.toFixed(decimals);
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
  const hasV9  = row.gy_v9 !== null && row.gy_v9 !== 0;
  const hasV82 = row.gy_v82 !== null && row.gy_v82 !== 0;
  if (!hasV82 && hasV9)  return <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700">New v9</span>;
  if (hasV82 && !hasV9)  return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">Dropped</span>;
  return null;
}

function CarrierTable({
  rows,
  sortKey,
  startRank,
  isDefault,
}: {
  rows: CarrierRow[];
  sortKey: SortKey;
  startRank: number;
  isDefault: boolean;
}) {
  return (
    <>
      {rows.map((row, i) => {
        const rank = startRank + i;
        const stripe = i % 2 === 0;
        return (
          <tr
            key={row.name}
            className={`transition-colors hover:bg-blue-50/40 ${
              isDefault
                ? stripe ? 'bg-[#001A41]/[0.04]' : 'bg-[#001A41]/[0.07]'
                : stripe ? 'bg-white' : 'bg-gray-50/60'
            }`}
          >
            <td className="w-8 px-3 py-2.5 text-center text-xs font-bold text-gray-400">{rank}</td>
            <td className="px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isDefault ? 'text-[#001A41]' : 'text-gray-800'}`}>
                  {row.name}
                </span>
                {isDefault && (
                  <span className="rounded bg-[#009DE0]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#009DE0]">
                    Core
                  </span>
                )}
                <StatusBadge row={row} />
              </div>
            </td>
            {/* % Codebasket */}
            <td className="px-3 py-2.5 text-center text-sm text-gray-700">{fmtPct(row.cb_v82)}</td>
            <td className="px-3 py-2.5 text-center text-sm font-semibold text-gray-900">{fmtPct(row.cb_v9)}</td>
            <td className="px-3 py-2.5 text-center text-xs"><Delta v={row.cb_delta} /></td>
            {/* % Green/Yellow */}
            <td className="px-3 py-2.5 text-center text-sm text-gray-700">{fmtPct(row.gy_v82)}</td>
            <td className="px-3 py-2.5 text-center text-sm font-semibold text-gray-900">{fmtPct(row.gy_v9)}</td>
            <td className="px-3 py-2.5 text-center text-xs"><Delta v={row.gy_delta} /></td>
            {/* Pop-Weighted Rank */}
            <td className="px-3 py-2.5 text-center text-sm text-gray-700">{fmt(row.rank_pop_v82)}</td>
            <td className={`px-3 py-2.5 text-center text-sm font-semibold ${sortKey === 'rank_pop_v9' ? 'text-[#009DE0]' : 'text-gray-900'}`}>{fmt(row.rank_pop_v9)}</td>
            <td className="px-3 py-2.5 text-center text-xs"><Delta v={row.rank_pop_delta} invert /></td>
            {/* Straight Avg Rank */}
            <td className="px-3 py-2.5 text-center text-sm text-gray-700">{fmt(row.rank_str_v82)}</td>
            <td className={`px-3 py-2.5 text-center text-sm font-semibold ${sortKey === 'rank_str_v9' ? 'text-[#009DE0]' : 'text-gray-900'}`}>{fmt(row.rank_str_v9)}</td>
            <td className="px-3 py-2.5 text-center text-xs"><Delta v={row.rank_str_delta} invert /></td>
          </tr>
        );
      })}
    </>
  );
}

export function CarrierRankingView() {
  const [data, setData] = useState<CarrierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('rank_pop_v9');

  useEffect(() => {
    fetch(DATA_URL)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: CarrierRow[]) => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const defaultRows = sortRows(data.filter(r => r.is_default), sortKey);
  const otherRows   = sortRows(data.filter(r => !r.is_default), sortKey);

  const SortBtn = ({ opt }: { opt: typeof SORT_OPTIONS[number] }) => (
    <button
      onClick={() => setSortKey(opt.key)}
      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-all ${
        sortKey === opt.key
          ? 'border-[#009DE0] bg-[#009DE0] text-white shadow-sm'
          : 'border-gray-200 bg-white text-gray-600 hover:border-[#009DE0]/50 hover:text-[#009DE0]'
      }`}
    >
      {opt.label}
    </button>
  );

  const HeaderCell = ({ label, subKey, span = 3 }: { label: string; subKey?: SortKey; span?: number }) => (
    <th
      colSpan={span}
      className={`border-b border-gray-200 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider ${
        subKey && sortKey === subKey ? 'text-[#009DE0]' : 'text-gray-500'
      }`}
    >
      {label}
    </th>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#001A41]">Carrier Ranking</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          v8.2 → v9 national summary · spend-weighted metrics &amp; MSA avg rank · 104 carriers
        </p>
      </div>

      {/* Sort controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sort by</span>
        {SORT_OPTIONS.map(opt => <SortBtn key={opt.key} opt={opt} />)}
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#009DE0]/20 ring-1 ring-[#009DE0]/40" />
          Core network (4 default MMA carriers — pinned to top)
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
          Rank = lower is better &nbsp;·&nbsp; % = higher is better &nbsp;·&nbsp; — = not present in that version
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading carrier data…</div>
      )}
      {error && (
        <div className="flex items-center justify-center py-20 text-sm text-red-500">Failed to load: {error}</div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead className="bg-[#001A41] text-white">
              <tr>
                <th rowSpan={2} className="w-8 border-b border-white/10 px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-white/60">#</th>
                <th rowSpan={2} className="border-b border-white/10 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/80">Carrier</th>
                <HeaderCell label="% Codebasket (Spend-Wtd)" subKey="cb_v9" />
                <HeaderCell label="% Green / Yellow (Spend-Wtd)" subKey="gy_v9" />
                <HeaderCell label="Avg Rank (Pop-Weighted)" subKey="rank_pop_v9" />
                <HeaderCell label="Avg Rank (Straight)" subKey="rank_str_v9" />
              </tr>
              <tr className="bg-[#001A41]/80">
                {['v8.2', 'v9', 'Δ', 'v8.2', 'v9', 'Δ', 'v8.2', 'v9', 'Δ', 'v8.2', 'v9', 'Δ'].map((h, i) => (
                  <th key={i} className="border-b border-white/10 px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Divider: Core Networks */}
              <tr>
                <td colSpan={15} className="bg-[#001A41]/[0.06] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#001A41]/50">
                  Core Networks
                </td>
              </tr>
              <CarrierTable rows={defaultRows} sortKey={sortKey} startRank={1} isDefault />

              {/* Divider: All Carriers */}
              <tr>
                <td colSpan={15} className="bg-gray-100 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  All Carriers ({otherRows.length})
                </td>
              </tr>
              <CarrierTable rows={otherRows} sortKey={sortKey} startRank={1} isDefault={false} />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
