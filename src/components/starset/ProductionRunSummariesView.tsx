import { useEffect, useMemo, useState } from 'react';
import { FileText, Map as MapIcon } from 'lucide-react';
import type { PRRow, Carrier, Version } from './ProductionRunData';
import { CARRIERS, parseCSV } from './ProductionRunData';
import { ProductionRunMatrix, CarrierToggles } from './ProductionRunMatrix';
import { ProductionRunCellDetail } from './ProductionRunCellDetail';
import { ProductionRunNational } from './ProductionRunNational';
import { ProductionRunMSA } from './ProductionRunMSA';
import { ProductionRunPdfPanel } from './ProductionRunPdfPanel';
import { ProductionRunHeatmap, type HeatmapMetric } from './ProductionRunHeatmap';
import { ProductionRunLegend } from './ProductionRunLegend';

const CSV_URL = '/mma-tracker/data/production-run-v9-comparison.csv';

type Grain = 'national' | 'state' | 'msa';

interface OpenCell {
  state: string;
  carrier: Carrier;
  msaId?: string;
  msaName?: string;
}

export function ProductionRunSummariesView() {
  const [rows, setRows] = useState<PRRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [grain, setGrain] = useState<Grain>('state');
  const [version, setVersion] = useState<Version>('new');
  const [visibleCarriers, setVisibleCarriers] = useState<Carrier[]>([...CARRIERS]);
  const [showMap, setShowMap] = useState(false);
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('gy');
  const [pdfOpen, setPdfOpen] = useState(false);

  const [openCell, setOpenCell] = useState<OpenCell | null>(null);
  const [msaState, setMsaState] = useState<string>('');
  const [scrollToState, setScrollToState] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(CSV_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        const parsed = parseCSV(text);
        setRows(parsed);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e?.message ?? e));
      });
    return () => { cancelled = true; };
  }, []);

  // Build indexed views
  const indexed = useMemo(() => {
    if (!rows) return null;

    // STATE/TOTAL/TOTAL rows: state -> carrier -> row
    const stateMatrix: Record<string, Record<string, PRRow>> = {};
    // STATE rows by setting (all billing_class/setting_type combos): state -> carrier -> rows[]
    const stateSettings: Record<string, Record<string, PRRow[]>> = {};
    // NATIONAL/TOTAL/TOTAL: carrier -> row
    const nationalTotals: Record<string, PRRow> = {};
    // NATIONAL by setting: carrier -> rows[]
    const nationalBySetting: Record<string, PRRow[]> = {};
    // MSA/TOTAL/TOTAL by state: state -> msa_id -> carrier -> row
    const msaByState: Record<string, Record<string, Record<string, PRRow>>> = {};
    // MSA setting rows: state -> msa_id -> carrier -> rows[]
    const msaSettings: Record<string, Record<string, Record<string, PRRow[]>>> = {};
    // msa_id -> name
    const msaNames: Record<string, string> = {};

    for (const r of rows) {
      const c = r.carrier_plan_name as Carrier;
      const isTotal = r.billing_class === 'TOTAL' && r.setting_type === 'TOTAL';

      if (r.row_grain === 'NATIONAL') {
        if (isTotal) {
          nationalTotals[c] = r;
        } else {
          (nationalBySetting[c] ||= []).push(r);
        }
      } else if (r.row_grain === 'STATE') {
        const st = r.state;
        if (!st) continue;
        if (isTotal) {
          (stateMatrix[st] ||= {})[c] = r;
        }
        ((stateSettings[st] ||= {})[c] ||= []).push(r);
      } else if (r.row_grain === 'MSA') {
        const st = r.state;
        const id = r.msa_id;
        if (!st || !id) continue;
        if (isTotal) {
          ((msaByState[st] ||= {})[id] ||= {})[c] = r;
        } else {
          (((msaSettings[st] ||= {})[id] ||= {})[c] ||= []).push(r);
        }
        if (r.msa_cbsa_name && !msaNames[id]) msaNames[id] = r.msa_cbsa_name;
      }
    }

    return { stateMatrix, stateSettings, nationalTotals, nationalBySetting, msaByState, msaSettings, msaNames };
  }, [rows]);

  const statesWithMsa = useMemo(() => {
    if (!indexed) return [];
    return Object.keys(indexed.msaByState).sort();
  }, [indexed]);

  // Default MSA state when grain switches to MSA
  useEffect(() => {
    if (grain !== 'msa' || msaState || statesWithMsa.length === 0) return;
    setMsaState('ALL');
  }, [grain, msaState, statesWithMsa]);

  const toggleCarrier = (c: Carrier) => {
    setVisibleCarriers((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...CARRIERS].filter((x) => prev.includes(x) || x === c)
    );
  };

  const handleCellClick = (state: string, carrier: Carrier, row: PRRow | null) => {
    if (!row) return;
    if (row.row_grain === 'MSA') {
      setOpenCell({ state, carrier, msaId: row.msa_id || undefined, msaName: row.msa_cbsa_name || undefined });
    } else {
      setOpenCell({ state, carrier });
    }
  };

  const cellTotalRow = useMemo(() => {
    if (!openCell || !indexed) return null;
    if (openCell.msaId) {
      return indexed.msaByState[openCell.state]?.[openCell.msaId]?.[openCell.carrier] ?? null;
    }
    return indexed.stateMatrix[openCell.state]?.[openCell.carrier] ?? null;
  }, [openCell, indexed]);

  const cellSettingRows = useMemo(() => {
    if (!openCell || !indexed) return [];
    if (openCell.msaId) {
      return indexed.msaSettings?.[openCell.state]?.[openCell.msaId]?.[openCell.carrier] ?? [];
    }
    return indexed.stateSettings[openCell.state]?.[openCell.carrier] ?? [];
  }, [openCell, indexed]);

  return (
    <div className="flex h-screen flex-col bg-mma-light-bg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-[#001A41]">Production Run Summaries</h1>
          <p className="text-sm text-gray-500">
            v8.2 vs v9 pre-production comparison — state × carrier quality stoplight matrix.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPdfOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <FileText className="h-4 w-4" />
            Reference Docs
          </button>
        </div>
      </div>

      {/* Controls bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {/* Grain */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Grain</span>
            <div className="flex rounded-md border border-gray-200 p-0.5 text-xs">
              {(['national', 'state', 'msa'] as Grain[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGrain(g)}
                  className={`rounded px-3 py-1 font-medium capitalize transition-colors ${
                    grain === g ? 'bg-[#001A41] text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >{g}</button>
              ))}
            </div>
          </div>

          {/* Version */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Version</span>
            <div className="flex rounded-md border border-gray-200 p-0.5 text-xs">
              {([
                { id: 'base' as Version, label: 'v8.2' },
                { id: 'new'  as Version, label: 'v9' },
                { id: 'delta' as Version, label: 'Δ Delta' },
              ]).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVersion(v.id)}
                  className={`rounded px-3 py-1 font-medium transition-colors ${
                    version === v.id ? 'bg-[#001A41] text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >{v.label}</button>
              ))}
            </div>
          </div>

          {/* Carriers */}
          <CarrierToggles visibleCarriers={visibleCarriers} onToggle={toggleCarrier} />

          {/* Map toggle (state grain only) */}
          {grain === 'state' && (
            <button
              onClick={() => setShowMap((v) => !v)}
              className={`ml-auto inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                showMap
                  ? 'border-[#001A41] bg-[#001A41] text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              {showMap ? 'Hide map' : 'Map view'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={grain === 'msa' ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-5' : 'flex-1 overflow-auto px-6 py-5'}>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load comparison data: {error}
          </div>
        )}
        {!rows && !error && (
          <div className="flex items-center justify-center py-16 text-sm text-gray-500">Loading comparison data…</div>
        )}
        {rows && indexed && (
          <>
            {grain === 'national' && (
              <div className="mb-6">
                <ProductionRunNational
                  nationalTotals={indexed.nationalTotals}
                  nationalBySetting={indexed.nationalBySetting}
                  version={version}
                  visibleCarriers={visibleCarriers}
                />
              </div>
            )}

            {grain === 'state' && showMap && visibleCarriers.length > 0 && (
              <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <ProductionRunHeatmap
                  stateMatrix={indexed.stateMatrix}
                  visibleCarriers={visibleCarriers}
                  metric={heatmapMetric}
                  onMetricChange={setHeatmapMetric}
                  version={version}
                  onStateClick={(st) => setScrollToState(st)}
                />
              </div>
            )}

            {(grain === 'state' || grain === 'national') && visibleCarriers.length > 0 && (
              <>
                <div className="mb-3">
                  <ProductionRunLegend version={version} />
                </div>
                <ProductionRunMatrix
                  stateMatrix={indexed.stateMatrix}
                  visibleCarriers={visibleCarriers}
                  version={version}
                  onCellClick={handleCellClick}
                  scrollToState={scrollToState}
                  onScrollHandled={() => setScrollToState(null)}
                />
              </>
            )}

            {grain === 'msa' && (
              <>
                <div className="mb-3">
                  <ProductionRunLegend version={version} />
                </div>
                <ProductionRunMSA
                  msaMatrix={msaState === 'ALL' ? {} : (indexed.msaByState[msaState] ?? {})}
                  msaByState={indexed.msaByState}
                  msaNames={indexed.msaNames}
                  statesWithMsa={statesWithMsa}
                  selectedState={msaState || 'ALL'}
                  onStateChange={setMsaState}
                  visibleCarriers={visibleCarriers}
                  version={version}
                  onCellClick={handleCellClick}
                />
              </>
            )}

            {visibleCarriers.length === 0 && (
              <div className="rounded-md border border-dashed border-gray-300 bg-white px-6 py-8 text-center text-sm text-gray-500">
                Select at least one carrier to display data.
              </div>
            )}
          </>
        )}
      </div>

      {/* PDF panel (persistent, lower z than cell detail) */}
      <ProductionRunPdfPanel open={pdfOpen && !openCell} onClose={() => setPdfOpen(false)} />

      {/* Cell detail panel (takes priority over PDF panel) */}
      <ProductionRunCellDetail
        open={!!openCell}
        state={openCell?.state ?? ''}
        carrier={openCell?.carrier ?? ''}
        msaName={openCell?.msaName}
        totalRow={cellTotalRow}
        settingRows={cellSettingRows}
        onClose={() => setOpenCell(null)}
      />
    </div>
  );
}
