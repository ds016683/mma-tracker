import { useMemo, useState, useCallback } from 'react';
import * as topojson from 'topojson-client';
import { geoAlbersUsa, geoPath } from 'd3-geo';
import statesJson from 'us-atlas/states-10m.json';
import type { MsaBubble } from '../../data/pipeline-intelligence-data';
import { STATE_CARRIER_COVERAGE } from '../../data/state-carrier-coverage';

const WIDTH = 975;
const HEIGHT = 610;

// FIPS → state abbreviation (from us-atlas)
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

// 5-bucket blue choropleth scale
function scoreToColor(score: number | undefined): string {
  if (score === undefined || score === 0) return '#dde8f0'; // uncovered (very light)
  if (score >= 0.7) return '#1a4f8a';  // deepest
  if (score >= 0.5) return '#2563a8';
  if (score >= 0.35) return '#3d7fc4';
  if (score >= 0.2) return '#6faad9';
  return '#a8cce8';                    // lightest with data
}

type ColorMetric = 'score' | 'providers' | 'plans' | 'msas';

interface StateTooltipData {
  abbr: string;
  x: number;
  y: number;
}

interface Props {
  msaDots: MsaBubble[];
  showDots: boolean;
  selectedNetwork: string | null;
  colorMetric: ColorMetric;
  onStateClick?: (state: string) => void;
}

