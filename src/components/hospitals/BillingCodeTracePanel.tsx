import { useState, useEffect, useMemo } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

interface AhdRecord { npi: number; name: string; state: string; city: string; }

interface TraceResult {
  provider: Record<string, string | null> | null;
  network_coverage: Record<string, string | null> | null;
  source_rates: Record<string, string | null>[];
  mma_output: Record<string, string | null>[];
  source_rate_count: string;
  mma_output_count: string;
}

const NETWORKS = ['Aetna', 'BCBS PPO', 'Cigna', 'UHC', 'BCBS Home Plan', 'BCBS HPN', 'HealthPartners', 'UHC Choice Plus'];

type NpiInputMode = 'npi' | 'name';

function StageCard({
  stage, label, status, summary, children, defaultOpen
}: {
  stage: number; label: string; status: 'found' | 'missing' | 'pending' | 'loading';
  summary: string; children?: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  const statusIcon = {
    found:   <CheckCircle size={16} className="text-green-500 shrink-0" />,
    missing: <XCircle size={16} className="text-red-400 shrink-0" />,
    pending: <AlertCircle size={16} className="text-gray-300 shrink-0" />,
    loading: <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />,
  }[status];

  const borderColor = {
    found: 'border-green-200', missing: 'border-red-100',
    pending: 'border-gray-100', loading: 'border-blue-100',
  }[status];

  return (
    <div className={`rounded-lg border bg-white overflow-hidden ${borderColor}`}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        onClick={() => children && setOpen(o => !o)}
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-600 shrink-0">
          {stage}
        </div>
        {statusIcon}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-800">{label}</div>
          <div className="text-xs text-gray-500 truncate">{summary}</div>
        </div>
        {children && (
          <span className="text-gray-400">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
      </button>
      {open && children && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 text-xs">
          {children}
        </div>
      )}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 w-32 shrink-0">{label}</span>
      <span className="font-medium text-gray-800">{value ?? '—'}</span>
    </div>
  );
}

function RateRow({ r }: { r: Record<string, string | null> }) {
  return (
    <div className="grid grid-cols-5 gap-2 py-1.5 border-b border-gray-100 last:border-0 text-xs">
      <span className="text-gray-600 truncate">{r.carrier_plan_name}</span>
      <span className="text-gray-600">{r.billing_class}</span>
      <span className="text-gray-600">{r.npi_practice_state}</span>
      <span className="text-gray-600">{r.negotiated_type}</span>
      <span className="font-semibold text-gray-800">${parseFloat(r.negotiated_rate ?? '0').toFixed(2)}</span>
    </div>
  );
}

function MmaRow({ r }: { r: Record<string, string | null> }) {
  const imputed = r.imputed_rate_flag === '1';
  return (
    <div className="grid grid-cols-6 gap-2 py-1.5 border-b border-gray-100 last:border-0 text-xs">
      <span className="text-gray-600 truncate">{r.network}</span>
      <span className="text-gray-600 truncate">{r.msa_cbsa_name}</span>
      <span className="text-gray-600">{r.billing_class}</span>
      <span className="text-gray-600">{r.negotiated_type}</span>
      <span className={`font-semibold ${imputed ? 'text-amber-600' : 'text-green-700'}`}>
        ${parseFloat(r.negotiated_rate_final ?? '0').toFixed(2)}
        {imputed && <span className="ml-1 text-amber-400">~</span>}
      </span>
      <span className="text-gray-400">{r.source_rate_flag}</span>
    </div>
  );
}

interface BillingCodeTracePanelProps {
  initialNpi?: string;
  initialName?: string;
  onNpiUsed?: () => void;
}

export function BillingCodeTracePanel({ initialNpi, initialName, onNpiUsed }: BillingCodeTracePanelProps) {
  const [billingCode, setBillingCode] = useState('');
  const [npi, setNpi] = useState('');
  const [network, setNetwork] = useState('');
  const [npiMode, setNpiMode] = useState<NpiInputMode>('npi');
  const [nameSearch, setNameSearch] = useState('');
  const [nameDropdownOpen, setNameDropdownOpen] = useState(false);
  const [selectedHospitalName, setSelectedHospitalName] = useState('');

  // Pre-fill NPI when coming from hospital side panel
  useEffect(() => {
    if (initialNpi) {
      setNpi(initialNpi);
      setNpiMode('npi');
      if (initialName) setSelectedHospitalName(initialName);
      onNpiUsed?.();
    }
  }, [initialNpi, initialName, onNpiUsed]);

  // Lazy-load AHD autocomplete when name mode is selected
  const [ahdData, setAhdData] = useState<AhdRecord[]>([]);
  useEffect(() => {
    if (npiMode === 'name' && ahdData.length === 0) {
      fetch(`${import.meta.env.BASE_URL}data/ahd-autocomplete.json`)
        .then(r => r.json())
        .then(setAhdData)
        .catch(() => {});
    }
  }, [npiMode, ahdData.length]);

  const nameSuggestions = useMemo(() => {
    if (!nameSearch || nameSearch.length < 3) return [];
    const q = nameSearch.toLowerCase();
    return ahdData
      .filter((h: AhdRecord) => h.name?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [nameSearch, ahdData]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TraceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runTrace() {
    if (!billingCode.trim() || !npi.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('bigquery-pipeline-trace', {
        body: {
          action: 'code-trace',
          billing_code: billingCode.trim().toUpperCase(),
          npi: npi.trim(),
          ...(network ? { network } : {}),
        },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (!data.ok) throw new Error(data.error);
      setResult(data.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const prov = result?.provider;
  const netCov = result?.network_coverage;
  const sources = result?.source_rates ?? [];
  const mmaOut = result?.mma_output ?? [];

  // Summarize rates
  const rateValues = sources.map(r => parseFloat(r.negotiated_rate ?? '0')).filter(v => v > 0);
  const rateMin = rateValues.length ? Math.min(...rateValues) : null;
  const rateMax = rateValues.length ? Math.max(...rateValues) : null;
  const rateAvg = rateValues.length ? rateValues.reduce((a, b) => a + b, 0) / rateValues.length : null;

  const mmaValues = mmaOut.map(r => parseFloat(r.negotiated_rate_final ?? '0')).filter(v => v > 0);
  const mmaMin = mmaValues.length ? Math.min(...mmaValues) : null;
  const mmaMax = mmaValues.length ? Math.max(...mmaValues) : null;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Billing Code (CPT/MS-DRG)</label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="e.g. 99213 or 470"
              value={billingCode}
              onChange={e => setBillingCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runTrace()}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">Provider</label>
              <div className="flex rounded overflow-hidden border border-gray-200">
                <button onClick={() => setNpiMode('npi')}
                  className={`px-2 py-0.5 text-xs font-medium transition-colors ${npiMode==='npi' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                  NPI
                </button>
                <button onClick={() => setNpiMode('name')}
                  className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium transition-colors ${npiMode==='name' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                  <Building2 size={10} /> Name
                </button>
              </div>
            </div>
            {npiMode === 'npi' ? (
              <input
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="10-digit NPI"
                value={npi}
                onChange={e => setNpi(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runTrace()}
              />
            ) : (
              <div className="relative">
                <input
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Type hospital name…"
                  value={nameSearch}
                  onChange={e => { setNameSearch(e.target.value); setNameDropdownOpen(true); }}
                  onFocus={() => setNameDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setNameDropdownOpen(false), 150)}
                />
                {nameDropdownOpen && nameSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-52 overflow-y-auto">
                    {nameSuggestions.map(h => (
                      <button key={h.npi} className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                        onMouseDown={() => {
                          setNpi(String(h.npi));
                          setSelectedHospitalName(h.name);
                          setNameSearch(h.name);
                          setNameDropdownOpen(false);
                          setNpiMode('npi');
                        }}>
                        <div className="text-sm font-medium text-gray-800">{h.name}</div>
                        <div className="text-xs text-gray-400">{h.city}, {h.state} · NPI {h.npi}</div>
                      </button>
                    ))}
                  </div>
                )}
                {npi && selectedHospitalName && (
                  <div className="mt-1 text-xs text-blue-600">→ NPI {npi} selected</div>
                )}
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Network (optional)</label>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              value={network}
              onChange={e => setNetwork(e.target.value)}
            >
              <option value="">All networks</option>
              {NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={runTrace}
              disabled={loading || !billingCode.trim() || !npi.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
            >
              <Search size={14} />
              {loading ? 'Tracing…' : 'Trace'}
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{error}</div>
        )}
      </div>

      {/* Pipeline DAG */}
      {(loading || result) && (
        <div className="space-y-2">
          {/* Connector line visual */}
          <div className="flex items-center gap-1 px-2 mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pipeline Trace</span>
            {result && (
              <span className="ml-2 text-xs text-gray-400">
                {billingCode.toUpperCase()} · NPI {npi}
                {network ? ` · ${network}` : ''}
              </span>
            )}
          </div>

          {/* Stage 1: Provider Identity */}
          <StageCard
            stage={1}
            label="Provider Identity (AHD Directory)"
            status={loading ? 'loading' : prov ? 'found' : 'missing'}
            summary={prov ? `${prov.facility_name} · ${prov.npi_practice_city}, ${prov.npi_practice_state}` : 'NPI not found in AHD 2023 directory'}
            defaultOpen={!!prov}
          >
            {prov && (
              <div className="space-y-1">
                <KV label="Facility Name" value={prov.facility_name} />
                <KV label="Facility Type" value={prov.facility_type} />
                <KV label="Ownership" value={prov.hospital_ownership_type} />
                <KV label="Location" value={`${prov.npi_practice_city}, ${prov.npi_practice_state} ${prov.npi_provider_zip_code}`} />
                <KV label="System" value={prov.system_affiliation} />
                <KV label="CBSA Code" value={prov.cbsa_code} />
                <KV label="Bed Size" value={prov.bed_size} />
                <KV label="Payer Mix" value={prov.commercial_payer_mix ? `${parseFloat(prov.commercial_payer_mix).toFixed(1)}%` : null} />
              </div>
            )}
          </StageCard>

          {/* Connector */}
          <div className="flex justify-center"><div className="w-0.5 h-4 bg-gray-200" /></div>

          {/* Stage 2: MRF Coverage */}
          <StageCard
            stage={2}
            label="MRF Network Coverage"
            status={loading ? 'loading' : netCov ? 'found' : 'missing'}
            summary={netCov
              ? `v8 MRF: ${netCov.in_v8_prov_mrf === '1' ? '✓' : '✗'} · Aetna: ${netCov.in_aetna_pos === '1' ? '✓' : '✗'} · BCBS: ${netCov.in_bcbs_ppo === '1' ? '✓' : '✗'} · Cigna: ${netCov.in_cigna_oap === '1' ? '✓' : '✗'} · UHC: ${netCov.in_uhc_choice === '1' ? '✓' : '✗'}`
              : 'NPI not in hospital MRF coverage report'}
            defaultOpen={!!netCov}
          >
            {netCov && (
              <div className="grid grid-cols-2 gap-1">
                {[
                  ['v8 MRF Processed', netCov.in_v8_prov_mrf === '1'],
                  ['v7 MRF Processed', netCov.in_v7_prov_mrf === '1'],
                  ['Aetna POS', netCov.in_aetna_pos === '1'],
                  ['BCBS PPO', netCov.in_bcbs_ppo === '1'],
                  ['Cigna OAP', netCov.in_cigna_oap === '1'],
                  ['UHC Choice', netCov.in_uhc_choice === '1'],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex items-center gap-2">
                    <span className={val ? 'text-green-500' : 'text-red-400'}>{val ? '✓' : '✗'}</span>
                    <span className="text-gray-700">{label as string}</span>
                  </div>
                ))}
                {netCov.total_komodo_util && (
                  <div className="col-span-2 mt-1 pt-1 border-t border-gray-100">
                    <KV label="Komodo Utilization" value={`${parseFloat(netCov.total_komodo_util).toLocaleString()} claims`} />
                  </div>
                )}
              </div>
            )}
          </StageCard>

          {/* Connector */}
          <div className="flex justify-center"><div className="w-0.5 h-4 bg-gray-200" /></div>

          {/* Stage 3: Source Rate Lookup (PP.0) */}
          <StageCard
            stage={3}
            label="Source Rate Lookup (PP.0 v8)"
            status={loading ? 'loading' : sources.length > 0 ? 'found' : result ? 'missing' : 'pending'}
            summary={sources.length > 0
              ? `${result?.source_rate_count ?? sources.length} rate records · $${rateMin?.toFixed(2)}–$${rateMax?.toFixed(2)} · avg $${rateAvg?.toFixed(2)}`
              : result ? 'No source rates found for this code/NPI combination' : ''}
            defaultOpen={sources.length > 0}
          >
            {sources.length > 0 && (
              <>
                <div className="grid grid-cols-5 gap-2 pb-1.5 border-b border-gray-200 text-xs font-medium text-gray-500">
                  <span>Plan</span><span>Class</span><span>State</span><span>Type</span><span>Rate</span>
                </div>
                {sources.slice(0, 20).map((r, i) => <RateRow key={i} r={r} />)}
                {sources.length > 20 && (
                  <div className="text-xs text-gray-400 pt-1">Showing 20 of {result?.source_rate_count} records</div>
                )}
              </>
            )}
          </StageCard>

          {/* Connector */}
          <div className="flex justify-center"><div className="w-0.5 h-4 bg-gray-200" /></div>

          {/* Stage 4: Network Classification */}
          <StageCard
            stage={4}
            label="Network Classification"
            status={loading ? 'loading' : sources.length > 0 ? 'found' : result ? 'missing' : 'pending'}
            summary={sources.length > 0
              ? `${[...new Set(sources.map(r => r.carrier_name))].filter(Boolean).join(' · ')}`
              : result ? 'No carrier classification data' : ''}
          >
            {sources.length > 0 && (
              <div className="space-y-1">
                {[...new Set(sources.map(r => r.carrier_name))].filter(Boolean).map(cn => {
                  const plans = [...new Set(sources.filter(r => r.carrier_name === cn).map(r => r.carrier_plan_name))];
                  return (
                    <div key={cn as string}>
                      <div className="font-medium text-gray-700">{cn}</div>
                      <div className="text-gray-500 ml-3">{plans.slice(0, 3).join(', ')}{plans.length > 3 ? ` +${plans.length - 3} more` : ''}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </StageCard>

          {/* Connector */}
          <div className="flex justify-center"><div className="w-0.5 h-4 bg-gray-200" /></div>

          {/* Stage 5: MMA Transfer Output */}
          <StageCard
            stage={5}
            label="MMA Transfer Output (Final Rate)"
            status={loading ? 'loading' : mmaOut.length > 0 ? 'found' : result ? 'missing' : 'pending'}
            summary={mmaOut.length > 0
              ? `${result?.mma_output_count ?? mmaOut.length} output records · $${mmaMin?.toFixed(2)}–$${mmaMax?.toFixed(2)} · ${[...new Set(mmaOut.map(r => r.network))].filter(Boolean).join(', ')}`
              : result ? 'Code/NPI not present in MMA transfer output' : ''}
            defaultOpen={mmaOut.length > 0}
          >
            {mmaOut.length > 0 && (
              <>
                <div className="grid grid-cols-6 gap-2 pb-1.5 border-b border-gray-200 text-xs font-medium text-gray-500">
                  <span>Network</span><span>MSA</span><span>Class</span><span>Type</span><span>Final Rate</span><span>Flag</span>
                </div>
                {mmaOut.slice(0, 20).map((r, i) => <MmaRow key={i} r={r} />)}
                {mmaOut.length > 20 && (
                  <div className="text-xs text-gray-400 pt-1">Showing 20 of {result?.mma_output_count} records</div>
                )}
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-amber-600">
                  ~ = imputed rate (not sourced directly from MRF)
                </div>
              </>
            )}
          </StageCard>
        </div>
      )}

      {!loading && !result && (
        <div className="text-center py-12 text-gray-400">
          <Search size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Enter a billing code and NPI to trace its pipeline path</p>
          <p className="text-xs mt-1">Example: CPT 99213 or MS-DRG 470</p>
        </div>
      )}
    </div>
  );
}
