import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Minus, X, Info } from 'lucide-react';
import {
  BUCKET_LABELS, BUCKET_ORDER,
  NATIONAL_CARRIERS, deltaColorClasses, deltaColor, fmtPct, fmtDelta,
  type CCRow, type BucketKey,
} from './MSACarrierCoverageData';
import { supabase } from '../../lib/supabase/client';

// Carriers selected by default (those present in the chosen state)
const DEFAULT_CARRIERS = ['Aetna Choice POS', 'BCBS PPO', 'Cigna OAP', 'UHC Choice POS Plus'];

// ─── Priority MSA list ─────────────────────────────────────────────────────
const PRIORITY_MSA_IDS = new Set([
  '10180','10900','11020','11100','11700','12420','13140','14010','15180','15500',
  '16580','16740','16980','17020','17780','18580','19100','19180','19500','20500',
  '21340','21500','22180','23420','24140','24660','24780','25420','25860','26420',
  '27340','27780','28660','29540','29700','30140','30980','31080','31180','32580',
  '33260','34820','35620','36220','37900','37980','38300','39580','39740','40420',
  '40580','40900','41660','41700','41740','41860','41940','42540','43300','44100',
  '44300','45500','46340','47020','47260','47380','48660','48700','48900','49180',
  '49620','49660','99032','99037','99041',
]);

