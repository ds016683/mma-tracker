import type { Priority } from '../../lib/baseball-card/types';

const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'bg-mma-blue-gray/10 text-mma-blue-gray border-mma-blue-gray/20',
  medium: 'bg-mma-yellow/10 text-mma-yellow border-mma-yellow/30',
  high: 'bg-mma-orange/10 text-mma-orange border-mma-orange/20',
  urgent: 'bg-mma-crimson/10 text-mma-crimson border-mma-crimson/20',
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
