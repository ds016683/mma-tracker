import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { regionHospitals } from '../../data/regionalHospitals';
import { X, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import type { RegionRow } from '../../lib/supabase/regionQueries';
import type { Region } from './USMap';

const NOTION_HOSPITALS_URL = 'https://www.notion.so/375750fa613d817faacef2e5bed9b830';
const NOTION_OPP_URL = 'https://www.notion.so/34f750fa613d813d8bf7c3578c5f2cfb';
const NOTION_NET_URL = 'https://www.notion.so/34f750fa613d81b6aef1e85b58ffe7dc';
const NOTION_NARRATIVE_URL = 'https://www.notion.so/34f750fa613d813980a7f50e249be477';

interface RegionPanelProps {
  region: Region;
  data: RegionRow | null;
  onClose: () => void;
  onSave: (regionId: number, updates: Partial<RegionRow>) => Promise<void>;
}

interface Opportunity {
  id: string; issue: string; category: string; priority: string;
  status: string; notes: string; notion_url: string; region_num: number;
}

interface NetworkEntry {
  name: string; carrier: string; plan_id: string; type: string;
}

interface V9Candidate {
  name: string; carrier: string; states: string[]; status: string; notes: string;
}

interface CoverageData {
  state_networks: Record<string, NetworkEntry[]>;
  v9_candidates: V9Candidate[];
}

interface NarrativeData {
  narrative: string; notion_url: string; region_num: number;
}

function parseJSON<T>(raw: string, prefix: string): T | null {
  if (!raw || !raw.startsWith(prefix)) return null;
  try { return JSON.parse(raw.slice(prefix.length)) as T; } catch { return null; }
}

function CollapsibleSection({ title, badge, notionUrl, children }: {
  title: string; badge?: string; notionUrl?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">{title}</span>
          {badge && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">{badge}</span>}
        </div>
        {notionUrl && open && (
          <a href={notionUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
            Edit in Notion <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

// --- Donut chart (SVG, no deps) ---
function DonutChart({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 88, height: 88 }}>
        <svg width={88} height={88} style={{ transform: 'rotate(-90deg)' }}>
          {/* track */}
          <circle cx={44} cy={44} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} />
          {/* fill */}
          <circle
            cx={44} cy={44} r={r} fill="none"
            stroke={color} strokeWidth={10}
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-800">{pct}%</span>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-600 text-center leading-tight">{label}</span>
    </div>
  );
}

// --- Hospital coverage popup ---
const COVERAGE_DATA = [
  { label: 'BCBS Coverage',   pct: 33, color: '#1e40af' },
  { label: 'United Coverage', pct: 67, color: '#0369a1' },
  { label: 'Cigna Coverage',  pct: 52, color: '#065f46' },
  { label: 'Aetna Coverage',  pct: 80, color: '#7c3aed' },
];

function HospitalPopup({ hospital, onClose }: { hospital: { npi: string; name: string }; onClose: () => void }) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={popupRef}
        className="relative bg-white rounded-2xl shadow-2xl px-8 py-7 flex flex-col items-center"
        style={{ width: 420, maxWidth: '95vw' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Header */}
        <h2 className="text-base font-bold text-[#001A41] text-center mb-1 pr-4">
          Coverage for {hospital.name}
        </h2>
        <p className="text-xs text-gray-400 font-mono mb-6">NPI {hospital.npi}</p>

        {/* Donuts */}
        <div className="grid grid-cols-2 gap-6 w-full justify-items-center mb-6">
          {COVERAGE_DATA.map((d) => (
            <DonutChart key={d.label} pct={d.pct} label={d.label} color={d.color} />
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-amber-600 text-center italic border-t border-gray-100 pt-4 w-full">
          This is example data and not representative of this hospital's actual coverage.
        </p>
      </div>
    </div>,
    document.body
  );
}

// --- State hospital row (with popup trigger) ---
function StateHospitalRow({ state, hospitals, onSelectHospital }: {
  state: string;
  hospitals: { npi: string; name: string }[];
  onSelectHospital: (h: { npi: string; name: string } | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 px-1 rounded transition-colors">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronRight className="h-3 w-3 text-gray-400" />}
          <span className="text-sm font-semibold text-gray-700">{state}</span>
        </div>
        <span className="text-xs text-gray-400">{hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''}</span>
      </button>
      {open && (
        <div className="ml-5 mb-2 space-y-1">
          {hospitals.map((h, i) => (
            <button
              key={i}
              onClick={() => onSelectHospital(h)}
              className="w-full flex items-start justify-between py-1 px-2 rounded bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-colors text-left group"
            >
              <div className="text-xs font-medium text-gray-700 group-hover:text-blue-800">{h.name}</div>
              <span className="text-xs text-gray-400 font-mono ml-2 flex-shrink-0">{h.npi}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StateNetworkRow({ state, networks }: { state: string; networks: NetworkEntry[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 px-1 rounded transition-colors">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronRight className="h-3 w-3 text-gray-400" />}
          <span className="text-sm font-semibold text-gray-700">{state}</span>
        </div>
        <span className="text-xs text-gray-400">{networks.length} networks</span>
      </button>
      {open && (
        <div className="ml-5 mb-2 space-y-1">
          {networks.map((n, i) => (
            <div key={i} className="flex items-start justify-between py-1 px-2 rounded bg-gray-50">
              <div>
                <div className="text-xs font-medium text-gray-700">{n.name}</div>
                {n.carrier && n.carrier !== n.name && (
                  <div className="text-xs text-gray-400">{n.carrier}</div>
                )}
              </div>
              {n.plan_id && <span className="text-xs text-gray-400 font-mono ml-2 flex-shrink-0">{n.plan_id}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RegionPanel({ region, data, onClose }: RegionPanelProps) {
  const [selectedHospital, setSelectedHospital] = useState<{ npi: string; name: string } | null>(null);
  const opportunities = parseJSON<Opportunity[]>(data?.areas_of_opportunity ?? '', '__json__');
  const coverageData = parseJSON<CoverageData>(data?.v8_coverage ?? '', '__json__');
  const narrativeData = parseJSON<NarrativeData>(data?.networks_of_interest ?? '', '__narrative__');

  const stateEntries = coverageData ? Object.entries(coverageData.state_networks) : [];
  const v9Candidates = coverageData?.v9_candidates ?? [];

  const updatedDate = data?.updated_at
    ? new Date(data.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <>
      {selectedHospital && (
        <HospitalPopup hospital={selectedHospital} onClose={() => setSelectedHospital(null)} />
      )}
      <div className="flex h-full flex-col bg-white shadow-xl" style={{ width: 400, minWidth: 400 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ background: region.color }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Region {region.id}</p>
          <h2 className="text-lg font-bold text-white">{region.name}</h2>
          <p className="text-xs text-white/60 mt-0.5">{stateEntries.map(([s]) => s).join(', ')}</p>
        </div>
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* Opportunity Narrative */}
        <CollapsibleSection title="Opportunity Narrative" notionUrl={NOTION_NARRATIVE_URL}>
          {narrativeData?.narrative ? (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{narrativeData.narrative}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No narrative yet.{" "}
              <a href={NOTION_NARRATIVE_URL} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                Add one in Notion →
              </a>
            </p>
          )}
        </CollapsibleSection>

        {/* v8 Regional Coverage */}
        <CollapsibleSection
          title="v8 Regional Coverage"
          badge={stateEntries.length > 0 ? `${stateEntries.length} states` : undefined}
          notionUrl={NOTION_NET_URL}
        >
          {coverageData && stateEntries.length > 0 ? (
            <div className="space-y-0 -mx-1">
              {stateEntries.map(([state, nets]) => (
                <StateNetworkRow key={state} state={state} networks={nets} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No coverage data</p>
          )}
        </CollapsibleSection>

        {/* v9 Candidates */}
        <CollapsibleSection
          title="v9 Candidates"
          badge={v9Candidates.length > 0 ? `${v9Candidates.length}` : undefined}
          notionUrl={NOTION_NET_URL}
        >
          {v9Candidates.length > 0 ? (
            <div className="space-y-2">
              {v9Candidates.map((c, i) => (
                <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <div className="text-sm font-medium text-gray-800">{c.name}</div>
                  {c.states.length > 0 && <div className="text-xs text-gray-500 mt-0.5">{c.states.join(', ')}</div>}
                  {c.status && c.status !== 'v9 candidate' && (
                    <div className="text-xs text-blue-600 mt-1 italic">{c.status}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No v9 candidates for this region</p>
          )}
        </CollapsibleSection>

        {/* Regional Hospitals */}
        {(() => {
          const hospitalsByState = regionHospitals[region.id] ?? {};
          const stateEntries2 = Object.entries(hospitalsByState).sort(([a], [b]) => a.localeCompare(b));
          const totalHospitals = stateEntries2.reduce((sum, [, h]) => sum + h.length, 0);
          return (
            <CollapsibleSection
              title="Regional Hospitals"
              badge={totalHospitals > 0 ? `${totalHospitals} hospitals` : undefined}
              notionUrl={NOTION_HOSPITALS_URL}
            >
              {stateEntries2.length > 0 ? (
                <div className="space-y-0 -mx-1">
                  {stateEntries2.map(([state, hospitals]) => (
                    <StateHospitalRow key={state} state={state} hospitals={hospitals} onSelectHospital={setSelectedHospital} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No hospital data for this region</p>
              )}
            </CollapsibleSection>
          );
        })()}

        {/* Areas of Opportunity */}
        <CollapsibleSection
          title="Current Areas of Opportunity"
          badge={opportunities ? `${opportunities.length}` : undefined}
          notionUrl={NOTION_OPP_URL}
        >
          {opportunities ? (
            opportunities.length === 0 ? (
              <p className="text-sm text-gray-300 italic">No items logged</p>
            ) : (
              <div className="space-y-2">
                {opportunities.map(opp => (
                  <a key={opp.id} href={opp.notion_url} target="_blank" rel="noopener noreferrer"
                    className="block rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 hover:bg-blue-50 hover:border-blue-200 transition-colors group">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-gray-800 group-hover:text-blue-800 leading-snug">{opp.issue}</span>
                      <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-blue-400 flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      {opp.category && <span className="rounded px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700">{opp.category}</span>}
                      {opp.priority && (
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          opp.priority === 'High' ? 'bg-red-100 text-red-700' :
                          opp.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'}`}>{opp.priority}</span>
                      )}
                      {opp.status && (
                        <span className={`rounded px-1.5 py-0.5 text-xs ${
                          opp.status === 'Open' ? 'bg-red-50 text-red-600' :
                          opp.status === 'In Progress' ? 'bg-yellow-50 text-yellow-600' :
                          opp.status === 'Resolved' ? 'bg-green-50 text-green-600' :
                          'bg-gray-100 text-gray-500'}`}>{opp.status}</span>
                      )}
                      {opp.region_num === 0 && <span className="text-xs text-gray-400 italic">Cross-regional</span>}
                    </div>
                  </a>
                ))}
              </div>
            )
          ) : (
            <p className="text-sm text-gray-300 italic">Loading...</p>
          )}
        </CollapsibleSection>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-5 py-3">
        <p className="text-xs text-gray-400">{updatedDate ? `Last synced: ${updatedDate}` : 'No data yet'}</p>
      </div>
      </div>
    </>
  );
}
