import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { fetchProjectsWithTasks, type ProjectWithTasks } from '../../lib/supabase/notionProjectQueries';

const NOTION_DB_URL = 'https://www.notion.so/34f750fa613d811d9455c9d4916b8483';
const NOTION_SYNC_SENTINEL_REGION = 1;

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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjectsWithTasks();
      setProjects(data);
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
      const triggerTime = new Date();
      // Signal daemon to run sync
      await supabase.from('region_data').update({ updated_at: triggerTime.toISOString() }).eq('region_id', NOTION_SYNC_SENTINEL_REGION);
      // Poll sync control row until daemon marks sync_completed > sync_started (max 45s)
      const deadline = Date.now() + 45000;
      let done = false;
      while (Date.now() < deadline && !done) {
        await new Promise(r => setTimeout(r, 2500));
        const { data } = await supabase.from('region_data').select('v7_coverage').eq('region_id', 0).single();
        if (data?.v7_coverage) {
          try {
            const status = JSON.parse(data.v7_coverage as string);
            const completed = new Date(status.sync_completed);
            const started = new Date(status.sync_started);
            if (completed > started && completed >= triggerTime) done = true;
          } catch { /* continue polling */ }
        }
      }
      // Sync is done (or timed out) — do one clean fetch
      const fresh = await fetchProjectsWithTasks();
      setProjects(fresh);
      setLastSync(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSyncing(false);
    }
  }, []);

  // Group by category
  const grouped = CATEGORY_ORDER.reduce<Record<string, ProjectWithTasks[]>>((acc, cat) => {
    acc[cat] = projects.filter(p => p.category === cat);
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
              Live from Notion · MMA Project Plan
              {lastSync && <span> · Synced {lastSync.toLocaleTimeString()}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href={NOTION_DB_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-300 hover:text-gray-700">
              <ExternalLink className="h-3.5 w-3.5" /> Open in Notion
            </a>
            <button onClick={syncNotion} disabled={syncing || loading}
              className="flex items-center gap-1.5 rounded-lg bg-[#224057] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a3245] disabled:opacity-60 transition-colors">
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Notion'}
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
            const phaseCount = items.reduce((s, p) => s + p.tasks.length, 0);
            return (
              <div key={cat}>
                {/* Group header */}
                <button onClick={() => setCollapsed(c => ({ ...c, [cat]: !c[cat] }))}
                  className="flex w-full items-center gap-3 rounded-t-lg px-4 py-2.5 text-left transition-opacity hover:opacity-90"
                  style={{ background: bg }}>
                  {isCollapsed ? <ChevronRight className="h-4 w-4 text-white/70" /> : <ChevronDown className="h-4 w-4 text-white/70" />}
                  <span className="text-sm font-bold text-white">{cat}</span>
                  <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">{items.length} projects · {phaseCount} phases</span>
                </button>

                {!isCollapsed && (
                  <div className="rounded-b-lg border border-t-0 border-gray-200 bg-white overflow-hidden">
                    {/* Column headers */}
                    <div className="grid text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100 px-4 py-2"
                      style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                      <span>Project</span>
                      <span>Status</span>
                      <span>Priority</span>
                      <span>Accountable</span>
                      <span>Start</span>
                      <span>Target</span>
                    </div>

                    {items.map(project => {
                      const isExpanded = expandedItems.has(project.id);
                      return (
                        <div key={project.id} className="border-b border-gray-50 last:border-0">
                          {/* Parent row */}
                          <div className="grid items-center px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                            style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}
                            onClick={() => setExpandedItems(s => { const n = new Set(s); n.has(project.id) ? n.delete(project.id) : n.add(project.id); return n; })}>
                            <div className="flex items-center gap-2 min-w-0">
                              {project.tasks.length > 0
                                ? (isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />)
                                : <span className="w-3.5" />}
                              <span className="truncate text-sm font-medium text-gray-900">{project.name}</span>
                              {project.tasks.length > 0 && (
                                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 flex-shrink-0">{project.tasks.length}</span>
                              )}
                            </div>
                            <div><span className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyle(project.mma_status)}`}>{project.mma_status || '—'}</span></div>
                            <div><PriorityChip priority={project.priority} /></div>
                            <div className="truncate text-xs text-gray-600">{project.mma_accountable || '—'}</div>
                            <div className="text-xs text-gray-500">{fmtDate(project.start_date)}</div>
                            <div className="text-xs text-gray-500">{fmtDate(project.target_date)}</div>
                          </div>

                          {/* Phase rows */}
                          {isExpanded && project.tasks.map(task => (
                            <div key={task.id} className="grid items-center pl-10 pr-4 py-2 bg-gray-50/60 border-t border-gray-100"
                              style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-gray-300 text-xs">└</span>
                                <span className={`truncate text-xs ${task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{task.task_name || task.text}</span>
                              </div>
                              <div>
                                <span className={`rounded px-1.5 py-0.5 text-[10px] ${task.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {task.done ? 'Complete' : 'In Progress'}
                                </span>
                              </div>
                              <div />
                              <div className="truncate text-xs text-gray-500">{task.assigned_to || '—'}</div>
                              <div className="text-xs text-gray-400">{fmtDate(task.start_date)}</div>
                              <div className="text-xs text-gray-400">{fmtDate(task.due_date)}</div>
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
