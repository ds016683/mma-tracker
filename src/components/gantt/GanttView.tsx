import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { fetchMondayBoard, GROUP_ORDER, type MondayItem } from '../../lib/monday/client';

// ── Colour map matching baseball cards / project plan ─────────────────────────
const GROUP_BG: Record<string, string> = {
  'group_title':    '#224057',
  'group_mm2padc3': '#234D8B',
  'group_mm2pm585': '#b8972e',
  'group_mm2pgtvh': '#16a34a',
  'group_mm2pm9jn': '#9ca3af',
};

const GROUP_BAR: Record<string, string> = {
  'group_title':    '#3a6a8c',
  'group_mm2padc3': '#4a7dcc',
  'group_mm2pm585': '#d4a830',
  'group_mm2pgtvh': '#22c55e',
  'group_mm2pm9jn': '#d1d5db',
};

// ── Date helpers ──────────────────────────────────────────────────────────────
function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function daysDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
function fmtShort(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtMon(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function GanttView() {
  const [items, setItems] = useState<MondayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [lastSync, setLastSync] = useState<Date | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const data = await fetchMondayBoard();
      setItems(data);
      setLastSync(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function toggle(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // ── Build timeline bounds ─────────────────────────────────────────────────
  const today = new Date();
  const allDates: Date[] = [today];
  for (const item of items) {
    if (parseDate(item.startDate)) allDates.push(parseDate(item.startDate)!);
    if (parseDate(item.targetDate)) allDates.push(parseDate(item.targetDate)!);
    for (const sub of item.subitems) {
      if (parseDate(sub.startDate)) allDates.push(parseDate(sub.startDate)!);
      if (parseDate(sub.endDate)) allDates.push(parseDate(sub.endDate)!);
    }
  }
  const rawMin = new Date(Math.min(...allDates.map(d => d.getTime())));
  const rawMax = new Date(Math.max(...allDates.map(d => d.getTime())));
  const minDate = addDays(rawMin, -7);
  const maxDate = addDays(rawMax, 14);
  const totalDays = Math.max(1, daysDiff(minDate, maxDate));

  function pct(d: Date) { return Math.max(0, Math.min(100, (daysDiff(minDate, d) / totalDays) * 100)); }
  function wPct(s: Date, e: Date) { return Math.max(0.8, (daysDiff(s, e) / totalDays) * 100); }

  // Month markers
  const months: { label: string; left: number }[] = [];
  let cur = new Date(minDate); cur.setDate(1);
  while (cur <= maxDate) {
    months.push({ label: fmtMon(cur), left: pct(cur) });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  const todayPct = pct(today);

  // Group items by group
  const byGroup: Record<string, MondayItem[]> = {};
  for (const item of items) {
    if (!byGroup[item.groupId]) byGroup[item.groupId] = [];
    byGroup[item.groupId].push(item);
  }

  const LABEL_W = 220;

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-sm text-gray-400">
      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading Gantt data…
    </div>
  );

  if (error) return (
    <div className="m-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {error}
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-[#f5f6f8]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#224057]">Gantt Chart</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Live from Monday.com · phases as bars
              {lastSync && <span> · Synced {lastSync.toLocaleTimeString()}</span>}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-[#224057] px-3 py-1.5 text-xs text-white hover:bg-[#234D8B] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {/* Chart body */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-14">
          {GROUP_ORDER.filter(g => (byGroup[g.id] ?? []).length > 0).map(group => {
            const groupItems = byGroup[group.id] ?? [];
            const headerBg = GROUP_BG[group.id] ?? '#224057';
            const barColor = GROUP_BAR[group.id] ?? '#3a6a8c';

            return (
              <div key={group.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {/* Group header */}
                <div className="flex items-center gap-3 px-5 py-3.5" style={{ backgroundColor: headerBg }}>
                  <span className="flex-1 text-xs font-bold uppercase tracking-widest text-white">{group.label}</span>
                  <span className="text-[11px] text-white/60">{groupItems.length} project{groupItems.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Timeline header */}
                <div className="flex border-b border-gray-100 bg-gray-50">
                  <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="shrink-0 border-r border-gray-100 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Project / Phase</div>
                  <div className="relative flex-1 py-2 overflow-hidden">
                    {months.map((m, i) => (
                      <span key={i} className="absolute text-[10px] text-gray-400 top-2" style={{ left: `${m.left}%` }}>{m.label}</span>
                    ))}
                  </div>
                  <div className="shrink-0 w-28 pr-4 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-gray-400">Dates</div>
                </div>

                {/* Project + subitem rows */}
                <div className="divide-y divide-gray-50">
                  {groupItems.map(item => {
                    const isCollapsed = collapsed.has(item.id);
                    const pStart = parseDate(item.startDate) ?? today;
                    const pEnd   = parseDate(item.targetDate) ?? addDays(pStart, 30);

                    return (
                      <div key={item.id}>
                        {/* Project row */}
                        <div className="flex h-11 items-center hover:bg-gray-50 transition-colors">
                          <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="flex shrink-0 items-center gap-2 border-r border-gray-100 px-3">
                            <button onClick={() => toggle(item.id)} className="shrink-0 text-gray-400 hover:text-gray-600">
                              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                            <span className="truncate text-xs font-semibold text-[#224057]" title={item.name}>{item.name}</span>
                          </div>

                          {/* Bar area */}
                          <div className="relative flex-1 px-1">
                            {/* Today line */}
                            <div className="absolute inset-y-0 w-px bg-[#F8C762]/60 z-10" style={{ left: `${todayPct}%` }} />
                            {/* Project bar */}
                            <div
                              className="absolute top-2.5 h-6 rounded-md opacity-90 flex items-center px-2"
                              style={{ left: `${pct(pStart)}%`, width: `${wPct(pStart, pEnd)}%`, backgroundColor: barColor }}
                              title={`${item.name}: ${fmtShort(pStart)} → ${fmtShort(pEnd)}`}
                            >
                              <span className="truncate text-[10px] font-semibold text-white">{item.status || 'In progress'}</span>
                            </div>
                          </div>

                          <div className="shrink-0 w-28 pr-4 text-right">
                            <span className="text-[10px] text-gray-400">{fmtShort(pStart)} – {fmtShort(pEnd)}</span>
                          </div>
                        </div>

                        {/* Subitem (phase) rows */}
                        {!isCollapsed && item.subitems.map(sub => {
                          const sStart = parseDate(sub.startDate) ?? pStart;
                          const sEnd   = parseDate(sub.endDate)   ?? addDays(sStart, 14);
                          const isDone = (sub.status || '').toLowerCase().includes('done') || (sub.status || '').toLowerCase().includes('complete');
                          return (
                            <div key={sub.id} className="flex h-9 items-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
                              <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="flex shrink-0 items-center gap-2 border-r border-gray-100 pl-10 pr-3">
                                <span className={`h-2 w-2 shrink-0 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                                <span className="truncate text-[11px] text-gray-600" title={sub.name}>{sub.name}</span>
                              </div>

                              <div className="relative flex-1 px-1">
                                <div className="absolute inset-y-0 w-px bg-[#F8C762]/60 z-10" style={{ left: `${todayPct}%` }} />
                                <div
                                  className="absolute top-2 h-5 rounded opacity-75"
                                  style={{
                                    left: `${pct(sStart)}%`,
                                    width: `${wPct(sStart, sEnd)}%`,
                                    backgroundColor: isDone ? '#22c55e' : barColor,
                                  }}
                                  title={`${sub.name}: ${fmtShort(sStart)} → ${fmtShort(sEnd)}`}
                                />
                              </div>

                              <div className="shrink-0 w-28 pr-4 text-right">
                                <span className="text-[10px] text-gray-400">{fmtShort(sStart)} – {fmtShort(sEnd)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Today marker label */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-400">
          <span className="h-3 w-px bg-[#F8C762]" />
          Today: {fmtShort(today)}
        </div>
      </div>
    </div>
  );
}