export function PipelineCoverageMap({ msaDots, showDots, selectedNetwork, colorMetric, onStateClick }: Props) {
  const [hoveredState, setHoveredState] = useState<StateTooltipData | null>(null);
  const [hoveredMsa, setHoveredMsa] = useState<{ msa: MsaBubble; x: number; y: number } | null>(null);

  const projection = useMemo(() =>
    geoAlbersUsa().scale(1300).translate([WIDTH / 2, HEIGHT / 2]), []);
  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const features = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const col = topojson.feature(statesJson as any, (statesJson as any).objects.states) as unknown as GeoJSON.FeatureCollection;
    return col.features;
  }, []);

  // Compute per-state color values
  const maxVals = useMemo(() => ({
    providers: Math.max(...Object.values(STATE_CARRIER_COVERAGE).map(v => v.n_providers)),
    plans:     Math.max(...Object.values(STATE_CARRIER_COVERAGE).map(v => v.n_plans)),
    msas:      Math.max(...Object.values(STATE_CARRIER_COVERAGE).map(v => v.msa_count)),
  }), []);

  const getFill = useCallback((fips: string) => {
    const abbr = FIPS_TO_STATE[fips];
    if (!abbr) return '#e8e4df';
    const cov = STATE_CARRIER_COVERAGE[abbr];
    if (!cov) return '#e8e4df';

    let normalizedScore: number;
    switch (colorMetric) {
      case 'providers': normalizedScore = cov.n_providers / maxVals.providers; break;
      case 'plans':     normalizedScore = cov.n_plans / maxVals.plans; break;
      case 'msas':      normalizedScore = cov.msa_count / maxVals.msas; break;
      default:          normalizedScore = cov.score;
    }
    return scoreToColor(normalizedScore);
  }, [colorMetric, maxVals]);

  // Project MSA dots
  const projectedDots = useMemo(() => {
    if (!showDots) return [];
    return msaDots.map(msa => {
      const pt = projection([msa.lng, msa.lat]);
      if (!pt) return null;
      const nets = msa.v9_networks?.length ?? msa.v8_networks?.length ?? 0;
      if (selectedNetwork && !msa.v9_networks?.includes(selectedNetwork) && !msa.v8_networks?.includes(selectedNetwork)) return null;
      return { msa, x: pt[0], y: pt[1], netCount: nets };
    }).filter(Boolean);
  }, [showDots, msaDots, projection, selectedNetwork]);

  // Hovered state data
  const hoveredData = hoveredState ? STATE_CARRIER_COVERAGE[hoveredState.abbr] : null;

  return (
    <div className="relative w-full" style={{ background: '#f5f4f0', borderRadius: 8, border: '1px solid #e0ddd8' }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: '100%', display: 'block' }}
        onMouseLeave={() => { setHoveredState(null); setHoveredMsa(null); }}
      >
        {/* State choropleth */}
        {features.map((f, i) => {
          const fips = String((f.id ?? '')).padStart(2, '0');
          const fill = getFill(fips);
          const abbr = FIPS_TO_STATE[fips] ?? '';
          return (
            <path
              key={i}
              d={pathGenerator(f) ?? ''}
              fill={fill}
              stroke="#ffffff"
              strokeWidth={1.2}
              style={{ cursor: abbr ? 'pointer' : 'default', transition: 'fill 0.15s' }}
              onMouseEnter={e => {
                if (!abbr) return;
                const svg = (e.currentTarget as SVGPathElement).ownerSVGElement!;
                const rect = svg.getBoundingClientRect();
                const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
                const svgY = ((e.clientY - rect.top) / rect.height) * HEIGHT;
                setHoveredState({ abbr, x: svgX, y: svgY });
                setHoveredMsa(null);
              }}
              onClick={() => abbr && onStateClick?.(abbr)}
            />
          );
        })}

        {/* MSA dot overlay */}
        {showDots && projectedDots.map((p, i) => p && (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={3.5}
            fill={p.netCount >= 4 ? '#f97316' : p.netCount >= 2 ? '#fbbf24' : '#fef3c7'}
            stroke="white" strokeWidth={1}
            opacity={0.85}
            style={{ cursor: 'pointer' }}
            onMouseEnter={e => {
              const svg = (e.currentTarget as SVGCircleElement).ownerSVGElement!;
              const rect = svg.getBoundingClientRect();
              const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
              const svgY = ((e.clientY - rect.top) / rect.height) * HEIGHT;
              setHoveredMsa({ msa: p.msa, x: svgX, y: svgY });
              setHoveredState(null);
            }}
            onMouseLeave={() => setHoveredMsa(null)}
          />
        ))}

        {/* State tooltip */}
        {hoveredState && hoveredData && (() => {
          const { abbr, x, y } = hoveredState;
          const tw = 200, th = 90;
          const tx = Math.min(x + 10, WIDTH - tw - 10);
          const ty = Math.max(y - th - 8, 10);
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={tx} y={ty} width={tw} height={th} rx={6}
                fill="white" stroke="#d1d5db" strokeWidth={1} />
              <text x={tx+10} y={ty+18} fontSize={13} fontWeight={700} fill="#111827">{abbr}</text>
              <text x={tx+10} y={ty+33} fontSize={10} fill="#6b7280">{hoveredData.msa_count} MSAs covered</text>
              <text x={tx+10} y={ty+47} fontSize={10} fill="#6b7280">{hoveredData.n_providers.toLocaleString()} providers</text>
              <text x={tx+10} y={ty+61} fontSize={10} fill="#6b7280">{hoveredData.n_plans} carrier plans · {hoveredData.n_codes.toLocaleString()} billing codes</text>
              <text x={tx+10} y={ty+77} fontSize={9} fill="#9ca3af">click to filter</text>
            </g>
          );
        })()}

        {/* MSA tooltip */}
        {hoveredMsa && (() => {
          const { msa, x, y } = hoveredMsa;
          const tw = 220, th = 70;
          const tx = Math.min(x + 10, WIDTH - tw - 10);
          const ty = Math.max(y - th - 8, 10);
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={tx} y={ty} width={tw} height={th} rx={6}
                fill="white" stroke="#d1d5db" strokeWidth={1} />
              <text x={tx+10} y={ty+18} fontSize={11} fontWeight={600} fill="#111827">{msa.msa_name}</text>
              <text x={tx+10} y={ty+33} fontSize={10} fill="#6b7280">{msa.v9_providers?.toLocaleString() ?? msa.v8_providers?.toLocaleString()} providers (v9)</text>
              <text x={tx+10} y={ty+48} fontSize={10} fill="#6b7280">{(msa.v9_networks ?? msa.v8_networks ?? []).join(' · ')}</text>
            </g>
          );
        })()}

        {/* Legend */}
        <g transform={`translate(${WIDTH - 170}, ${HEIGHT - 85})`}>
          <rect x={-8} y={-8} width={175} height={92} rx={6} fill="white" fillOpacity={0.92} stroke="#e5e7eb" strokeWidth={1} />
          <text x={0} y={8} fontSize={9} fontWeight={600} fill="#6b7280">COVERAGE DEPTH</text>
          {[
            { color: '#1a4f8a', label: 'Very high' },
            { color: '#2563a8', label: 'High' },
            { color: '#3d7fc4', label: 'Moderate' },
            { color: '#6faad9', label: 'Low' },
            { color: '#a8cce8', label: 'Minimal' },
            { color: '#dde8f0', label: 'Not indexed' },
          ].map((l, i) => (
            <g key={i} transform={`translate(0, ${16 + i * 11})`}>
              <rect width={10} height={9} rx={2} fill={l.color} />
              <text x={14} y={8} fontSize={9} fill="#4b5563">{l.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
