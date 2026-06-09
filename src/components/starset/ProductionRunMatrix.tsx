import { useEffect, useRef } from 'react';
import { Check, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { PRRow, Version, Carrier } from './ProductionRunData';
import {
  CARRIERS, CARRIER_SHORT, STATE_ORDER, STATE_NAMES,
  getCellViewData, LABEL_FULL, fmtPct, fmtDelta,
} from './ProductionRunData';

interface Props {
  // STATE/TOTAL/TOTAL rows keyed by state -> carrier -> row
  stateMatrix: Record<string, Record<string, PRRow>>;
  visibleCarriers: Carrier[];
  version: Version;
  onCellClick: (state: string, carrier: Carrier, row: PRRow | null) => void;
  scrollToState: string | null;
  onScrollHandled: () => void;
}

export function ProductionRunMatrix({
  stateMatrix, visibleCarriers, version, onCellClick, scrollToState, onScrollHandled,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  useEffect(() => {
    if (!scrollToState) return;
    const row = rowRefs.current[scrollToState];
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.classList.add('ring-2', 'ring-[#009DE0]', 'ring-offset-1');
      const t = setTimeout(() => {
        row.classList.remove('ring-2', 'ring-[#009DE0]', 'ring-offset-1');
        onScrollHandled();
      }, 1800);
      return () => clearTimeout(t);
    }
    onScrollHandled();
  }, [scrollToState, onScrollHandled]);

  return (
    <div
      ref={scrollRef}
      className="relative max-h-[70vh] overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
        <colgroup>
          <col style={{ width: '9rem' }} />
          {visibleCarriers.map((c) => (
            <col key={c} />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-20 bg-white">
          <tr>
            <th
              className="sticky left-0 z-30 border-b border-r border-gray-200 bg-white px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500"
            >
              State
            </th>
            {visibleCarriers.map((c) => (
              <th
                key={c}
                className="border-b border-gray-200 bg-white px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                title={c}
              >
                {CARRIER_SHORT[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STATE_ORDER.map((st) => {
            const carrierRows = stateMatrix[st] ?? {};
            return (
              <tr
                key={st}
                ref={(el) => { rowRefs.current[st] = el; }}
                className="transition-shadow"
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b border-r border-gray-200 bg-white px-3 py-2 text-left align-top"
                >
                  <div className="text-sm font-semibold text-[#001A41]">{st}</div>
                  <div className="text-[10px] text-gray-400">{STATE_NAMES[st]}</div>
                </th>
                {visibleCarriers.map((c) => {
                  const row = carrierRows[c] ?? null;
                  const view = getCellViewData(row, version);
                  return (
                    <td
                      key={c}
                      className="border-b border-gray-100 p-1.5 align-top"
                    >
                      <button
                        onClick={() => onCellClick(st, c, row)}
                        className={`flex w-full flex-col gap-1 rounded-md border px-2 py-1.5 text-left text-xs transition-shadow hover:shadow-md ${view.colorClasses}`}
                        title={view.label || (row ? 'clean' : 'No data')}
                        disabled={!row}
                      >
                        {version === 'delta' ? (
                          <DeltaCellBody view={view} />
                        ) : (
                          <VersionCellBody view={view} />
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
  );
}

function VersionCellBody({ view }: { view: ReturnType<typeof getCellViewData> }) {
  if (!view.row) return <span className="text-[11px] italic">No data</span>;
  if (view.abbrevs.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
        <Check className="h-3 w-3" />
        Clean
      </span>
    );
  }
  return (
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
  );
}

function DeltaCellBody({ view }: { view: ReturnType<typeof getCellViewData> }) {
  if (!view.row) return <span className="text-[11px] italic">No data</span>;
  const dir = view.direction;
  const gy = view.row.pct_greenyellow_new;
  const dlt = view.row.delta_pct_greenyellow;

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

interface CarrierTogglesProps {
  visibleCarriers: Carrier[];
  onToggle: (c: Carrier) => void;
}

export function CarrierToggles({ visibleCarriers, onToggle }: CarrierTogglesProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Carriers</span>
      {CARRIERS.map((c) => {
        const on = visibleCarriers.includes(c);
        return (
          <button
            key={c}
            onClick={() => onToggle(c)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              on
                ? 'border-[#001A41] bg-[#001A41] text-white'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}
            aria-pressed={on}
          >
            {CARRIER_SHORT[c]}
          </button>
        );
      })}
    </div>
  );
}
