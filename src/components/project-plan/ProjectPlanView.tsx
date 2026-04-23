import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { fetchMondayBoard, GROUP_ORDER } from '../../lib/monday/client';
import type { MondayItem } from '../../lib/monday/client';

const STATUS_STYLES: Record<string, string> = {
  'Working on it': 'bg-[#fdab3d] text-white',
  'Done':          'bg-[#00c875] text-white',
  'Stuck':         'bg-[#df2f4a] text-white',
  'Not Started':   'bg-gray-200 text-gray-500',
  'In Progress':   'bg-[#fdab3d] text-white',
  '':              'bg-gray-100 text-gray-400',
};

function statusStyle(s: string) {
  return STATUS_STYLES[s] ?? 'bg-gray-100 text-gray-500';
}

function fmtDate(d: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }); }
  catch { return d; }
}

function StakesChip({ stakes }: { stakes: string }) {
  const color = stakes === 'High'
    ? 'bg-red-50 text-red-700 border-red-200'
    : stakes === 'Medium'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : stakes === 'Low'
    ? 'bg-gray-50 text-gray-500 border-gray-200'
    : '';
  if (!stakes || !color) return null;
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}>{stakes}</span>;
}

export function ProjectPlanView() {
  const [items, setItems] = useState<MondayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMondayBoard();
      setItems(data);
      setLastSync(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function toggleGroup(id: string) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleItem(id: string) {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const itemsByGroup: Record<string, MondayItem[]> = {};
  for (const item of items) {
    (itemsByGroup[item.groupId] ??= []).push(item);
  }

  const noApiKey = !import.meta.env.VITE_MONDAY_API_KEY;

  return (
    <div className="flex h-screen flex-col bg-[#f5f6f8]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#224057]">Project Plan</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Live from Monday.com · Board: Marsh McLennan Agency
              {lastSync && <span> · Synced {lastSync.toLocaleTimeString()}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://thirdhorizonstrategies.monday.com/boards/18409785203"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-300 hover:text-gray-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Monday
            </a>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-[#224057] px-3 py-1.5 text-xs text-white hover:bg-[#234D8B] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Syncing…' : 'Sync'}
            </button>
          </div>
        </div>
      </div>

      {noApiKey && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          VITE_MONDAY_API_KEY not configured — add it to GitHub Actions secrets to enable live sync.
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Sync error: {error}
        </div>
      )}

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

          {/* Column headers */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_3fr_1fr_1fr] border-b border-gray-200 bg-gray-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            <span>Project</span>
            <span>Accountable</span>
            <span>Responsible</span>
            <span>Start</span>
            <span>Target Completion</span>
            <span>Description</span>
            <span>Status</span>
            <span>Stakes</span>
          </div>

          {GROUP_ORDER.map(group => {
            const groupItems = itemsByGroup[group.id] ?? [];
            const isCollapsed = !!collapsed[group.id];

            return (
              <div key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5 text-left hover:bg-gray-100 transition-colors"
                >
                  {isCollapsed
                    ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#224057]" />
                    : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#224057]" />}
                  <span className="text-xs font-bold text-[#224057] uppercase tracking-wide">{group.label}</span>
                  <span className="ml-1 text-[10px] text-gray-400">{groupItems.length} item{groupItems.length !== 1 ? 's' : ''}</span>
                </button>

                {!isCollapsed && (
                  <>
                    {groupItems.length === 0 && (
                      <div className="border-b border-gray-100 px-8 py-3 text-xs italic text-gray-300">No items</div>
                    )}
                    {groupItems.map(item => {
                      const isExpanded = expandedItems.has(item.id);
                      return (
                        <div key={item.id}>
                          <div
                            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_3fr_1fr_1fr] items-center border-b border-gray-100 px-4 py-2.5 hover:bg-[#E8F0F8]/30 transition-colors cursor-pointer"
                            onClick={() => toggleItem(item.id)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="shrink-0 text-gray-300">
                                {isExpanded
                                  ? <ChevronDown className="h-3.5 w-3.5" />
                                  : <ChevronRight className="h-3.5 w-3.5" />}
                              </span>
                              <span className="truncate text-sm font-medium text-[#224057]">{item.name}</span>
                              {item.subitems.length > 0 && (
                                <span className="shrink-0 rounded-full bg-[#224057]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#224057]">
                                  {item.subitems.length}
                                </span>
                              )}
                            </div>
                            <span className="truncate text-xs text-gray-600">{item.accountable || '—'}</span>
                            <span className="truncate text-xs text-gray-600">{item.responsible || '—'}</span>
                            <span className="text-xs text-gray-500">{fmtDate(item.startDate)}</span>
                            <span className="text-xs text-gray-500">{fmtDate(item.targetDate)}</span>
                            <span className="truncate text-xs text-gray-500">{item.description || '—'}</span>
                            <span>
                              {item.status && (
                                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${statusStyle(item.status)}`}>
                                  {item.status}
                                </span>
                              )}
                            </span>
                            <StakesChip stakes={item.stakes} />
                          </div>

                          {isExpanded && item.subitems.length > 0 && (
                            <div className="border-b border-gray-100 bg-gray-50/40">
                              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_3fr_1fr] border-b border-gray-100 px-8 py-1.5 text-[9px] font-semibold uppercase tracking-widest text-gray-300">
                                <span>Phase</span>
                                <span>Responsible</span>
                                <span>Start</span>
                                <span>End</span>
                                <span>Description</span>
                                <span>Status</span>
                              </div>
                              {item.subitems.map(sub => (
                                <div
                                  key={sub.id}
                                  className="grid grid-cols-[2fr_1fr_1fr_1fr_3fr_1fr] items-center border-b border-gray-100 px-8 py-2 last:border-0 hover:bg-white transition-colors"
                                >
                                  <span className="truncate pl-3 text-xs text-gray-600 border-l-2 border-[#F8C762]">{sub.name}</span>
                                  <span className="truncate text-xs text-gray-500">{sub.responsible || '—'}</span>
                                  <span className="text-xs text-gray-400">{fmtDate(sub.startDate)}</span>
                                  <span className="text-xs text-gray-400">{fmtDate(sub.endDate)}</span>
                                  <span className="truncate text-xs text-gray-400">{sub.description || '—'}</span>
                                  <span>
                                    {sub.status && (
                                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${statusStyle(sub.status)}`}>
                                        {sub.status}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
