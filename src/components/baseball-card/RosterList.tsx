import { ArrowUp, ChevronDown, Users } from 'lucide-react';
import type { BaseballCardProject, Priority, MMATaskStatus } from '../../lib/baseball-card/types';
import { FreshnessDot } from './FreshnessDot';
import { PriorityBadge } from './PriorityBadge';
import { MMAStatusBadge, VersionBadge, ContractBadge } from './MMABadges';
import { ExpandableCardContent } from './ExpandableCardContent';

interface RosterListProps {
  projects: BaseballCardProject[];
  onProjectUpdate: (id: string, updates: Partial<BaseballCardProject>) => void;
  onPromote: (id: string) => void;
  onToggleExpand: (id: string) => void;
  expandedCardId: string | null;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RosterList({ projects, onProjectUpdate, onPromote, onToggleExpand, expandedCardId, onPin, onDelete }: RosterListProps) {
  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
      {projects.map(project => {
        const isExpanded = expandedCardId === project.id;
        return (
          <div key={project.id} className="group">
            <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50">
              <FreshnessDot lastActivityAt={project.last_activity_at} />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <span
                    className="flex cursor-pointer items-center gap-1.5 truncate text-sm font-medium text-mma-dark-blue"
                    onClick={() => onToggleExpand(project.id)}
                  >
                    {project.name}
                    <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </span>
                  {project.status === 'on_hold' && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">On Hold</span>
                  )}
                </div>
                {!isExpanded && project.description && (
                  <p className="mb-1 truncate text-xs text-gray-400">{project.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-1.5">
                  <VersionBadge version={project.mma_version} onChange={(v) => onProjectUpdate(project.id, { mma_version: v })} />
                  <MMAStatusBadge status={project.mma_status} onChange={(s: MMATaskStatus) => onProjectUpdate(project.id, { mma_status: s })} />
                  <PriorityBadge
                    priority={project.priority}
                    onClick={(p: Priority) => onProjectUpdate(project.id, { priority: p })}
                  />
                  <ContractBadge contractRef={project.mma_contract_ref} onChange={(c) => onProjectUpdate(project.id, { mma_contract_ref: c })} />
                  {!isExpanded && project.people.length > 0 && (
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
              </div>
            </div>
            {isExpanded && (
              <div className="px-4 pb-4">
                <ExpandableCardContent
                  project={project}
                  onUpdate={onProjectUpdate}
                  onPin={onPin}
                  onDelete={onDelete}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
