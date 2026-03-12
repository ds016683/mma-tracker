import { ArrowUp, ArrowUpRight, Users } from 'lucide-react';
import type { BaseballCardProject, Priority } from '../../lib/baseball-card/types';
import { FreshnessDot } from './FreshnessDot';
import { PriorityBadge } from './PriorityBadge';
import { MMAStatusBadge, VersionBadge } from './MMABadges';

interface RosterListProps {
  projects: BaseballCardProject[];
  onProjectUpdate: (id: string, updates: Partial<BaseballCardProject>) => void;
  onPromote: (id: string) => void;
  onNavigate: (id: string) => void;
}

export function RosterList({ projects, onProjectUpdate, onPromote, onNavigate }: RosterListProps) {
  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
      {projects.map(project => (
        <div
          key={project.id}
          className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
        >
          <FreshnessDot lastActivityAt={project.last_activity_at} />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              <span className="truncate text-sm font-medium text-mma-dark-blue">{project.name}</span>
              {project.status === 'on_hold' && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">On Hold</span>
              )}
            </div>
            {project.description && (
              <p className="mb-1 truncate text-xs text-gray-400">{project.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <VersionBadge version={project.mma_version} />
              <MMAStatusBadge status={project.mma_status} />
              <PriorityBadge
                priority={project.priority}
                onClick={(p: Priority) => onProjectUpdate(project.id, { priority: p })}
              />
              {project.people.length > 0 && (
                <span
                  className="flex items-center gap-0.5 text-xs text-gray-400"
                  title={project.people.map(p => `${p.name}${p.role ? ` (${p.role})` : ''}`).join(', ')}
                >
                  <Users className="h-3 w-3" />
                  {project.people.length}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => onPromote(project.id)}
              className="rounded p-1.5 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
              title="Promote to Spotlight — move this card into the top-priority drag-and-drop grid"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate(project.id)}
              className="rounded p-1.5 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
              title="Open detail view — see RACI, description, tasks, notes, links, and full project info"
            >
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
