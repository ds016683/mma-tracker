import { useEffect, useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus, ChevronDown, ChevronRight, Search } from 'lucide-react';

const DATA_URL = '/mma-tracker/data/buca-ranking.json';

// ── Types ────────────────────────────────────────────────────────────────────
interface SummaryRow {
  name: string;
  short_name: string;
  rank_str_v82: number | null;
  rank_str_v9:  number | null;
  rank_str_delta: number | null;
  rank_pop_v82: number | null;
  rank_pop_v9:  number | null;
  rank_pop_delta: number | null;
  msas_v82: number | null;
  msas_v9:  number | null;
}

interface DetailRow {
  msa_id: number;
  msa_name: string;
  population: number | null;
  rate_aetna: number | null;
  rate_bcbs:  number | null;
  rate_cigna: number | null;
  rate_uhc:   number | null;
  all_rank_aetna: number | null;
  all_rank_bcbs:  number | null;
  all_rank_cigna: number | null;
  all_rank_uhc:   number | null;
  buca_rank_aetna: number | null;
  buca_rank_bcbs:  number | null;
  buca_rank_cigna: number | null;
  buca_rank_uhc:   number | null;
}

type MetricKey = 'str' | 'pop';
type DetailSort = 'msa_name' | 'population' | 'buca_rank_aetna' | 'buca_rank_bcbs' | 'buca_rank_cigna' | 'buca_rank_uhc';

// ── Carrier style config ─────────────────────────────────────────────────────
const CARRIER_STYLE: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  'Aetna Choice POS':    { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   badge: 'bg-rose-100 text-rose-700' },
  'BCBS PPO':            { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700' },
  'Cigna OAP':           { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  'UHC Choice POS Plus': { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   badge: 'bg-teal-100 text-teal-700' },
};

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉', 4: '4th' };

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt2(v: number | null): string {
  if (v === null) return '—';
  return v.toFixed(2);
}
function fmtPop(v: number | null): string {
  if (v === null) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}
function DeltaBadge({ v, invert = true }: { v: number | null; invert?: boolean }) {
  if (v === null) return <span className="text-gray-400 text-xs">—</span>;
  // For rank: lower is better, so negative delta = improvement (green)
  const improved = invert ? v < 0 : v > 0;
  const worsened = invert ? v > 0 : v < 0;
  const abs = Math.abs(v).toFixed(2);
  if (improved) return (
    <span className="inline-flex items-center gap-0.5 text-emerald-600 text-xs font-semibold">
      <ArrowDown className="h-3 w-3" />−{abs}
    </span>
  );
  if (worsened) return (
    <span className="inline-flex items-center gap-0.5 text-red-500 text-xs font-semibold">
      <ArrowUp className="h-3 w-3" />+{abs}
    </span>
  );
  return <span className="inline-flex items-center gap-0.5 text-gray-400 text-xs"><Minus className="h-3 w-3" />0.00</span>;
}

// ── Rank pill: 1-4 within MSA detail ─────────────────────────────────────────
function RankPill({ v }: { v: number | null }) {
  if (v === null || v === 0) return <span className="text-gray-300 text-xs">—</span>;
  const colors = ['', 'bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${colors[v] ?? 'bg-gray-100 text-gray-500'}`}>
      {v}
    </span>
  );
}

// ── Summary ranking card ─────────────────────────────────────────────────────
function RankCard({ row, position, metric }: { row: SummaryRow; position: number; metric: MetricKey }) {
  const v82    = metric === 'str' ? row.rank_str_v82  : row.rank_pop_v82;
  const v9     = metric === 'str' ? row.rank_str_v9   : row.rank_pop_v9;
  const delta  = metric === 'str' ? row.rank_str_delta : row.rank_pop_delta;
  const style  = CARRIER_STYLE[row.name] ?? { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' };
  const medal  = RANK_MEDAL[position];

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 ${style.border} ${style.bg} p-5 shadow-sm transition-shadow hover:shadow-md`}>
      {/* Position medal */}
      <div className="absolute right-4 top-4 text-2xl leading-none opacity-70">{medal}</div>

      {/* Carrier name */}
      <div className="mb-4 pr-10">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${style.badge}`}>
          {row.short_name}
        </span>
        <p className={`mt-1 text-[13px] font-semibold ${style.text}`}>{row.name}</p>
      </div>

      {/* Main metric */}
      <div className="flex items-end gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">v9 Rank</p>
          <p className={`text-3xl font-extrabold leading-none ${style.text}`}>{fmt2(v9)}</p>
        </div>
        <div className="mb-0.5">
          <DeltaBadge v={delta} />
        </div>
      </div>

      {/* v8.2 comparison */}
      <p className="mt-2 text-xs text-gray-400">v8.2: <span className="font-semibold text-gray-600">{fmt2(v82)}</span></p>


    </div>
  );
}

