import { useMemo } from 'react';
import { Check, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { PRRow, Version, Carrier } from './ProductionRunData';
import {
  CARRIER_SHORT, STATE_ORDER, STATE_NAMES,
  getCellViewData, LABEL_FULL, fmtPct, fmtDelta,
} from './ProductionRunData';

interface Props {
  // MSA rows (TOTAL/TOTAL only) for selected state, keyed by msa_id -> carrier -> row
  msaMatrix: Record<string, Record<string, PRRow>>;
  // msa_id -> msa_cbsa_name
  msaNames: Record<string, string>;
  // All states with MSA data
  statesWithMsa: string[];
  selectedState: string;
  onStateChange: (s: string) => void;
  visibleCarriers: Carrier[];
  version: Version;
  onCellClick: (state: string, carrier: Carrier, row: PRRow | null) => void;
}

export function ProductionRunMSA({
  msaMatrix, msaNames, statesWithMsa, selectedState, onStateChange,
  visibleCarriers, version, onCellClick,
}: Props) {
  const orderedStates = useMemo(() => {
    const inOrder = STATE_ORDER.filter((s) => statesWithMsa.includes(s));
    const extras = statesWithMsa.filter((s) => !STATE_ORDER.includes(s));
    return [...inOrder, ...extras];
  }, [statesWithMsa]);

  const orderedMsaIds = useMemo(() => {
    return Object.keys(msaMatrix).sort((a, b) => {
      const na = msaNames[a] ?? '';
      const nb = msaNames[b] ?? '';
      return na.localeCompare(nb);
    });
  }, [msaMatrix, msaNames]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">State</label>
        <select
          value={selectedState}
          onChange={(e) => onStateChange(e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#001A41] focus:outline-none focus:ring-2 focus:ring-[#009DE0]"
        >
          {orderedStates.map((s) => (
            <option key={s} value={s}>
              {s} — {STATE_NAMES[s] ?? s}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400">{orderedMsaIds.length} MSAs</span>
      </div>

      {orderedMsaIds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-8 text-center text-sm text-gray-500">
          No MSA-level data for {STATE_NAMES[selectedState] ?? selectedState}.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
            <colgroup>
              <col style={{ width: '16rem' }} />
              {visibleCarriers.map((c) => (
                <col key={c} />
              ))}
            </colgroup>
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b border-gray-200 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  MSA
                </th>
                {visibleCarriers.map((c) => (
                  <th
                    key={c}
                    className="border-b border-gray-200 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {CARRIER_SHORT[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedMsaIds.map((msaId) => {
                const name = msaNames[msaId] ?? msaId;
                const carrierRows = msaMatrix[msaId] ?? {};
                return (
                  <tr key={msaId}>
                    <th
                      scope="row"
                      className="border-b border-gray-100 px-3 py-2 text-left align-top"
                    >
                      <div className="text-sm font-semibold text-[#001A41]">{name}</div>
                      <div className="text-[10px] text-gray-400">CBSA {msaId}</div>
                    </th>
                    {visibleCarriers.map((c) => {
                      const row = carrierRows[c] ?? null;
                      const view = getCellViewData(row, version);
                      return (
                        <td key={c} className="border-b border-gray-100 p-1.5 align-top">
                          <button
                            onClick={() => onCellClick(carrierRows[c]?.state ?? '', c as Carrier, row)}
                            className={`flex w-full flex-col gap-1 rounded-md border px-2 py-1.5 text-left text-xs transition-shadow hover:shadow-md ${view.colorClasses}`}
                            title={view.label || (row ? 'clean' : 'No data')}
                            disabled={!row}
                          >
                            {!row ? (
                              <span className="text-[11px] italic">No data</span>
                            ) : version === 'delta' ? (
                              <DeltaBody
                                dir={view.direction}
                                gy={row.pct_greenyellow_new}
                                dlt={row.delta_pct_greenyellow}
                              />
                            ) : view.abbrevs.length === 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
                                <Check className="h-3 w-3" /> Clean
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {view.abbrevs.map((abbr, idx) => (
                                  <span
                                    key={`${abbr}-${idx}`}
                                    className="inline-flex items-center rounded bg-white/60 px-1.5 py-0.5 font-mono text-[10px] font-bold"
                                    title={LABEL_FULL[abbr] ?? abbr}
                                  >
                                    {abbr}
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                        </td>
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
  );
}

function DeltaBody({ dir, gy, dlt }: { dir: string; gy: number | null; dlt: number | null }) {
  let label = 'Stable';
  let Icon: typeof ArrowUp = Minus;
  let iconChar: string | null = null;
  if (dir === 'improved') { label = 'Improved'; Icon = ArrowUp; }
  else if (dir === 'regressed') { label = 'Regressed'; Icon = ArrowDown; }
  else if (dir === 'still_clean') { label = 'Clean'; Icon = Minus; }
  else { label = 'Stable'; iconChar = '~'; }
  return (
    <div className="flex w-full flex-col gap-0.5">
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
        {iconChar ? <span className="font-mono leading-none">{iconChar}</span> : <Icon className="h-3 w-3" />}
        {label}
      </span>
      <span className="font-mono text-[10px] tabular-nums opacity-80">
        G/Y {fmtPct(gy)} <span className="opacity-75">· {fmtDelta(dlt)}</span>
      </span>
    </div>
  );
}

