import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Filter, ChevronUp, ChevronDown, MapPin, X } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

interface Hospital {
  id: number;
  npi: number;
  cms_number: string;
  facility_name: string;
  facility_type: string;
  system_affiliation: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  cbsa_code: string;
  cbsa_name: string;
  cbsa_type: string;
  urban_rural: string;
  bed_size: number | null;
  net_patient_revenue: number | null;
  commercial_payer_mix: number | null;
  ownership_type: string;
  active_mrf: boolean;
  latest_production_version: string;
  mrf_download_status: string;
  qa_status: string;
}

// Collapsed row — one per NPI
interface CollapsedHospital {
  npi: number;
  cms_number: string;
  facility_name: string;
  facility_type: string;
  system_affiliation: string;
  urban_rural: string;
  bed_size: number | null;
  net_patient_revenue: number | null;
  active_mrf: boolean;
  latest_production_version: string;
  // Collapsed fields
  displayState: string;   // actual state or 'XX'
  displayMsa: string;     // actual MSA or count pill sentinel
  locationCount: number;  // number of raw rows
  locations: Array<{ state: string; cbsa_name: string; cbsa_code: string }>;
}

type SortField = 'net_patient_revenue' | 'facility_name' | 'state' | 'bed_size';
type SortDir = 'asc' | 'desc';

const FACILITY_TYPE_COLORS: Record<string, string> = {
  'Short Term Acute Care': 'bg-blue-50 text-blue-700',
  'Critical Access':       'bg-amber-50 text-amber-700',
  'Psychiatric':           'bg-purple-50 text-purple-700',
  'Rehabilitation':        'bg-green-50 text-green-700',
  'Long Term':             'bg-orange-50 text-orange-700',
  'Childrens':             'bg-pink-50 text-pink-700',
  'Other':                 'bg-gray-50 text-gray-500',
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY'
];

function fmtNPR(v: number | null) {
  if (!v) return '—';
  if (v >= 1e9) return `$${(v/1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v/1e6).toFixed(0)}M`;
  return `$${(v/1e3).toFixed(0)}K`;
}

function fmtVersion(v: string) {
  if (!v) return '—';
  const m = v.match(/(\d{4}_\d{2}v\d+)/);
  return m ? m[1] : v.split('_').slice(-1)[0];
}

function collapseByNpi(rows: Hospital[]): CollapsedHospital[] {
  const map = new Map<number, Hospital[]>();
  for (const row of rows) {
    if (!map.has(row.npi)) map.set(row.npi, []);
    map.get(row.npi)!.push(row);
  }

  const collapsed: CollapsedHospital[] = [];
  for (const [npi, group] of map.entries()) {
    const first = group[0];
    const states = [...new Set(group.map(r => r.state).filter(Boolean))];
    const displayState = states.length === 1 ? states[0] : 'XX';
    const locationCount = group.length;
    const displayMsa = locationCount === 1 ? (first.cbsa_name || '—') : `${locationCount} MSAs`;
    const locations = group.map(r => ({
      state: r.state,
      cbsa_name: r.cbsa_name,
      cbsa_code: r.cbsa_code,
    }));

    collapsed.push({
      npi,
      cms_number: first.cms_number,
      facility_name: first.facility_name,
      facility_type: first.facility_type,
      system_affiliation: first.system_affiliation,
      urban_rural: first.urban_rural,
      bed_size: first.bed_size,
      net_patient_revenue: first.net_patient_revenue,
      active_mrf: group.some(r => r.active_mrf),
      latest_production_version: first.latest_production_version,
      displayState,
      displayMsa,
      locationCount,
      locations,
    });
  }

  return collapsed;
}

