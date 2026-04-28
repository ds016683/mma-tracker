import { useState } from 'react';

// ── Synthetic data per version ────────────────────────────────────────────────
const VERSIONS = ['v9 (Active)', 'v8 (Baseline)', 'v7 (Archive)'];

interface StageData {
  total: number;
  passed: number;
  rejected: number;
  rescueQueue?: number;
}

interface PipelineData {
  source: number;
  staging: StageData;
  pp0: StageData;
  postProcessing: StageData;
}

const SYNTHETIC: Record<string, PipelineData> = {
  'v9 (Active)': {
    source: 2847,
    staging:        { total: 2847, passed: 2541, rejected: 306 },
    pp0:            { total: 2541, passed: 2388, rejected: 153, rescueQueue: 153 },
    postProcessing: { total: 2388, passed: 2201, rejected: 187 },
  },
  'v8 (Baseline)': {
    source: 2614,
    staging:        { total: 2614, passed: 2401, rejected: 213 },
    pp0:            { total: 2401, passed: 2289, rejected: 112, rescueQueue: 112 },
    postProcessing: { total: 2289, passed: 2184, rejected: 105 },
  },
  'v7 (Archive)': {
    source: 2198,
    staging:        { total: 2198, passed: 1977, rejected: 221 },
    pp0:            { total: 1977, passed: 1841, rejected: 136, rescueQueue: 136 },
    postProcessing: { total: 1841, passed: 1744, rejected: 97 },
  },
};

function pct(num: number, den: number) {
  return den === 0 ? 0 : Math.round((num / den) * 100);
}

function fmt(n: number) {
  return n.toLocaleString();
}

// ── Pipeline gauge ────────────────────────────────────────────────────────────
interface Tick {
  label: string;
  position: number; // 0–100
  count: number;
  isBranch?: boolean;
}

