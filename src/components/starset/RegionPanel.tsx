import { useState } from 'react';
import { X, Pencil, Save, XCircle, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import type { RegionRow } from '../../lib/supabase/regionQueries';
import type { Region } from './USMap';
import { useAuth } from '../../contexts/AuthContext';

const ADMIN_EMAIL = 'david.smith@thirdhorizon.com';
const NOTION_NARRATIVE_URL = 'https://www.notion.so/34f750fa613d813980a7f50e249be477';
const NOTION_OPP_URL = 'https://www.notion.so/34f750fa613d813d8bf7c3578c5f2cfb';
const NOTION_NET_URL = 'https://www.notion.so/34f750fa613d81b6aef1e85b58ffe7dc';

interface RegionPanelProps {
  region: Region;
  data: RegionRow | null;
  onClose: () => void;
  onSave: (regionId: number, updates: Partial<RegionRow>) => Promise<void>;
}

interface EditState {
  networks_of_interest: string;
  v8_coverage: string;
  areas_of_opportunity: string;
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

interface NarrativeData {
  narrative: string; notion_url: string; region_num: number;
}

interface CoverageData {
  state_networks: Record<string, NetworkEntry[]>;
  v9_candidates: V9Candidate[];
}

function parseJSON<T>(raw: string, prefix: string): T | null {
  if (!raw || !raw.startsWith(prefix)) return null;
  try { return JSON.parse(raw.slice(prefix.length)) as T; } catch { return null; }
}

// Collapsible section wrapper
function CollapsibleSection({ title, badge, notionUrl, children, defaultOpen = false }: {
  title: string; badge?: string; notionUrl?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
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

// State → networks collapsible
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

export function RegionPanel({ region, data, onClose, onSave }: RegionPanelProps) {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    networks_of_interest: data?.networks_of_interest ?? '',
    v8_coverage: data?.v8_coverage ?? '',
    areas_of_opportunity: data?.areas_of_opportunity ?? '',
  });

  const opportunities = parseJSON<Opportunity[]>(data?.areas_of_opportunity ?? '', '__json__');
  const narrativeData = parseJSON<NarrativeData>(data?.networks_of_interest ?? '', '__narrative__');
  const coverageData = parseJSON<CoverageData>(data?.v8_coverage ?? '', '__json__');

  const handleEdit = () => {
    setEditState({
      networks_of_interest: data?.networks_of_interest ?? '',
      v8_coverage: data?.v8_coverage ?? '',
      areas_of_opportunity: data?.areas_of_opportunity ?? '',
    });
    setEditing(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(region.id, editState);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updatedDate = data?.updated_at
    ? new Date(data.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const stateEntries = coverageData ? Object.entries(coverageData.state_networks) : [];
  const v9Candidates = coverageData?.v9_candidates ?? [];

  return (
    <div className="flex h-full flex-col bg-white shadow-xl" style={{ width: 400, minWidth: 400 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ background: region.color }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Region {region.id}</p>
          <h2 className="text-lg font-bold text-white">{region.name}</h2>
          <p className="text-xs text-white/60 mt-0.5">{stateEntries.map(([s]) => s).join(', ')}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && !editing && (
            <button onClick={handleEdit} className="flex items-center gap-1.5 rounded-md bg-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-colors">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )}
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {saved && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm font-medium text-green-700">Saved</div>}

        {/* Opportunity Narrative */}
        <CollapsibleSection title="Opportunity Narrative" notionUrl={NOTION_NARRATIVE_URL} defaultOpen={true}>
          {narrativeData?.narrative ? (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{narrativeData.narrative}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No narrative yet.{' '}
              <a href={NOTION_NARRATIVE_URL} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                Add one in Notion →
              </a>
            </p>
          )}
        </CollapsibleSection>

        {/* Networks of Interest */}
        <CollapsibleSection title="Networks of Interest">
          {editing ? (
            <textarea value={editState.networks_of_interest} onChange={e => setEditState(s => ({...s, networks_of_interest: e.target.value}))}
              rows={3} placeholder="Networks currently active..."
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-y" />
          ) : (
            <div className="text-sm text-gray-700">
              {data?.networks_of_interest || <span className="text-gray-300 italic">Not configured</span>}
            </div>
          )}
        </CollapsibleSection>

        {/* v8 Coverage */}
        <CollapsibleSection
          title="v8 Regional Coverage"
          badge={stateEntries.length > 0 ? `${stateEntries.length} states` : undefined}
          notionUrl={NOTION_NET_URL}
          defaultOpen={false}
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

        {/* Areas of Opportunity */}
        <CollapsibleSection
          title="Current Areas of Opportunity"
          badge={opportunities ? `${opportunities.length}` : undefined}
          notionUrl={NOTION_OPP_URL}
          defaultOpen={true}
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
      {editing ? (
        <div className="border-t border-gray-100 px-5 py-4 flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#001A41] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#002C5F] disabled:opacity-50 transition-colors">
            <Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={() => setEditing(false)} disabled={saving}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <XCircle className="h-4 w-4" />Cancel
          </button>
        </div>
      ) : (
        <div className="border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-400">{updatedDate ? `Last updated: ${updatedDate}` : 'No data yet'}</p>
        </div>
      )}
    </div>
  );
}
