import type { Priority } from '../../lib/baseball-card/types';

const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'bg-gray-100 text-gray-600 border-gray-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Very High',
};

const CYCLE: Priority[] = ['low', 'medium', 'high', 'urgent'];

interface PriorityBadgeProps {
  priority: Priority;
  onClick?: (next: Priority) => void;
}

export function PriorityBadge({ priority, onClick }: PriorityBadgeProps) {
  const handleClick = onClick
    ? () => {
        const idx = CYCLE.indexOf(priority);
        onClick(CYCLE[(idx + 1) % CYCLE.length]);
      }
    : undefined;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!onClick}
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${PRIORITY_STYLES[priority]} ${onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
      title={`Priority: ${PRIORITY_LABELS[priority]}${onClick ? ' (click to cycle)' : ''}`}
    >
      {PRIORITY_LABELS[priority]}
    </button>
  );
}