export function HospitalCoverageView() {
  const [collapsed, setCollapsed] = useState<CollapsedHospital[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [modalRow, setModalRow] = useState<CollapsedHospital | null>(null);

  // Filters
  const [stateFilter, setStateFilter] = useState('');
  const [cbsaSearch, setCbsaSearch] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [activeMrfOnly, setActiveMrfOnly] = useState(false);
  const [noMrfOnly, setNoMrfOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('net_patient_revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch up to 5K rows, collapse client-side
    let q = supabase
      .from('hospital_directory')
      .select('*', { count: 'exact' })
      .limit(5000);

    if (stateFilter) q = q.eq('state', stateFilter);
    if (activeMrfOnly) q = q.eq('active_mrf', true);
    if (noMrfOnly) q = q.eq('active_mrf', false);
    if (typeFilter) q = q.eq('facility_type', typeFilter);
    if (nameSearch.trim()) q = q.ilike('facility_name', `%${nameSearch.trim()}%`);
    if (cbsaSearch.trim()) q = q.ilike('cbsa_name', `%${cbsaSearch.trim()}%`);

    q = q.order(sortField, { ascending: sortDir === 'asc', nullsFirst: false });

    const { data, error } = await q;
    if (!error && data) {
      setCollapsed(collapseByNpi(data));
    }

    setLoading(false);
  }, [stateFilter, cbsaSearch, nameSearch, activeMrfOnly, noMrfOnly, typeFilter, sortField, sortDir]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleActiveMrf = () => {
    setActiveMrfOnly(v => { if (!v) setNoMrfOnly(false); return !v; });
  };
  const toggleNoMrf = () => {
    setNoMrfOnly(v => { if (!v) setActiveMrfOnly(false); return !v; });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const exportCSV = async () => {
    // Export raw records for full fidelity
    let q = supabase.from('hospital_directory').select('*').limit(10000);
    if (stateFilter) q = q.eq('state', stateFilter);
    if (activeMrfOnly) q = q.eq('active_mrf', true);
    if (noMrfOnly) q = q.eq('active_mrf', false);
    if (typeFilter) q = q.eq('facility_type', typeFilter);
    if (nameSearch.trim()) q = q.ilike('facility_name', `%${nameSearch.trim()}%`);
    if (cbsaSearch.trim()) q = q.ilike('cbsa_name', `%${cbsaSearch.trim()}%`);
    q = q.order(sortField, { ascending: sortDir === 'asc', nullsFirst: false });

    const { data } = await q;
    if (!data || data.length === 0) return;

    const headers = ['NPI','CMS #','Facility Name','Type','System','City','State','ZIP','MSA','Urban/Rural','Beds','NPR','Comm Mix','Ownership','Active MRF','Production Version'];
    const rows = data.map((h: Hospital) => [
      h.npi, h.cms_number, h.facility_name, h.facility_type, h.system_affiliation,
      h.city, h.state, h.zip, h.cbsa_name, h.urban_rural,
      h.bed_size ?? '', h.net_patient_revenue ?? '', h.commercial_payer_mix ?? '',
      h.ownership_type, h.active_mrf ? 'Yes' : 'No', fmtVersion(h.latest_production_version)
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: unknown) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `hospital_directory_${stateFilter || 'all'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 text-gray-300">↕</span>;
    return sortDir === 'desc'
      ? <ChevronDown className="ml-1 inline h-3 w-3 text-[#009DE0]" />
      : <ChevronUp   className="ml-1 inline h-3 w-3 text-[#009DE0]" />;
  };

  const uniqueNpiCount = collapsed.length;

  return (
    <div className="flex h-screen flex-col bg-mma-light-bg">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#001A41]">Hospital Coverage</h1>
            <p className="text-sm text-gray-500">
              AHD master hospital directory — {uniqueNpiCount.toLocaleString()} unique NPIs
            </p>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg bg-[#001A41] px-4 py-2 text-sm font-medium text-white hover:bg-[#003366] transition-colors">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* State */}
          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#009DE0] focus:outline-none">
            <option value="">All States</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* MSA search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search MSA / metro..." value={cbsaSearch}
              onChange={e => setCbsaSearch(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-[#009DE0] focus:outline-none w-52" />
          </div>

          {/* Name search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search hospital name..." value={nameSearch}
              onChange={e => setNameSearch(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-[#009DE0] focus:outline-none w-56" />
          </div>

          {/* Facility type */}
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#009DE0] focus:outline-none">
            <option value="">All Types</option>
            {Object.keys(FACILITY_TYPE_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Active MRF toggle */}
          <button onClick={toggleActiveMrf}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              activeMrfOnly
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}>
            <Filter className="h-4 w-4" />
            Active MRF
          </button>

          <button onClick={toggleNoMrf}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              noMrfOnly
                ? 'border-red-400 bg-red-50 text-red-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}>
            <Filter className="h-4 w-4" />
            No Hospital MRF
          </button>

          {/* Stats */}
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            <span>{uniqueNpiCount.toLocaleString()} unique NPIs</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-gray-400">Loading...</div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-[#001A41]"
                  onClick={() => toggleSort('facility_name')}>
                  Facility Name <SortIcon field="facility_name" />
                </th>
                <th className="border-b border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">NPI</th>
                <th className="border-b border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                <th className="border-b border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-[#001A41]"
                  onClick={() => toggleSort('state')}>
                  State <SortIcon field="state" />
                </th>
                <th className="border-b border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">MSA</th>
                <th className="border-b border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Urban/Rural</th>
                <th className="border-b border-gray-200 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-[#001A41]"
                  onClick={() => toggleSort('net_patient_revenue')}>
                  NPR <SortIcon field="net_patient_revenue" />
                </th>
                <th className="border-b border-gray-200 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Active MRF</th>
                <th className="border-b border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Production</th>
              </tr>
            </thead>
            <tbody>
              {collapsed.map((h, i) => {
                const typeColor = FACILITY_TYPE_COLORS[h.facility_type] ?? 'bg-gray-50 text-gray-500';
                const isMulti = h.locationCount > 1;
                return (
                  <tr
                    key={h.npi}
                    onClick={() => isMulti && setModalRow(h)}
                    className={`border-b border-gray-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} ${
                      isMulti ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-blue-50/20'
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-[#001A41]">{h.facility_name}</div>
                      {h.system_affiliation && (
                        <div className="text-xs text-gray-400">{h.system_affiliation}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{h.npi}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${typeColor}`}>
                        {h.facility_type || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-gray-700">
                      {h.displayState === 'XX'
                        ? <span className="text-gray-400 italic">XX</span>
                        : h.displayState}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[160px]">
                      {isMulti ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          <MapPin className="h-3 w-3" />
                          {h.locationCount} MSAs
                        </span>
                      ) : (
                        <span className="truncate block" title={h.displayMsa}>{h.displayMsa}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {h.urban_rural ? (
                        <span className={`rounded px-1.5 py-0.5 text-xs ${h.urban_rural === 'Urban' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {h.urban_rural}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-800">
                      {fmtNPR(h.net_patient_revenue)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {h.active_mrf
                        ? <span className="inline-block h-2 w-2 rounded-full bg-green-500" title="Active MRF" />
                        : <span className="inline-block h-2 w-2 rounded-full bg-gray-200" title="No MRF" />
                      }
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-400">
                      {fmtVersion(h.latest_production_version)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Multi-location modal */}
      {modalRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setModalRow(null)}
        >
          <div
            className="relative w-full max-w-md rounded-xl bg-white shadow-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setModalRow(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="mb-1 text-base font-bold text-[#001A41]">{modalRow.facility_name}</h2>
            <p className="mb-4 text-xs text-gray-500">NPI {modalRow.npi} · {modalRow.locationCount} locations</p>
            <div className="divide-y divide-gray-100">
              {modalRow.locations.map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#009DE0]" />
                    <span className="text-sm text-gray-700">{loc.cbsa_name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="font-semibold text-gray-600">{loc.state}</span>
                    {loc.cbsa_code && <span className="font-mono">{loc.cbsa_code}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
