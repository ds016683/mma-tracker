import { useState } from 'react';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import type { BaseballCardProject } from '../../lib/baseball-card/types';
import { VersionBadge, MMAStatusBadge } from './MMABadges';

interface ArchiveProps {
  projects: BaseballCardProject[];
  onNavigate: (id: string) => void;
}

export function Archive({ projects, onNavigate }: ArchiveProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (projects.length === 0) return null;

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
          {projects.map(project => (
            <div
              key={project.id}
              className="group flex items-center justify-between px-4 py-2.5 text-sm text-gray-500"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{project.name}</span>
                <VersionBadge version={project.mma_version} />
                <MMAStatusBadge status={project.mma_status} />
                <span className="text-xs text-gray-400">{project.category}</span>
              </div>
              <button
                onClick={() => onNavigate(project.id)}
                className="shrink-0 rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                title="Open detail view — see tasks, notes, links, and full project info"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
