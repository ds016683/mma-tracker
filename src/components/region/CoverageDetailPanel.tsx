import { useMemo } from 'react';
import { ArrowUp, ArrowDown, Info, FileCheck2, Building2 } from 'lucide-react';
import type { CcmBucket, CcmAreaRow, CcmGyRow, CcmHospitalRow } from '../../lib/supabase/ccmQueries';
import { HospitalDrilldown } from './HospitalDrilldown';
import { BUCKET_LABEL, fmtPct, hospitalsCoveredPhrase, type MetricKey } from './ccmGeo';

interface Props {
  planName: string;
  bucket: CcmBucket;
  metric: MetricKey;
  geoFamily: 'area' | 'gy';
  geoLabel: string;
  geoRow?: CcmAreaRow | CcmGyRow;
  emptyHint?: string;
  showHospitals: boolean;
  hospitals: CcmHospitalRow[] | null;
  hospitalsLoading: boolean;
  onSelectHospital: (npi: string, name: string, city: string | null) => void;
  // metros within the current region/state (shown when no metro/county is selected)
  msaList?: CcmAreaRow[];
  onSelectMsa?: (msaId: string, name: string) => void;
  // hospital drill-down
  selectedHospital: { npi: string; name: string; city: string | null } | null;
  hospitalDetail: CcmHospitalRow[] | null;
  hospitalAcrossPlans: CcmHospitalRow[] | null;
  hospitalDetailLoading: boolean;
  onBackFromHospital: () => void;
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <Info className="h-3.5 w-3.5 cursor-help text-gray-400 group-hover:text-[#009DE0]" />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-5 z-50 hidden w-56 -translate-x-1/2 rounded-md bg-[#001A41] px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white shadow-lg group-hover:block"
      >
        {text}
      </span>
    </span>
  );
}

function DeltaBadge({ d }: { d: number | null }) {
  if (d === null || Math.abs(d) < 0.05) return null;
  const up = d > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold tabular-nums ${
        up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}
      title="Change since the previous data version"
    >
      <Icon className="h-2.5 w-2.5" />
      {Math.abs(d).toFixed(1)} pts
    </span>
  );
}

function StatBlock({ label, value, delta, tip }: { label: string; value: string; delta?: number | null; tip: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
        {label} <InfoTip text={tip} />
      </div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className="text-xl font-bold text-[#001A41] tabular-nums">{value}</span>
        {delta !== undefined && <DeltaBadge d={delta ?? null} />}
      </div>
    </div>
  );
}

