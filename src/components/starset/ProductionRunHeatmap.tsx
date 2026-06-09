import { useMemo, useState } from 'react';
import * as topojson from 'topojson-client';
import { geoAlbersUsa, geoPath } from 'd3-geo';
import statesJson from 'us-atlas/states-10m.json';
import type { PRRow, Version } from './ProductionRunData';
import { STATE_NAMES } from './ProductionRunData';

const FIPS_TO_STATE: Record<string, string> = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT',
  '10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL',
  '18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD',
  '25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE',
  '32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND',
  '39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD',
  '47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV',
  '55':'WI','56':'WY',
};

const WIDTH = 975;
const HEIGHT = 610;

export type HeatmapMetric = 'gy' | 'red' | 'missing';

interface Props {
  // STATE/TOTAL/TOTAL rows keyed by state -> carrier -> row
  stateMatrix: Record<string, Record<string, PRRow>>;
  visibleCarriers: string[];
  metric: HeatmapMetric;
  onMetricChange: (m: HeatmapMetric) => void;
  version: Version;
  onStateClick: (state: string) => void;
}

function gyColor(v: number): string {
  if (v >= 80) return '#22c55e';
  if (v >= 70) return '#84cc16';
  if (v >= 60) return '#eab308';
  if (v >= 50) return '#f97316';
  return '#ef4444';
}

function lowerIsBetterColor(v: number): string {
  // Invert: lower is better
  if (v < 5)  return '#22c55e';
  if (v < 10) return '#84cc16';
  if (v < 20) return '#eab308';
  if (v < 35) return '#f97316';
  return '#ef4444';
}

function getMetricValue(row: PRRow | undefined, metric: HeatmapMetric, version: Version): number | null {
  if (!row) return null;
  if (version === 'delta') {
    if (metric === 'gy') return row.delta_pct_greenyellow;
    if (metric === 'red') return row.delta_pct_red;
    return row.delta_pct_missing;
  }
  const suffix = version === 'base' ? '_base' : '_new';
  if (metric === 'gy') return row[`pct_greenyellow${suffix}` as keyof PRRow] as number | null;
  if (metric === 'red') return row[`pct_red${suffix}` as keyof PRRow] as number | null;
  return row[`pct_missing${suffix}` as keyof PRRow] as number | null;
}

function deltaColor(metric: HeatmapMetric, delta: number): string {
  // For G/Y: positive delta = improvement (green). For red/missing: negative delta = improvement (green).
  const improved = metric === 'gy' ? delta > 0 : delta < 0;
  const worsened = metric === 'gy' ? delta < 0 : delta > 0;
  if (Math.abs(delta) < 0.5) return '#94a3b8';
  if (improved) return Math.abs(delta) >= 3 ? '#16a34a' : '#84cc16';
  if (worsened) return Math.abs(delta) >= 3 ? '#dc2626' : '#f97316';
  return '#94a3b8';
}

