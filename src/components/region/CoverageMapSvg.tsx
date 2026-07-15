import { useEffect, useMemo, useState } from 'react';
import * as topojson from 'topojson-client';
import { geoAlbersUsa, geoPath } from 'd3-geo';
import statesJson from 'us-atlas/states-10m.json';
import countiesJson from 'us-atlas/counties-10m.json';
import type { CcmAreaRow, CcmGyRow } from '../../lib/supabase/ccmQueries';
import {
  REGIONS, FIPS_TO_STATE, STATE_TO_FIPS, STATE_NAMES, STATE_TO_REGION_ID,
  metricValue, colorForMetric, legendFor, formatMetric,
  hospitalsCoveredPhrase, METRIC_BY_KEY,
  type MetricKey, type DrillLevel,
} from './ccmGeo';

export type { DrillLevel };

const WIDTH = 975;
const HEIGHT = 610;

// Centered number-label positions per region (tuned for this 975×610 Albers projection).
const REGION_LABEL_POS: Record<number, { x: number; y: number }> = {
  1:  { x: 195, y: 120 }, 2:  { x: 118, y: 295 }, 3:  { x: 222, y: 272 },
  4:  { x: 445, y: 427 }, 5:  { x: 668, y: 290 }, 6:  { x: 490, y: 195 },
  7:  { x: 786, y: 522 }, 8:  { x: 824, y: 191 }, 9:  { x: 672, y: 398 },
  10: { x: 800, y: 355 },
};

/** A hospital to plot as a dot (coords resolved from the pins file by NPI). */
export interface HospitalDot {
  npi: string;
  name: string;
  hasData: boolean;
}

interface Props {
  level: DrillLevel;
  metric: MetricKey;
  stateRows: CcmAreaRow[];
  countyRows: CcmGyRow[];
  hospitalDots: HospitalDot[];
  activeRegionId: number | null;
  activeState: string | null;
  onSelectRegion: (id: number) => void;
  onSelectState: (abbr: string) => void;
  onSelectCounty: (fips: string, name: string) => void;
  onSelectHospital: (npi: string, name: string) => void;
}

interface Tip {
  x: number;
  y: number;
  title: string;
  lines: string[];
  hint?: string;
}

const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

// NPI → [lng, lat] from the shared hospital pins file (approximate locations).
let pinsPromise: Promise<Map<string, [number, number]>> | null = null;
function loadHospitalPins(): Promise<Map<string, [number, number]>> {
  if (!pinsPromise) {
    pinsPromise = fetch(`${import.meta.env.BASE_URL}data/hospital-pins.json`)
      .then((r) => r.json())
      .then((rows: unknown[][]) => {
        const m = new Map<string, [number, number]>();
        for (const row of rows) {
          const npi = String(row[0]);
          const lat = Number(row[3]);
          const lng = Number(row[4]);
          if (Number.isFinite(lat) && Number.isFinite(lng)) m.set(npi, [lng, lat]);
        }
        return m;
      })
      .catch(() => new Map<string, [number, number]>());
  }
  return pinsPromise;
}

