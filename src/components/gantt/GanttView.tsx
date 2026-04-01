import { useState, useRef } from 'react';
import { ChevronDown, ChevronRight, Download, LayoutGrid } from 'lucide-react';
import type { BaseballCardProject, Task } from '../../lib/baseball-card/types';
import { computeRollup } from '../../lib/baseball-card/types';

interface GanttViewProps {
  projects: BaseballCardProject[];
  onSwitchToBoard: () => void;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function daysDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Color logic ───────────────────────────────────────────────────────────────

type BarColor = 'green' | 'yellow' | 'red' | 'gray';

function taskBarColor(task: Task): BarColor {
  if (task.done) return 'green';
  const due = parseDate(task.due_date);
  if (!due) return 'gray';
  const now = new Date();
  const diff = daysDiff(now, due);
  if (diff < 0) return 'red';
  if (diff <= 3) return 'yellow';
  return 'green';
}

function projectBarColor(tasks: Task[]): BarColor {
  if (tasks.length === 0) return 'gray';
  const colors = tasks.map(taskBarColor);
  if (colors.includes('red')) return 'red';
  if (colors.includes('yellow')) return 'yellow';
  if (colors.every(c => c === 'green')) return 'green';
  return 'gray';
}

const BAR_CLASSES: Record<BarColor, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
  gray: 'bg-gray-400',
};

// ── Gantt row computation ─────────────────────────────────────────────────────

interface GanttProject {
  project: BaseballCardProject;
  start: Date;
  end: Date;
  tasks: GanttTask[];
}

interface GanttTask {
  task: Task;
  start: Date;
  end: Date;
}

