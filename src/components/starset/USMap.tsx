import { useMemo } from 'react';
import * as topojson from 'topojson-client';
import statesJson from 'us-atlas/states-10m.json';
import type { Topology } from 'topojson-specification';

export interface Region {
  id: number;
  name: string;
  color: string;
  states: string[];
}

export const REGIONS: Region[] = [
  { id: 1,  name: 'Northwest',       color: '#7EC8E3', states: ['WA','OR','ID','MT','WY','AK'] },
  { id: 2,  name: 'West',            color: '#4A90D9', states: ['CA','NV','HI'] },
  { id: 3,  name: 'Non-Region',      color: '#2C5F8A', states: ['UT','CO'] },
  { id: 4,  name: 'Southwest',       color: '#3DAA8C', states: ['TX','OK','AR','LA','MS','NM','AZ'] },
  { id: 5,  name: 'Midwest',         color: '#E8739A', states: ['IL','IN','OH','MI','KY','WV'] },
  { id: 6,  name: 'Upper Midwest',   color: '#F5B731', states: ['IA','NE','MN','WI','ND','SD','KS','MO'] },
  { id: 7,  name: 'Florida',         color: '#5BBFA8', states: ['FL'] },
  { id: 8,  name: 'Greater Northeast', color: '#F5A623', states: ['NY','ME','VT','NH','MA','RI','CT','NJ','PA'] },
  { id: 9,  name: 'East',            color: '#2E7D8C', states: ['GA','TN','AL','SC'] },
  { id: 10, name: 'Mid-Atlantic',    color: '#7B68EE', states: ['NC','VA','MD','DE','DC'] },
];

// FIPS code to state abbreviation
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

// Build state -> region lookup
const STATE_TO_REGION: Record<string, number> = {};
for (const region of REGIONS) {
  for (const st of region.states) {
    STATE_TO_REGION[st] = region.id;
  }
}

interface USMapProps {
  selectedRegionId: number | null;
  onRegionSelect: (regionId: number) => void;
  onDeselect: () => void;
}

export function USMap({ selectedRegionId, onRegionSelect, onDeselect }: USMapProps) {
  // Precompute features — not used directly but validates the topology loads
  useMemo(() => {
    const topology = statesJson as unknown as Topology;
    topojson.feature(topology, (topology.objects as any).states);
  }, []);

  // We'll use the SVG path strings directly from topojson
  // The us-atlas 10m data uses a built-in projection (albersUsa equivalent)
  // so we can render straight into a 975x610 viewBox

  const getStateColor = (fips: string) => {
    const abbr = FIPS_TO_STATE[fips];
    if (!abbr) return '#e0e0e0';
    const regionId = STATE_TO_REGION[abbr];
    if (!regionId) return '#e0e0e0';
    const region = REGIONS.find(r => r.id === regionId);
    if (!region) return '#e0e0e0';

    if (selectedRegionId === regionId) {
      // Darken selected region
      return region.color;
    }
    if (selectedRegionId !== null) {
      // Dim unselected regions
      return region.color + '55';
    }
    return region.color;
  };

  const getStateStroke = (fips: string) => {
    const abbr = FIPS_TO_STATE[fips];
    if (!abbr) return '#fff';
    const regionId = STATE_TO_REGION[abbr];
    if (selectedRegionId !== null && selectedRegionId === regionId) {
      return '#ffffff';
    }
    return '#ffffff';
  };

  const getStateStrokeWidth = (fips: string) => {
    const abbr = FIPS_TO_STATE[fips];
    if (!abbr) return 0.5;
    const regionId = STATE_TO_REGION[abbr];
    if (selectedRegionId !== null && selectedRegionId === regionId) return 1.5;
    return 0.5;
  };

  const handleStateClick = (fips: string) => {
    const abbr = FIPS_TO_STATE[fips];
    if (!abbr) return;
    const regionId = STATE_TO_REGION[abbr];
    if (!regionId) return;
    onRegionSelect(regionId);
  };

  // Render using SVG path data — us-atlas 10m is pre-projected into 975x610
  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 975 610"
        className="w-full h-auto"
        style={{ background: '#f8f9fa', borderRadius: 8 }}
        onClick={(e) => {
          if ((e.target as SVGElement).tagName === 'svg') onDeselect();
        }}
      >
        {(statesJson as any).objects.states.geometries.map((geo: any) => {
          const fips = String(geo.id).padStart(2, '0');
          const abbr = FIPS_TO_STATE[fips];
          if (!abbr || abbr === 'AK' || abbr === 'HI') return null;

          const feature = topojson.feature(
            statesJson as unknown as Topology,
            geo as any
          );

          // Convert feature to SVG path using simple path from coordinates
          // For us-atlas, coordinates are already screen-projected
          return (
            <StatePath
              key={fips}
              feature={feature}
              fill={getStateColor(fips)}
              stroke={getStateStroke(fips)}
              strokeWidth={getStateStrokeWidth(fips)}
              onClick={() => handleStateClick(fips)}
              title={abbr}
            />
          );
        })}

        {/* Legend */}
        <g transform="translate(10, 500)">
          {REGIONS.map((region, i) => (
            <g
              key={region.id}
              transform={`translate(${(i % 5) * 180}, ${Math.floor(i / 5) * 20})`}
              style={{ cursor: 'pointer' }}
              onClick={() => onRegionSelect(region.id)}
            >
              <rect
                width={14}
                height={14}
                fill={selectedRegionId !== null && selectedRegionId !== region.id ? region.color + '55' : region.color}
                rx={2}
              />
              <text x={18} y={11} fontSize={10} fill="#333" fontFamily="inherit">
                {region.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

// Individual state path component using topojson path conversion
function StatePath({
  feature,
  fill,
  stroke,
  strokeWidth,
  onClick,
  title,
}: {
  feature: any;
  fill: string;
  stroke: string;
  strokeWidth: number;
  onClick: () => void;
  title: string;
}) {
  // Convert GeoJSON feature to SVG path using a simple coordinate mapping
  // us-atlas 10m uses Albers USA projection, coordinates map directly to SVG space
  const pathData = geoFeatureToPath(feature);
  if (!pathData) return null;

  return (
    <path
      d={pathData}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={{ cursor: 'pointer', transition: 'fill 0.2s ease, opacity 0.2s ease' }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <title>{title}</title>
    </path>
  );
}

function geoFeatureToPath(feature: any): string | null {
  if (!feature?.geometry) return null;
  const { type, coordinates } = feature.geometry;

  const ringToPath = (ring: number[][]) =>
    ring.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ') + ' Z';

  if (type === 'Polygon') {
    return coordinates.map(ringToPath).join(' ');
  }
  if (type === 'MultiPolygon') {
    return coordinates
      .map((poly: number[][][]) => poly.map(ringToPath).join(' '))
      .join(' ');
  }
  return null;
}
