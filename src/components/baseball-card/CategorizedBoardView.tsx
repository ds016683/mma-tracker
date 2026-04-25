import { useState } from 'react';
import { ChevronDown, ChevronRight, FolderOpen, MoveRight, Pin, Trash2 } from 'lucide-react';
import { computeScheduleHealth, ScheduleIndicator } from './ExpandableCardContent';
import type { BaseballCardProject } from '../../lib/baseball-card/types';
import { BOARD_CATEGORIES } from '../../lib/baseball-card/types';
import { FreshnessDot } from './FreshnessDot';
import { ExpandableCardContent } from './ExpandableCardContent';
import { InlineDropdown } from './InlineDropdown';

interface CategorizedBoardViewProps {
  projects: BaseballCardProject[];
  onProjectUpdate: (id: string, updates: Partial<BaseballCardProject>) => void;
  onToggleExpand: (id: string) => void;
  expandedCardId: string | null;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}

// ── Category accent colours (header bar per section) ─────────────────────────
const SECTION_HEADER_BG: Record<string, string> = {
  'Production Priorities':          'bg-[#224057]',
  'Data Enhancements (Schedule E)': 'bg-[#234D8B]',
  'Innovation Roadmap':             'bg-[#b8972e]',
  'Completed':                      'bg-emerald-600',
  'Extraneous':                     'bg-gray-400',
};

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
    <div className="space-y-14">
      {BOARD_CATEGORIES.map(section => {
        const sectionProjects = projects.filter(
          p => p.status !== 'archived' && (p.category || 'Production Priorities') === section.id
        );
        const isCollapsed = !!collapsed[section.id];
        const headerBg = SECTION_HEADER_BG[section.id] ?? 'bg-[#224057]';

        return (
          <div key={section.id} className={`overflow-hidden rounded-xl border bg-white shadow-sm ${section.borderColor}`}>
            {/* Section header — click to collapse */}
            <button
              onClick={() => toggle(section.id)}
              className={`flex w-full items-center gap-3 px-5 py-3.5 text-left ${headerBg}`}
            >
              <FolderOpen size={14} className="shrink-0 text-white/80" />
              <span className="flex-1 text-xs font-bold uppercase tracking-widest text-white">
                {section.label}
              </span>
              <span className="text-[11px] text-white/60">
                {sectionProjects.length} item{sectionProjects.length !== 1 ? 's' : ''}
              </span>
              {isCollapsed
                ? <ChevronRight size={14} className="shrink-0 text-white/60" />
                : <ChevronDown size={14} className="shrink-0 text-white/60" />}
            </button>

            {!isCollapsed && (
              <div className="p-5">
                {sectionProjects.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-sm text-gray-400">No items in this category.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sectionProjects.map(p => (
                      <BaseballCard
                        key={p.id}
                        project={p}
                        isExpanded={expandedCardId === p.id}
                        onToggleExpand={onToggleExpand}
                        onProjectUpdate={onProjectUpdate}
                        onPin={onPin}
                        onDelete={onDelete}
                        onMoveCategory={moveCategory}
                        currentCategory={section.id}
                        accentBg={headerBg}
                      />
                    ))}
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

// ── Card action bar ───────────────────────────────────────────────────────────

function CardActions({
  project, currentCategory, onPin, onDelete, onMoveCategory,
}: {
  project: BaseballCardProject;
  currentCategory: string;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveCategory: (id: string, cat: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const categoryIds = BOARD_CATEGORIES.map(c => c.id) as unknown as readonly string[];
  const labels = Object.fromEntries(BOARD_CATEGORIES.map(c => [c.id, c.label])) as Record<string, string>;

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirmDelete) { onDelete(project.id); }
    else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }

  return (
    <div
      className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={e => { e.stopPropagation(); onPin(project.id); }}
        className={`rounded p-1 transition-colors ${
          project.pinned ? 'text-[#F8C762] hover:text-amber-500' : 'text-white/50 hover:text-[#F8C762]'
        }`}
        title={project.pinned ? 'Unpin' : 'Pin'}
      >
        <Pin className={`h-3.5 w-3.5 ${project.pinned ? 'fill-current' : ''}`} />
      </button>
      <InlineDropdown
        options={categoryIds}
        value={currentCategory}
        onChange={cat => onMoveCategory(project.id, cat)}
        labels={labels}
      >
        <span className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-white/50 hover:text-white transition-colors cursor-pointer">
          <MoveRight size={11} /> Move
        </span>
      </InlineDropdown>
      <button
        onClick={handleDelete}
        className={`rounded p-1 transition-colors ${
          confirmDelete ? 'bg-red-500 text-white' : 'text-white/40 hover:text-red-300'
        }`}
        title={confirmDelete ? 'Confirm delete' : 'Delete'}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      {confirmDelete && <span className="text-[10px] text-red-300">confirm?</span>}
    </div>
  );
}

// ── Baseball card tile ────────────────────────────────────────────────────────

interface BaseballCardProps {
  project: BaseballCardProject;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onProjectUpdate: (id: string, updates: Partial<BaseballCardProject>) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveCategory: (id: string, cat: string) => void;
  currentCategory: string;
  accentBg: string;
}

function BaseballCard({
  project, isExpanded, onToggleExpand,
  onProjectUpdate, onPin, onDelete,
  onMoveCategory, currentCategory, accentBg,
}: BaseballCardProps) {
  const taskDone = project.tasks.filter((t: { done: boolean }) => t.done).length;
  const taskTotal = project.tasks.length;
  const pct = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : null;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md ${
        isExpanded ? 'col-span-1 md:col-span-2 xl:col-span-3' : ''
      } ${project.pinned ? 'ring-2 ring-[#F8C762]/60' : ''}`}
    >
      {/* Card header bar — coloured accent + title */}
      <div
        className={`flex cursor-pointer items-start gap-2 px-4 py-3 ${accentBg}`}
        onClick={() => onToggleExpand(project.id)}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug text-white line-clamp-2">
            {project.name}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          {project.pinned && <Pin size={11} className="fill-[#F8C762] text-[#F8C762]" />}
          <CardActions
            project={project}
            currentCategory={currentCategory}
            onPin={onPin}
            onDelete={onDelete}
            onMoveCategory={onMoveCategory}
          />
          <ChevronDown
            className={`h-3.5 w-3.5 text-white/70 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Card body — compact meta row */}
      {!isExpanded && (
        <div
          className="flex cursor-pointer flex-col gap-2 px-4 py-3"
          onClick={() => onToggleExpand(project.id)}
        >
          {/* Status + priority badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {project.mma_status && (
              <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                (project.mma_status as string) === 'Done' ? 'bg-emerald-100 text-emerald-700' :
                (project.mma_status as string) === 'Stuck' ? 'bg-red-100 text-red-600' :
                'bg-blue-50 text-[#234D8B]'
              }`}>{project.mma_status}</span>
            )}
            {project.mma_priority && (
              <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                project.mma_priority === 'High' ? 'bg-amber-100 text-amber-700' :
                project.mma_priority === 'Low' ? 'bg-gray-100 text-gray-500' :
                'bg-slate-100 text-slate-600'
              }`}>{project.mma_priority}</span>
            )}
            <FreshnessDot lastActivityAt={project.last_activity_at} />
            <ScheduleIndicator health={computeScheduleHealth(project.target_date, project.tasks)} compact />
          </div>

          {/* Description snippet */}
          {project.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">{project.description}</p>
          )}

          {/* RACI mini-row */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {project.mma_accountable && (
              <span className="text-[10px] text-gray-400"><span className="font-semibold text-gray-500">A:</span> {project.mma_accountable}</span>
            )}
            {project.mma_responsible && (
              <span className="text-[10px] text-gray-400"><span className="font-semibold text-gray-500">R:</span> {project.mma_responsible}</span>
            )}
          </div>

          {/* Progress bar (tasks) */}
          {pct !== null && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-[#234D8B]'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400">{pct}%</span>
            </div>
          )}

          {/* Contract ref + target date footer */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-2">
            {project.mma_contract_ref ? (
              <span className="text-[10px] text-gray-400">{project.mma_contract_ref}</span>
            ) : <span />}
            {project.target_date && (
              <span className="text-[10px] text-gray-400">
                Due {new Date(project.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Expanded content — unchanged */}
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