// ── Main view ────────────────────────────────────────────────────────────────
export function CoreBucaCarrierRankingView() {
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [detail,  setDetail]  = useState<DetailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [metric,  setMetric]  = useState<MetricKey>('str');
  const [showDetail, setShowDetail] = useState(false);
  const [search,  setSearch]  = useState('');
  const [detailSort, setDetailSort] = useState<DetailSort>('buca_rank_aetna');
  const [detailSortDir, setDetailSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetch(DATA_URL)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setSummary(d.summary); setDetail(d.detail); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // Sort summary cards by v9 rank for chosen metric (lower = better = rank 1)
  const rankedSummary = useMemo(() => {
    const key = metric === 'str' ? 'rank_str_v9' : 'rank_pop_v9';
    return [...summary].sort((a, b) => {
      const av = a[key] ?? Infinity;
      const bv = b[key] ?? Infinity;
      return av - bv;
    });
  }, [summary, metric]);

  // Filtered + sorted detail
  const filteredDetail = useMemo(() => {
    let rows = detail;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.msa_name.toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      const av = (a[detailSort] as number | null) ?? (detailSortDir === 'asc' ? Infinity : -Infinity);
      const bv = (b[detailSort] as number | null) ?? (detailSortDir === 'asc' ? Infinity : -Infinity);
      return detailSortDir === 'asc' ? av - bv : bv - av;
    });
  }, [detail, search, detailSort, detailSortDir]);

  const handleDetailSort = (col: DetailSort) => {
    if (detailSort === col) {
      setDetailSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setDetailSort(col);
      setDetailSortDir('asc');
    }
  };

  const SortTh = ({ col, label }: { col: DetailSort; label: string }) => (
    <th
      onClick={() => handleDetailSort(col)}
      className="cursor-pointer select-none border-b border-white/10 px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-white"
    >
      <span className="inline-flex items-center gap-1 justify-center">
        {label}
        {detailSort === col
          ? detailSortDir === 'asc'
            ? <ArrowUp className="h-3 w-3 text-[#009DE0]" />
            : <ArrowDown className="h-3 w-3 text-[#009DE0]" />
          : <span className="h-3 w-3" />}
      </span>
    </th>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#f0f4f8' }}>

      {/* ── Header ── */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#001A41]">Core BUCA Carrier Ranking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Aetna · BCBS · Cigna · UHC ranked against each other only (1 = lowest spend) · v8.2 → v9
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading…</div>
      )}
      {error && (
        <div className="flex items-center justify-center py-20 text-sm text-red-500">Failed to load: {error}</div>
      )}

      {!loading && !error && (
        <>
          {/* ── Metric toggle ── */}
          <div className="mb-5 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Rank metric</span>
            {([['str', 'Straight Avg'], ['pop', 'Pop-Weighted Avg']] as [MetricKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMetric(key)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-all ${
                  metric === key
                    ? 'border-[#009DE0] bg-[#009DE0] text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-[#009DE0]/50 hover:text-[#009DE0]'
                }`}
              >
                {label}
              </button>
            ))}
            <span className="ml-2 text-xs text-gray-400 italic">Lower rank = lower spend</span>
          </div>

          {/* ── Ranking cards ── */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {rankedSummary.map((row, i) => (
              <RankCard key={row.name} row={row} position={i + 1} metric={metric} />
            ))}
          </div>

          {/* ── Comparison table ── */}
          <div className="mb-6 overflow-hidden rounded-xl bg-white shadow">
            <div className="border-b border-gray-100 px-5 py-3.5">
              <h2 className="text-sm font-bold text-[#001A41]">Summary Comparison</h2>
              <p className="text-xs text-gray-400 mt-0.5">Both metrics side-by-side · lower rank = better</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="bg-[#001A41] text-white">
                    <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white/80">Carrier</th>
                    <th colSpan={3} className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-white/60">Straight Avg Rank</th>
                    <th colSpan={3} className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-white/60">Pop-Weighted Avg Rank</th>
                  </tr>
                  <tr className="bg-[#001A41]/80">
                    <th className="border-b border-white/10 px-4 py-1.5" />
                    {['v8.2','v9','Δ','v8.2','v9','Δ'].map((h, i) => (
                      <th key={i} className="border-b border-white/10 px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-white/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankedSummary.map((row, i) => {
                    const style = CARRIER_STYLE[row.name];
                    return (
                      <tr key={row.name} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'} transition-colors hover:bg-blue-50/30`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg leading-none">{RANK_MEDAL[i + 1]}</span>
                            <div>
                              <p className={`text-sm font-semibold ${style?.text ?? 'text-gray-800'}`}>{row.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-gray-500">{fmt2(row.rank_str_v82)}</td>
                        <td className="px-3 py-3 text-center text-sm font-semibold text-gray-900">{fmt2(row.rank_str_v9)}</td>
                        <td className="px-3 py-3 text-center"><DeltaBadge v={row.rank_str_delta} /></td>
                        <td className="px-3 py-3 text-center text-sm text-gray-500">{fmt2(row.rank_pop_v82)}</td>
                        <td className="px-3 py-3 text-center text-sm font-semibold text-gray-900">{fmt2(row.rank_pop_v9)}</td>
                        <td className="px-3 py-3 text-center"><DeltaBadge v={row.rank_pop_delta} /></td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── MSA Detail (collapsible) ── */}
          <div className="overflow-hidden rounded-xl bg-white shadow">
            <button
              onClick={() => setShowDetail(v => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50"
            >
              <div>
                <h2 className="text-sm font-bold text-[#001A41]">MSA Detail — v9 BUCA Rankings</h2>
                <p className="text-xs text-gray-400 mt-0.5">{detail.length.toLocaleString()} MSAs · BUCA rank + all-network rank + rates</p>
              </div>
              {showDetail ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            </button>

            {showDetail && (
              <div className="border-t border-gray-100">
                {/* Search */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
                  <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search MSA…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                  />
                  {search && (
                    <span className="text-xs text-gray-400">{filteredDetail.length} result{filteredDetail.length !== 1 ? 's' : ''}</span>
                  )}
                </div>

                {/* Table */}
                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full min-w-[960px] border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#001A41] text-white">
                        <th className="border-b border-white/10 px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white/80" rowSpan={2}>MSA</th>
                        <th className="border-b border-white/10 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-white/60" rowSpan={2}>Pop</th>
                        <th className="border-b border-white/10 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-white/60" colSpan={4}>BUCA Rank (1=lowest spend)</th>
                        <th className="border-b border-white/10 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-white/40" colSpan={4}>All-Network Rank</th>
                      </tr>
                      <tr className="bg-[#001A41]/80">
                        {(['buca_rank_aetna','buca_rank_bcbs','buca_rank_cigna','buca_rank_uhc'] as DetailSort[]).map((col, i) => (
                          <SortTh key={col} col={col} label={['Aetna','BCBS','Cigna','UHC'][i]} />
                        ))}
                        {['Aetna','BCBS','Cigna','UHC'].map(l => (
                          <th key={l} className="border-b border-white/10 px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-white/40">{l}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDetail.map((row, i) => (
                        <tr key={row.msa_id} className={i % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/60 hover:bg-blue-50/30'}>
                          <td className="px-4 py-2.5">
                            <p className="text-sm font-medium text-gray-800">{row.msa_name}</p>
                          </td>
                          <td className="px-3 py-2.5 text-center text-xs text-gray-500">{fmtPop(row.population)}</td>
                          <td className="px-3 py-2.5 text-center"><RankPill v={row.buca_rank_aetna} /></td>
                          <td className="px-3 py-2.5 text-center"><RankPill v={row.buca_rank_bcbs} /></td>
                          <td className="px-3 py-2.5 text-center"><RankPill v={row.buca_rank_cigna} /></td>
                          <td className="px-3 py-2.5 text-center"><RankPill v={row.buca_rank_uhc} /></td>
                          <td className="px-3 py-2.5 text-center text-xs text-gray-400">{row.all_rank_aetna ?? '—'}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-gray-400">{row.all_rank_bcbs ?? '—'}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-gray-400">{row.all_rank_cigna ?? '—'}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-gray-400">{row.all_rank_uhc ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