// ─── State / MSA helpers ────────────────────────────────────────────────────

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California',
  CO:'Colorado', CT:'Connecticut', DE:'Delaware', DC:'D.C.', FL:'Florida',
  GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana',
  IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine',
  MD:'Maryland', MA:'Massachusetts', MI:'Michigan', MN:'Minnesota',
  MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada',
  NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York',
  NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma',
  OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina',
  SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont',
  VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming',
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function DeltaBadge({ d }: { d: number | null }) {
  if (d === null || Math.abs(d) < 0.05) return <span className="text-gray-400 text-[10px]">—</span>;
  const cls = deltaColor(d);
  const Icon = d > 0.5 ? ArrowUp : d < -0.5 ? ArrowDown : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono text-[10px] tabular-nums ${cls}`}>
      <Icon className="h-2.5 w-2.5" />
      {fmtDelta(d)}
    </span>
  );
}

function OOABadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded bg-gray-200 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-600"
      title="Out-of-area: carrier has minimal presence in this MSA and is excluded from weighted quality averages"
    >
      <Info className="h-2.5 w-2.5" /> OOA
    </span>
  );
}

// ─── State derivation ────────────────────────────────────────────────────────
// msa_carrier_coverage.state is NULL for all rows. MSA names reliably embed
// the state abbreviation(s) after the last comma: "Springfield, MA" → "MA",
// "Boston-Cambridge-Newton, MA-NH" → "MA" (first state wins),
// "Providence-Warwick, RI-MA" → "RI" (first state wins).
// Non-metropolitan areas like "SD NONMETROPOLITAN AREA" won't match — they
// get an empty string and are excluded from state filtering (correct).
function deriveStateFromMsaName(name: string): string {
  const match = name.match(/,\s*([A-Z]{2})(?:[^A-Z]|$)/);
  return match ? match[1] : '';
}

// ─── Metric selection ────────────────────────────────────────────────────────

type Metric = 'gy' | 'cb';

const METRIC_LABELS: Record<Metric, string> = {
  gy: 'Percent Green/Yellow (GY)',
  cb: 'Code Basket (CB)',
};

// Pull the v8.2 / v9 / delta values for the active metric out of a row.
function metricVals(r: CCRow, metric: Metric): { v8: number | null; v9: number | null; d: number | null } {
  return metric === 'gy'
    ? { v8: r.gy8, v9: r.gy9, d: r.gyd }
    : { v8: r.cb8, v9: r.cb9, d: r.cbd };
}

interface CellProps {
  rows: CCRow[]; // all 4 bucket rows for this msa × carrier
  metric: Metric;
  onClick: () => void;
}

function CoverageCell({ rows, metric, onClick }: CellProps) {
  if (rows.length === 0) {
    return (
      <td className="border-b border-gray-100 p-1 align-top">
        <div className="flex h-full min-h-[80px] items-center justify-center rounded-md border border-dashed border-gray-200 text-[11px] italic text-gray-400">
          No data
        </div>
      </td>
    );
  }

  const totalRow = rows.find(r => r.bucket === 'TOTAL');

  return (
    <td className="border-b border-gray-100 p-1 align-top">
      <button
        onClick={onClick}
        className="w-full rounded-md border border-gray-200 bg-white text-left transition-shadow hover:shadow-md focus:outline-none"
      >
        {totalRow?.ooa && (
          <div className="px-2 pt-1.5">
            <OOABadge />
          </div>
        )}
        {BUCKET_ORDER.map(bk => {
          const r = rows.find(x => x.bucket === bk);
          if (!r) return (
            <div key={bk} className="flex items-center gap-1 border-b border-gray-100 px-2 py-1.5 last:border-0">
              <span className="w-[4.5rem] shrink-0 text-[10px] font-medium text-gray-400">{BUCKET_LABELS[bk]}</span>
              <span className="text-[10px] italic text-gray-300">—</span>
            </div>
          );
          const { v8, v9, d } = metricVals(r, metric);
          const cc = deltaColorClasses(d, r.ooa);
          return (
            <div key={bk} className={`flex items-center gap-1 border-b border-gray-100 px-2 py-1.5 last:border-0 rounded-sm ${cc}`}>
              <span className="w-[4.5rem] shrink-0 text-[10px] font-semibold opacity-70">{BUCKET_LABELS[bk]}</span>
              <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
                <span className="flex items-baseline gap-0.5">
                  <span className="text-[8px] font-medium uppercase tracking-wide opacity-40">v8.2</span>
                  <span className="font-mono text-[11px] tabular-nums opacity-60">{fmtPct(v8)}</span>
                </span>
                <span className="flex items-baseline gap-0.5">
                  <span className="text-[8px] font-medium uppercase tracking-wide opacity-40">v9</span>
                  <span className="font-mono text-[11px] font-bold tabular-nums">{fmtPct(v9)}</span>
                </span>
                <span className="w-12 text-right"><DeltaBadge d={d} /></span>
              </div>
            </div>
          );
        })}
      </button>
    </td>
  );
}

// ─── Detail Panel ────────────────────────────────────────────────────────────

interface DetailPanelProps {
  msaName: string;
  carrier: string;
  rows: CCRow[];
  onClose: () => void;
}

function DetailPanel({ msaName, carrier, rows, onClose }: DetailPanelProps) {
  const totalRow = rows.find(r => r.bucket === 'TOTAL');
  return (
    <>
      <div className="fixed inset-0 z-[1100] bg-black/30" onClick={onClose} aria-hidden />
      <aside className="fixed right-0 top-0 z-[1101] flex h-screen w-full max-w-[500px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">MSA Carrier Detail</div>
            <div className="mt-1 text-base font-bold text-[#001A41] leading-tight">{msaName}</div>
            <div className="mt-0.5 text-sm font-medium text-gray-600">{carrier}</div>
            <div className="mt-1 text-xs text-gray-400">v8.2 → v9</div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* OOA notice */}
          {totalRow?.ooa && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <strong>Out-of-Area:</strong> This carrier has minimal presence in this MSA
              (under 2% of the largest carrier's rate count AND quality below 20%). It is
              excluded from spend-weighted quality averages but shown here for reference.
            </div>
          )}

          {/* Metrics table per bucket */}
          {BUCKET_ORDER.map(bk => {
            const r = rows.find(x => x.bucket === bk);
            return (
              <section key={bk}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {BUCKET_LABELS[bk]}
                </h3>
                {!r ? (
                  <p className="text-xs italic text-gray-400">No data for this bucket.</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full table-fixed text-sm">
                      <colgroup>
                        <col />
                        <col style={{ width: '5.5rem' }} />
                        <col style={{ width: '5.5rem' }} />
                        <col style={{ width: '4.5rem' }} />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="py-1.5 pl-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">Metric</th>
                          <th className="py-1.5 px-2 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">v8.2</th>
                          <th className="py-1.5 px-2 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">v9</th>
                          <th className="py-1.5 pl-2 pr-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">Δ</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 pl-3 text-sm text-gray-600">% Green/Yellow</td>
                          <td className="py-2 px-2 text-right font-mono text-sm text-gray-500 tabular-nums">{fmtPct(r.gy8)}</td>
                          <td className="py-2 px-2 text-right font-mono text-sm font-semibold text-gray-900 tabular-nums">{fmtPct(r.gy9)}</td>
                          <td className={`py-2 pl-2 pr-3 text-right font-mono text-xs tabular-nums ${deltaColor(r.gyd)}`}>{r.gyd !== null ? (r.gyd >= 0 ? '+' : '') + r.gyd.toFixed(1) + 'pp' : '—'}</td>
                        </tr>
                        <tr>
                          <td className="py-2 pl-3 text-sm text-gray-600">% Codebasket</td>
                          <td className="py-2 px-2 text-right font-mono text-sm text-gray-500 tabular-nums">{fmtPct(r.cb8)}</td>
                          <td className="py-2 px-2 text-right font-mono text-sm font-semibold text-gray-900 tabular-nums">{fmtPct(r.cb9)}</td>
                          <td className={`py-2 pl-2 pr-3 text-right font-mono text-xs tabular-nums ${deltaColor(r.cbd)}`}>{r.cbd !== null ? (r.cbd >= 0 ? '+' : '') + r.cbd.toFixed(1) + 'pp' : '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}

          {/* Spend breakdown (TOTAL row) */}
          {totalRow && totalRow.rate9 !== null && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">v9 Spend & Coverage</h3>
              <div className="rounded-lg border border-gray-200 px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Spend per 1,000 members</span>
                  <span className="font-mono font-semibold text-gray-900">${totalRow.rate9.toLocaleString()}</span>
                </div>
                {totalRow.rank9 !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Carrier spend rank in MSA</span>
                    <span className="font-mono font-semibold text-gray-900">#{totalRow.rank9} <span className="text-xs text-gray-400">(1 = lowest)</span></span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">MSA population</span>
                  <span className="font-mono text-gray-700">{totalRow.total_pop.toLocaleString()}</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </aside>
    </>
  );
}

// ─── Carrier Toggle Pills ────────────────────────────────────────────────────

interface CarrierTogglesProps {
  allCarriers: string[];
  visible: string[];
  onToggle: (c: string) => void;
}

function CarrierToggles({ allCarriers, visible, onToggle }: CarrierTogglesProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Carriers</span>
        <span className="text-[11px] text-gray-400">{visible.length} selected</span>
      </div>
      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
        {allCarriers.map(c => {
          const on = visible.includes(c);
          const isNational = NATIONAL_CARRIERS.includes(c);
          return (
            <button
              key={c}
              onClick={() => onToggle(c)}
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                on
                  ? isNational
                    ? 'bg-[#001A41] border-[#001A41] text-white'
                    : 'bg-[#009DE0] border-[#009DE0] text-white'
                  : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function Legend({ metric }: { metric: Metric }) {
  const tiers = [
    { cls: 'bg-emerald-100 border-emerald-300', label: '≥ +10' },
    { cls: 'bg-emerald-50 border-emerald-200',  label: '+3 to +10' },
    { cls: 'bg-green-50 border-green-200',      label: '+0.5 to +3' },
    { cls: 'bg-white border-gray-300',          label: '≈ 0' },
    { cls: 'bg-orange-50 border-orange-300',    label: '−0.5 to −3' },
    { cls: 'bg-red-50 border-red-300',          label: '−3 to −10' },
    { cls: 'bg-red-100 border-red-400',         label: '≤ −10' },
    { cls: 'bg-gray-100 border-gray-300',       label: 'OOA' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs text-gray-600 shadow-sm">
      <span className="font-semibold uppercase tracking-wider text-gray-400 text-[10px]">Δ Color (pp)</span>
      {tiers.map(t => (
        <span key={t.label} className="inline-flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded-sm border ${t.cls}`} />
          {t.label}
        </span>
      ))}
      <span className="ml-auto text-[11px] text-gray-400">Showing {METRIC_LABELS[metric]} · color = v9 − v8.2 change</span>
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

