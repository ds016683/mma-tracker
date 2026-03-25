import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ArrowDown, Users } from 'lucide-react';
import type { BaseballCardProject, Priority, MMATaskStatus } from '../../lib/baseball-card/types';
import { FreshnessDot } from './FreshnessDot';
import { PriorityBadge } from './PriorityBadge';
import { MMAStatusBadge, VersionBadge, ContractBadge } from './MMABadges';
import { ExpandableCardContent } from './ExpandableCardContent';

interface SpotlightGridProps {
  projects: BaseballCardProject[];
  onProjectUpdate: (id: string, updates: Partial<BaseballCardProject>) => void;
  onReorder: (ids: string[], draggedId: string) => void;
  onToggleExpand: (id: string) => void;
  expandedCardId: string | null;
  onDemote: (id: string) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SpotlightGrid({ projects, onProjectUpdate, onReorder, onToggleExpand, expandedCardId, onDemote, onPin, onDelete }: SpotlightGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(_event: DragStartEvent) {
    // Auto-collapse expanded card when drag starts
    if (expandedCardId) {
      onToggleExpand(expandedCardId);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = projects.map(p => p.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    const newIds = [...ids];
    newIds.splice(oldIndex, 1);
    newIds.splice(newIndex, 0, active.id as string);
    onReorder(newIds, active.id as string);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={projects.map(p => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {projects.map(project => (
            <SortableCard
              key={project.id}
              project={project}
              isExpanded={expandedCardId === project.id}
              onToggleExpand={() => onToggleExpand(project.id)}
              onDemote={onDemote}
              onProjectUpdate={onProjectUpdate}
              onPin={onPin}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCard({
  project,
  isExpanded,
  onToggleExpand,
  onDemote,
  onProjectUpdate,
  onPin,
  onDelete,
}: {
  project: BaseballCardProject;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDemote: (id: string) => void;
  onProjectUpdate: (id: string, updates: Partial<BaseballCardProject>) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isPencilsDown = project.status === 'pencils_down';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-mma-blue/30 ${isPencilsDown ? 'opacity-50 grayscale' : ''} ${isExpanded ? 'col-span-1 md:col-span-2 xl:col-span-4' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
          title="Drag to reorder cards in the Spotlight grid"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <div
              className="flex cursor-pointer items-center gap-1.5"
              onClick={onToggleExpand}
            >
              <FreshnessDot lastActivityAt={project.last_activity_at} />
              {project.pinned && (
                <span className="text-xs text-amber-500" title="This project is pinned to focus">*</span>
              )}
              <h3 className="text-sm font-semibold leading-tight text-mma-dark-blue">
                {project.name}
              </h3>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                onClick={() => onDemote(project.id)}
                className="rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                title="Move to Roster — remove from Spotlight and place in the overflow list"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Badges */}
          <div className="mb-2 flex flex-wrap gap-1">
            <VersionBadge version={project.mma_version} onChange={(v) => onProjectUpdate(project.id, { mma_version: v })} />
            <MMAStatusBadge status={project.mma_status} onChange={(s: MMATaskStatus) => onProjectUpdate(project.id, { mma_status: s })} />
            <PriorityBadge priority={project.priority} onClick={(p: Priority) => onProjectUpdate(project.id, { priority: p })} />
            <ContractBadge contractRef={project.mma_contract_ref} onChange={(c) => onProjectUpdate(project.id, { mma_contract_ref: c })} />
          </div>

          {/* Description preview (only when collapsed) */}
          {!isExpanded && project.description && (
            <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
              {project.description}
            </p>
          )}

          {/* People (only when collapsed) */}
          {!isExpanded && project.people.length > 0 && (
            <div
              className="flex items-center gap-1 text-xs text-gray-400"
              title={project.people.map(p => `${p.name}${p.role ? ` (${p.role})` : ''}`).join(', ')}
            >
              <Users className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {project.mma_responsible || project.people.map(p => p.name).join(', ')}
              </span>
            </div>
          )}

          {/* Expanded content */}
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
    </div>
  );
}