export function CoverageMapSvg({
  level, metric,
  stateRows, countyRows, hospitalDots,
  activeRegionId, activeState,
  onSelectRegion, onSelectState, onSelectCounty, onSelectHospital,
}: Props) {
  const [tip, setTip] = useState<Tip | null>(null);
  const [pins, setPins] = useState<Map<string, [number, number]> | null>(null);

  useEffect(() => { loadHospitalPins().then(setPins); }, []);

  const projection = useMemo(
    () => geoAlbersUsa().scale(1300).translate([WIDTH / 2, HEIGHT / 2]),
    []
  );
  const pathGen = useMemo(() => geoPath(projection), [projection]);

  const stateFeatures = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const col = topojson.feature(statesJson as any, (statesJson as any).objects.states) as unknown as GeoJSON.FeatureCollection;
    return col.features;
  }, []);

  const countyFeatures = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const col = topojson.feature(countiesJson as any, (countiesJson as any).objects.counties) as unknown as GeoJSON.FeatureCollection;
    return col.features;
  }, []);

  // Merged region outlines (states dissolved into one shape per MMA region).
  const regionShapes = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topo = statesJson as any;
    const geoms = topo.objects.states.geometries as { id: string | number }[];
    return REGIONS.map((region) => {
      const rg = geoms.filter((g) => {
        const abbr = FIPS_TO_STATE[String(g.id).padStart(2, '0')];
        return abbr && region.states.includes(abbr);
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const merged = topojson.merge(topo, rg as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = pathGen({ type: 'Feature', geometry: merged, properties: {} } as any) ?? '';
      return { region, d };
    });
  }, [pathGen]);

  // ── indexes ────────────────────────────────────────────────────────────────
  const stateByAbbr = useMemo(() => {
    const m = new Map<string, CcmAreaRow>();
    for (const r of stateRows) if (r.state) m.set(r.state, r);
    return m;
  }, [stateRows]);

  const countyByFips = useMemo(() => {
    const m = new Map<string, CcmGyRow>();
    for (const r of countyRows) {
      // 'UNMAPPED' county_code won't match any FIPS and is left off the choropleth
      if (r.county_code) m.set(String(r.county_code).padStart(5, '0'), r);
    }
    return m;
  }, [countyRows]);

  // gy_rate colouring is relative — needs the max across the counties in view
  const colorMax = useMemo(() => {
    if (METRIC_BY_KEY[metric].kind !== 'level') return undefined;
    let mx = 0;
    for (const r of countyRows) {
      const v = metricValue(r, metric);
      if (v != null && v > mx) mx = v;
    }
    return mx;
  }, [metric, countyRows]);

  // ── zoom transform + numeric scale (so dots stay a constant on-screen size) ──
  const { transform, scale } = useMemo(() => {
    let features: GeoJSON.Feature[] = [];
    if (level === 'state' && activeRegionId !== null) {
      const region = REGION_BY_ID[activeRegionId];
      features = stateFeatures.filter((f) => {
        const abbr = FIPS_TO_STATE[String(f.id).padStart(2, '0')];
        return abbr && region?.states.includes(abbr);
      });
    } else if (level === 'county' && activeState) {
      features = stateFeatures.filter(
        (f) => String(f.id).padStart(2, '0') === STATE_TO_FIPS[activeState]
      );
    }
    if (features.length === 0) return { transform: 'translate(0,0) scale(1)', scale: 1 };
    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [[x0, y0], [x1, y1]] = pathGen.bounds(fc as any);
    if (![x0, y0, x1, y1].every(Number.isFinite)) return { transform: 'translate(0,0) scale(1)', scale: 1 };
    const bw = Math.max(1, x1 - x0);
    const bh = Math.max(1, y1 - y0);
    const s = Math.min(WIDTH / bw, HEIGHT / bh) * 0.88;
    const tx = WIDTH / 2 - (s * (x0 + x1)) / 2;
    const ty = HEIGHT / 2 - (s * (y0 + y1)) / 2;
    return { transform: `translate(${tx},${ty}) scale(${s})`, scale: s };
  }, [level, activeRegionId, activeState, stateFeatures, pathGen]);

  const dots = useMemo(() => {
    if (!pins) return [];
    const out: { npi: string; name: string; x: number; y: number; hasData: boolean }[] = [];
    for (const h of hospitalDots) {
      const coord = pins.get(h.npi);
      if (!coord) continue;
      const pt = projection(coord);
      if (!pt) continue;
      out.push({ npi: h.npi, name: h.name, x: pt[0], y: pt[1], hasData: h.hasData });
    }
    return out;
  }, [pins, hospitalDots, projection]);

  // ── helpers ──────────────────────────────────────────────────────────────────
  function svgPoint(e: React.MouseEvent): { x: number; y: number } {
    const svg = (e.currentTarget as SVGElement).ownerSVGElement ?? (e.currentTarget as SVGSVGElement);
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * HEIGHT,
    };
  }

  function metricLine(row: CcmAreaRow | CcmGyRow | undefined, m: MetricKey): string {
    return `${METRIC_BY_KEY[m].short}: ${formatMetric(m, metricValue(row, m))}`;
  }

  const legend = legendFor(metric);

  // ── hospital dot overlay ─────────────────────────────────────────────────────
  function renderHospitalDots() {
    const rr = 3 / scale;
    return dots.map((d, i) => (
      <circle
        key={`${d.npi}-${i}`}
        cx={d.x} cy={d.y} r={rr}
        fill={d.hasData ? '#009DE0' : '#9aa4b2'}
        stroke="#fff" strokeWidth={0.8 / scale}
        opacity={0.9}
        style={{ cursor: 'pointer' }}
        onMouseMove={(e) => {
          const p = svgPoint(e);
          setTip({
            x: p.x, y: p.y,
            title: d.name,
            lines: [d.hasData ? 'Has rate data in this plan' : 'No rate data found'],
            hint: 'Click to open this hospital',
          });
        }}
        onMouseLeave={() => setTip(null)}
        onClick={() => onSelectHospital(d.npi, d.name)}
      />
    ));
  }

  // ── base layers ──────────────────────────────────────────────────────────────
  function renderRegionLayer() {
    return (
      <>
        {/* State choropleth — coloured by each state's own metric, thin state borders */}
        {stateFeatures.map((f, i) => {
          const fips = String(f.id).padStart(2, '0');
          const abbr = FIPS_TO_STATE[fips];
          const d = pathGen(f as GeoJSON.Feature) ?? '';
          if (!abbr) return <path key={i} d={d} fill="#eef0f2" stroke="#fff" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />;
          const regionId = STATE_TO_REGION_ID[abbr] ?? null;
          const region = regionId !== null ? REGION_BY_ID[regionId] : null;
          const row = stateByAbbr.get(abbr);
          const fill = colorForMetric(metric, metricValue(row, metric));
          return (
            <path
              key={i}
              d={d}
              fill={fill}
              stroke="#ffffff"
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: regionId !== null ? 'pointer' : 'default', transition: 'fill 0.2s' }}
              onMouseMove={(e) => {
                const p = svgPoint(e);
                setTip({
                  x: p.x, y: p.y,
                  title: STATE_NAMES[abbr] ?? abbr,
                  lines: row ? [metricLine(row, metric), hospitalsCoveredPhrase(row) ?? 'No hospital data'] : ['No data for this plan here'],
                  hint: region ? `Click to open Region ${regionId} — ${region.name}` : undefined,
                });
              }}
              onMouseLeave={() => setTip(null)}
              onClick={() => { if (regionId !== null) onSelectRegion(regionId); }}
            />
          );
        })}
        {/* Thick region separators (outline only, drawn over the thin state borders) */}
        {regionShapes.map(({ region, d }) => (
          <path key={`out-${region.id}`} d={d} fill="none" stroke="#ffffff" strokeWidth={4.4} strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ pointerEvents: 'none' }} />
        ))}
        {/* Region number labels */}
        {regionShapes.map(({ region }) => {
          const pos = REGION_LABEL_POS[region.id];
          if (!pos) return null;
          return (
            <text
              key={`lbl-${region.id}`}
              x={pos.x} y={pos.y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={32} fontWeight={800} fill="rgba(255,255,255,0.92)"
              style={{ pointerEvents: 'none', userSelect: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.55)' }}
            >
              {region.id}
            </text>
          );
        })}
      </>
    );
  }

  function renderStateLayer() {
    const region = activeRegionId !== null ? REGION_BY_ID[activeRegionId] : null;
    return stateFeatures.map((f, i) => {
      const fips = String(f.id).padStart(2, '0');
      const abbr = FIPS_TO_STATE[fips];
      const inRegion = abbr && region?.states.includes(abbr);
      const d = pathGen(f as GeoJSON.Feature) ?? '';
      if (!inRegion) {
        return <path key={i} d={d} fill="#eef0f2" stroke="#fff" strokeWidth={0.5} vectorEffect="non-scaling-stroke" opacity={0.5} />;
      }
      const row = stateByAbbr.get(abbr!);
      const fill = colorForMetric(metric, metricValue(row, metric));
      return (
        <path
          key={i}
          d={d}
          fill={fill}
          stroke="#ffffff"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
          onMouseMove={(e) => {
            const p = svgPoint(e);
            setTip({
              x: p.x, y: p.y,
              title: STATE_NAMES[abbr!] ?? abbr!,
              lines: row ? [metricLine(row, metric), hospitalsCoveredPhrase(row) ?? 'No hospital data'] : ['No data for this plan here'],
              hint: 'Click to open counties',
            });
          }}
          onMouseLeave={() => setTip(null)}
          onClick={() => onSelectState(abbr!)}
        />
      );
    });
  }

  function renderCountyLayer() {
    if (!activeState) return null;
    const stateFips = STATE_TO_FIPS[activeState];
    const counties = countyFeatures.filter((f) => String(f.id).padStart(5, '0').slice(0, 2) === stateFips);
    return (
      <>
        {counties.map((f, i) => {
          const fips = String(f.id).padStart(5, '0');
          const row = countyByFips.get(fips);
          const d = pathGen(f as GeoJSON.Feature) ?? '';
          const fill = row ? colorForMetric(metric, metricValue(row, metric), { max: colorMax }) : '#e5e7eb';
          const name = row?.county_name ?? '';
          return (
            <path
              key={i}
              d={d}
              fill={fill}
              stroke="#ffffff"
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
              onMouseMove={(e) => {
                const p = svgPoint(e);
                setTip({
                  x: p.x, y: p.y,
                  title: name || `County ${fips}`,
                  lines: row ? [metricLine(row, metric), hospitalsCoveredPhrase(row) ?? 'No hospital data'] : ['No data for this plan here'],
                  hint: 'Click to list hospitals',
                });
              }}
              onMouseLeave={() => setTip(null)}
              onClick={() => onSelectCounty(fips, name)}
            />
          );
        })}
        {renderHospitalDots()}
      </>
    );
  }

  return (
    <div className="relative w-full" style={{ background: '#f5f6f8', borderRadius: 8, border: '1px solid #e2e5ea' }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: '100%', display: 'block' }}
        onMouseLeave={() => setTip(null)}
      >
        <g transform={transform} style={{ transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' }}>
          {level === 'region' && renderRegionLayer()}
          {level === 'state' && renderStateLayer()}
          {level === 'county' && renderCountyLayer()}
        </g>

        {/* Tooltip */}
        {tip && (() => {
          const tw = 236;
          const th = 34 + tip.lines.length * 15 + (tip.hint ? 15 : 0);
          const tx = Math.min(tip.x + 12, WIDTH - tw - 8);
          const ty = Math.max(tip.y - th - 8, 8);
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={tx} y={ty} width={tw} height={th} rx={7} fill="white" stroke="#d1d5db" strokeWidth={1} filter="url(#cm-shadow)" />
              <text x={tx + 11} y={ty + 19} fontSize={12.5} fontWeight={700} fill="#001A41">{tip.title}</text>
              {tip.lines.map((ln, i) => (
                <text key={i} x={tx + 11} y={ty + 37 + i * 15} fontSize={11} fill="#4b5563">{ln}</text>
              ))}
              {tip.hint && (
                <text x={tx + 11} y={ty + 37 + tip.lines.length * 15} fontSize={9.5} fill="#009DE0">{tip.hint}</text>
              )}
            </g>
          );
        })()}

        <defs>
          <filter id="cm-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-200 bg-white/70 px-4 py-2.5 text-xs text-gray-600">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Legend</span>
        {legend.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border border-black/10" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
        {level === 'county' && dots.length > 0 && (
          <>
            <span className="inline-flex items-center gap-1.5 text-gray-500">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: '#009DE0' }} />
              Hospital (has data)
            </span>
            <span className="inline-flex items-center gap-1.5 text-gray-500">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: '#9aa4b2' }} />
              Hospital (no data)
            </span>
          </>
        )}
      </div>
    </div>
  );
}
