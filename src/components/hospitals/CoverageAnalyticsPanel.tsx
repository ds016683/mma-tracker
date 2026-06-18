import { useMemo, useState } from 'react';
import { MSABubbleMap } from './MSABubbleMap';
import { NetworkVersionDiff } from './NetworkVersionDiff';
import {
  MSA_BUBBLE_DATA, MSA_NETWORK_DETAIL, NETWORK_VERSION_CHANGES, STATE_HOSPITAL_COVERAGE
} from '../../data/pipeline-intelligence-data';

const CORE_NETWORKS = ['Aetna', 'BCBS PPO', 'Cigna', 'UHC'];
const ALL_NETWORKS = ['All', 'Aetna', 'BCBS PPO', 'BCBS Home Plan', 'BCBS HPN', 'Cigna', 'UHC', 'HealthPartners', 'Priority Health', 'The Alliance'];

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold" style={{ color: color ?? '#1a1a1a' }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function CoverageAnalyticsPanel() {
  const [version, setVersion] = useState<'v8' | 'v9' | 'both'>('v9');
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedMsa, setSelectedMsa] = useState<typeof MSA_BUBBLE_DATA[0] | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'diff' | 'hospital'>('map');

  // Aggregate stats for top cards
  const stats = useMemo(() => {
    const vKey = version === 'both' ? 'v9' : version;
    const filtered = selectedNetwork
      ? MSA_BUBBLE_DATA.filter(m => (m[`${vKey}_networks` as keyof typeof m] as string[]).includes(selectedNetwork))
      : MSA_BUBBLE_DATA;
    const totalProviders = filtered.reduce((s, m) => s + (m[`${vKey}_providers` as keyof typeof m] as number), 0);
    const totalRecords = filtered.reduce((s, m) => s + (m[`${vKey}_records` as keyof typeof m] as number), 0);
    const totalMsas = filtered.length;

    // Hospital coverage totals
    const hc = STATE_HOSPITAL_COVERAGE;
    const totalHospitals = hc.reduce((s, r) => s + r.total_hospitals, 0);
    const totalInMrf = hc.reduce((s, r) => s + r.in_v8_mrf, 0);

    return { totalProviders, totalRecords, totalMsas, totalHospitals, totalInMrf };
  }, [version, selectedNetwork]);

  // MSA drill-down: get network detail for selected MSA
  const msaDetail = useMemo(() => {
    if (!selectedMsa) return [];
    return MSA_NETWORK_DETAIL.filter(d => d.msa_id === selectedMsa.msa_id);
  }, [selectedMsa]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Pipeline Version</label>
          <div className="flex rounded-md overflow-hidden border border-gray-200">
            {(['v8', 'v9', 'both'] as const).map(v => (
              <button key={v} onClick={() => setVersion(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${version === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {v === 'both' ? 'v8 + v9' : v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Network Filter</label>
          <select
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none"
            value={selectedNetwork ?? 'All'}
            onChange={e => setSelectedNetwork(e.target.value === 'All' ? null : e.target.value)}
          >
            {ALL_NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="ml-auto text-xs text-gray-400">
          Source: starset-lumen-bq · admin_metadata_lineage_reports
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Priority MSAs" value={stats.totalMsas} sub={version === 'both' ? 'v8 + v9' : version.toUpperCase()} color="#2563eb" />
        <StatCard label="Providers (max)" value={fmt(stats.totalProviders)} sub="across MSAs" />
        <StatCard label="Rate Records" value={fmt(stats.totalRecords)} sub="indexed" />
        <StatCard label="Hospitals in MRF" value={stats.totalInMrf.toLocaleString()} sub={`of ${stats.totalHospitals.toLocaleString()} total`} />
        <StatCard label="Core Networks" value={CORE_NETWORKS.length} sub="Aetna · BCBS · Cigna · UHC" />
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'map' as const, label: 'MSA Coverage Map' },
          { id: 'diff' as const, label: 'Version Diff (v8→v9)' },
          { id: 'hospital' as const, label: 'Hospital Coverage' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Map tab */}
      {activeTab === 'map' && (
        <div className="space-y-3">
          <MSABubbleMap
            data={MSA_BUBBLE_DATA}
            selectedVersion={version}
            selectedNetwork={selectedNetwork}
            onMsaClick={setSelectedMsa}
          />

          {/* MSA drill-down panel */}
          {selectedMsa && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-800">{selectedMsa.msa_name}</div>
                  <div className="text-xs text-gray-500">MSA {selectedMsa.msa_id} · {selectedMsa.state}</div>
                </div>
                <button onClick={() => setSelectedMsa(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕ Close</button>
              </div>
              {msaDetail.length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-1 text-gray-500 font-medium">Network</th>
                      <th className="text-left pb-1 text-gray-500 font-medium">Version</th>
                      <th className="text-right pb-1 text-gray-500 font-medium">Providers</th>
                      <th className="text-right pb-1 text-gray-500 font-medium">Records</th>
                      <th className="text-right pb-1 text-gray-500 font-medium">Plans</th>
                    </tr>
                  </thead>
                  <tbody>
                    {msaDetail.map((d, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-1.5 text-gray-700">{d.network}</td>
                        <td className="py-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${d.version === 'v9' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {d.version}
                          </span>
                        </td>
                        <td className="py-1.5 text-right text-gray-700">{d.n_providers.toLocaleString()}</td>
                        <td className="py-1.5 text-right text-gray-700">{fmt(d.n_records)}</td>
                        <td className="py-1.5 text-right text-gray-700">{d.n_plans}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-xs text-gray-400">No core network detail for this MSA</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Version diff tab */}
      {activeTab === 'diff' && (
        <NetworkVersionDiff changes={NETWORK_VERSION_CHANGES} selectedNetwork={selectedNetwork} />
      )}

      {/* Hospital coverage tab */}
      {activeTab === 'hospital' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">Hospital MRF Coverage by State</span>
            <span className="ml-2 text-xs text-gray-400">Source: hospital_npi_coverage_report_mma_v8</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['State', 'Total Hospitals', 'In v8 MRF', 'MRF %', 'Aetna', 'BCBS', 'Cigna', 'UHC'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STATE_HOSPITAL_COVERAGE.filter(r => r.state.length === 2).sort((a, b) => a.state.localeCompare(b.state)).map((r, i) => {
                  const pct = r.total_hospitals > 0 ? ((r.in_v8_mrf / r.total_hospitals) * 100).toFixed(0) : '0';
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 font-semibold text-gray-700">{r.state}</td>
                      <td className="px-3 py-2 text-gray-600">{r.total_hospitals.toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-600">{r.in_v8_mrf.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-gray-500">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{r.in_aetna.toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-600">{r.in_bcbs.toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-600">{r.in_cigna.toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-600">{r.in_uhc.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