function buildGanttData(projects: BaseballCardProject[]): { items: GanttProject[]; minDate: Date; maxDate: Date } {
  const today = new Date();
  const items: GanttProject[] = [];

  for (const p of projects) {
    if (p.status === 'archived') continue;

    // Build task timeline; each task's default start = previous task's end
    const ganttTasks: GanttTask[] = [];
    let cursor = parseDate(p.start_date) ?? parseDate(p.created_at) ?? today;

    for (const t of p.tasks) {
      const taskStart = parseDate(t.start_date) ?? cursor;
      const taskEnd = parseDate(t.due_date) ?? addDays(taskStart, 7);
      ganttTasks.push({ task: t, start: taskStart, end: taskEnd });
      // Next task defaults to start after this one ends
      cursor = taskEnd;
    }

    const projStart = parseDate(p.start_date) ?? (ganttTasks[0]?.start ?? today);
    const projEnd = parseDate(p.end_date) ?? parseDate(p.target_date) ?? (ganttTasks[ganttTasks.length - 1]?.end ?? addDays(projStart, 30));

    items.push({ project: p, start: projStart, end: projEnd, tasks: ganttTasks });
  }

  if (items.length === 0) {
    return { items, minDate: today, maxDate: addDays(today, 30) };
  }

  const allDates = items.flatMap(i => [i.start, i.end, ...i.tasks.flatMap(t => [t.start, t.end])]);
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  // Pad a little
  minDate.setDate(minDate.getDate() - 2);
  maxDate.setDate(maxDate.getDate() + 7);

  return { items, minDate, maxDate };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GanttView({ projects, onSwitchToBoard }: GanttViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { items, minDate, maxDate } = buildGanttData(projects);
  const totalDays = daysDiff(minDate, maxDate);

  function toggleCollapse(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function pct(d: Date): number {
    return Math.max(0, Math.min(100, (daysDiff(minDate, d) / totalDays) * 100));
  }

  function width(start: Date, end: Date): number {
    return Math.max(0.5, (daysDiff(start, end) / totalDays) * 100);
  }

  async function exportPDF() {
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      if (!containerRef.current) return;
      const canvas = await html2canvas(containerRef.current, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
      const pageW = pdf.internal.pageSize.getWidth();
      const imgW = pageW - 40;
      const imgH = (canvas.height / canvas.width) * imgW;
      pdf.addImage(imgData, 'PNG', 20, 20, imgW, imgH);
      pdf.save(`gantt-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error('PDF export failed', e);
    } finally {
      setExporting(false);
    }
  }

  // Build month markers
  const months: { label: string; left: number }[] = [];
  let cursor = new Date(minDate);
  cursor.setDate(1);
  while (cursor <= maxDate) {
    months.push({
      label: cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      left: pct(cursor),
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  // Today marker
  const todayPct = pct(new Date());

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-mma-dark-blue">Gantt Chart</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToBoard}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:border-gray-300 hover:text-gray-800"
          >
            <LayoutGrid className="h-4 w-4" />
            Card View
          </button>
          <button
            onClick={exportPDF}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-md bg-mma-dark-blue px-3 py-1.5 text-sm text-white hover:bg-mma-blue disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        {(['green', 'yellow', 'red', 'gray'] as BarColor[]).map(c => (
          <span key={c} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-sm ${BAR_CLASSES[c]}`} />
            {{ green: 'On Track', yellow: 'Due ≤3 Days', red: 'Overdue', gray: 'No Date' }[c]}
          </span>
        ))}
      </div>

      {/* Chart */}
      <div ref={containerRef} className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="min-w-[700px]">
          {/* Month header */}
          <div className="relative h-8 border-b border-gray-200 bg-gray-50">
            {months.map((m, i) => (
              <span
                key={i}
                className="absolute top-1 text-xs text-gray-500"
                style={{ left: `calc(${m.left}% + 180px)` }}
              >
                {m.label}
              </span>
            ))}
            {/* Today line label */}
            <span
              className="absolute top-1 text-xs font-medium text-mma-blue"
              style={{ left: `calc(${todayPct}% + 180px)` }}
            >
              Today
            </span>
          </div>

          {/* Rows */}
          {items.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              No active projects with dates. Add start/end dates to projects to see them here.
            </div>
          ) : (
            items.map(({ project, start, end, tasks }) => {
              const isCollapsed = collapsed.has(project.id);
              const pColor = projectBarColor(project.tasks);
              const { pct: rollupPct, status } = computeRollup(project.tasks);

              return (
                <div key={project.id} className="border-b border-gray-100 last:border-0">
                  {/* Project row */}
                  <div className="flex h-10 items-center hover:bg-gray-50">
                    {/* Label */}
                    <div className="flex w-44 shrink-0 items-center gap-1.5 px-3">
                      <button
                        onClick={() => toggleCollapse(project.id)}
                        className="shrink-0 text-gray-400 hover:text-gray-600"
                      >
                        {isCollapsed
                          ? <ChevronRight className="h-3.5 w-3.5" />
                          : <ChevronDown className="h-3.5 w-3.5" />
                        }
                      </button>
                      <span className="truncate text-xs font-semibold text-mma-dark-blue" title={project.name}>
                        {project.name}
                      </span>
                    </div>

                    {/* Timeline area */}
                    <div className="relative flex-1 pr-3">
                      {/* Today line */}
                      <div
                        className="absolute inset-y-0 w-px bg-mma-blue/40"
                        style={{ left: `${todayPct}%` }}
                      />
                      {/* Project bar */}
                      <div
                        className={`absolute top-2 h-6 rounded ${BAR_CLASSES[pColor]} opacity-80`}
                        style={{ left: `${pct(start)}%`, width: `${width(start, end)}%` }}
                        title={`${project.name}: ${fmtShort(start)} → ${fmtShort(end)} | ${rollupPct}% (${status})`}
                      >
                        <span className="ml-1 truncate text-xs font-medium text-white">
                          {rollupPct}%
                        </span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="w-36 shrink-0 text-right pr-3">
                      <span className="text-xs text-gray-400">
                        {fmtShort(start)} — {fmtShort(end)}
                      </span>
                    </div>
                  </div>

                  {/* Task rows */}
                  {!isCollapsed && tasks.map(({ task, start: ts, end: te }) => {
                    const tc = taskBarColor(task);
                    return (
                      <div key={task.id} className="flex h-8 items-center bg-gray-50/40 hover:bg-gray-50">
                        <div className="flex w-44 shrink-0 items-center gap-2 pl-8 pr-3">
                          <span
                            className={`h-3 w-3 shrink-0 rounded-sm border ${task.done ? 'border-mma-turquoise bg-mma-turquoise' : 'border-gray-300'}`}
                          />
                          <span className="truncate text-xs text-gray-600" title={task.task_name || task.text}>
                            {task.task_name || task.text}
                          </span>
                        </div>

                        <div className="relative flex-1 pr-3">
                          <div
                            className="absolute inset-y-0 w-px bg-mma-blue/40"
                            style={{ left: `${todayPct}%` }}
                          />
                          <div
                            className={`absolute top-1.5 h-5 rounded ${BAR_CLASSES[tc]} opacity-70`}
                            style={{ left: `${pct(ts)}%`, width: `${width(ts, te)}%` }}
                            title={`${task.task_name || task.text}: ${fmtShort(ts)} → ${fmtShort(te)}${task.assigned_to ? ` | ${task.assigned_to}` : ''}`}
                          />
                        </div>

                        <div className="w-36 shrink-0 text-right pr-3">
                          <span className="text-xs text-gray-400">
                            {task.due_date ? fmtShort(new Date(task.due_date)) : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
