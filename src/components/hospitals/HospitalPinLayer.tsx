import { useEffect, useState, useMemo } from 'react';
import { geoAlbersUsa } from 'd3-geo';

const WIDTH = 975;
const HEIGHT = 610;

// [npi, name, state, lat, lng, tier(r/y/g), net_count, in_mrf, beds, util, type]
export type HospitalRow = [number, string, string, number, number, 'r' | 'y' | 'g', number, number, number, number, string];

export const TIER_COLOR = { r: '#ef4444', y: '#f59e0b', g: '#22c55e' };
export const TIER_LABEL = { r: 'Poor coverage', y: 'Decent coverage', g: 'Strong coverage' };

interface Props {
  filterState?: string | null;
  filterTier?: ('r' | 'y' | 'g')[] | null;
  onStatsReady?: (stats: { red: number; yellow: number; green: number; total: number }) => void;
  onPinClick?: (h: HospitalRow) => void;
}

export function HospitalPinLayer({ filterState, filterTier, onStatsReady, onPinClick }: Props) {
  const [hospitals, setHospitals] = useState<HospitalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredNpi, setHoveredNpi] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/hospital-pins.json`)
      .then(r => r.json())
      .then(data => { setHospitals(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const projection = useMemo(() =>
    geoAlbersUsa().scale(1300).translate([WIDTH / 2, HEIGHT / 2]), []);

  const pins = useMemo(() => {
    let filtered = hospitals;
    if (filterState) filtered = filtered.filter(h => h[2] === filterState);
    if (filterTier?.length) filtered = filtered.filter(h => filterTier.includes(h[5]));
    return filtered.map(h => {
      const pt = projection([h[4], h[3]]);
      if (!pt) return null;
      return { h, x: pt[0], y: pt[1] };
    }).filter(Boolean) as { h: HospitalRow; x: number; y: number }[];
  }, [hospitals, filterState, filterTier, projection]);

  useEffect(() => {
    if (!onStatsReady) return;
    const stats = { red: 0, yellow: 0, green: 0, total: pins.length };
    pins.forEach(p => {
      if (p.h[5] === 'r') stats.red++;
      else if (p.h[5] === 'y') stats.yellow++;
      else stats.green++;
    });
    onStatsReady(stats);
  }, [pins, onStatsReady]);

  if (loading) return (
    <text x={10} y={20} fontSize={11} fill="#6b7280">Loading hospital pins…</text>
  );

  return (
    <>
      {(['r', 'y', 'g'] as const).map(tier =>
        pins.filter(p => p.h[5] === tier).map((p, i) => {
          const isHovered = hoveredNpi === p.h[0];
          return (
            <circle
              key={`${tier}-${i}`}
              cx={p.x} cy={p.y}
              r={isHovered ? 6 : 4}
              fill={TIER_COLOR[tier]}
              stroke="white"
              strokeWidth={isHovered ? 2 : 1}
              opacity={isHovered ? 1 : 0.85}
              style={{ cursor: 'pointer', transition: 'r 0.1s' }}
              onMouseEnter={e => {
                e.stopPropagation();          // ← suppress state tooltip
                setHoveredNpi(p.h[0]);
              }}
              onMouseLeave={e => {
                e.stopPropagation();
                setHoveredNpi(null);
              }}
              onClick={e => {
                e.stopPropagation();          // ← suppress state click
                onPinClick?.(p.h);
              }}
            />
          );
        })
      )}
    </>
  );
}
