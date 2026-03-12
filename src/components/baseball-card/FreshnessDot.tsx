import { getFreshnessTier } from '../../lib/baseball-card/partition';

interface FreshnessDotProps {
  lastActivityAt: string | null;
}

const TIER_CLASSES = {
  fresh: 'bg-mma-green',
  warning: 'bg-mma-orange',
  stale: 'bg-mma-blue-gray',
};

const TIER_LABELS = {
  fresh: 'Active within the last 7 days',
  warning: 'Last activity 8-14 days ago',
  stale: 'No activity for over 14 days',
};

export function FreshnessDot({ lastActivityAt }: FreshnessDotProps) {
  const tier = getFreshnessTier(lastActivityAt);
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${TIER_CLASSES[tier]}`}
      title={TIER_LABELS[tier]}
    />
  );
}
