import { X, ArrowUp, ArrowDown, Minus, ArrowRight } from 'lucide-react';
import type { PRRow } from './ProductionRunData';
import {
  STATE_NAMES, fmtPct, fmtDelta, fmtSpendPerK, labelToAbbrevs,
  LABEL_FULL, flagColorClasses,
} from './ProductionRunData';

interface Props {
  open: boolean;
  state: string;
  carrier: string;
  // When set, popup is MSA-scoped rather than state-scoped
  msaName?: string;
  // MSA/STATE TOTAL/TOTAL row for headline metrics
  totalRow: PRRow | null;
  // Setting-breakdown rows for the same scope+carrier (all billing_class/setting_type combos)
  settingRows: PRRow[];
  onClose: () => void;
}

interface MetricRowProps {
  label: string;
  baseStr: string;
  newStr: string;
  deltaStr: string;
  deltaSign: number; // -1 negative, 0 neutral, 1 positive; controls color
  betterWhenUp: boolean;
}

function MetricRow({ label, baseStr, newStr, deltaStr, deltaSign, betterWhenUp }: MetricRowProps) {
  let deltaColor = 'text-gray-500';
  if (deltaSign !== 0) {
    const good = betterWhenUp ? deltaSign > 0 : deltaSign < 0;
    deltaColor = good ? 'text-emerald-600' : 'text-red-600';
  }
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-2 pr-2 text-sm text-gray-600">{label}</td>
      <td className="py-2 px-2 text-right font-mono text-sm text-gray-500 tabular-nums">{baseStr}</td>
      <td className="py-2 px-2 text-right font-mono text-sm font-semibold text-gray-900 tabular-nums">{newStr}</td>
      <td className={`py-2 pl-2 text-right font-mono text-xs tabular-nums ${deltaColor}`}>{deltaStr}</td>
    </tr>
  );
}

function settingLabel(billing: string, setting: string): string | null {
  if (billing === 'institutional' && setting === 'inpatient') return 'Inpatient';
  if (billing === 'institutional' && setting === 'outpatient') return 'Outpatient Facility';
  if (billing === 'professional' && setting === 'outpatient') return 'Professional';
  return null;
}

