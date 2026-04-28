import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { fetchProjectsWithTasks, type ProjectWithTasks } from '../../lib/supabase/notionProjectQueries';

const CATEGORY_ORDER = [
  'Production Priorities',
  'Data Enhancements (Schedule E)',
  'Innovation Roadmap',
  'Completed',
  'Extraneous',
];

const GROUP_BG: Record<string, string> = {
  'Production Priorities':          '#224057',
  'Data Enhancements (Schedule E)': '#234D8B',
  'Innovation Roadmap':             '#b8972e',
  'Completed':                      '#16a34a',
  'Extraneous':                     '#9ca3af',
};

const GROUP_BAR: Record<string, string> = {
  'Production Priorities':          '#3a6a8c',
  'Data Enhancements (Schedule E)': '#4a7dcc',
  'Innovation Roadmap':             '#d4a830',
  'Completed':                      '#22c55e',
  'Extraneous':                     '#d1d5db',
};

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function daysDiff(a: Date, b: Date): number { return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)); }
function fmtShort(d: Date): string { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtMon(d: Date): string { return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); }

export function GanttView() {
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
      setProjects(await fetchProjectsWithTasks());
      setLastSync(new Date());
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const syncNotion = useCallback(async () => {
    setSyncing(true);
    try {
      const { supabase } = await import('../../lib/supabase/client');
      await supabase.from('region_data').update({ updated_at: new Date().toISOString() }).eq('region_id', 1);
      let attempts = 0;
      const before = new Date().toISOString();
      while (attempts < 10) {
        await new Promise(r => setTimeout(r, 2000));
        const fresh = await fetchProjectsWithTasks();
        if (fresh.some(p => p.last_activity_at > before) || attempts >= 8) {
          setProjects(fresh); setLastSync(new Date()); break;
        }
        attempts++;
      }
    } catch (e) { setError((e as Error).message); }
    finally { setSyncing(false); }
  }, []);

  // Compute timeline bounds from all projects with dates
  const allDates = projects.flatMap(p => [
    parseDate(p.start_date), parseDate(p.target_date),
    ...p.tasks.flatMap(t => [parseDate(t.start_date), parseDate(t.due_date)])
  ]).filter(Boolean) as Date[];
  
  const today = new Date();
  const minDate = allDates.length ? addDays(new Date(Math.min(...allDates.map(d => d.getTime()))), -14) : addDays(today, -30);
  const maxDate = allDates.length ? addDays(new Date(Math.max(...allDates.map(d => d.getTime()))), 14) : addDays(today, 180);
  const totalDays = Math.max(daysDiff(minDate, maxDate), 1);

  function pct(d: Date) { return Math.max(0, Math.min(100, (daysDiff(minDate, d) / totalDays) * 100)); }

  // Month tick marks
  const months: { label: string; pct: number }[] = [];
  const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (cur <= maxDate) {
    months.push({ label: fmtMon(cur), pct: pct(cur) });
    cur.setMonth(cur.getMonth() + 1);
  }

  const todayPct = pct(today);

  const grouped = CATEGORY_ORDER.reduce<Record<string, ProjectWithTasks[]>>((acc, cat) => {
    acc[cat] = projects.filter(p => p.category === cat);
    return acc;
  }, {});

  const LABEL_W = 220;

  return (
    <div className="flex h-screen flex-col bg-[#f5f6f8]">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#224057]">Gantt Chart</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Notion-sourced · {projects.length} projects
              {lastSync && <span> · {lastSync.toLocaleTimeString()}</span>}
            </p>
          </div>
          <button onClick={syncing ? undefined : syncNotion} disabled={syncing || loading}
            className="flex items-center gap-1.5 rounded-lg bg-[#224057] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a3245] disabled:opacity-60 transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Notion'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-gray-400 text-sm">Loading…</div>
      ) : error ? (
        <div className="m-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div style={{ minWidth: LABEL_W + 800 }}>
            {/* Timeline header */}
            <div className="sticky top-0 z-10 flex border-b border-gray-200 bg-white" style={{ height: 36 }}>
              <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="border-r border-gray-200 flex items-center px-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</span>
              </div>
              <div className="relative flex-1">
                {months.map(m => (
                  <div key={m.label} className="absolute top-0 flex h-full flex-col justify-end pb-1" style={{ left: `${m.pct}%` }}>
                    <div className="h-full border-l border-gray-100" />
                    <span className="absolute bottom-1 left-1 text-[10px] text-gray-400 whitespace-nowrap">{m.label}</span>
                  </div>
                ))}
                <div className="absolute top-0 z-10 h-full border-l-2 border-[#F8C762]" style={{ left: `${todayPct}%` }}>
                  <span className="absolute -top-0 left-1 text-[10px] font-bold text-[#b8972e] whitespace-nowrap">{fmtShort(today)}</span>
                </div>
              </div>
            </div>

            {/* Groups */}
            {CATEGORY_ORDER.map(cat => {
              const items = grouped[cat] ?? [];
              if (items.length === 0) return null;
              const bg = GROUP_BG[cat] ?? '#224057';
              const barColor = GROUP_BAR[cat] ?? '#3a6a8c';
              const isCollapsed = collapsed[cat];

              return (
                <div key={cat}>
                  {/* Group header row */}
                  <button onClick={() => setCollapsed(c => ({ ...c, [cat]: !c[cat] }))}
                    className="flex w-full items-center border-b border-gray-200 text-left"
                    style={{ background: bg, height: 32 }}>
                    <div className="flex items-center gap-2 px-4" style={{ width: LABEL_W, minWidth: LABEL_W }}>
                      {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-white/70" /> : <ChevronDown className="h-3.5 w-3.5 text-white/70" />}
                      <span className="text-xs font-bold text-white truncate">{cat}</span>
                      <span className="ml-auto text-[10px] text-white/60">{items.length}</span>
                    </div>
                    <div className="flex-1 relative" style={{ height: 32 }}>
                      <div className="absolute top-0 z-10 h-full border-l-2 border-[#F8C762]/60" style={{ left: `${todayPct}%` }} />
                    </div>
                  </button>

                  {!isCollapsed && items.map(project => {
                    const pStart = parseDate(project.start_date);
                    const pEnd = parseDate(project.target_date);
                    const isExpanded = expandedItems.has(project.id);

                    return (
                      <div key={project.id} className="border-b border-gray-100">
                        {/* Project row */}
                        <div className="flex items-center hover:bg-gray-50" style={{ height: 38 }}>
                          <div className="flex items-center gap-2 px-4 border-r border-gray-200 cursor-pointer"
                            style={{ width: LABEL_W, minWidth: LABEL_W }}
                            onClick={() => setExpandedItems(s => { const n = new Set(s); n.has(project.id) ? n.delete(project.id) : n.add(project.id); return n; })}>
                            {project.tasks.length > 0
                              ? (isExpanded ? <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0" /> : <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />)
                              : <span className="w-3" />}
                            <span className="truncate text-xs font-medium text-gray-800">{project.name}</span>
                          </div>
                          <div className="relative flex-1" style={{ height: 38 }}>
                            <div className="absolute top-0 z-10 h-full border-l-2 border-[#F8C762]/60" style={{ left: `${todayPct}%` }} />
                            {months.map(m => (
                              <div key={m.label} className="absolute top-0 h-full border-l border-gray-100" style={{ left: `${m.pct}%` }} />
                            ))}
                            {pStart && pEnd && (
                              <div className="absolute top-1/2 -translate-y-1/2 rounded-sm flex items-center px-2"
                                style={{ left: `${pct(pStart)}%`, width: `${Math.max(pct(pEnd) - pct(pStart), 1)}%`, height: 20, background: barColor }}>
                                <span className="truncate text-[10px] text-white font-medium">
                                  {fmtShort(pStart)} → {fmtShort(pEnd)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Phase rows */}
                        {isExpanded && project.tasks.map(task => {
                          const tStart = parseDate(task.start_date);
                          const tEnd = parseDate(task.due_date);
                          return (
                            <div key={task.id} className="flex items-center bg-gray-50/80 border-t border-gray-100" style={{ height: 32 }}>
                              <div className="flex items-center gap-2 pl-8 pr-4 border-r border-gray-200" style={{ width: LABEL_W, minWidth: LABEL_W }}>
                                <span className="text-gray-300 text-xs">└</span>
                                <span className="truncate text-[11px] text-gray-600">{task.task_name || task.text}</span>
                              </div>
                              <div className="relative flex-1" style={{ height: 32 }}>
                                <div className="absolute top-0 z-10 h-full border-l-2 border-[#F8C762]/60" style={{ left: `${todayPct}%` }} />
                                {months.map(m => (
                                  <div key={m.label} className="absolute top-0 h-full border-l border-gray-100" style={{ left: `${m.pct}%` }} />
                                ))}
                                {tStart && tEnd && (
                                  <div className="absolute top-1/2 -translate-y-1/2 rounded-sm"
                                    style={{ left: `${pct(tStart)}%`, width: `${Math.max(pct(tEnd) - pct(tStart), 0.5)}%`, height: 14,
                                      background: task.done ? '#22c55e' : barColor + 'aa' }} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
