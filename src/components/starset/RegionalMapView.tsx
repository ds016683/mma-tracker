import { useState, useEffect, useCallback } from 'react';
import { USMap, REGIONS } from './USMap';
import { RegionPanel } from './RegionPanel';
import { fetchAllRegions, upsertRegion } from '../../lib/supabase/regionQueries';
import type { RegionRow } from '../../lib/supabase/regionQueries';

export function RegionalMapView() {
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [regionData, setRegionData] = useState<Record<number, RegionRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllRegions()
      .then((rows) => {
        const map: Record<number, RegionRow> = {};
        for (const row of rows) {
          map[row.region_id] = row;
        }
        setRegionData(map);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(
    async (regionId: number, updates: Partial<RegionRow>) => {
      await upsertRegion({ region_id: regionId, ...updates });
      setRegionData((prev) => ({
        ...prev,
        [regionId]: {
          ...prev[regionId],
          ...updates,
          updated_at: new Date().toISOString(),
        } as RegionRow,
      }));
    },
    []
  );

  const selectedRegion = selectedRegionId !== null
    ? REGIONS.find((r) => r.id === selectedRegionId) ?? null
    : null;

  return (
    <div className="flex h-screen flex-col bg-mma-light-bg">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-[#001A41]">Regional Map</h1>
        <p className="text-sm text-gray-500">
          MMA Network Navigator coverage by sales region. Click a region to view details.
        </p>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map area */}
        <div
          className="flex flex-1 flex-col items-center justify-start overflow-auto p-6"
          style={{ minWidth: 0 }}
        >
          {loading && (
            <div className="flex h-40 items-center justify-center text-sm text-gray-400">
              Loading region data...
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              Failed to load region data: {error}
            </div>
          )}
          {!loading && (
            <>
              <div className="w-full max-w-4xl">
                <USMap
                  selectedRegionId={selectedRegionId}
                  onRegionSelect={setSelectedRegionId}
                  onDeselect={() => setSelectedRegionId(null)}
                />
              </div>
              {/* Mobile: show panel below map */}
              {selectedRegion && (
                <div className="mt-4 w-full max-w-4xl lg:hidden">
                  <RegionPanel
                    region={selectedRegion}
                    data={regionData[selectedRegion.id] ?? null}
                    onClose={() => setSelectedRegionId(null)}
                    onSave={handleSave}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop: side panel */}
        <div
          className={`hidden lg:flex transition-all duration-300 ease-in-out border-l border-gray-200 ${
            selectedRegion ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            width: selectedRegion ? 380 : 0,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {selectedRegion && (
            <RegionPanel
              region={selectedRegion}
              data={regionData[selectedRegion.id] ?? null}
              onClose={() => setSelectedRegionId(null)}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}