function PipelineGauge({ data, source }: { data: PipelineData; source: number }) {
  const fillPct = pct(data.postProcessing.passed, source);

  const ticks: Tick[] = [
    { label: 'Source',          position: 0,   count: source },
    { label: 'Staging',         position: 30,  count: data.staging.passed },
    { label: 'Staging Rejects', position: 30,  count: data.staging.rejected, isBranch: true },
    { label: 'PP0',             position: 62,  count: data.pp0.passed },
    { label: 'Rescue Queue',    position: 62,  count: data.pp0.rescueQueue ?? 0, isBranch: true },
    { label: 'Post-Processing', position: 100, count: data.postProcessing.passed },
  ];

  const mainTicks = ticks.filter(t => !t.isBranch);
  const branchTicks = ticks.filter(t => t.isBranch);

  return (
    <div className="mb-8">
      {/* Bar */}
      <div className="relative h-5 rounded-full bg-gray-100 overflow-visible">
        {/* Fill */}
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${fillPct}%`, background: 'linear-gradient(90deg, #224057 0%, #234D8B 60%, #F8C762 100%)' }}
        />
        {/* Main tick marks */}
        {mainTicks.map(tick => (
          <div key={tick.label}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${tick.position}%` }}>
            <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
              tick.position === 0 ? 'bg-[#224057]' :
              tick.position <= fillPct ? 'bg-[#234D8B]' : 'bg-gray-300'
            }`} />
          </div>
        ))}
      </div>

      {/* Tick labels — main pipeline */}
      <div className="relative mt-2" style={{ height: 40 }}>
        {mainTicks.map(tick => (
          <div key={tick.label}
            className="absolute flex flex-col items-center"
            style={{ left: `${tick.position}%`, transform: 'translateX(-50%)' }}>
            <span className="text-[10px] font-semibold text-[#224057] whitespace-nowrap">{tick.label}</span>
            <span className="text-[11px] font-bold text-gray-700">{fmt(tick.count)}</span>
          </div>
        ))}
      </div>

      {/* Branch indicators */}
      <div className="mt-4 flex gap-6">
        {branchTicks.map(tick => (
          <div key={tick.label} className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5">
            <svg width="16" height="16" viewBox="0 0 16 16" className="text-amber-500 flex-shrink-0">
              <path d="M8 2 L8 10 M8 10 L4 14 M8 10 L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
            <span className="text-xs text-amber-700 font-medium">{tick.label}:</span>
            <span className="text-xs font-bold text-amber-800">{fmt(tick.count)}</span>
          </div>
        ))}
      </div>

      {/* Overall yield */}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#234D8B]" style={{ width: `${fillPct}%` }} />
        </div>
        <span className="text-xs font-semibold text-[#224057] whitespace-nowrap">
          {fillPct}% overall yield · {fmt(data.postProcessing.passed)} MRFs through full pipeline
        </span>
      </div>
    </div>
  );
}

// ── Summary table ─────────────────────────────────────────────────────────────
function SummaryTable({ data, source }: { data: PipelineData; source: number }) {
  const rows = [
    {
      stage: 'Source MRFs',
      description: 'Total hospital MRFs with data on file',
      totalIn: source,
      passed: source,
      failed: 0,
      yield: 100,
      isBranch: false,
    },
    {
      stage: 'Staging Table',
      description: 'MRFs successfully loaded to staging',
      totalIn: data.staging.total,
      passed: data.staging.passed,
      failed: data.staging.rejected,
      yield: pct(data.staging.passed, data.staging.total),
      isBranch: false,
    },
    {
      stage: '↳ Staging Rejects',
      description: 'MRFs rejected at ingestion — schema/format errors',
      totalIn: data.staging.rejected,
      passed: 0,
      failed: data.staging.rejected,
      yield: 0,
      isBranch: true,
    },
    {
      stage: 'PP0',
      description: 'MRFs passing pre-processing gate 0',
      totalIn: data.pp0.total,
      passed: data.pp0.passed,
      failed: data.pp0.rejected,
      yield: pct(data.pp0.passed, data.pp0.total),
      isBranch: false,
    },
    {
      stage: '↳ Rescue Queue',
      description: 'MRFs without reconciling payer names — queued for manual rescue',
      totalIn: data.pp0.rescueQueue ?? 0,
      passed: 0,
      failed: data.pp0.rescueQueue ?? 0,
      yield: 0,
      isBranch: true,
    },
    {
      stage: 'Post-Processing',
      description: 'MRFs completing full post-processing pipeline',
      totalIn: data.postProcessing.total,
      passed: data.postProcessing.passed,
      failed: data.postProcessing.rejected,
      yield: pct(data.postProcessing.passed, data.postProcessing.total),
      isBranch: false,
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-[#224057]">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">Stage</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70 hidden md:table-cell">Description</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">Total In</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">Passed</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">Failed / Branched</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">Yield</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className={`${row.isBranch ? 'bg-amber-50/60' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-blue-50/30 transition-colors`}>
              <td className="px-4 py-3">
                <span className={`font-medium ${row.isBranch ? 'text-amber-700 text-xs' : 'text-[#224057]'}`}>
                  {row.stage}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{row.description}</td>
              <td className="px-4 py-3 text-right font-mono text-sm text-gray-700">{fmt(row.totalIn)}</td>
              <td className="px-4 py-3 text-right font-mono text-sm text-emerald-700 font-semibold">
                {row.passed > 0 ? fmt(row.passed) : '—'}
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm text-red-500">
                {row.failed > 0 ? fmt(row.failed) : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                {row.stage === 'Source MRFs' || row.isBranch ? (
                  <span className="text-xs text-gray-400">—</span>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width: `${row.yield}%`,
                          background: row.yield >= 90 ? '#16a34a' : row.yield >= 75 ? '#F8C762' : '#ef4444' }} />
                    </div>
                    <span className={`text-xs font-semibold w-8 text-right ${
                      row.yield >= 90 ? 'text-emerald-700' : row.yield >= 75 ? 'text-amber-600' : 'text-red-600'
                    }`}>{row.yield}%</span>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export function ProductionProgressView() {
  const [selectedVersion, setSelectedVersion] = useState(VERSIONS[0]);
  const [sourceOverride, setSourceOverride] = useState<string>('');

  const data = SYNTHETIC[selectedVersion];
  const source = sourceOverride !== '' ? parseInt(sourceOverride.replace(/,/g, '')) || data.source : data.source;

  return (
    <div className="flex h-screen flex-col bg-[#f5f6f8]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-[#224057]">Production Progress</h1>
            <p className="text-xs text-gray-400 mt-0.5">v9 Hospital MRF Pipeline · Synthetic data</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Version toggle */}
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              {VERSIONS.map(v => (
                <button key={v}
                  onClick={() => { setSelectedVersion(v); setSourceOverride(''); }}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedVersion === v
                      ? 'bg-[#224057] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {v}
                </button>
              ))}
            </div>
            {/* Source override input */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-400 whitespace-nowrap">Source MRFs:</label>
              <input
                type="text"
                value={sourceOverride !== '' ? sourceOverride : data.source.toLocaleString()}
                onChange={e => setSourceOverride(e.target.value)}
                onFocus={e => e.target.select()}
                className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-right text-xs font-mono focus:border-[#234D8B] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Source MRFs',      value: source,                              color: '#224057' },
            { label: 'Reached Staging',  value: data.staging.passed,                 color: '#234D8B' },
            { label: 'Reached PP0',      value: data.pp0.passed,                     color: '#234D8B' },
            { label: 'Pipeline Complete',value: data.postProcessing.passed,           color: '#16a34a' },
          ].map(card => (
            <div key={card.label} className="rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm">
              <p className="text-xs text-gray-400">{card.label}</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: card.color }}>{fmt(card.value)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{pct(card.value, source)}% of source</p>
            </div>
          ))}
        </div>

        {/* Pipeline gauge */}
        <div className="mb-6 rounded-xl bg-white border border-gray-200 px-6 py-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#224057] mb-4">Pipeline Flow</h2>
          <PipelineGauge data={data} source={source} />
        </div>

        {/* Summary table */}
        <div>
          <h2 className="text-sm font-semibold text-[#224057] mb-3">Stage Summary</h2>
          <SummaryTable data={data} source={source} />
        </div>
      </div>
    </div>
  );
}