interface OpenCell { msaId: string; carrier: string; }

export function MSACarrierCoverageView() {
  const [rows, setRows] = useState<CCRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [visibleCarriers, setVisibleCarriers] = useState<string[]>([]);
  const [openCell, setOpenCell] = useState<OpenCell | null>(null);
  const [metric, setMetric] = useState<Metric>('gy');
  const [msaOrder, setMsaOrder] = useState<'alpha' | 'largest' | 'smallest'>('alpha');

  useEffect(() => {
    async function loadData() {
      // SOURCE TABLE: msa_carrier_coverage
      //
      // ccm_msa was the intended v9 replacement but is only a PARTIAL load:
      // - covers 33 of 51 states
      // - missing MSAs within covered states (e.g. Springfield MA, Worcester MA,
      //   Providence RI-MA, Vineyard Haven MA are absent)
      //
      // msa_carrier_coverage has complete MSA coverage (all 47,904 rows) but
      // the `state` column is NULL for every row, which broke the state filter.
      //
      // FIX: use msa_carrier_coverage for complete data, and derive state
      // inline from msa_name (names embed state abbrs: "Springfield, MA",
      // "Boston-Cambridge-Newton, MA-NH", "Worcester, MA-CT").
      // This is the authoritative fix until ccm_msa is fully reloaded.
      const { data, error: sbError } = await supabase
        .from('msa_carrier_coverage')
        .select('*')
        .limit(55000);
      if (sbError) {
        setError(sbError.message);
      } else {
        // Map snake_case DB columns to CCRow shape
        const mapped: CCRow[] = (data ?? []).map((r: Record<string, unknown>) => ({
          msa_id:    String(r.msa_id ?? ''),
          msa_name:  String(r.msa_name ?? ''),
          carrier:   String(r.carrier ?? ''),
          bucket:    String(r.bucket ?? '') as BucketKey,
          // state is NULL in this table — derive from msa_name.
          // MSA names embed the primary state: "Springfield, MA" → "MA",
          // "Boston-Cambridge-Newton, MA-NH" → "MA", "Providence-Warwick, RI-MA" → "RI".
          state:     r.state != null ? String(r.state) : deriveStateFromMsaName(String(r.msa_name ?? '')),
          seg_pop:   r.seg_pop != null ? Number(r.seg_pop) : null,
          total_pop: r.total_pop != null ? Number(r.total_pop) : 0,
          ooa:       Number(r.ooa ?? 0) === 1,
          gy9:       r.gy9 != null ? Number(r.gy9) : null,
          gy8:       r.gy8 != null ? Number(r.gy8) : null,
          gyd:       r.gyd != null ? Number(r.gyd) : null,
          cb9:       r.cb9 != null ? Number(r.cb9) : null,
          cb8:       r.cb8 != null ? Number(r.cb8) : null,
          cbd:       r.cbd != null ? Number(r.cbd) : null,
          rate9:     r.rate9 != null ? Number(r.rate9) : null,
          rank9:     r.rank9 != null ? Number(r.rank9) : null,
        }));
        setRows(mapped);
      }
    }
    loadData();
  }, []);

  // Index: state → msa_id → carrier → bucket → row
  const indexed = useMemo(() => {
    if (!rows) return null;
    const byState: Record<string, Record<string, Record<string, Record<BucketKey, CCRow>>>> = {};
    const msaNames: Record<string, string> = {};
    const allCarriers = new Set<string>();
    const statesWithData = new Set<string>();

    for (const r of rows) {
      allCarriers.add(r.carrier);
      if (r.state) {
        statesWithData.add(r.state);
        const st = (byState[r.state] ||= {});
        const msa = (st[r.msa_id] ||= {});
        const car = (msa[r.carrier] ||= {} as Record<BucketKey, CCRow>);
        car[r.bucket] = r;
        if (!msaNames[r.msa_id]) msaNames[r.msa_id] = r.msa_name;
      }
    }
    return {
      byState,
      msaNames,
      allCarriers: [...allCarriers].sort(),
      states: [...statesWithData].sort(),
    };
  }, [rows]);

  // Set default state once data loads
  useEffect(() => {
    if (indexed && !selectedState) {
      setSelectedState('PRIORITY');
    }
  }, [indexed, selectedState]);

  const stateMsaMap = useMemo(() => {
    if (!indexed || !selectedState) return {};
    if (selectedState === 'PRIORITY') {
      const merged: Record<string, Record<string, Record<BucketKey, CCRow>>> = {};
      for (const stMatrix of Object.values(indexed.byState)) {
        for (const [msaId, carrierMap] of Object.entries(stMatrix)) {
          if (!PRIORITY_MSA_IDS.has(msaId)) continue;
          if (!merged[msaId]) merged[msaId] = {};
          for (const [carrier, buckets] of Object.entries(carrierMap)) {
            if (!merged[msaId][carrier]) merged[msaId][carrier] = buckets as Record<BucketKey, CCRow>;
          }
        }
      }
      return merged;
    }
    return indexed.byState[selectedState] ?? {};
  }, [indexed, selectedState]);

  // Carriers that actually have data in the selected state
  const stateCarriers = useMemo(() => {
    const present = new Set<string>();
    for (const msaId in stateMsaMap) {
      for (const carrier in stateMsaMap[msaId]) present.add(carrier);
    }
    return [...present].sort();
  }, [stateMsaMap]);

  // When the state changes, default the visible columns to DEFAULT_CARRIERS present
  // in that state; fall back to national carriers, then to all carriers with data.
  useEffect(() => {
    if (stateCarriers.length === 0) return;
    const defaultsPresent = DEFAULT_CARRIERS.filter(c => stateCarriers.includes(c));
    if (defaultsPresent.length > 0) { setVisibleCarriers(defaultsPresent); return; }
    const nationalsPresent = NATIONAL_CARRIERS.filter(c => stateCarriers.includes(c));
    setVisibleCarriers(nationalsPresent.length > 0 ? nationalsPresent : stateCarriers);
  }, [stateCarriers]);

  // Helper: get total_pop for an MSA from any available TOTAL row
  const getMsaPop = (msaId: string): number => {
    const carrierMap = stateMsaMap[msaId] ?? {};
    for (const buckets of Object.values(carrierMap)) {
      const total = (buckets as Record<string, CCRow>)['TOTAL'];
      if (total?.total_pop) return total.total_pop;
    }
    return 0;
  };

  const orderedMsaIds = useMemo(() => {
    const entries = Object.entries(stateMsaMap);
    if (msaOrder === 'alpha') {
      return entries
        .sort((a, b) => (indexed?.msaNames[a[0]] ?? '').localeCompare(indexed?.msaNames[b[0]] ?? ''))
        .map(([id]) => id);
    }
    if (msaOrder === 'largest') {
      return entries
        .sort((a, b) => {
          const pa = getMsaPop(a[0]), pb = getMsaPop(b[0]);
          if (pb !== pa) return pb - pa;
          return (indexed?.msaNames[a[0]] ?? '').localeCompare(indexed?.msaNames[b[0]] ?? '');
        })
        .map(([id]) => id);
    }
    // smallest
    return entries
      .sort((a, b) => {
        const pa = getMsaPop(a[0]), pb = getMsaPop(b[0]);
        if (pa !== pb) return pa - pb;
        return (indexed?.msaNames[a[0]] ?? '').localeCompare(indexed?.msaNames[b[0]] ?? '');
      })
      .map(([id]) => id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateMsaMap, indexed, msaOrder]);

  const toggleCarrier = (c: string) => {
    setVisibleCarriers(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const openCellRows = useMemo(() => {
    if (!openCell || !indexed) return [];
    if (selectedState === 'PRIORITY') {
      for (const stMatrix of Object.values(indexed.byState)) {
        const buckets = stMatrix[openCell.msaId]?.[openCell.carrier];
        if (buckets) return Object.values(buckets);
      }
      return [];
    }
    const carrierMap = indexed.byState[selectedState]?.[openCell.msaId]?.[openCell.carrier] ?? {};
    return Object.values(carrierMap);
  }, [openCell, indexed, selectedState]);

  return (
    <div className="flex h-screen flex-col bg-[#f8f7f4]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-[#001A41]">MSA Carrier Coverage</h1>
          <p className="text-sm text-gray-500">
            Carrier quality & codebasket coverage by MSA — v8.2 vs v9 comparison
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-gray-200 bg-white px-6 py-3 space-y-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {/* State selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">State</span>
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#001A41] focus:outline-none focus:ring-2 focus:ring-[#009DE0]"
            >
              <option value="PRIORITY">⭐ Priority MSAs</option>
              {indexed?.states.map(s => (
                <option key={s} value={s}>{s} — {STATE_NAMES[s] ?? s}</option>
              ))}
            </select>
            {orderedMsaIds.length > 0 && (
              <span className="text-xs text-gray-400">{orderedMsaIds.length} MSAs</span>
            )}
          </div>

          {/* Order selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Order</span>
            <select
              value={msaOrder}
              onChange={e => setMsaOrder(e.target.value as 'alpha' | 'largest' | 'smallest')}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#001A41] focus:outline-none focus:ring-2 focus:ring-[#009DE0]"
            >
              <option value="alpha">Alphabetical</option>
              <option value="largest">Largest to Smallest</option>
              <option value="smallest">Smallest to Largest</option>
            </select>
          </div>

          {/* Metric selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Metric</span>
            <select
              value={metric}
              onChange={e => setMetric(e.target.value as Metric)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#001A41] focus:outline-none focus:ring-2 focus:ring-[#009DE0]"
            >
              <option value="gy">{METRIC_LABELS.gy}</option>
              <option value="cb">{METRIC_LABELS.cb}</option>
            </select>
          </div>
        </div>

        {/* Carrier toggles — only carriers with data in the selected state */}
        {indexed && stateCarriers.length > 0 && (
          <CarrierToggles
            allCarriers={stateCarriers}
            visible={visibleCarriers}
            onToggle={toggleCarrier}
          />
        )}
      </div>

      {/* Color legend - sticky above scroll area */}
      {rows && indexed && orderedMsaIds.length > 0 && visibleCarriers.length > 0 && (
        <div className="border-b border-gray-200 bg-white">
          <Legend metric={metric} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-auto px-6 py-4 space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load data: {error}
          </div>
        )}
        {!rows && !error && (
          <div className="flex items-center justify-center py-16 text-sm text-gray-500">
            Loading carrier coverage data…
          </div>
        )}

        {rows && indexed && orderedMsaIds.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-8 text-center text-sm text-gray-500">
            No MSA data for {selectedState === 'PRIORITY' ? 'Priority MSAs' : (STATE_NAMES[selectedState] ?? selectedState)}.
          </div>
        )}

        {rows && indexed && visibleCarriers.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-8 text-center text-sm text-gray-500">
            Select at least one carrier to display data.
          </div>
        )}

        {rows && indexed && orderedMsaIds.length > 0 && visibleCarriers.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="w-full border-separate border-spacing-0 text-sm">
                  <colgroup>
                    <col style={{ width: '16rem' }} />
                    {visibleCarriers.map(c => <col key={c} style={{ minWidth: '11rem' }} />)}
                  </colgroup>
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="border-b border-gray-200 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        MSA
                      </th>
                      {visibleCarriers.map(c => (
                        <th key={c} className="border-b border-gray-200 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orderedMsaIds.map(msaId => {
                      const msaName = indexed.msaNames[msaId] ?? msaId;
                      const carrierMap = stateMsaMap[msaId] ?? {};

                      return (
                        <tr key={msaId}>
                          {/* MSA label */}
                          <th scope="row" className="border-b border-gray-100 px-3 py-2 text-left align-top bg-gray-50/50">
                            <div className="text-sm font-semibold text-[#001A41] leading-tight">{msaName}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">CBSA {msaId}</div>
                          </th>

                          {/* Carrier cells */}
                          {visibleCarriers.map(carrier => {
                            const bucketMap = carrierMap[carrier];
                            if (!bucketMap) {
                              return (
                                <td key={carrier} className="border-b border-gray-100 p-1 align-top">
                                  <div className="flex h-full min-h-[80px] items-center justify-center rounded-md border border-dashed border-gray-200 text-[11px] italic text-gray-300">
                                    —
                                  </div>
                                </td>
                              );
                            }
                            const bucketRows = Object.values(bucketMap) as CCRow[];
                            return (
                              <CoverageCell
                                key={carrier}
                                rows={bucketRows}
                                metric={metric}
                                onClick={() => setOpenCell({ msaId, carrier })}
                              />
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {openCell && (
        <DetailPanel
          msaName={indexed?.msaNames[openCell.msaId] ?? openCell.msaId}
          carrier={openCell.carrier}
          rows={openCellRows}
          onClose={() => setOpenCell(null)}
        />
      )}
    </div>
  );
}
