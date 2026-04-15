import { useMemo, useCallback } from 'react';
import * as topojson from 'topojson-client';
import { geoAlbersUsa, geoPath } from 'd3-geo';
import statesJson from 'us-atlas/states-10m.json';

export interface Region {
  id: number;
  name: string;
  color: string;
  states: string[];
}

export const REGIONS: Region[] = [
  { id: 1,  name: 'Northwest',         color: '#7EC8E3', states: ['WA','OR','ID','MT','WY','AK'] },
  { id: 2,  name: 'West',              color: '#4A90D9', states: ['CA','NV','HI'] },
  { id: 3,  name: 'Non-Region',        color: '#2C5F8A', states: ['UT','CO'] },
  { id: 4,  name: 'Southwest',         color: '#3DAA8C', states: ['TX','OK','AR','LA','MS','NM','AZ'] },
  { id: 5,  name: 'Midwest',           color: '#E8739A', states: ['IL','IN','OH','MI','KY','WV'] },
  { id: 6,  name: 'Upper Midwest',     color: '#F5B731', states: ['IA','NE','MN','WI','ND','SD','KS','MO'] },
  { id: 7,  name: 'Florida',           color: '#5BBFA8', states: ['FL'] },
  { id: 8,  name: 'Greater Northeast', color: '#F5A623', states: ['NY','ME','VT','NH','MA','RI','CT','NJ','PA'] },
  { id: 9,  name: 'East',              color: '#2E7D8C', states: ['GA','TN','AL','SC'] },
  { id: 10, name: 'Mid-Atlantic',      color: '#7B68EE', states: ['NC','VA','MD','DE','DC'] },
];

// FIPS code -> state abbreviation
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

// State -> region id lookup
const STATE_TO_REGION: Record<string, number> = {};
for (const region of REGIONS) {
  for (const st of region.states) {
    STATE_TO_REGION[st] = region.id;
  }
}

const WIDTH = 975;
const HEIGHT = 610;

interface USMapProps {
  selectedRegionId: number | null;
  onRegionSelect: (regionId: number) => void;
  onDeselect: () => void;
}

export function USMap({ selectedRegionId, onRegionSelect, onDeselect }: USMapProps) {
  // Build path generator with Albers USA projection scaled to 975x610 (matches us-atlas encoding)
  const pathGenerator = useMemo(() => {
    const projection = geoAlbersUsa().scale(1300).translate([WIDTH / 2, HEIGHT / 2]);
    return geoPath(projection);
  }, []);

  // Extract GeoJSON features from topojson
  const features = useMemo(() => {
    const topo = statesJson as any;
    const collection = topojson.feature(topo, topo.objects.states) as unknown as GeoJSON.FeatureCollection;
    return collection.features;
  }, []);

  const getRegionForFips = useCallback((fips: string) => {
    const abbr = FIPS_TO_STATE[fips];
    if (!abbr) return null;
    const regionId = STATE_TO_REGION[abbr];
    if (!regionId) return null;
    return REGIONS.find(r => r.id === regionId) ?? null;
  }, []);

  const getFill = useCallback((fips: string) => {
    const region = getRegionForFips(fips);
    if (!region) return '#e0e0e0';
    if (selectedRegionId === null) return region.color;
    if (selectedRegionId === region.id) return region.color;
    return region.color + '44'; // dim unselected
  }, [selectedRegionId, getRegionForFips]);

  const getStrokeWidth = useCallback((fips: string) => {
    const region = getRegionForFips(fips);
    if (!region) return 0.5;
    return selectedRegionId === region.id ? 1.5 : 0.5;
  }, [selectedRegionId, getRegionForFips]);

  const handleStateClick = useCallback((fips: string) => {
    const region = getRegionForFips(fips);
    if (region) onRegionSelect(region.id);
  }, [getRegionForFips, onRegionSelect]);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto rounded-lg"
        style={{ background: '#f8f9fa' }}
        onClick={(e) => {
          if ((e.target as SVGElement).tagName === 'svg') onDeselect();
        }}
      >
        {features.map((feature) => {
          const fips = String(feature.id).padStart(2, '0');
          const d = pathGenerator(feature as any);
          if (!d) return null;

          return (
            <path
              key={fips}
              d={d}
              fill={getFill(fips)}
              stroke="#ffffff"
              strokeWidth={getStrokeWidth(fips)}
              style={{ cursor: 'pointer', transition: 'fill 0.2s ease' }}
              onClick={(e) => { e.stopPropagation(); handleStateClick(fips); }}
            >
              <title>{FIPS_TO_STATE[fips] ?? fips}</title>
            </path>
          );
        })}

        {/* Region legend */}
        <g transform="translate(10, 530)">
          {REGIONS.map((region, i) => (
            <g
              key={region.id}
              transform={`translate(${(i % 5) * 190}, ${Math.floor(i / 5) * 22})`}
              style={{ cursor: 'pointer' }}
              onClick={() => onRegionSelect(region.id)}
            >
              <rect
                width={14}
                height={14}
                rx={2}
                fill={selectedRegionId !== null && selectedRegionId !== region.id
                  ? region.color + '44'
                  : region.color}
              />
              <text x={18} y={11} fontSize={11} fill="#444" fontFamily="inherit">
                {region.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
