import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { BaseballCardProject } from '../../lib/baseball-card/types';
import { VersionBadge, MMAStatusBadge } from './MMABadges';
import { ExpandableCardContent } from './ExpandableCardContent';

interface ArchiveProps {
  projects: BaseballCardProject[];
  onProjectUpdate: (id: string, updates: Partial<BaseballCardProject>) => void;
  onToggleExpand: (id: string) => void;
  expandedCardId: string | null;
}

export function Archive({ projects, onProjectUpdate, onToggleExpand, expandedCardId }: ArchiveProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (projects.length === 0) return null;

  function handleRestore(id: string) {
    onProjectUpdate(id, { status: 'active', archived_at: null });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
        title={isOpen ? 'Collapse the archive section' : 'Expand to see archived / completed cards'}
      >
        <span>Archive ({projects.length})</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {projects.map(project => {
            const isExpanded = expandedCardId === project.id;
            return (
              <div key={project.id} className="group">
                <div className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-500">
                  <div
                    className="flex cursor-pointer items-center gap-2"
                    onClick={() => onToggleExpand(project.id)}
                  >
                    <span className="text-gray-600">{project.name}</span>
                    <VersionBadge version={project.mma_version} />
                    <MMAStatusBadge status={project.mma_status} />
                    <span className="text-xs text-gray-400">{project.category}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <ExpandableCardContent
                      project={project}
                      onUpdate={onProjectUpdate}
                      onPin={() => {}}
                      onDelete={() => {}}
                      readOnly
                      onRestore={handleRestore}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
