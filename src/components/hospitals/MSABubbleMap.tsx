import { useMemo, useState } from 'react';
import * as topojson from 'topojson-client';
import { geoAlbersUsa, geoPath } from 'd3-geo';
import statesJson from 'us-atlas/states-10m.json';
import type { MsaBubble } from '../../data/pipeline-intelligence-data';

const WIDTH = 975;
const HEIGHT = 610;

const NETWORK_COLORS: Record<string, string> = {
  'Aetna':          '#e05c2a',
  'BCBS PPO':       '#1a5fa8',
  'BCBS Home Plan': '#2979c4',
  'BCBS HPN':       '#3d8ed4',
  'Cigna':          '#00a0be',
  'UHC':            '#006fa6',
  'HealthPartners': '#6b7fc4',
  'Priority Health':'#9b59b6',
  'The Alliance':   '#27ae60',
  'Healthcare Highways': '#16a085',
  'Medcost':        '#8e44ad',
  'UPMC':           '#2c3e50',
  'default':        '#7c8fa6',
};

interface Props {
  data: MsaBubble[];
  selectedVersion: 'v8' | 'v9' | 'both';
  selectedNetwork: string | null;
  onMsaClick?: (msa: MsaBubble) => void;
}

export function MSABubbleMap({ data, selectedVersion, selectedNetwork, onMsaClick }: Props) {
  const [tooltip, setTooltip] = useState<{ msa: MsaBubble; x: number; y: number } | null>(null);

  const projection = useMemo(() =>
    geoAlbersUsa().scale(1300).translate([WIDTH / 2, HEIGHT / 2]), []);
  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const features = useMemo(() => {
    const topo = statesJson as unknown as Parameters<typeof topojson.feature>[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const col = topojson.feature(topo, (topo as any).objects.states) as unknown as GeoJSON.FeatureCollection;
    return col.features;
  }, []);

  // Map each MSA to projected coordinates
  const projected = useMemo(() => {
    return data.map(msa => {
      const pt = projection([msa.lng, msa.lat]);
      if (!pt) return null;
      const vKey = selectedVersion === 'both' ? 'v9' : selectedVersion;
      const providers = msa[`${vKey}_providers` as keyof MsaBubble] as number;
      const records = msa[`${vKey}_records` as keyof MsaBubble] as number;
      const networks = msa[`${vKey}_networks` as keyof MsaBubble] as string[];

      if (selectedNetwork && !networks.includes(selectedNetwork)) return null;

      // Radius scaled by provider count (log scale, 4–28px)
      const r = Math.max(4, Math.min(28, 4 + Math.log10(Math.max(1, providers)) * 5));

      // Color: if single network selected, use its color; else gradient by count
      const color = selectedNetwork
        ? (NETWORK_COLORS[selectedNetwork] ?? NETWORK_COLORS.default)
        : networks.length >= 4 ? '#2563eb' : networks.length >= 2 ? '#60a5fa' : '#bfdbfe';

      return { msa, x: pt[0], y: pt[1], r, color, providers, records, networks };
    }).filter(Boolean);
  }, [data, projection, selectedVersion, selectedNetwork]);

  const totalProviders = projected.reduce((s, p) => s + (p?.providers ?? 0), 0);
  const totalMSAs = projected.length;

  return (
    <div className="relative w-full" style={{ background: '#f8f7f4', borderRadius: 8, border: '1px solid #e5e3de' }}>
      {/* Legend */}
      <div className="flex items-center gap-4 px-4 pt-3 pb-1 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Network coverage per MSA:</span>
        {[
          { label: '4+ networks', color: '#2563eb' },
          { label: '2–3 networks', color: '#60a5fa' },
          { label: '1 network', color: '#bfdbfe' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1 text-xs text-gray-600">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
        <span className="ml-auto text-xs text-gray-500">
          <strong>{totalMSAs}</strong> MSAs · <strong>{totalProviders.toLocaleString()}</strong> providers
        </span>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: '100%', display: 'block' }}>
        {/* State fills */}
        {features.map((f, i) => (
          <path
            key={i}
            d={pathGenerator(f) ?? ''}
            fill="#e9e7e2"
            stroke="#ffffff"
            strokeWidth={1}
          />
        ))}

        {/* MSA bubbles — sorted so smaller are on top */}
        {[...projected].sort((a, b) => (b?.r ?? 0) - (a?.r ?? 0)).map((p, i) => p && (
          <g key={i}
            style={{ cursor: 'pointer' }}
            onClick={() => onMsaClick?.(p.msa)}
            onMouseEnter={() => setTooltip({ msa: p.msa, x: p.x, y: p.y })}
            onMouseLeave={() => setTooltip(null)}
          >
            <circle cx={p.x} cy={p.y} r={p.r + 2} fill="white" opacity={0.5} />
            <circle
              cx={p.x} cy={p.y} r={p.r}
              fill={selectedNetwork ? p.color : p.color}
              stroke="white" strokeWidth={1.5}
              opacity={0.85}
            />
          </g>
        ))}

        {/* Tooltip */}
        {tooltip && (() => {
          const { msa, x, y } = tooltip;
          const vKey = selectedVersion === 'both' ? 'v9' : selectedVersion;
          const providers = msa[`${vKey}_providers` as keyof MsaBubble] as number;
          const networks = msa[`${vKey}_networks` as keyof MsaBubble] as string[];
          const tw = 200, th = 80;
          const tx = Math.min(x + 12, WIDTH - tw - 10);
          const ty = Math.max(y - th - 8, 10);
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={tx} y={ty} width={tw} height={th} rx={6}
                fill="white" stroke="#d1d5db" strokeWidth={1} filter="url(#shadow)" />
              <text x={tx + 10} y={ty + 18} fontSize={11} fontWeight={600} fill="#1a1a1a">{msa.msa_name}</text>
              <text x={tx + 10} y={ty + 33} fontSize={10} fill="#6b7280">{providers.toLocaleString()} providers</text>
              <text x={tx + 10} y={ty + 47} fontSize={10} fill="#6b7280">{networks.length} networks</text>
              <text x={tx + 10} y={ty + 61} fontSize={9} fill="#9ca3af">{networks.slice(0, 3).join(' · ')}{networks.length > 3 ? ' +more' : ''}</text>
            </g>
          );
        })()}

        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
