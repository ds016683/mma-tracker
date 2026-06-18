import { useEffect, useState, useMemo } from 'react';
import { geoAlbersUsa } from 'd3-geo';

const WIDTH = 975;
const HEIGHT = 610;

// [npi, name, state, lat, lng, tier(r/y/g), net_count, in_mrf, beds, util, type]
type HospitalRow = [number, string, string, number, number, 'r' | 'y' | 'g', number, number, number, number, string];

const TIER_COLOR = { r: '#ef4444', y: '#f59e0b', g: '#22c55e' };
const TIER_LABEL = { r: 'Poor coverage', y: 'Decent coverage', g: 'Strong coverage' };

interface Tooltip { h: HospitalRow; x: number; y: number }

interface Props {
  filterState?: string | null;
  filterTier?: ('r' | 'y' | 'g')[] | null;
  onStatsReady?: (stats: { red: number; yellow: number; green: number; total: number }) => void;
}

export function HospitalPinLayer({ filterState, filterTier, onStatsReady }: Props) {
  const [hospitals, setHospitals] = useState<HospitalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  useEffect(() => {
    fetch('/data/hospital-pins.json')
      .then(r => r.json())
      .then(data => {
        setHospitals(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const projection = useMemo(() =>
    geoAlbersUsa().scale(1300).translate([WIDTH / 2, HEIGHT / 2]), []);

  const pins = useMemo(() => {
    let filtered = hospitals;
    if (filterState) filtered = filtered.filter(h => h[2] === filterState);
    if (filterTier?.length) filtered = filtered.filter(h => filterTier.includes(h[5]));

    // Emit stats
    const stats = { red: 0, yellow: 0, green: 0, total: filtered.length };
    filtered.forEach(h => {
      if (h[5] === 'r') stats.red++;
      else if (h[5] === 'y') stats.yellow++;
      else stats.green++;
    });
    onStatsReady?.(stats);

    return filtered.map(h => {
      const pt = projection([h[4], h[3]]);
      if (!pt) return null;
      return { h, x: pt[0], y: pt[1] };
    }).filter(Boolean);
  }, [hospitals, filterState, filterTier, projection, onStatsReady]);

  if (loading) return (
    <text x={10} y={20} fontSize={11} fill="#6b7280">Loading hospital pins…</text>
  );

  return (
    <>
      {/* Pins — render red first (bottom), then yellow, then green (top) */}
      {(['r', 'y', 'g'] as const).map(tier =>
        pins.filter(p => p!.h[5] === tier).map((p, i) => (
          <circle
            key={`${tier}-${i}`}
            cx={p!.x} cy={p!.y} r={4}
            fill={TIER_COLOR[tier]}
            stroke="white" strokeWidth={1}
            opacity={0.85}
            style={{ cursor: 'pointer' }}
            onMouseEnter={e => {
              const svg = (e.currentTarget as SVGCircleElement).ownerSVGElement!;
              const rect = svg.getBoundingClientRect();
              setTooltip({
                h: p!.h,
                x: ((e.clientX - rect.left) / rect.width) * WIDTH,
                y: ((e.clientY - rect.top) / rect.height) * HEIGHT,
              });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))
      )}

      {/* Tooltip */}
      {tooltip && (() => {
        const { h, x, y } = tooltip;
        const [npi, name, state,,, tier, net, mrf, beds, util, type] = h;
        const tw = 230, th = 115;
        const tx = Math.min(x + 10, WIDTH - tw - 8);
        const ty = Math.max(y - th - 8, 8);

        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect x={tx} y={ty} width={tw} height={th} rx={6}
              fill="white" stroke="#d1d5db" strokeWidth={1}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }} />
            {/* Tier badge */}
            <rect x={tx+tw-58} y={ty+6} width={52} height={16} rx={8}
              fill={TIER_COLOR[tier]} opacity={0.15} />
            <text x={tx+tw-32} y={ty+17} fontSize={9} fontWeight={600}
              fill={TIER_COLOR[tier]} textAnchor="middle">{TIER_LABEL[tier]}</text>
            {/* Content */}
            <text x={tx+10} y={ty+20} fontSize={11} fontWeight={700} fill="#111827">
              {name.length > 28 ? name.slice(0, 28) + '…' : name}
            </text>
            <text x={tx+10} y={ty+33} fontSize={9} fill="#6b7280">
              {state}{type ? ` · ${type.slice(0, 22)}` : ''}{beds > 0 ? ` · ${beds} beds` : ''}
            </text>
            <text x={tx+10} y={ty+48} fontSize={9} fill="#6b7280">
              NPI: {npi}
            </text>
            {/* Network badges */}
            <text x={tx+10} y={ty+63} fontSize={9} fill="#374151">
              {net > 0 ? `${net}/4 networks: ${['Aetna','BCBS','Cigna','UHC'].slice(0,net).join(', ')}` : 'No network coverage'}
            </text>
            <text x={tx+10} y={ty+77} fontSize={9} fill={mrf ? '#16a34a' : '#9ca3af'}>
              {mrf ? '✓ In v8 MRF' : '✗ Not in v8 MRF'}
            </text>
            {util > 0 && (
              <text x={tx+10} y={ty+91} fontSize={9} fill="#6b7280">
                Utilization: {util.toLocaleString()} claims
              </text>
            )}
            {/* Coverage bar */}
            <rect x={tx+10} y={ty+102} width={210} height={4} rx={2} fill="#f3f4f6" />
            <rect x={tx+10} y={ty+102} width={Math.round(210 * (net / 4))} height={4} rx={2}
              fill={TIER_COLOR[tier]} />
          </g>
        );
      })()}
    </>
  );
}