// gy / red / miss spend-confidence mix (area levels only)
function QualityMix({ gy, red, miss }: { gy: number | null; red: number | null; miss: number | null }) {
  const segs = [
    { v: gy ?? 0, color: '#22c55e', label: 'Verified rates' },
    { v: red ?? 0, color: '#ef4444', label: 'Low-confidence rates' },
    { v: miss ?? 0, color: '#d1d5db', label: 'No rate found (estimated)' },
  ];
  const total = segs.reduce((s, x) => s + Math.max(0, x.v), 0);
  if (total <= 0) return null;
  return (
    <div>
      <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-gray-500">
        Where spend’s rates come from
        <InfoTip text="Splits this plan’s spend into rates we can verify, low-confidence rates, and spend with no rate found (estimated)." />
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full">
        {segs.map((s, i) => s.v > 0 && (
          <div key={i} style={{ width: `${(s.v / total) * 100}%`, background: s.color }} title={`${s.label}: ${s.v.toFixed(0)}%`} />
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
        {segs.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1 text-[10px] text-gray-500">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function CoverageBadge({ icon: Icon, label, tone }: { icon: React.ElementType; label: string; tone: 'green' | 'gray' }) {
  const cls = tone === 'green' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${cls}`}>
      <Icon className="h-2.5 w-2.5" /> {label}
    </span>
  );
}

function HospitalRowItem({ h, onClick }: { h: CcmHospitalRow; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-1 border-b border-gray-100 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-[#F7F9FC]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[#001A41]">{h.hospital_name}</div>
          {h.city && <div className="text-[11px] text-gray-400">{h.city}</div>}
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          {h.hospital_mrf_ingested === 1 && <CoverageBadge icon={FileCheck2} label="Hospital file" tone="green" />}
          {h.ooa === 1 && <CoverageBadge icon={Info} label="Out of area" tone="gray" />}
        </div>
      </div>
      {h.has_plan_data === 1 && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#009DE0]"
              style={{ width: `${Math.max(0, Math.min(100, h.pct_codebasket_codes9 ?? 0))}%` }}
            />
          </div>
          <span className="w-10 text-right text-[10px] tabular-nums text-gray-400">{fmtPct(h.pct_codebasket_codes9)}</span>
        </div>
      )}
    </button>
  );
}

export function CoverageDetailPanel({
  planName, bucket, metric, geoFamily, geoLabel, geoRow, emptyHint,
  showHospitals, hospitals, hospitalsLoading,
  onSelectHospital,
  msaList, onSelectMsa,
  selectedHospital, hospitalDetail, hospitalAcrossPlans, hospitalDetailLoading, onBackFromHospital,
}: Props) {
  const sortedMsas = useMemo(
    () => [...(msaList ?? [])].sort((a, b) => (b.rate9 ?? 0) - (a.rate9 ?? 0)),
    [msaList]
  );

  const { inPlan, noData } = useMemo(() => {
    const list = hospitals ?? [];
    // TODO: swap sort to cms_medicare_part_a.total_allowed when table lands (join on ccn_number)
    const bySpend = (a: CcmHospitalRow, b: CcmHospitalRow) => (b.gy_rate9 ?? 0) - (a.gy_rate9 ?? 0);
    return {
      inPlan: list.filter((h) => h.has_plan_data === 1).sort(bySpend),
      noData: list.filter((h) => h.has_plan_data !== 1).sort(bySpend),
    };
  }, [hospitals]);

  // Hospital drill-down replaces the whole panel body
  if (selectedHospital) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-gray-200 px-5 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Hospital detail</div>
          <div className="text-sm font-medium text-gray-600">{planName} · {BUCKET_LABEL[bucket]}</div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <HospitalDrilldown
            hospitalName={selectedHospital.name}
            city={selectedHospital.city}
            planName={planName}
            metric={metric}
            rows={hospitalDetail}
            acrossPlans={hospitalAcrossPlans}
            loading={hospitalDetailLoading}
            onBack={onBackFromHospital}
          />
        </div>
      </div>
    );
  }

  const hospPhrase = hospitalsCoveredPhrase(geoRow);
  const area = geoFamily === 'area' ? (geoRow as CcmAreaRow | undefined) : undefined;
  const gy = geoFamily === 'gy' ? (geoRow as CcmGyRow | undefined) : undefined;

  return (
    <div className="flex h-full flex-col">
      {/* Headline */}
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{planName}</div>
        <div className="mt-0.5 text-lg font-bold leading-tight text-[#001A41]">{geoLabel}</div>
        <div className="mt-0.5 text-xs text-gray-400">{BUCKET_LABEL[bucket]} services · vs prior data version</div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {!geoRow ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
            {emptyHint ?? 'No data for this plan here.'}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hospitals-covered headline */}
            {hospPhrase && (
              <div className="rounded-lg border border-[#009DE0]/30 bg-[#009DE0]/5 px-4 py-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                  <Building2 className="h-3.5 w-3.5 text-[#009DE0]" /> Hospitals with rate data
                  <InfoTip text="How many hospitals in this market have any rate data in this plan, out of all hospitals we track here." />
                </div>
                <div className="mt-1 text-base font-bold text-[#001A41]">{hospPhrase}</div>
              </div>
            )}

            {/* Headline stats — area vs GY-only county */}
            {geoFamily === 'gy' ? (
              <div className="grid grid-cols-2 gap-2">
                <StatBlock
                  label="Rate coverage"
                  value={fmtPct(gy?.pct_codebasket_codes9)}
                  delta={gy?.pct_codebasket_codesd}
                  tip="Share of the standard billing-code set that has a good-confidence rate here."
                />
                <StatBlock
                  label="vs Medicare"
                  value={fmtPct(gy?.pct_medicare9)}
                  tip="How the good-confidence rates here compare to the Medicare benchmark. Higher means more expensive than Medicare."
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <StatBlock
                  label="Data quality"
                  value={fmtPct(area?.gy9)}
                  delta={area?.gyd}
                  tip="Share of spend backed by good-confidence rates. Higher means more of the rates can be trusted."
                />
                <StatBlock
                  label="Code coverage"
                  value={fmtPct(area?.cb9)}
                  delta={area?.cbd}
                  tip="Share of the standard set of billing codes that have a rate in this plan."
                />
              </div>
            )}

            {/* Area-level spend-confidence mix + benchmark comparison */}
            {geoFamily === 'area' && area && (
              <QualityMix gy={area.gy9} red={area.red9} miss={area.miss9} />
            )}
            {area?.anchor_carrier_plan_name && area.pct_diff_from_anchor9 != null && (
              <div className="rounded-lg border border-gray-200 bg-[#F7F9FC] px-4 py-2.5 text-sm">
                <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                  Price vs benchmark plan
                  <InfoTip text="How this plan’s spend compares to the lowest-priced (anchor) plan in this metro." />
                </div>
                <div className="mt-0.5">
                  <span className={`font-bold ${area.pct_diff_from_anchor9 > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {area.pct_diff_from_anchor9 > 0 ? '+' : ''}{area.pct_diff_from_anchor9.toFixed(0)}%
                  </span>
                  <span className="ml-1 text-gray-500">vs {area.anchor_carrier_plan_name}</span>
                  {area.outlier_check9 && area.outlier_check9 !== 'NORMAL' && (
                    <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">outlier</span>
                  )}
                </div>
              </div>
            )}

            {/* Metros within this region/state */}
            {!showHospitals && sortedMsas.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Metro areas</h3>
                  <span className="text-[11px] text-gray-400">{sortedMsas.length}</span>
                </div>
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  {sortedMsas.map((m) => (
                    <button
                      key={m.msa_id ?? m.msa_name ?? ''}
                      onClick={() => m.msa_id && onSelectMsa?.(m.msa_id, m.msa_name ?? m.msa_id)}
                      className="flex w-full items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 text-left transition-colors last:border-0 hover:bg-[#F7F9FC]"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[#001A41]">{m.msa_name ?? m.msa_id}</div>
                        <div className="text-[10px] text-gray-400">{hospitalsCoveredPhrase(m) ?? 'No hospital data'}</div>
                      </div>
                      <span className="flex-shrink-0 text-xs font-semibold tabular-nums text-gray-600">{fmtPct(m.gy9)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hospital roster */}
            {showHospitals && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Hospitals</h3>
                  {hospitals && <span className="text-[11px] text-gray-400">{hospitals.length} in this market</span>}
                </div>

                {hospitalsLoading && <div className="py-6 text-center text-sm text-gray-500">Loading hospitals…</div>}

                {!hospitalsLoading && hospitals && hospitals.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    No hospitals found for this plan here.
                  </div>
                )}

                {!hospitalsLoading && inPlan.length > 0 && (
                  <div className="mb-3">
                    <div className="mb-1 text-[11px] font-semibold text-emerald-700">In plan data · {inPlan.length}</div>
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                      {inPlan.map((h) => (
                        <HospitalRowItem key={h.hospital_npi} h={h} onClick={() => onSelectHospital(h.hospital_npi, h.hospital_name, h.city)} />
                      ))}
                    </div>
                  </div>
                )}

                {!hospitalsLoading && noData.length > 0 && (
                  <div>
                    <div className="mb-1 text-[11px] font-semibold text-gray-400">No data found · {noData.length}</div>
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                      {noData.map((h) => (
                        <HospitalRowItem key={h.hospital_npi} h={h} onClick={() => onSelectHospital(h.hospital_npi, h.hospital_name, h.city)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
