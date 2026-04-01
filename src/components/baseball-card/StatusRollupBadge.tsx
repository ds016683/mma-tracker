import type { Task } from '../../lib/baseball-card/types';
import { computeRollup } from '../../lib/baseball-card/types';

interface StatusRollupBadgeProps {
  tasks: Task[];
  compact?: boolean;
}

const STATUS_CONFIG = {
  'on-track': { label: 'On Track', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  'at-risk': { label: 'At Risk', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'overdue': { label: 'Overdue', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  'complete': { label: 'Complete', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'no-tasks': { label: 'No Tasks', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
} as const;

export function StatusRollupBadge({ tasks, compact = false }: StatusRollupBadgeProps) {
  const { pct, status } = computeRollup(tasks);
  const cfg = STATUS_CONFIG[status];

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
        title={`${pct}% complete — ${cfg.label}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${cfg.bg}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      <span className={`text-xs font-semibold ${cfg.text}`}>{pct}% complete</span>
      <span className={`text-xs ${cfg.text} opacity-75`}>— {cfg.label}</span>
    </div>
  );
}
