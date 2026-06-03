import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { fetchProjectsWithTasks, type ProjectWithTasks } from '../../lib/supabase/notionProjectQueries';
import { useProjects } from '../../contexts/ProjectsContext';

const NOTION_DB_URL = 'https://www.notion.so/34f750fa613d811d9455c9d4916b8483';

const CATEGORY_ORDER = [
  'Production Priorities',
  'Data Enhancements (Schedule E)',
  'Innovation Roadmap',
  'Completed',
  'Extraneous',
];

const GROUP_HEADER_BG: Record<string, string> = {
  'Production Priorities':          '#224057',
  'Data Enhancements (Schedule E)': '#234D8B',
  'Innovation Roadmap':             '#b8972e',
  'Completed':                      '#16a34a',
  'Extraneous':                     '#9ca3af',
};

const STATUS_STYLES: Record<string, string> = {
  'In Progress':  'bg-[#fdab3d] text-white',
  'Not Started':  'bg-gray-200 text-gray-500',
  'Blocked':      'bg-[#df2f4a] text-white',
  'Complete':     'bg-[#00c875] text-white',
  '':             'bg-gray-100 text-gray-400',
};

function statusStyle(s: string) { return STATUS_STYLES[s] ?? 'bg-gray-100 text-gray-500'; }

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }); }
  catch { return d; }
}

function PriorityChip({ priority }: { priority: string }) {
  const color = priority === 'High' ? 'bg-red-50 text-red-700 border-red-200'
    : priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200'
    : priority === 'Low' ? 'bg-gray-50 text-gray-500 border-gray-200' : '';
  if (!priority || !color) return null;
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}>{priority}</span>;
}

