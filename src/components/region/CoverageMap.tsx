import { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapIcon, ChevronRight, Search, X } from 'lucide-react';
import {
  getCarrierList, getRegionMetrics, getStateMetrics,
  getCountyMetrics, getMsaMetrics, getHospitals, getHospitalDetail,
  getHospitalAcrossPlans, getScopedCarriers, getHospitalDots,
  CCM_BUCKETS,
  type CcmBucket, type CcmAreaRow, type CcmGyRow, type CcmHospitalRow,
} from '../../lib/supabase/ccmQueries';
import { CoverageMapSvg, type DrillLevel, type HospitalDot } from './CoverageMapSvg';
import { CoverageDetailPanel } from './CoverageDetailPanel';
import {
  REGIONS, STATE_NAMES, BUCKET_LABEL,
  metricsForLevel, defaultMetricForLevel,
  regionIdFromRow, type MetricKey,
} from './ccmGeo';

// ─── searchable plan selector ─────────────────────────────────────────────────
function PlanSelect({
  carriers, value, onChange,
}: { carriers: string[]; value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return carriers;
    return carriers.filter((c) => c.toLowerCase().includes(q));
  }, [carriers, query]);

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex min-w-[240px] items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#001A41] hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#009DE0]"
      >
        <span className="truncate">{value || 'Select a plan…'}</span>
        <ChevronRight className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-[320px] max-w-[90vw] rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plans…"
              className="w-full text-sm text-[#001A41] focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-gray-400">No plans match “{query}”.</div>
            )}
            {filtered.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); setQuery(''); }}
                className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-[#F7F9FC] ${
                  c === value ? 'font-semibold text-[#009DE0]' : 'text-gray-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export function CoverageMap() {
  // control bar
  const [carriers, setCarriers] = useState<string[]>([]);
  const [carriersLoaded, setCarriersLoaded] = useState(false);
  const [availableCarriers, setAvailableCarriers] = useState<string[]>([]);
  const [plan, setPlan] = useState('');
  const [bucket, setBucket] = useState<CcmBucket>('Total');
  const [metric, setMetric] = useState<MetricKey>('quality');

  // drill navigation
  const [level, setLevel] = useState<DrillLevel>('region');
  const [activeRegionId, setActiveRegionId] = useState<number | null>(null);
  const [activeState, setActiveState] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<{ fips: string; name: string } | null>(null);
  const [selectedMsa, setSelectedMsa] = useState<{ msaId: string; name: string } | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<{ npi: string; name: string; city: string | null } | null>(null);

  // data
  const [regionRows, setRegionRows] = useState<CcmAreaRow[]>([]);
  const [stateRows, setStateRows] = useState<CcmAreaRow[]>([]);
  const [countyRows, setCountyRows] = useState<CcmGyRow[]>([]);
  const [msaRows, setMsaRows] = useState<CcmAreaRow[]>([]);
  const [hospitals, setHospitals] = useState<CcmHospitalRow[] | null>(null);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [stateDots, setStateDots] = useState<HospitalDot[]>([]);
  const [hospitalDetail, setHospitalDetail] = useState<CcmHospitalRow[] | null>(null);
  const [hospitalAcrossPlans, setHospitalAcrossPlans] = useState<CcmHospitalRow[] | null>(null);
  const [hospitalDetailLoading, setHospitalDetailLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // in-memory cache so drilling back up never refetches
  const cache = useRef(new Map<string, CcmAreaRow[] | CcmGyRow[]>());
  const hospCache = useRef(new Map<string, CcmHospitalRow[]>());
  const dotsCache = useRef(new Map<string, HospitalDot[]>());

  // ── carrier list on mount ──
  useEffect(() => {
    getCarrierList()
      .then((list) => {
        setCarriers(list);
        setAvailableCarriers(list);
        if (list.length) setPlan((p) => p || list[0]);
      })
      .catch((e) => setError(e.message ?? String(e)))
      .finally(() => setCarriersLoaded(true));
  }, []);

  // ── adaptive plan list: only plans with data at the deepest active scope ──
  useEffect(() => {
    if (!carriers.length) return;
    // NB: selecting a county does NOT narrow the list — it stays at the state scope.
    const scope =
      selectedHospital ? { npi: selectedHospital.npi }
      : selectedMsa ? { msaId: selectedMsa.msaId }
      : activeState ? { state: activeState }
      : activeRegionId !== null ? { regionId: activeRegionId }
      : null;
    if (!scope) { setAvailableCarriers(carriers); return; }
    let cancelled = false;
    getScopedCarriers(scope)
      // show the accurate scoped list even when it's short; only a real error
      // falls back to the full list (never silently dump every plan)
      .then((list) => { if (!cancelled) setAvailableCarriers(list); })
      .catch(() => { if (!cancelled) setAvailableCarriers(carriers); });
    return () => { cancelled = true; };
  }, [carriers, activeRegionId, activeState, selectedCounty, selectedMsa, selectedHospital]);

  // ── region metrics (always, for the default view + region coloring) ──
  useEffect(() => {
    if (!plan) return;
    const key = `region|${plan}|${bucket}`;
    if (cache.current.has(key)) { setRegionRows(cache.current.get(key)! as CcmAreaRow[]); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    getRegionMetrics(plan, bucket)
      .then((rows) => { if (cancelled) return; cache.current.set(key, rows); setRegionRows(rows); })
      .catch((e) => { if (!cancelled) setError(e.message ?? String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [plan, bucket]);

  // ── state metrics for ALL states (drives the national state choropleth and the
  //    per-region state view) — cheap (~50 rows per plan+bucket) ──
  useEffect(() => {
    if (!plan) { setStateRows([]); return; }
    const key = `state|${plan}|${bucket}`;
    if (cache.current.has(key)) { setStateRows(cache.current.get(key)! as CcmAreaRow[]); return; }
    let cancelled = false;
    getStateMetrics(plan, bucket)
      .then((rows) => { if (cancelled) return; cache.current.set(key, rows); setStateRows(rows); })
      .catch((e) => { if (!cancelled) setError(e.message ?? String(e)); });
    return () => { cancelled = true; };
  }, [plan, bucket]);

  // ── county metrics for the active state ──
  useEffect(() => {
    if (!plan || !activeState) { setCountyRows([]); return; }
    const key = `county|${plan}|${bucket}|${activeState}`;
    if (cache.current.has(key)) { setCountyRows(cache.current.get(key)! as CcmGyRow[]); return; }
    let cancelled = false;
    getCountyMetrics(plan, bucket, activeState)
      .then((rows) => { if (cancelled) return; cache.current.set(key, rows); setCountyRows(rows); })
      .catch((e) => { if (!cancelled) setError(e.message ?? String(e)); });
    return () => { cancelled = true; };
  }, [plan, bucket, activeState]);

  // ── MSA metrics: region-wide at state level, state-specific once a state is open ──
  useEffect(() => {
    let states: string[] | null = null;
    if (activeState) states = [activeState];
    else if (activeRegionId !== null) states = REGIONS.find((r) => r.id === activeRegionId)?.states ?? null;
    if (!plan || !states || states.length === 0) { setMsaRows([]); return; }
    const key = `msa|${plan}|${bucket}|${activeState ?? 'region' + activeRegionId}`;
    if (cache.current.has(key)) { setMsaRows(cache.current.get(key)! as CcmAreaRow[]); return; }
    let cancelled = false;
    getMsaMetrics(plan, bucket, states)
      .then((rows) => { if (cancelled) return; cache.current.set(key, rows); setMsaRows(rows); })
      .catch((e) => { if (!cancelled) setError(e.message ?? String(e)); });
    return () => { cancelled = true; };
  }, [plan, bucket, activeRegionId, activeState]);

  // ── keep the selected metric valid for the current level (area vs GY-only) ──
  useEffect(() => {
    if (!metricsForLevel(level).some((m) => m.key === metric)) {
      setMetric(defaultMetricForLevel(level));
    }
  }, [level, metric]);

  // ── hospitals for the selected county / MSA ──
  useEffect(() => {
    const geo = selectedCounty
      ? { county_code: selectedCounty.fips }
      : selectedMsa
      ? { msa_id: selectedMsa.msaId }
      : null;
    if (!plan || !geo) { setHospitals(null); return; }
    const key = `hosp|${plan}|${JSON.stringify(geo)}`;
    if (hospCache.current.has(key)) { setHospitals(hospCache.current.get(key)!); return; }
    let cancelled = false;
    setHospitalsLoading(true);
    getHospitals(plan, geo)
      .then((rows) => { if (cancelled) return; hospCache.current.set(key, rows); setHospitals(rows); })
      .catch((e) => { if (!cancelled) setError(e.message ?? String(e)); })
      .finally(() => { if (!cancelled) setHospitalsLoading(false); });
    return () => { cancelled = true; };
  }, [plan, selectedCounty, selectedMsa]);

  // ── all hospitals in the open state, as map dots (shown from state level down) ──
  useEffect(() => {
    if (!plan || !activeState) { setStateDots([]); return; }
    const key = `dots|${plan}|${activeState}`;
    if (dotsCache.current.has(key)) { setStateDots(dotsCache.current.get(key)!); return; }
    let cancelled = false;
    getHospitalDots(plan, activeState)
      .then((rows) => { if (cancelled) return; dotsCache.current.set(key, rows); setStateDots(rows); })
      .catch((e) => { if (!cancelled) setError(e.message ?? String(e)); });
    return () => { cancelled = true; };
  }, [plan, activeState]);

  // ── hospital drill-down detail (selected plan) ──
  useEffect(() => {
    if (!plan || !selectedHospital) { setHospitalDetail(null); return; }
    const key = `hdet|${plan}|${selectedHospital.npi}`;
    if (hospCache.current.has(key)) { setHospitalDetail(hospCache.current.get(key)!); return; }
    let cancelled = false;
    setHospitalDetailLoading(true);
    getHospitalDetail(selectedHospital.npi, plan)
      .then((rows) => { if (cancelled) return; hospCache.current.set(key, rows); setHospitalDetail(rows); })
      .catch((e) => { if (!cancelled) setError(e.message ?? String(e)); })
      .finally(() => { if (!cancelled) setHospitalDetailLoading(false); });
    return () => { cancelled = true; };
  }, [plan, selectedHospital]);

  // ── hospital across all plans (for BUCA comparison) — plan-independent ──
  useEffect(() => {
    if (!selectedHospital) { setHospitalAcrossPlans(null); return; }
    const key = `across|${selectedHospital.npi}`;
    if (hospCache.current.has(key)) { setHospitalAcrossPlans(hospCache.current.get(key)!); return; }
    let cancelled = false;
    getHospitalAcrossPlans(selectedHospital.npi)
      .then((rows) => { if (cancelled) return; hospCache.current.set(key, rows); setHospitalAcrossPlans(rows); })
      .catch((e) => { if (!cancelled) setError(e.message ?? String(e)); });
    return () => { cancelled = true; };
  }, [selectedHospital]);

  // ── navigation ──
  function resetToHome() {
    setLevel('region'); setActiveRegionId(null); setActiveState(null);
    setSelectedCounty(null); setSelectedMsa(null); setSelectedHospital(null);
  }
  // Switching plans keeps the current drill level — just re-render it for the new
  // plan. Clearing the hospital drill-down avoids showing a stale NPI's detail.
  function handlePlanChange(c: string) { setPlan(c); setSelectedHospital(null); }
  function handleSelectRegion(id: number) {
    setActiveRegionId(id); setLevel('state');
    setActiveState(null); setSelectedCounty(null); setSelectedMsa(null); setSelectedHospital(null);
  }
  function handleSelectState(abbr: string) {
    setActiveState(abbr); setLevel('county');
    setSelectedCounty(null); setSelectedMsa(null); setSelectedHospital(null);
  }
  function handleSelectCounty(fips: string, name: string) {
    setSelectedCounty({ fips, name }); setSelectedMsa(null); setSelectedHospital(null);
  }
  function handleSelectMsa(msaId: string, name: string) {
    setSelectedMsa({ msaId, name }); setSelectedCounty(null); setSelectedHospital(null);
  }
  function handleSelectHospital(npi: string, name: string, city: string | null = null) {
    setSelectedHospital({ npi, name, city });
  }
  function goToRegionLevel() {
    setLevel('state'); setActiveState(null);
    setSelectedCounty(null); setSelectedMsa(null); setSelectedHospital(null);
  }
  function goToStateLevel() {
    setLevel('county'); setSelectedCounty(null); setSelectedMsa(null); setSelectedHospital(null);
  }

  // ── indexes for the detail panel ──
  const regionById = useMemo(() => {
    const m = new Map<number, CcmAreaRow>();
    for (const r of regionRows) { const id = regionIdFromRow(r); if (id !== null && !m.has(id)) m.set(id, r); }
    return m;
  }, [regionRows]);
  const stateByAbbr = useMemo(() => {
    const m = new Map<string, CcmAreaRow>();
    for (const r of stateRows) if (r.state) m.set(r.state, r);
    return m;
  }, [stateRows]);
  const countyByFips = useMemo(() => {
    const m = new Map<string, CcmGyRow>();
    for (const r of countyRows) if (r.county_code) m.set(String(r.county_code).padStart(5, '0'), r);
    return m;
  }, [countyRows]);

  // Hospital dots = every hospital in the open state (shown from state level down).
  const hospitalDots: HospitalDot[] = stateDots;

  // ── selected geography → panel props ──
  const activeRegion = activeRegionId !== null ? REGIONS.find((r) => r.id === activeRegionId) : null;
  let geoLabel = 'United States';
  let geoRow: CcmAreaRow | CcmGyRow | undefined;
  // county rows are the only GY-family geography that lands in the panel headline
  const geoFamily: 'area' | 'gy' = selectedCounty ? 'gy' : 'area';
  let showHospitals = false;
  let emptyHint: string | undefined = 'Select a region on the map to begin.';

  if (selectedCounty) {
    geoRow = countyByFips.get(selectedCounty.fips);
    geoLabel = `${selectedCounty.name || 'County'}${activeState ? `, ${activeState}` : ''}`;
    showHospitals = true;
    emptyHint = 'No data for this plan in this county.';
  } else if (selectedMsa) {
    geoRow = msaRows.find((r) => r.msa_id === selectedMsa.msaId);
    geoLabel = selectedMsa.name;
    showHospitals = true;
    emptyHint = 'No data for this plan in this metro.';
  } else if (level === 'county' && activeState) {
    geoRow = stateByAbbr.get(activeState);
    geoLabel = STATE_NAMES[activeState] ?? activeState;
    emptyHint = 'Select a county or metro on the map to list hospitals.';
  } else if (level === 'state' && activeRegionId !== null) {
    geoRow = regionById.get(activeRegionId);
    geoLabel = `Region ${activeRegionId} — ${activeRegion?.name ?? ''}`;
    emptyHint = 'Select a state on the map to drill in.';
  }

  // ── breadcrumb ──
  const crumbs: { label: string; onClick?: () => void }[] = [{ label: 'United States', onClick: resetToHome }];
  if (activeRegionId !== null) crumbs.push({ label: `Region ${activeRegionId} — ${activeRegion?.name ?? ''}`, onClick: goToRegionLevel });
  if (activeState) crumbs.push({ label: STATE_NAMES[activeState] ?? activeState, onClick: goToStateLevel });
  if (selectedCounty) crumbs.push({ label: selectedCounty.name || 'County' });
  if (selectedMsa) crumbs.push({ label: selectedMsa.name });

  return (
    <div className="flex h-screen flex-col bg-[#F7F9FC]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-[#009DE0]" />
          <h1 className="text-lg font-bold text-[#001A41]">Coverage Map</h1>
        </div>
        <p className="mt-0.5 text-sm text-gray-500">
          Explore how complete and trustworthy each plan’s pricing data is — by region, state, county, metro, and hospital.
        </p>
      </div>

      {/* Control bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Plan</span>
          <PlanSelect carriers={availableCarriers} value={plan} onChange={handlePlanChange} />
          {availableCarriers.length > 0 && availableCarriers.length < carriers.length && (
            <span className="text-[11px] text-gray-400">{availableCarriers.length} with data here</span>
          )}
        </div>

        {/* Bucket segmented control */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Services</span>
          <div className="flex overflow-hidden rounded-md border border-gray-200">
            {CCM_BUCKETS.map((b) => (
              <button
                key={b}
                onClick={() => setBucket(b)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  bucket === b ? 'bg-[#009DE0] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {BUCKET_LABEL[b]}
              </button>
            ))}
          </div>
        </div>

        {/* Metric selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Color by</span>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#001A41] focus:outline-none focus:ring-2 focus:ring-[#009DE0]"
          >
            {metricsForLevel(level).map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-white px-6 py-2 text-sm">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-300" />}
              {c.onClick && !last ? (
                <button onClick={c.onClick} className="font-medium text-[#009DE0] hover:underline">{c.label}</button>
              ) : (
                <span className={last ? 'font-semibold text-[#001A41]' : 'text-gray-500'}>{c.label}</span>
              )}
            </span>
          );
        })}
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-2 text-sm text-red-700">
          Failed to load data: {error}
        </div>
      )}

      {/* Body: map (left) + detail panel (right) */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="relative overflow-y-auto p-4 lg:w-[60%]">
          {loading && (
            <div className="absolute right-6 top-5 z-20 rounded-md bg-white/90 px-3 py-1 text-xs text-gray-500 shadow">
              Loading…
            </div>
          )}
          {!plan ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">
              {!carriersLoaded
                ? 'Loading plans…'
                : 'No plan data available yet — the coverage tables are currently empty.'}
            </div>
          ) : (
            <CoverageMapSvg
              level={level}
              metric={metric}
              stateRows={stateRows}
              countyRows={countyRows}
              hospitalDots={hospitalDots}
              activeRegionId={activeRegionId}
              activeState={activeState}
              onSelectRegion={handleSelectRegion}
              onSelectState={handleSelectState}
              onSelectCounty={handleSelectCounty}
              onSelectHospital={(npi, name) => handleSelectHospital(npi, name)}
            />
          )}
        </div>

        <div className="border-t border-gray-200 bg-white lg:w-[40%] lg:border-l lg:border-t-0">
          <CoverageDetailPanel
            planName={plan}
            bucket={bucket}
            metric={metric}
            geoFamily={geoFamily}
            geoLabel={geoLabel}
            geoRow={geoRow}
            emptyHint={emptyHint}
            showHospitals={showHospitals}
            hospitals={hospitals}
            hospitalsLoading={hospitalsLoading}
            onSelectHospital={handleSelectHospital}
            msaList={msaRows}
            onSelectMsa={handleSelectMsa}
            selectedHospital={selectedHospital}
            hospitalDetail={hospitalDetail}
            hospitalAcrossPlans={hospitalAcrossPlans}
            hospitalDetailLoading={hospitalDetailLoading}
            onBackFromHospital={() => setSelectedHospital(null)}
          />
        </div>
      </div>
    </div>
  );
}
