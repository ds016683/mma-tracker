import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, FileCheck2, ArrowUp, ArrowDown } from 'lucide-react';
import type { CcmBucket, CcmHospitalRow } from '../../lib/supabase/ccmQueries';
import {
  BUCKET_LABEL, fmtPct, fmtInt, fmtSpendPer1k, formatMetric,
  HOSPITAL_METRICS, HOSPITAL_METRIC_KEYS,
  bucaFamily, BUCA_ORDER, BUCA_FAMILY_LABEL,
  colorForMetric, hospitalMetricValue, hospitalMetricLabel, METRIC_BY_KEY,
  type MetricKey, type BucaFamily,
} from './ccmGeo';

interface Props {
  hospitalName: string;
  city: string | null;
  planName: string;
  metric: MetricKey;
  rows: CcmHospitalRow[] | null;        // this hospital under the selected plan (all buckets)
  acrossPlans: CcmHospitalRow[] | null; // this hospital under every plan (for comparison)
  loading: boolean;
  onBack: () => void;
}

const DETAIL_BUCKETS: CcmBucket[] = ['IP', 'OP', 'Prof'];

interface Seg { value: number; color: string; label: string }

function StackedBar({ segments }: { segments: Seg[] }) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return <div className="h-2.5 w-full rounded-full bg-gray-100" />;
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full">
      {segments.map((s, i) =>
        s.value > 0 ? (
          <div key={i} style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${((s.value / total) * 100).toFixed(0)}%`} />
        ) : null
      )}
    </div>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
      <span className="inline-block h-2 w-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

// pp change (for rate coverage)
function PtsDelta({ d }: { d: number | null }) {
  if (d === null || Math.abs(d) < 0.05) return <span className="text-[10px] text-gray-300">—</span>;
  const up = d > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold tabular-nums ${
      up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
    }`} title="Change since the previous data version">
      <Icon className="h-2.5 w-2.5" />{Math.abs(d).toFixed(1)}
    </span>
  );
}

// dollar change (for good-confidence spend)
function SpendDelta({ d }: { d: number | null }) {
  if (d === null || d === 0) return null;
  const up = d > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums text-gray-400" title="Change since the previous data version">
      <Icon className="h-2.5 w-2.5" />{fmtSpendPer1k(Math.abs(d))}
    </span>
  );
}