export function ProductionRunHeatmap({
  stateMatrix, visibleCarriers, metric, onMetricChange, version, onStateClick,
}: Props) {
  const [hover, setHover] = useState<{ state: string; value: number | null; x: number; y: number } | null>(null);

  const pathGenerator = useMemo(() => {
    const projection = geoAlbersUsa().scale(1300).translate([WIDTH / 2, HEIGHT / 2]);
    return geoPath(projection);
  }, []);

  const features = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topo = statesJson as any;
    const collection = topojson.feature(topo, topo.objects.states) as unknown as GeoJSON.FeatureCollection;
    return collection.features;
  }, []);

  // Per-state averaged value across visible carriers
  const stateValues = useMemo(() => {
    const m: Record<string, number | null> = {};
    Object.keys(stateMatrix).forEach((st) => {
      const carrierRows = stateMatrix[st];
      let sum = 0, count = 0;
      visibleCarriers.forEach((c) => {
        const v = getMetricValue(carrierRows[c], metric, version);
        if (v !== null && v !== undefined && !Number.isNaN(v)) { sum += v; count++; }
      });
      m[st] = count > 0 ? sum / count : null;
    });
    return m;
  }, [stateMatrix, visibleCarriers, metric, version]);

  const getFill = (fips: string): string => {
    const abbr = FIPS_TO_STATE[fips];
    if (!abbr) return '#e5e7eb';
    const v = stateValues[abbr];
    if (v === null || v === undefined) return '#e5e7eb';
    if (version === 'delta') return deltaColor(metric, v);
    return metric === 'gy' ? gyColor(v) : lowerIsBetterColor(v);
  };

  const metricLabel: Record<HeatmapMetric, string> = {
    gy: 'G/Y %',
    red: 'Red %',
    missing: 'Missing %',
  };

  return (
    <div className="relative w-full">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Heatmap Metric</span>
        <div className="flex rounded-md border border-gray-200 bg-white p-0.5 text-xs">
          {(['gy', 'red', 'missing'] as HeatmapMetric[]).map((m) => (
            <button
              key={m}
              onClick={() => onMetricChange(m)}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                metric === m
                  ? 'bg-[#001A41] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {metricLabel[m]}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-gray-400">
          Colored by mean across visible carriers
          {version === 'delta' ? ' · Δ v9 − v8.2 (green = improved)' : version === 'new' ? ' · v9' : ' · v8.2'}
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full rounded-lg" style={{ background: '#f8fafc' }}>
          {features.map((feature) => {
            const fips = String(feature.id).padStart(2, '0');
            const d = pathGenerator(feature as Parameters<typeof pathGenerator>[0]);
            if (!d) return null;
            const abbr = FIPS_TO_STATE[fips];
            return (
              <path
                key={fips}
                d={d}
                fill={getFill(fips)}
                stroke="#ffffff"
                strokeWidth={0.6}
                style={{ cursor: abbr ? 'pointer' : 'default', transition: 'fill 0.2s ease' }}
                onMouseEnter={(e) => {
                  if (!abbr) return;
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  const evRect = (e.currentTarget as SVGPathElement).getBoundingClientRect();
                  setHover({
                    state: abbr,
                    value: stateValues[abbr] ?? null,
                    x: evRect.left - rect.left + evRect.width / 2,
                    y: evRect.top - rect.top,
                  });
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => { if (abbr) onStateClick(abbr); }}
              />
            );
          })}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-[#001A41] px-2 py-1 text-xs text-white shadow-lg"
            style={{ left: `${(hover.x / WIDTH) * 100}%`, top: `${(hover.y / HEIGHT) * 100}%` }}
          >
            <div className="font-semibold">{STATE_NAMES[hover.state] ?? hover.state}</div>
            <div className="font-mono">
              {metricLabel[metric]}: {hover.value === null ? '—' : hover.value.toFixed(1) + (version === 'delta' ? ' pp' : '%')}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
        <span className="font-semibold uppercase tracking-wider text-gray-400">Scale</span>
        {version === 'delta' ? (
          <>
            <LegendDot color="#16a34a" label="Improved ≥3pp" />
            <LegendDot color="#84cc16" label="Improved" />
            <LegendDot color="#94a3b8" label="No change" />
            <LegendDot color="#f97316" label="Worsened" />
            <LegendDot color="#dc2626" label="Worsened ≥3pp" />
          </>
        ) : metric === 'gy' ? (
          <>
            <LegendDot color="#22c55e" label="≥80%" />
            <LegendDot color="#84cc16" label="70–79%" />
            <LegendDot color="#eab308" label="60–69%" />
            <LegendDot color="#f97316" label="50–59%" />
            <LegendDot color="#ef4444" label="<50%" />
          </>
        ) : (
          <>
            <LegendDot color="#22c55e" label="<5%" />
            <LegendDot color="#84cc16" label="5–10%" />
            <LegendDot color="#eab308" label="10–20%" />
            <LegendDot color="#f97316" label="20–35%" />
            <LegendDot color="#ef4444" label="≥35%" />
          </>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 rounded-sm border border-white" style={{ background: color }} />
      <span>{label}</span>
    </span>
  );
}
