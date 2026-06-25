import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Download, Filter, ChevronUp, ChevronDown, MapPin, X } from 'lucide-react';

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
  mrf_failure_reason: string;
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
  mrf_failure_reason: string;
  latest_production_version: string;
  // Collapsed fields
  displayState: string;
  displayMsa: string;
  locationCount: number;
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

/** RFC-4180-compliant CSV parser */
function parseCsv(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQ && text[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if ((ch === '\n' || ch === '\r') && !inQ) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      lines.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur) lines.push(cur);

  const splitRow = (row: string): string[] => {
    const cols: string[] = [];
    let val = ''; let inq = false;
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') {
        if (inq && row[i + 1] === '"') { val += '"'; i++; }
        else inq = !inq;
      } else if (c === ',' && !inq) { cols.push(val); val = ''; }
      else val += c;
    }
    cols.push(val);
    return cols;
  };

  if (lines.length < 2) return [];
  const headers = splitRow(lines[0]);
  return lines.slice(1).filter(l => l.trim()).map(l => {
    const cols = splitRow(l);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h.trim()] = (cols[i] ?? '').trim(); });
    return obj;
  });
}

function rowToHospital(r: Record<string, string>): Hospital {
  return {
    id:                      parseInt(r.id) || 0,
    npi:                     parseInt(r.npi) || 0,
    cms_number:              r.cms_number || '',
    facility_name:           r.facility_name || '',
    facility_type:           r.facility_type || '',
    system_affiliation:      r.system_affiliation || '',
    address:                 r.address || '',
    city:                    r.city || '',
    state:                   r.state || '',
    zip:                     r.zip || '',
    cbsa_code:               r.cbsa_code || '',
    cbsa_name:               r.cbsa_name || '',
    cbsa_type:               r.cbsa_type || '',
    urban_rural:             r.urban_rural || '',
    bed_size:                r.bed_size ? parseInt(r.bed_size) : null,
    net_patient_revenue:     r.net_patient_revenue ? parseFloat(r.net_patient_revenue) : null,
    commercial_payer_mix:    r.commercial_payer_mix ? parseFloat(r.commercial_payer_mix) : null,
    ownership_type:          r.ownership_type || '',
    active_mrf:              r.active_mrf === 'true',
    mrf_failure_reason:      r.mrf_failure_reason || '',
    latest_production_version: r.latest_production_version || '',
    mrf_download_status:     r.mrf_download_status || '',
    qa_status:               r.qa_status || '',
  };
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
    const displayMsa = locationCount === 1 ? (first.cbsa_name || '—') : `${locationCount} Locations`;
    const locations = group.map(r => ({
      state: r.state,
      cbsa_name: r.cbsa_name,
      cbsa_code: r.cbsa_code,
    }));

    collapsed.push({
      npi,
      cms_number:              first.cms_number,
      facility_name:           first.facility_name,
      facility_type:           first.facility_type,
      system_affiliation:      first.system_affiliation,
      urban_rural:             first.urban_rural,
      bed_size:                first.bed_size,
      net_patient_revenue:     first.net_patient_revenue,
      active_mrf:              group.some(r => r.active_mrf),
      mrf_failure_reason:      first.mrf_failure_reason || '',
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
  const [allRows, setAllRows] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Load CSV once on mount
  const loadCsv = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/tracker_hospital_directory_reasons.csv`);
      const text = await res.text();
      setAllRows(parseCsv(text).map(rowToHospital));
    } catch (err) {
      console.error('Failed to load hospital directory CSV', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCsv(); }, [loadCsv]);

  // Client-side filter + sort + collapse
  const collapsed = useMemo(() => {
    let rows = allRows;
    if (stateFilter)        rows = rows.filter(r => r.state === stateFilter);
    if (activeMrfOnly)      rows = rows.filter(r => r.active_mrf);
    if (noMrfOnly)          rows = rows.filter(r => !r.active_mrf);
    if (typeFilter)         rows = rows.filter(r => r.facility_type === typeFilter);
    if (nameSearch.trim())  rows = rows.filter(r => r.facility_name.toLowerCase().includes(nameSearch.trim().toLowerCase()));
    if (cbsaSearch.trim())  rows = rows.filter(r => r.cbsa_name.toLowerCase().includes(cbsaSearch.trim().toLowerCase()));

    const c = collapseByNpi(rows);

    c.sort((a, b) => {
      let av: number | string | null = null;
      let bv: number | string | null = null;
      if      (sortField === 'net_patient_revenue') { av = a.net_patient_revenue; bv = b.net_patient_revenue; }
      else if (sortField === 'bed_size')             { av = a.bed_size;            bv = b.bed_size; }
      else if (sortField === 'facility_name')        { av = a.facility_name;       bv = b.facility_name; }
      else if (sortField === 'state')                { av = a.displayState;        bv = b.displayState; }
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === 'string' && typeof bv === 'string')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

    return c;
  }, [allRows, stateFilter, cbsaSearch, nameSearch, activeMrfOnly, noMrfOnly, typeFilter, sortField, sortDir]);

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

  const exportCSV = () => {
    if (collapsed.length === 0) return;
    const headers = ['NPI','CMS #','Facility Name','Type','System','City','State','ZIP','Location','Urban/Rural','Beds','NPR','Comm Mix','Ownership','Active MRF','MRF Usage Barrier','Production Version'];
    const rows = collapsed.map(h => [
      h.npi, h.cms_number, h.facility_name, h.facility_type, h.system_affiliation,
      '', h.displayState, '', h.displayMsa, h.urban_rural,
      h.bed_size ?? '', h.net_patient_revenue ?? '', '',
      '', h.active_mrf ? 'Yes' : 'No', h.mrf_failure_reason, fmtVersion(h.latest_production_version)
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
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

          {/* Location search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search location / metro..." value={cbsaSearch}
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
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-[#001A41] w-[180px] max-w-[180px]"
                  onClick={() => toggleSort('facility_name')}>
                  Facility Name <SortIcon field="facility_name" />
                </th>
                <th className="border-b border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">NPI</th>
                <th className="border-b border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                <th className="border-b border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-[#001A41]"
                  onClick={() => toggleSort('state')}>
                  State <SortIcon field="state" />
                </th>
                <th className="border-b border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Location</th>
                <th className="border-b border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Urban/Rural</th>
                <th className="border-b border-gray-200 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-[#001A41]"
                  onClick={() => toggleSort('net_patient_revenue')}>
                  NPR <SortIcon field="net_patient_revenue" />
                </th>
                <th className="border-b border-gray-200 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Active MRF</th>
                <th className="border-b border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">MRF Usage Barrier</th>
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
                    {/* Facility Name — ~2/3 width via fixed max-w */}
                    <td className="px-4 py-2.5 w-[180px] max-w-[180px]">
                      <div className="font-medium text-[#001A41] truncate" title={h.facility_name}>{h.facility_name}</div>
                      {h.system_affiliation && (
                        <div className="text-xs text-gray-400 truncate" title={h.system_affiliation}>{h.system_affiliation}</div>
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
                    {/* Location — renamed from MSA */}
                    <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[160px]">
                      {isMulti ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          <MapPin className="h-3 w-3" />
                          {h.locationCount} Locations
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
                    {/* Active MRF */}
                    <td className="px-3 py-2.5 text-center">
                      {h.active_mrf
                        ? <span className="inline-block h-2 w-2 rounded-full bg-green-500" title="Active MRF" />
                        : <span className="inline-block h-2 w-2 rounded-full bg-gray-200" title="No MRF" />
                      }
                    </td>
                    {/* MRF Usage Barrier — directly right of Active MRF */}
                    <td className="px-3 py-2.5 text-xs max-w-[160px]">
                      {h.mrf_failure_reason && h.mrf_failure_reason !== 'NA'
                        ? <span className="truncate block text-red-500" title={h.mrf_failure_reason}>{h.mrf_failure_reason}</span>
                        : <span className="text-gray-300">—</span>}
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
              {(() => {
                // Count occurrences of each cbsa_name
                const countMap = new Map<string, number>();
                for (const loc of modalRow.locations) {
                  const key = loc.cbsa_name || '—';
                  countMap.set(key, (countMap.get(key) || 0) + 1);
                }
                // Deduplicate — keep first occurrence of each cbsa_name
                const seen = new Set<string>();
                const deduped = modalRow.locations.filter(loc => {
                  const key = loc.cbsa_name || '—';
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                });
                // Sort: duplicates first (alphabetical within dupes), then singles (alphabetical)
                deduped.sort((a, b) => {
                  const aC = countMap.get(a.cbsa_name || '—') ?? 1;
                  const bC = countMap.get(b.cbsa_name || '—') ?? 1;
                  if (aC > 1 && bC === 1) return -1;
                  if (aC === 1 && bC > 1) return 1;
                  return (a.cbsa_name || '').localeCompare(b.cbsa_name || '');
                });
                return deduped.map((loc, idx) => {
                  const count = countMap.get(loc.cbsa_name || '—') ?? 1;
                  const label = count > 1
                    ? `${loc.cbsa_name || '—'} (${count})`
                    : (loc.cbsa_name || '—');
                  return (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#009DE0]" />
                        <span className="text-sm text-gray-700">{label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="font-semibold text-gray-600">{loc.state}</span>
                        {loc.cbsa_code && <span className="font-mono">{loc.cbsa_code}</span>}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
