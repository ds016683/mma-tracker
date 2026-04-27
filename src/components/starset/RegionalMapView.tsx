import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { USMap, REGIONS } from './USMap';
import { RegionPanel } from './RegionPanel';
import { supabase } from '../../lib/supabase/client';
import { fetchAllRegions, upsertRegion } from '../../lib/supabase/regionQueries';
import type { RegionRow } from '../../lib/supabase/regionQueries';

export function RegionalMapView() {
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [regionData, setRegionData] = useState<Record<number, RegionRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load: just fetch from Supabase (HTTPS, no sync server)
  const loadFromSupabase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAllRegions();
      const map: Record<number, RegionRow> = {};
      for (const row of rows) {
        map[row.region_id] = row;
      }
      setRegionData(map);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Button click: write sync-request flag to Supabase (HTTPS) → VPS picks it up within 30s
  const syncFromNotion = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      // Signal the VPS sync daemon by writing a timestamp to Supabase
      await supabase
        .from("region_data")
        .update({ updated_at: new Date().toISOString() })
        .eq("region_id", 1);  // sentinel: updating row 1 triggers VPS poll

      // Wait up to 20s for VPS to pick up and push fresh data
      let attempts = 0;
      const before = new Date().toISOString();
      while (attempts < 10) {
        await new Promise(r => setTimeout(r, 2000));
        const rows = await fetchAllRegions();
        // Check if updated_at changed (VPS writes back after sync)
        const updated = rows.some(r => r.updated_at > before);
        if (updated || attempts >= 8) {
          const map: Record<number, RegionRow> = {};
          for (const row of rows) {
            map[row.region_id] = row;
          }
          setRegionData(map);
          setLastSync(new Date());
          break;
        }
        attempts++;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#001A41]">Regional Map</h1>
            <p className="text-sm text-gray-500">
              MMA Network Navigator coverage by sales region · Notion-synced
              {lastSync && <span className="text-xs text-gray-400"> · Last synced {lastSync.toLocaleTimeString()}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.notion.so/34f750fa613d8088b5ccc54a6efd5799"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-300 hover:text-gray-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Notion
            </a>
            <button
              onClick={syncFromNotion}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-lg bg-[#224057] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a3245] disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Notion'}
            </button>
          </div>
        </div>
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