export function ProjectPlanView() {
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { refetch: refetchBaseballCards } = useProjects();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  // Comments editing: dirtyComments tracks unsaved edits keyed by project id
  const [dirtyComments, setDirtyComments] = useState<Record<string, string>>({});
  const dirtyCount = Object.keys(dirtyComments).length;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjectsWithTasks();
      // Normalize: projects with no category fall into Extraneous
      // Sub-items (has parent_id) keep their category blank — they render under their parent.
      // Top-level items with no category fall into Extraneous.
      const normalized = data.map(p => ({
        ...p,
        category: p.parent_id ? (p.category?.trim() || '') : (p.category?.trim() || 'Extraneous'),
      }));
      setProjects(normalized);
      setLastSync(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const syncNotion = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const { supabase } = await import('../../lib/supabase/client');
      // Build comment update payload from any dirty edits
      const commentUpdates = Object.entries(dirtyComments).map(([pageId, comments]) => ({ pageId, comments }));
      // Invoke edge function — passes comment edits so they're pushed to Notion first
      const { error: fnErr } = await supabase.functions.invoke('notion-project-sync', {
        body: commentUpdates.length > 0 ? { commentUpdates } : undefined,
      });
      if (fnErr) throw new Error(fnErr.message);
      // Clear dirty state after successful sync
      setDirtyComments({});
      // Re-fetch the now-updated projects from Supabase
      const fresh = await fetchProjectsWithTasks();
      setProjects(fresh.map(p => ({ ...p, category: p.parent_id ? (p.category?.trim() || '') : (p.category?.trim() || 'Extraneous') })));
      setLastSync(new Date());
      await refetchBaseballCards();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSyncing(false);
    }
  }, [refetchBaseballCards, dirtyComments]);

  // Build children map: parentId → sub-items
  const childrenByParent = projects.reduce<Record<string, ProjectWithTasks[]>>((acc, p) => {
    if (p.parent_id) {
      if (!acc[p.parent_id]) acc[p.parent_id] = [];
      acc[p.parent_id].push(p);
    }
    return acc;
  }, {});

  // Group by category — top-level items only (no parent_id)
  const grouped = CATEGORY_ORDER.reduce<Record<string, ProjectWithTasks[]>>((acc, cat) => {
    acc[cat] = projects.filter(p => !p.parent_id && p.category === cat);
    return acc;
  }, {});

  return (
    <div className="flex h-screen flex-col bg-[#f5f6f8]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#224057]">Project Plan</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Live from Notion · {projects.length} projects
              {lastSync && <span> · Synced {lastSync.toLocaleTimeString()}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href={NOTION_DB_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-300 hover:text-gray-700">
              <ExternalLink className="h-3.5 w-3.5" /> Open in Notion
            </a>
            <button onClick={syncNotion} disabled={syncing || loading}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 transition-colors ${
                dirtyCount > 0 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#224057] hover:bg-[#1a3245]'
              }`}>
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : dirtyCount > 0 ? `Sync Notion (${dirtyCount} edit${dirtyCount > 1 ? 's' : ''})` : 'Sync Notion'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-14">
          {CATEGORY_ORDER.map(cat => {
            const items = grouped[cat] ?? [];
            if (items.length === 0) return null;
            const bg = GROUP_HEADER_BG[cat] ?? '#224057';
            const isCollapsed = collapsed[cat];
            const phaseCount = items.reduce((s, p) => s + (childrenByParent[p.id]?.length ?? 0), 0);
            return (
              <div key={cat}>
                {/* Group header */}
                <button onClick={() => setCollapsed(c => ({ ...c, [cat]: !c[cat] }))}
                  className="flex w-full items-center gap-3 rounded-t-lg px-4 py-2.5 text-left transition-opacity hover:opacity-90"
                  style={{ background: bg }}>
                  {isCollapsed ? <ChevronRight className="h-4 w-4 text-white/70" /> : <ChevronDown className="h-4 w-4 text-white/70" />}
                  <span className="text-sm font-bold text-white">{cat}</span>
                  <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">{items.length} projects · {phaseCount} phases</span>
                {/* phaseCount now counts Notion sub-items */}
                </button>

                {!isCollapsed && (
                  <div className="rounded-b-lg border border-t-0 border-gray-200 bg-white overflow-hidden">
                    {/* Column headers */}
                    <div className="grid text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100 px-4 py-2"
                      style={{ gridTemplateColumns: 'minmax(180px,3fr) minmax(90px,1fr) minmax(70px,0.8fr) minmax(110px,1.2fr) minmax(72px,0.8fr) minmax(72px,0.8fr) minmax(140px,2fr)' }}>
                      <span>Project</span>
                      <span>Status</span>
                      <span>Priority</span>
                      <span>Accountable</span>
                      <span>Start</span>
                      <span>Target</span>
                      <span>Comments</span>
                    </div>

                    {items.map(project => {
                      const isExpanded = expandedItems.has(project.id);
                      const subItems = childrenByParent[project.id] ?? [];
                      const hasChildren = subItems.length > 0;
                      return (
                        <div key={project.id} className="border-b border-gray-50 last:border-0">
                          {/* Parent row */}
                          <div
                            className="grid items-center px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer group"
                            style={{ gridTemplateColumns: 'minmax(180px,3fr) minmax(90px,1fr) minmax(70px,0.8fr) minmax(110px,1.2fr) minmax(72px,0.8fr) minmax(72px,0.8fr) minmax(140px,2fr)' }}
                            title={project.name}
                            onClick={(e) => {
                              // Don't collapse/expand when clicking inside the comments cell
                              if ((e.target as HTMLElement).closest('[data-comment-cell]')) return;
                              setExpandedItems(s => { const n = new Set(s); n.has(project.id) ? n.delete(project.id) : n.add(project.id); return n; });
                            }}>
                            <div className="flex items-center gap-2 min-w-0">
                              {hasChildren
                                ? (isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />)
                                : <span className="w-3.5" />}
                              <span className="truncate text-sm font-medium text-gray-900">{project.name}</span>
                              {hasChildren && (
                                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 flex-shrink-0">{subItems.length}</span>
                              )}
                            </div>
                            <div><span className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyle(project.mma_status)}`}>{project.mma_status || '—'}</span></div>
                            <div><PriorityChip priority={project.mma_priority} /></div>
                            <div className="truncate text-xs text-gray-600">{project.mma_accountable || '—'}</div>
                            <div className="text-xs text-gray-500">{fmtDate(project.start_date)}</div>
                            <div className="text-xs text-gray-500">{fmtDate(project.target_date)}</div>
                            {/* Comments — editable inline */}
                            <div data-comment-cell className="relative" onClick={e => e.stopPropagation()}>
                              <textarea
                                rows={1}
                                value={dirtyComments[project.id] !== undefined ? dirtyComments[project.id] : (project.mma_comments || '')}
                                placeholder="Add a comment…"
                                onChange={e => setDirtyComments(prev => ({ ...prev, [project.id]: e.target.value }))}
                                className="w-full resize-none rounded border border-transparent bg-transparent px-1.5 py-0.5 text-xs text-gray-600 placeholder-gray-300 hover:border-gray-200 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-200 transition-colors"
                                style={{ minHeight: '1.6rem', maxHeight: '4rem' }}
                              />
                              {dirtyComments[project.id] !== undefined && (
                                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500" title="Unsaved — click Sync Notion to save" />
                              )}
                            </div>
                          </div>

                          {/* Notion sub-items */}
                          {isExpanded && subItems.map(child => (
                            <div key={child.id}
                              className="grid items-center pl-10 pr-4 py-2 bg-gray-50/60 border-t border-gray-100"
                              style={{ gridTemplateColumns: 'minmax(180px,3fr) minmax(90px,1fr) minmax(70px,0.8fr) minmax(110px,1.2fr) minmax(72px,0.8fr) minmax(72px,0.8fr) minmax(140px,2fr)' }}
                              title={child.name}>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-gray-300 text-xs flex-shrink-0">└</span>
                                <span className="truncate text-xs text-gray-700">{child.name}</span>
                              </div>
                              <div><span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusStyle(child.mma_status)}`}>{child.mma_status || '—'}</span></div>
                              <div><PriorityChip priority={child.mma_priority} /></div>
                              <div className="truncate text-xs text-gray-500">{child.mma_accountable || child.mma_responsible || '—'}</div>
                              <div className="text-xs text-gray-400">{fmtDate(child.start_date)}</div>
                              <div className="text-xs text-gray-400">{fmtDate(child.target_date)}</div>
                              <div className="text-xs text-gray-400 truncate px-1.5">{child.mma_comments || ''}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