function isDark(hex: string): boolean {
  const m = hex.replace('#', '');
  if (m.length !== 6) return false;
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

export function HospitalDrilldown({
  hospitalName, city, planName, metric, rows, acrossPlans, loading, onBack,
}: Props) {
  const [compare, setCompare] = useState(false);
  // Comparison metric — defaults to the map's "Color by" when that metric is
  // meaningful for a single hospital, else the hospital default.
  const initialMetric = HOSPITAL_METRIC_KEYS.includes(metric) ? metric : 'codebasket';
  const [compareMetric, setCompareMetric] = useState<MetricKey>(initialMetric);
  useEffect(() => {
    setCompareMetric(HOSPITAL_METRIC_KEYS.includes(metric) ? metric : 'codebasket');
  }, [metric]);

  const byBucket = useMemo(() => {
    const m = new Map<CcmBucket, CcmHospitalRow>();
    for (const r of rows ?? []) m.set(r.bucket, r);
    return m;
  }, [rows]);
  const totalRow = byBucket.get('Total');

  // Cross-plan comparison rows (IP + OP + Prof per plan with data for this hospital)
  const compareRows = useMemo(() => {
    const byCarrier = new Map<string, { family: BucaFamily | null; IP?: CcmHospitalRow; OP?: CcmHospitalRow; Prof?: CcmHospitalRow }>();
    for (const r of acrossPlans ?? []) {
      if (r.bucket !== 'IP' && r.bucket !== 'OP' && r.bucket !== 'Prof') continue;
      const e = byCarrier.get(r.carrier) ?? { family: bucaFamily(r.carrier) };
      e[r.bucket] = r;
      byCarrier.set(r.carrier, e);
    }
    return [...byCarrier.entries()]
      .map(([carrier, v]) => ({ carrier, ...v }))
      .sort((a, b) => {
        const fa = a.family ? BUCA_ORDER.indexOf(a.family) : 99;
        const fb = b.family ? BUCA_ORDER.indexOf(b.family) : 99;
        return fa - fb || a.carrier.localeCompare(b.carrier);
      });
  }, [acrossPlans]);

  // gy_rate cells are coloured relative to the largest value in the table
  const levelMax = useMemo(() => {
    if (METRIC_BY_KEY[compareMetric].kind !== 'level') return undefined;
    let mx = 0;
    for (const row of compareRows) {
      for (const b of ['IP', 'OP', 'Prof'] as const) {
        const v = hospitalMetricValue(row[b], compareMetric);
        if (v != null && v > mx) mx = v;
      }
    }
    return mx;
  }, [compareRows, compareMetric]);

  function Cell({ r }: { r?: CcmHospitalRow }) {
    const v = r ? hospitalMetricValue(r, compareMetric) : null;
    const color = colorForMetric(compareMetric, v, { max: levelMax });
    return (
      <td className="px-1.5 py-1.5 text-center">
        <span
          className="inline-block min-w-[3rem] rounded px-1.5 py-1 text-xs font-semibold tabular-nums"
          style={{ background: color, color: isDark(color) ? '#fff' : '#111827' }}
        >
          {formatMetric(compareMetric, v)}
        </span>
      </td>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-[#009DE0] hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to hospital list
      </button>

      <div className="mb-1 text-base font-bold leading-tight text-[#001A41]">{hospitalName}</div>
      {city && <div className="mb-3 text-sm text-gray-500">{city}</div>}

      {/* View toggle */}
      <div className="mb-4 flex gap-1.5 text-sm">
        <div className="group relative flex-1">
          <button
            onClick={() => setCompare(false)}
            className={`w-full rounded-md border px-3 py-1.5 font-medium transition-colors ${
              !compare ? 'border-[#009DE0] bg-[#009DE0] text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="block truncate">{planName || 'This plan'}</span>
          </button>
          <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-64 rounded-md bg-[#001A41] px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white shadow-lg group-hover:block">
            Showing this hospital under “{planName}”. To view a different plan, use the <span className="font-semibold">Plan</span> dropdown at the top-left of the page.
          </div>
        </div>
        <button
          onClick={() => setCompare(true)}
          className={`flex-1 rounded-md border px-3 py-1.5 font-medium transition-colors ${
            compare ? 'border-[#009DE0] bg-[#009DE0] text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Compare plans
        </button>
      </div>

      {loading && <div className="py-8 text-center text-sm text-gray-500">Loading hospital detail…</div>}

      {/* ─── Compare view ─── */}
      {!loading && compare && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Compare by</span>
            <select
              value={compareMetric}
              onChange={(e) => setCompareMetric(e.target.value as MetricKey)}
              className="flex-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-[#001A41] focus:outline-none focus:ring-2 focus:ring-[#009DE0]"
            >
              {HOSPITAL_METRICS.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
          <p className="mb-2 text-xs text-gray-500">
            Comparing <span className="font-semibold text-[#001A41]">{hospitalMetricLabel(compareMetric)}</span> across every plan with data for this hospital, by service type.
          </p>
          {compareRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              No plan-level rate data found for this hospital.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-1.5 pl-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">Plan</th>
                    <th className="py-1.5 px-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500">Inpatient</th>
                    <th className="py-1.5 px-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500">Outpatient</th>
                    <th className="py-1.5 px-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500">Professional</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.carrier} className={`border-b border-gray-100 last:border-0 ${row.carrier === planName ? 'bg-[#009DE0]/5' : ''}`}>
                      <td className="py-1.5 pl-3 pr-2">
                        <div className="text-xs font-medium text-[#001A41] leading-tight">{row.carrier}</div>
                        <div className="text-[9px] uppercase tracking-wide text-gray-400">{row.family ? BUCA_FAMILY_LABEL[row.family] : 'Regional'}</div>
                      </td>
                      <Cell r={row.IP} />
                      <Cell r={row.OP} />
                      <Cell r={row.Prof} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Single-plan view ─── */}
      {!loading && !compare && (!rows || rows.length === 0) && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          No rate detail available for this hospital in this plan.
        </div>
      )}

      {!loading && !compare && rows && rows.length > 0 && (
        <div className="space-y-4">
          {totalRow?.pct_medicare9 != null && (
            <div className="rounded-lg border border-gray-200 bg-[#F7F9FC] px-4 py-2.5 text-sm">
              <span className="font-semibold text-[#001A41]">≈ {fmtPct(totalRow.pct_medicare9)} of Medicare</span>
              <span className="ml-1 text-gray-500">— how this hospital’s good-confidence rates compare to the Medicare benchmark.</span>
            </div>
          )}

          {DETAIL_BUCKETS.map((bk) => {
            const r = byBucket.get(bk);
            return (
              <section key={bk} className="rounded-lg border border-gray-200 bg-white p-4">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{BUCKET_LABEL[bk]}</h4>
                {!r ? (
                  <p className="text-xs italic text-gray-400">No data for this service type.</p>
                ) : (
                  <div className="space-y-3">
                    {/* Good-confidence spend + rate coverage summary */}
                    <div className="flex gap-4 rounded-md bg-gray-50 px-3 py-2">
                      <div className="flex-1">
                        <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Verified spend / 1K</div>
                        <div className="mt-0.5 flex items-baseline gap-1.5">
                          <span className="text-sm font-bold text-[#001A41] tabular-nums">{fmtSpendPer1k(r.gy_rate9)}</span>
                          <SpendDelta d={r.gy_rated} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Rate coverage</div>
                        <div className="mt-0.5 flex items-baseline gap-1.5">
                          <span className="text-sm font-bold text-[#001A41] tabular-nums">{fmtPct(r.pct_codebasket_codes9)}</span>
                          <PtsDelta d={r.pct_codebasket_codesd} />
                        </div>
                      </div>
                    </div>

                    {/* Rate coverage detail */}
                    <div>
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Rate coverage</div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-semibold text-[#001A41]">
                          {fmtInt(r.n_codes_gy9)} billing codes have a good-confidence rate
                        </span>
                        <span className="text-sm font-bold text-[#009DE0]">{fmtPct(r.pct_codebasket_codes9)}</span>
                      </div>
                      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-[#009DE0]" style={{ width: `${Math.max(0, Math.min(100, r.pct_codebasket_codes9 ?? 0))}%` }} />
                      </div>
                      <p className="mt-1 text-[10px] text-gray-400">Share of the standard billing-code set that has a good-confidence rate here.</p>
                    </div>

                    {/* Rate confidence */}
                    <div>
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Rate confidence</div>
                      <StackedBar segments={[
                        { value: r.n_green9 ?? 0, color: '#22c55e', label: 'High confidence' },
                        { value: r.n_yellow9 ?? 0, color: '#f59e0b', label: 'Medium confidence' },
                        { value: r.n_red9 ?? 0, color: '#ef4444', label: 'Low confidence' },
                        { value: r.n_notassigned9 ?? 0, color: '#d1d5db', label: 'Not rated' },
                      ]} />
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        <Swatch color="#22c55e" label="High" />
                        <Swatch color="#f59e0b" label="Medium" />
                        <Swatch color="#ef4444" label="Low" />
                        <Swatch color="#d1d5db" label="Not rated" />
                      </div>
                      <p className="mt-1 text-[10px] text-gray-400">How confident we are in each good-confidence rate.</p>
                    </div>

                    {/* Rate source (two sources below MSA — no imputed) */}
                    <div>
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Where rates came from</div>
                      <StackedBar segments={[
                        { value: r.src_carrier_pct9 ?? 0, color: '#002C77', label: 'Carrier rate file' },
                        { value: r.src_provider_pct9 ?? 0, color: '#0077A0', label: 'Hospital rate file' },
                      ]} />
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        <Swatch color="#002C77" label="Carrier’s rate file" />
                        <Swatch color="#0077A0" label="Hospital’s published rate file" />
                      </div>
                      <p className="mt-1 text-[10px] text-gray-400">How each rate was sourced.</p>
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          {totalRow?.hospital_mrf_ingested === 1 && (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <FileCheck2 className="h-3.5 w-3.5" /> We have this hospital’s own published rate file
            </div>
          )}

          {totalRow?.source_versions9 && (
            <p className="text-[10px] text-gray-400">Data provenance: {totalRow.source_versions9}</p>
          )}
        </div>
      )}
    </div>
  );
}
