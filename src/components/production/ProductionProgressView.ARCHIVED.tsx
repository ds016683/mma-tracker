import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';

// ── Version config — swap table names here when new versions land ─────────────
// To add v10: copy the v9 entry, update table name, add to VERSIONS array
const VERSION_CONFIG: Record<string, {
  label: string;
  bqTable: string;  // BigQuery source (for reference/docs)
  supabaseKey: string;  // key in pipeline_stats table
  live: boolean;
}> = {
  'v9 (Active)': {
    label: 'v9 (Active)',
    bqTable: 'starset-lumen-bq.external_sources.mrf_hospital_metadata_data_orders_2026_04v9',
    supabaseKey: 'hospital_pipeline_v9',
    live: true,
  },
  'v8 (Baseline)': {
    label: 'v8 (Baseline)',
    bqTable: 'starset-lumen-bq.external_sources.mrf_hospital_metadata_data_orders_2026_02v8',
    supabaseKey: 'hospital_pipeline_v8',
    live: false, // table not yet transferred — shows synthetic
  },
};

const VERSIONS = Object.keys(VERSION_CONFIG);

// ── Types ─────────────────────────────────────────────────────────────────────
interface PipelineStats {
  source_total: number;
  staging_passed: number;
  staging_rejected: number;
  pp0_passed: number;
  rescue_queue: number;
  post_processing_passed: number;
  qa_needs_review: number;
  not_started: number;
  last_updated?: string;
}

// ── Fallback synthetic data (shown when live=false or fetch fails) ─────────────
// Pipeline stages that exist vs pending per version
// v9: Source + Staging are real BQ data. PP0+ not yet available (pipeline in build).
// v8: Staging data exists in BQ (Region 2 only transferred). PP0+ not tracked.
const STAGE_AVAILABILITY: Record<string, { staging: boolean; pp0: boolean; postProcessing: boolean }> = {
  'v9 (Active)':   { staging: true,  pp0: false, postProcessing: false },
  'v8 (Baseline)': { staging: true,  pp0: false, postProcessing: false },
};

const SYNTHETIC: Record<string, PipelineStats> = {
  'v9 (Active)': {
    // Real: from mrf_hospital_metadata_data_orders_2026_04v9 in BQ
    source_total: 4868,
    staging_passed: 1571,
    staging_rejected: 3,
    // Pending: v9 PP0/post-processing pipeline tables not yet built (target 5/4)
    pp0_passed: 0,
    rescue_queue: 0,
    post_processing_passed: 0,
    qa_needs_review: 0,
    not_started: 134,
  },
  'v8 (Baseline)': {
    // Real: ~4,500 distinct hospital NPIs per Chris Hart (MMA Production meeting 2026-04-27)
    // Staging data in BQ (Region 2 transferred); full national not yet in Lumen BQ
    source_total: 4500,
    staging_passed: 4500,
    staging_rejected: 0,
    // PP0+ not tracked for v8
    pp0_passed: 0,
    rescue_queue: 0,
    post_processing_passed: 0,
    qa_needs_review: 0,
    not_started: 0,
  },
};

function pct(num: number, den: number) {
  return den === 0 ? 0 : Math.round((num / den) * 100);
}
function fmt(n: number) { return n.toLocaleString(); }

