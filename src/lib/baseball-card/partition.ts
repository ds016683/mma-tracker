import type { BaseballCardProject, FreshnessTier, PartitionedPortfolio } from './types';

const SPOTLIGHT_DEFAULT = 8;

export function getFreshnessTier(lastActivityAt: string | null): FreshnessTier {
  if (!lastActivityAt) return 'stale';
  const daysSince = (Date.now() - new Date(lastActivityAt).getTime()) / 86_400_000;
  if (daysSince <= 7) return 'fresh';
  if (daysSince <= 14) return 'warning';
  return 'stale';
}

interface ScoredProject extends BaseballCardProject {
  _effort: number;
}

function getEffortScore(project: BaseballCardProject): number {
  if (project.status === 'pencils_down') return 0;
  const freshness = getFreshnessTier(project.last_activity_at);
  let score = freshness === 'fresh' ? 10 : freshness === 'warning' ? 4 : 0;
  if (project.pinned) score += 20;
  if (project.target_date) {
    score += 5;
    const daysUntil = (new Date(project.target_date).getTime() - Date.now()) / 86_400_000;
    if (daysUntil < 0) score += 10;
  }
  // Boost urgent/high priority
  if (project.priority === 'urgent') score += 15;
  if (project.priority === 'high') score += 8;
  return score;
}

export function partitionProjects(projects: BaseballCardProject[]): PartitionedPortfolio {
  const active = projects.filter(p => p.status !== 'archived');
  const archived = projects
    .filter(p => p.status === 'archived')
    .sort((a, b) => new Date(b.archived_at!).getTime() - new Date(a.archived_at!).getTime())
    .slice(0, 50);

  const manual = active
    .filter(p => p.manual_rank != null)
    .sort((a, b) => a.manual_rank! - b.manual_rank!);

  const auto: ScoredProject[] = active
    .filter(p => p.manual_rank == null && p.status !== 'on_hold')
    .map(p => ({ ...p, _effort: getEffortScore(p) }))
    .sort((a, b) => {
      if (b._effort !== a._effort) return b._effort - a._effort;
      return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
    });

  const onHold = active.filter(p => p.status === 'on_hold' && p.manual_rank == null);

  // Auto-fill pads to SPOTLIGHT_DEFAULT; manual promotions add on top with no cap
  const spotlight = [...manual, ...auto.slice(0, SPOTLIGHT_DEFAULT)];
  const spotlightIds = new Set(spotlight.map(p => p.id));
  const rosterAuto = auto.filter(p => !spotlightIds.has(p.id));

  return {
    spotlight,
    roster: [...rosterAuto, ...onHold],
    archive: archived,
  };
}
