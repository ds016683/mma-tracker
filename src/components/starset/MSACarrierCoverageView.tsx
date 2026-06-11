import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Minus, X, Info } from 'lucide-react';
import {
  parseCSV, BUCKET_LABELS, BUCKET_ORDER,
  NATIONAL_CARRIERS, gyColorClasses, deltaColor, fmtPct, fmtDelta,
  type CCRow, type BucketKey,
} from './MSACarrierCoverageData';

const CSV_URL = '/mma-tracker/data/carrier-coverage-comparison.csv';

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

interface CellProps {
  rows: CCRow[]; // all 4 bucket rows for this msa × carrier
  onClick: () => void;
}

function CoverageCell({ rows, onClick }: CellProps) {
  if (rows.length === 0) {
    return (
      <td className="border-b border-gray-100 p-1 align-top">
        <div className="flex h-full min-h-[80px] items-center justify-center rounded-md border border-dashed border-gray-200 text-[11px] italic text-gray-400">
          No data
        </div>
      </td>
    );
  }

  return (
    <td className="border-b border-gray-100 p-1 align-top">
      <button
        onClick={onClick}
        className="w-full rounded-md border border-gray-200 bg-white text-left transition-shadow hover:shadow-md focus:outline-none"
      >
        {BUCKET_ORDER.map(bk => {
          const r = rows.find(x => x.bucket === bk);
          if (!r) return (
            <div key={bk} className="flex items-center gap-1 border-b border-gray-100 px-2 py-1.5 last:border-0">
              <span className="w-14 shrink-0 text-[10px] font-medium text-gray-400">{BUCKET_LABELS[bk]}</span>
              <span className="text-[10px] italic text-gray-300">—</span>
            </div>
          );
          const cc = gyColorClasses(r.gy9, r.ooa);
          return (
            <div key={bk} className={`flex items-start gap-1.5 border-b border-gray-100 px-2 py-1.5 last:border-0 rounded-sm ${cc}`}>
              <span className="w-14 shrink-0 text-[10px] font-semibold opacity-70">{BUCKET_LABELS[bk]}</span>
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                {/* G/Y row */}
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-medium opacity-60">G/Y</span>
                  <span className="font-mono text-[11px] font-bold tabular-nums">{fmtPct(r.gy9)}</span>
                  <DeltaBadge d={r.gyd} />
                </div>
                {/* Codebasket row */}
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-medium opacity-60">CB</span>
                  <span className="font-mono text-[11px] tabular-nums">{fmtPct(r.cb9)}</span>
                  <DeltaBadge d={r.cbd} />
                </div>
                {r.ooa && <OOABadge />}
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
  search: string;
  onSearch: (s: string) => void;
}

function CarrierToggles({ allCarriers, visible, onToggle, search, onSearch }: CarrierTogglesProps) {
  const filtered = allCarriers.filter(c => c.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Carriers</span>
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search…"
          className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs focus:outline-none focus:border-gray-400 w-40"
        />
        <span className="text-[11px] text-gray-400">{visible.length} selected</span>
      </div>
      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
        {filtered.map(c => {
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

function Legend() {
  const tiers = [
    { cls: 'bg-emerald-50 border-emerald-200', label: '≥75%' },
    { cls: 'bg-green-50 border-green-200',     label: '60–74%' },
    { cls: 'bg-yellow-50 border-yellow-300',   label: '45–59%' },
    { cls: 'bg-orange-50 border-orange-300',   label: '30–44%' },
    { cls: 'bg-red-50 border-red-300',         label: '<30%' },
    { cls: 'bg-gray-50 border-gray-300',       label: 'OOA' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs text-gray-600 shadow-sm">
      <span className="font-semibold uppercase tracking-wider text-gray-400 text-[10px]">G/Y Color</span>
      {tiers.map(t => (
        <span key={t.label} className="inline-flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded-sm border ${t.cls}`} />
          {t.label}
        </span>
      ))}
      <span className="ml-auto text-[11px] text-gray-400">G/Y = % Green/Yellow · CB = % Codebasket · Δ = v9 − v8.2</span>
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

interface OpenCell { msaId: string; carrier: string; }

export function MSACarrierCoverageView() {
  const [rows, setRows] = useState<CCRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [visibleCarriers, setVisibleCarriers] = useState<string[]>([...NATIONAL_CARRIERS]);
  const [carrierSearch, setCarrierSearch] = useState('');
  const [openCell, setOpenCell] = useState<OpenCell | null>(null);
  const [showOOA, setShowOOA] = useState(true);

  useEffect(() => {
    fetch(CSV_URL)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(text => setRows(parseCSV(text)))
      .catch(e => setError(String(e?.message ?? e)));
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
    if (indexed && !selectedState && indexed.states.length > 0) {
      setSelectedState(indexed.states[0]);
    }
  }, [indexed, selectedState]);

  const stateMsaMap = useMemo(() => {
    if (!indexed || !selectedState) return {};
    return indexed.byState[selectedState] ?? {};
  }, [indexed, selectedState]);

  const orderedMsaIds = useMemo(() => {
    return Object.entries(stateMsaMap)
      .sort((a, b) => {
        const nameA = indexed?.msaNames[a[0]] ?? '';
        const nameB = indexed?.msaNames[b[0]] ?? '';
        return nameA.localeCompare(nameB);
      })
      .map(([id]) => id);
  }, [stateMsaMap, indexed]);

  const toggleCarrier = (c: string) => {
    setVisibleCarriers(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const openCellRows = useMemo(() => {
    if (!openCell || !indexed || !selectedState) return [];
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
              {indexed?.states.map(s => (
                <option key={s} value={s}>{s} — {STATE_NAMES[s] ?? s}</option>
              ))}
            </select>
            {orderedMsaIds.length > 0 && (
              <span className="text-xs text-gray-400">{orderedMsaIds.length} MSAs</span>
            )}
          </div>

          {/* OOA toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
            <input
              type="checkbox"
              checked={showOOA}
              onChange={e => setShowOOA(e.target.checked)}
              className="rounded"
            />
            Show out-of-area carriers
          </label>
        </div>

        {/* Carrier toggles */}
        {indexed && (
          <CarrierToggles
            allCarriers={indexed.allCarriers}
            visible={visibleCarriers}
            onToggle={toggleCarrier}
            search={carrierSearch}
            onSearch={setCarrierSearch}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
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
            No MSA data for {STATE_NAMES[selectedState] ?? selectedState}.
          </div>
        )}

        {rows && indexed && visibleCarriers.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-8 text-center text-sm text-gray-500">
            Select at least one carrier to display data.
          </div>
        )}

        {rows && indexed && orderedMsaIds.length > 0 && visibleCarriers.length > 0 && (
          <>
            <Legend />

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
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
                            const totalRow = bucketRows.find(r => r.bucket === 'TOTAL');
                            if (!showOOA && totalRow?.ooa) {
                              return (
                                <td key={carrier} className="border-b border-gray-100 p-1 align-top">
                                  <div className="flex h-full min-h-[80px] items-center justify-center rounded-md border border-dashed border-gray-200 text-[11px] italic text-gray-300">
                                    OOA hidden
                                  </div>
                                </td>
                              );
                            }
                            return (
                              <CoverageCell
                                key={carrier}
                                rows={bucketRows}
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
            </div>
          </>
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