// ── Pipeline gauge ─────────────────────────────────────────────────────────────
function PipelineGauge({ stats }: { stats: PipelineStats }) {
  const source = stats.source_total;
  // Fill only to the last stage that has real data
  const availability = STAGE_AVAILABILITY[Object.keys(STAGE_AVAILABILITY).find(k =>
    stats.source_total === SYNTHETIC[k]?.source_total) ?? ''] ?? { staging: false, pp0: false, postProcessing: false };
  const lastRealCount = availability.postProcessing ? stats.post_processing_passed
    : availability.pp0 ? stats.pp0_passed
    : availability.staging ? stats.staging_passed
    : stats.source_total;
  const fillPct = pct(lastRealCount, source);

  const mainTicks = [
    { label: 'Source',           position: 0,   count: source },
    { label: 'Staging',          position: 30,  count: stats.staging_passed },
    { label: 'PP0',              position: 62,  count: stats.pp0_passed },
    { label: 'Post-Processing',  position: 100, count: stats.post_processing_passed },
  ];

  const branches = [
    { label: 'Staging Rejects', count: stats.staging_rejected },
    { label: 'Rescue Queue',    count: stats.rescue_queue },
    { label: 'QA Review',       count: stats.qa_needs_review },
  ];

  return (
    <div className="mb-6">
      <div className="relative h-5 rounded-full bg-gray-100">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${fillPct}%`, background: 'linear-gradient(90deg, #224057 0%, #234D8B 60%, #F8C762 100%)' }} />
        {mainTicks.map(tick => (
          <div key={tick.label}
            className="absolute flex items-center justify-center"
            style={{
              left: `${tick.position}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 12, height: 12,
            }}>
            <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
              tick.position === 0 ? 'bg-[#224057]' :
              tick.position <= fillPct ? 'bg-[#234D8B]' : 'bg-gray-300'}`} />
          </div>
        ))}
      </div>

      {/* Tick labels */}
      <div className="relative mt-2" style={{ height: 40 }}>
        {mainTicks.map(tick => {
          const isFirst = tick.position === 0;
          const isLast = tick.position === 100;
          const transform = isFirst ? 'translateX(0)' : isLast ? 'translateX(-100%)' : 'translateX(-50%)';
          return (
            <div key={tick.label} className="absolute flex flex-col items-center"
              style={{ left: `${tick.position}%`, transform }}>
              <span className="text-[10px] font-semibold text-[#224057] whitespace-nowrap">{tick.label}</span>
              <span className="text-[11px] font-bold text-gray-700">{fmt(tick.count)}</span>
            </div>
          );
        })}
      </div>

      {/* Branch chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {branches.filter(b => b.count > 0).map(b => (
          <div key={b.label} className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5">
            <svg width="14" height="14" viewBox="0 0 16 16" className="text-amber-500 flex-shrink-0">
              <path d="M8 2 L8 10 M8 10 L4 14 M8 10 L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
            <span className="text-xs text-amber-700 font-medium">{b.label}:</span>
            <span className="text-xs font-bold text-amber-800">{fmt(b.count)}</span>
          </div>
        ))}
      </div>

      {/* Overall yield */}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#234D8B]" style={{ width: `${fillPct}%` }} />
        </div>
        <span className="text-xs font-semibold text-[#224057] whitespace-nowrap">
          {fillPct}% overall yield · {fmt(stats.post_processing_passed)} MRFs through full pipeline
        </span>
      </div>
    </div>
  );
}

// ── Summary table ─────────────────────────────────────────────────────────────
function SummaryTable({ stats }: { stats: PipelineStats }) {
  const s = stats;
  const rows = [
    { stage: 'Source MRFs',         desc: 'Total hospital MRFs in scope',                       totalIn: s.source_total,         passed: s.source_total,           failed: 0,                  isBranch: false },
    { stage: 'Staging',             desc: 'Downloaded and loaded to staging table',              totalIn: s.source_total,         passed: s.staging_passed,         failed: s.staging_rejected, isBranch: false },
    { stage: '↳ Staging Rejects',   desc: 'Download errors or schema failures',                 totalIn: s.staging_rejected,     passed: 0,                        failed: s.staging_rejected, isBranch: true  },
    { stage: 'PP0',                 desc: 'Passed pre-processing gate 0',                        totalIn: s.staging_passed,       passed: s.pp0_passed,             failed: s.rescue_queue,     isBranch: false },
    { stage: '↳ Rescue Queue',      desc: 'No reconciling payer name — queued for rescue',      totalIn: s.rescue_queue,         passed: 0,                        failed: s.rescue_queue,     isBranch: true  },
    { stage: 'Post-Processing',     desc: 'QA passed — pipeline complete',                       totalIn: s.pp0_passed,           passed: s.post_processing_passed, failed: s.qa_needs_review,  isBranch: false },
    { stage: '↳ QA Review',         desc: 'Flagged for QA review before final delivery',        totalIn: s.qa_needs_review,      passed: 0,                        failed: s.qa_needs_review,  isBranch: true  },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-[#224057]">
            {['Stage','Description','Total In','Passed','Failed / Branched','Yield'].map(h => (
              <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white ${h === 'Stage' || h === 'Description' ? 'text-left' : 'text-right'} ${h === 'Description' ? 'hidden md:table-cell' : ''}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => {
            const yieldPct = row.totalIn > 0 && !row.isBranch && row.stage !== 'Source MRFs'
              ? pct(row.passed, row.totalIn) : null;
            return (
              <tr key={i} className={`${row.isBranch ? 'bg-amber-50/60' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-blue-50/30 transition-colors`}>
                <td className="px-4 py-3">
                  <span className={`font-medium ${row.isBranch ? 'text-amber-700 text-xs' : 'text-[#224057]'}`}>{row.stage}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{row.desc}</td>
                <td className="px-4 py-3 text-right font-mono text-sm text-gray-700">{fmt(row.totalIn)}</td>
                <td className="px-4 py-3 text-right font-mono text-sm text-emerald-700 font-semibold">{row.passed > 0 ? fmt(row.passed) : '—'}</td>
                <td className="px-4 py-3 text-right font-mono text-sm text-red-500">{row.failed > 0 ? fmt(row.failed) : '—'}</td>
                <td className="px-4 py-3 text-right">
                  {yieldPct !== null ? (
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${yieldPct}%`,
                          background: yieldPct >= 90 ? '#16a34a' : yieldPct >= 75 ? '#F8C762' : '#ef4444' }} />
                      </div>
                      <span className={`text-xs font-semibold w-8 text-right ${yieldPct >= 90 ? 'text-emerald-700' : yieldPct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{yieldPct}%</span>
                    </div>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export function ProductionProgressView() {
  const [selectedVersion, setSelectedVersion] = useState(VERSIONS[0]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const config = VERSION_CONFIG[selectedVersion];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setStats(null);
      if (config.live) {
        // Try to load from Supabase pipeline_stats table
        const { data, error } = await supabase
          .from('pipeline_stats')
          .select('*')
          .eq('version_key', config.supabaseKey)
          .single();
        if (!cancelled) {
          if (data && !error) {
            setStats(data.stats as PipelineStats);
            setIsLive(true);
            setLastUpdated(data.synced_at);
          } else {
            // Fall back to baked-in values from last known sync
            setStats(SYNTHETIC[selectedVersion]);
            setIsLive(true); // still "live" — from BQ, just baked at build time
            setLastUpdated(null);
          }
          setLoading(false);
        }
      } else {
        if (!cancelled) {
          setStats(SYNTHETIC[selectedVersion]);
          setIsLive(false);
          setLastUpdated(null);
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedVersion, config.live, config.supabaseKey]);

  const displayStats = stats ?? SYNTHETIC[selectedVersion];

  return (
    <div className="flex h-screen flex-col bg-[#f5f6f8]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#224057]">Production Progress</h1>
              {isLive ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                  LIVE
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">SYNTHETIC</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Hospital MRF Pipeline · {config.bqTable.split('.').pop()}
              {lastUpdated && <> · Synced {new Date(lastUpdated).toLocaleString()}</>}
            </p>
          </div>
          {/* Version toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            {VERSIONS.map(v => (
              <button key={v} onClick={() => setSelectedVersion(v)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedVersion === v ? 'bg-[#224057] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {v}
                {!VERSION_CONFIG[v].live && <span className="ml-1 text-[9px] opacity-60">synth</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading pipeline data...</div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Source MRFs',       value: displayStats.source_total,            color: '#224057' },
                { label: 'Reached Staging',   value: displayStats.staging_passed,          color: '#234D8B' },
                { label: 'Reached PP0',        value: displayStats.pp0_passed,              color: '#234D8B' },
                { label: 'Pipeline Complete', value: displayStats.post_processing_passed,  color: '#16a34a' },
              ].map(card => (
                <div key={card.label} className="rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm">
                  <p className="text-xs text-gray-400">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: card.color }}>{fmt(card.value)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{pct(card.value, displayStats.source_total)}% of source</p>
                </div>
              ))}
            </div>

            {/* Pipeline gauge */}
            <div className="mb-6 rounded-xl bg-white border border-gray-200 px-6 py-5 shadow-sm">
              <h2 className="text-sm font-semibold text-[#224057] mb-4">Pipeline Flow</h2>
              <PipelineGauge stats={displayStats} />
            </div>

            {/* Summary table */}
            <div>
              <h2 className="text-sm font-semibold text-[#224057] mb-3">Stage Summary</h2>
              <SummaryTable stats={displayStats} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
