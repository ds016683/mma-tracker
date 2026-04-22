import { useState } from 'react';
import { ChevronDown, ChevronRight, FolderOpen, MoveRight, Pin, Trash2 } from 'lucide-react';
import type { BaseballCardProject, Priority, MMATaskStatus } from '../../lib/baseball-card/types';
import { BOARD_CATEGORIES } from '../../lib/baseball-card/types';
import { FreshnessDot } from './FreshnessDot';
import { PriorityBadge } from './PriorityBadge';
import { MMAStatusBadge, VersionBadge, ContractBadge } from './MMABadges';
import { ExpandableCardContent } from './ExpandableCardContent';
import { StatusRollupBadge } from './StatusRollupBadge';
import { InlineDropdown } from './InlineDropdown';

interface CategorizedBoardViewProps {
  projects: BaseballCardProject[];
  onProjectUpdate: (id: string, updates: Partial<BaseballCardProject>) => void;
  onToggleExpand: (id: string) => void;
  expandedCardId: string | null;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CategorizedBoardView({
  projects,
  onProjectUpdate,
  onToggleExpand,
  expandedCardId,
  onPin,
  onDelete,
}: CategorizedBoardViewProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  const moveCategory = (projectId: string, newCategory: string) =>
    onProjectUpdate(projectId, { category: newCategory });

  return (
    <div className="space-y-4">
      {BOARD_CATEGORIES.map(section => {
        const sectionProjects = projects.filter(
          p => p.status !== 'archived' && (p.category || 'Production Priorities') === section.id
        );
        const pinned = sectionProjects.filter(p => p.pinned);
        const unpinned = sectionProjects.filter(p => !p.pinned);
        const isCollapsed = !!collapsed[section.id];

        return (
          <div key={section.id} className={`rounded-xl border bg-white shadow-sm ${section.borderColor}`}>
            <button
              onClick={() => toggle(section.id)}
              className="flex w-full items-center gap-3 rounded-xl px-5 py-4 text-left transition-colors hover:bg-[#E8F0F8]/40"
            >
              <FolderOpen size={15} className={section.iconColor} />
              <span className={`flex-1 text-sm font-bold uppercase tracking-wide ${section.labelColor}`}>
                {section.label}
              </span>
              <span className="text-xs text-gray-400">
                {pinned.length} pinned &mdash; {unpinned.length} other
                {sectionProjects.length === 0 ? ' (empty)' : ''}
              </span>
              {isCollapsed
                ? <ChevronRight size={14} className="shrink-0 text-gray-300" />
                : <ChevronDown size={14} className="shrink-0 text-gray-300" />}
            </button>

            {!isCollapsed && (
              <div className="px-5 pb-5">
                {pinned.length > 0 && (
                  <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {pinned.map(p => (
                      <CategoryCard
                        key={p.id}
                        project={p}
                        isExpanded={expandedCardId === p.id}
                        onToggleExpand={onToggleExpand}
                        onProjectUpdate={onProjectUpdate}
                        onPin={onPin}
                        onDelete={onDelete}
                        onMoveCategory={moveCategory}
                        currentCategory={section.id}
                      />
                    ))}
                  </div>
                )}
                {unpinned.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                    <div className="border-b border-gray-200 px-4 py-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Not Pinned</span>
                      <span className="text-[10px] text-gray-300">{unpinned.length}</span>
                    </div>
                    {unpinned.map(p => (
                      <RosterRow
                        key={p.id}
                        project={p}
                        isExpanded={expandedCardId === p.id}
                        onToggleExpand={onToggleExpand}
                        onProjectUpdate={onProjectUpdate}
                        onPin={onPin}
                        onDelete={onDelete}
                        onMoveCategory={moveCategory}
                        currentCategory={section.id}
                      />
                    ))}
                  </div>
                )}
                {sectionProjects.length === 0 && (
                  <div className="py-6 text-center">
                    <p className="text-sm text-gray-400">No items in this category.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Card action bar (shared by grid + roster) ────────────────────────────────

function CardActions({
  project,
  currentCategory,
  onPin,
  onDelete,
  onMoveCategory,
  alwaysVisible = false,
}: {
  project: BaseballCardProject;
  currentCategory: string;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveCategory: (id: string, cat: string) => void;
  alwaysVisible?: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const categoryIds = BOARD_CATEGORIES.map(c => c.id) as unknown as readonly string[];
  const labels = Object.fromEntries(BOARD_CATEGORIES.map(c => [c.id, c.label])) as Record<string, string>;

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(project.id);
    } else {
      setConfirmDelete(true);
      // Auto-cancel confirm state after 3s
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }

  return (
    // stopPropagation on the whole action bar — nothing here should expand/collapse the card
    <div
      className={`flex shrink-0 items-center gap-1 transition-opacity ${alwaysVisible ? '' : 'opacity-0 group-hover:opacity-100'}`}
      onClick={e => e.stopPropagation()}
    >
      {/* Pin / Unpin */}
      <button
        onClick={(e) => { e.stopPropagation(); onPin(project.id); }}
        className={`rounded p-1 transition-colors ${
          project.pinned
            ? 'text-[#F8C762] hover:text-amber-500'
            : 'text-gray-300 hover:text-[#F8C762]'
        }`}
        title={project.pinned ? 'Unpin — move to roster list' : 'Pin — promote to card grid'}
      >
        <Pin className={`h-3.5 w-3.5 ${project.pinned ? 'fill-current' : ''}`} />
      </button>

      {/* Move category */}
      <InlineDropdown
        options={categoryIds}
        value={currentCategory}
        onChange={(cat) => onMoveCategory(project.id, cat)}
        labels={labels}
      >
        <span
          className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-400 hover:border-[#234D8B]/40 hover:text-[#234D8B] transition-colors cursor-pointer"
          title="Move to another category"
        >
          <MoveRight size={11} />
          Move
        </span>
      </InlineDropdown>

      {/* Hard delete */}
      <button
        onClick={handleDelete}
        className={`rounded p-1 transition-colors ${
          confirmDelete
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'text-gray-300 hover:text-red-500'
        }`}
        title={confirmDelete ? 'Click again to confirm delete' : 'Delete card permanently'}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      {confirmDelete && (
        <span className="text-[10px] text-red-500 font-medium">confirm?</span>
      )}
    </div>
  );
}

// ── Category card (grid tile) ────────────────────────────────────────────────

interface CardProps {
  project: BaseballCardProject;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onProjectUpdate: (id: string, updates: Partial<BaseballCardProject>) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveCategory: (id: string, cat: string) => void;
  currentCategory: string;
}

function CategoryCard({
  project, isExpanded, onToggleExpand,
  onProjectUpdate, onPin, onDelete,
  onMoveCategory, currentCategory,
}: CardProps) {
  return (
    <div
      className={`group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-mma-blue/30 hover:shadow-md ${
        isExpanded ? 'col-span-1 md:col-span-2 xl:col-span-3' : ''
      }`}
    >
      <div className="min-w-0">
        <div className="mb-2 flex items-start justify-between gap-2">
          {/* Clickable title area */}
          <div
            className="flex cursor-pointer items-center gap-1.5 flex-1 min-w-0"
            onClick={() => onToggleExpand(project.id)}
          >
            <FreshnessDot lastActivityAt={project.last_activity_at} />
            <h3 className="text-sm font-semibold leading-tight text-mma-dark-blue truncate">
              {project.name}
            </h3>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>

          {/* Action bar — isolated from expand clicks */}
          <CardActions
            project={project}
            currentCategory={currentCategory}
            onPin={onPin}
            onDelete={onDelete}
            onMoveCategory={onMoveCategory}
          />
        </div>

        <div className="mb-2 flex flex-wrap gap-1">
          <VersionBadge version={project.mma_version} onChange={v => onProjectUpdate(project.id, { mma_version: v })} />
          <MMAStatusBadge status={project.mma_status} onChange={(s: MMATaskStatus) => onProjectUpdate(project.id, { mma_status: s })} />
          <PriorityBadge priority={project.priority} onClick={(p: Priority) => onProjectUpdate(project.id, { priority: p })} />
          <ContractBadge contractRef={project.mma_contract_ref} onChange={c => onProjectUpdate(project.id, { mma_contract_ref: c })} />
        </div>

        {!isExpanded && project.tasks.length > 0 && (
          <div className="mb-2"><StatusRollupBadge tasks={project.tasks} compact /></div>
        )}
        {!isExpanded && project.description && (
          <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-gray-500">{project.description}</p>
        )}
        {isExpanded && (
          <ExpandableCardContent
            project={project}
            onUpdate={onProjectUpdate}
            onPin={onPin}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
}

// ── Roster-style row ─────────────────────────────────────────────────────────

function RosterRow({
  project, isExpanded, onToggleExpand,
  onProjectUpdate, onPin, onDelete,
  onMoveCategory, currentCategory,
}: CardProps) {
  return (
    <div className="group border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white">
        <FreshnessDot lastActivityAt={project.last_activity_at} />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <span
              className="flex cursor-pointer items-center gap-1.5 truncate text-sm font-medium text-mma-dark-blue"
              onClick={() => onToggleExpand(project.id)}
            >
              {project.name}
              <ChevronDown
                className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <VersionBadge version={project.mma_version} onChange={v => onProjectUpdate(project.id, { mma_version: v })} />
            <MMAStatusBadge status={project.mma_status} onChange={(s: MMATaskStatus) => onProjectUpdate(project.id, { mma_status: s })} />
            <PriorityBadge priority={project.priority} onClick={(p: Priority) => onProjectUpdate(project.id, { priority: p })} />
            <ContractBadge contractRef={project.mma_contract_ref} onChange={c => onProjectUpdate(project.id, { mma_contract_ref: c })} />
          </div>
        </div>

        <CardActions
          project={project}
          currentCategory={currentCategory}
          onPin={onPin}
          onDelete={onDelete}
          onMoveCategory={onMoveCategory}
        />
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
}