function directionBadge(direction: string) {
  const map: Record<string, { label: string; cls: string; Icon: typeof ArrowUp }> = {
    improved:    { label: 'Improved',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: ArrowUp },
    regressed:   { label: 'Regressed',   cls: 'bg-red-50 text-red-800 border-red-300',             Icon: ArrowDown },
    still_clean: { label: 'Still Clean', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', Icon: Minus },
    stable:      { label: 'Stable',      cls: 'bg-yellow-50 text-yellow-800 border-yellow-300',    Icon: Minus },
  };
  return map[direction] ?? null;
}

export function ProductionRunCellDetail({ open, state, carrier, msaName, totalRow, settingRows, onClose }: Props) {
  if (!open) return null;

  const stateFull = STATE_NAMES[state] ?? state;
  const scopeLabel = msaName ?? stateFull;
  const dirInfo = totalRow ? directionBadge(totalRow.review_direction) : null;
  const newFlags = totalRow
    ? [
        ...labelToAbbrevs(totalRow.review_label_new ?? ''),
        ...labelToAbbrevs(totalRow.supplementary_label_new ?? ''),
      ]
    : [];
  const newFlagsClass = flagColorClasses(totalRow?.flag_canonical_count_new ?? null);

  return (
    <>
      <div
        className="fixed inset-0 z-[1100] bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 z-[1101] flex h-screen w-full max-w-[540px] flex-col bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={`Quality detail for ${scopeLabel} ${carrier}`}
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {msaName ? 'MSA Detail' : 'Cell Detail'}
            </div>
            <div className="mt-1 flex items-center gap-2 text-base font-bold text-[#001A41]">
              <span>{scopeLabel}</span>
              <span className="text-gray-300">|</span>
              <span>{carrier}</span>
            </div>
            {msaName && (
              <div className="mt-0.5 text-xs text-gray-400">{stateFull}</div>
            )}
            <div className="mt-1 text-xs text-gray-500">v8.2 <ArrowRight className="inline h-3 w-3" /> v9</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close detail panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!totalRow ? (
            <p className="text-sm text-gray-500">No data available for this state and carrier.</p>
          ) : (
            <>
              {/* Section 1: Quality Snapshot */}
              <section className="mb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Quality Snapshot</h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col />
                      <col style={{ width: '6.5rem' }} />
                      <col style={{ width: '6.5rem' }} />
                      <col style={{ width: '5rem' }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="py-2 pl-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">Metric</th>
                        <th className="py-2 px-2 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">v8.2</th>
                        <th className="py-2 px-2 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">v9</th>
                        <th className="py-2 pl-2 pr-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">Δ</th>
                      </tr>
                    </thead>
                    <tbody className="[&_td:first-child]:pl-3 [&_td:last-child]:pr-3">
                      <MetricRow
                        label="G/Y (MRF-Backed) %"
                        baseStr={fmtPct(totalRow.pct_greenyellow_base)}
                        newStr={fmtPct(totalRow.pct_greenyellow_new)}
                        deltaStr={fmtDelta(totalRow.delta_pct_greenyellow)}
                        deltaSign={Math.sign(totalRow.delta_pct_greenyellow ?? 0)}
                        betterWhenUp
                      />
                      <MetricRow
                        label="Red %"
                        baseStr={fmtPct(totalRow.pct_red_base)}
                        newStr={fmtPct(totalRow.pct_red_new)}
                        deltaStr={fmtDelta(totalRow.delta_pct_red)}
                        deltaSign={Math.sign(totalRow.delta_pct_red ?? 0)}
                        betterWhenUp={false}
                      />
                      <MetricRow
                        label="Missing %"
                        baseStr={fmtPct(totalRow.pct_missing_base)}
                        newStr={fmtPct(totalRow.pct_missing_new)}
                        deltaStr={fmtDelta(totalRow.delta_pct_missing)}
                        deltaSign={Math.sign(totalRow.delta_pct_missing ?? 0)}
                        betterWhenUp={false}
                      />
                      <MetricRow
                        label="Carrier MRF %"
                        baseStr={fmtPct(totalRow.pct_carrier_mrf_spend_base)}
                        newStr={fmtPct(totalRow.pct_carrier_mrf_spend_new)}
                        deltaStr={fmtDelta(totalRow.delta_pct_carrier_mrf)}
                        deltaSign={Math.sign(totalRow.delta_pct_carrier_mrf ?? 0)}
                        betterWhenUp
                      />
                      <MetricRow
                        label="Hospital MRF %"
                        baseStr={fmtPct(totalRow.pct_hospital_mrf_spend_base)}
                        newStr={fmtPct(totalRow.pct_hospital_mrf_spend_new)}
                        deltaStr={fmtDelta(totalRow.delta_pct_hospital_mrf)}
                        deltaSign={Math.sign(totalRow.delta_pct_hospital_mrf ?? 0)}
                        betterWhenUp
                      />
                      <MetricRow
                        label="Imputed %"
                        baseStr={fmtPct(totalRow.pct_imputed_spend_base)}
                        newStr={fmtPct(totalRow.pct_imputed_spend_new)}
                        deltaStr={fmtDelta(totalRow.delta_pct_imputed)}
                        deltaSign={Math.sign(totalRow.delta_pct_imputed ?? 0)}
                        betterWhenUp={false}
                      />
                      <MetricRow
                        label="Spend per 1k"
                        baseStr={fmtSpendPerK(totalRow.total_weighted_rate_base)}
                        newStr={fmtSpendPerK(totalRow.total_weighted_rate_new)}
                        deltaStr={fmtPct(totalRow.pct_change_total_weighted_rate)}
                        deltaSign={0}
                        betterWhenUp
                      />
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Section 2: Label Transition */}
              <section className="mb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Label Transition</h3>
                <div className="rounded-lg border border-gray-200 px-4 py-3">
                  <div className="break-words text-sm font-medium text-[#001A41]">
                    {totalRow.label_transition && totalRow.label_transition.trim() !== ''
                      ? totalRow.label_transition
                      : `${totalRow.review_label_base || 'clean'} → ${totalRow.review_label_new || 'clean'}`}
                  </div>
                  {dirInfo && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${dirInfo.cls}`}>
                        <dirInfo.Icon className="h-3 w-3" />
                        {dirInfo.label}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Section 3: Setting Breakdown */}
              <section className="mb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Setting Breakdown — G/Y %</h3>
                <div className="space-y-2">
                  {settingRows.length === 0 && (
                    <p className="text-xs text-gray-500">No setting-level data available.</p>
                  )}
                  {settingRows.map((sr) => {
                    const lbl = settingLabel(sr.billing_class, sr.setting_type);
                    if (!lbl) return null;
                    const dlt = sr.delta_pct_greenyellow;
                    const dltColor = dlt === null
                      ? 'text-gray-500'
                      : dlt > 0 ? 'text-emerald-600' : dlt < 0 ? 'text-red-600' : 'text-gray-500';
                    return (
                      <div
                        key={`${sr.billing_class}-${sr.setting_type}`}
                        className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 rounded-md border border-gray-200 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-gray-700">{lbl}</span>
                        <span className="font-mono text-xs text-gray-500 tabular-nums">{fmtPct(sr.pct_greenyellow_base)}</span>
                        <ArrowRight className="h-3 w-3 text-gray-300" />
                        <span className="font-mono text-sm text-gray-900 tabular-nums">{fmtPct(sr.pct_greenyellow_new)}</span>
                        <span className={`font-mono text-xs tabular-nums ${dltColor}`}>{fmtDelta(dlt)}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Section 4: Flags */}
              <section className="mb-2">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">v9 Review Flags</h3>
                {newFlags.length === 0 ? (
                  <div className={`inline-flex rounded-md border px-3 py-1.5 text-sm font-medium ${newFlagsClass}`}>
                    Clean — passes all 4 thresholds (no flags tripped)
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {newFlags.map((abbr, idx) => (
                      <span
                        key={`${abbr}-${idx}`}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${newFlagsClass}`}
                        title={LABEL_FULL[abbr] ?? abbr}
                      >
                        <span className="font-mono">{abbr}</span>
                        <span className="font-normal opacity-80">{LABEL_FULL[abbr] ?? ''}</span>
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
