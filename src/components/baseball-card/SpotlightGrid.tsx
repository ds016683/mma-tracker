import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowUpRight, ArrowDown, Users } from 'lucide-react';
import type { BaseballCardProject, Priority } from '../../lib/baseball-card/types';
import { FreshnessDot } from './FreshnessDot';
import { PriorityBadge } from './PriorityBadge';
import { MMAStatusBadge, VersionBadge, ContractBadge } from './MMABadges';

interface SpotlightGridProps {
  projects: BaseballCardProject[];
  onProjectUpdate: (id: string, updates: Partial<BaseballCardProject>) => void;
  onReorder: (ids: string[], draggedId: string) => void;
  onNavigate: (id: string) => void;
  onDemote: (id: string) => void;
}

export function SpotlightGrid({ projects, onProjectUpdate, onReorder, onNavigate, onDemote }: SpotlightGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={projects.map(p => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {projects.map(project => (
            <SortableCard
              key={project.id}
              project={project}
              onNavigate={onNavigate}
              onDemote={onDemote}
              onPriorityChange={(p) => onProjectUpdate(project.id, { priority: p })}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCard({
  project,
  onNavigate,
  onDemote,
  onPriorityChange,
}: {
  project: BaseballCardProject;
  onNavigate: (id: string) => void;
  onDemote: (id: string) => void;
  onPriorityChange: (p: Priority) => void;
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
      className={`group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-mma-blue/30 ${isPencilsDown ? 'opacity-50 grayscale' : ''}`}
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
            <div className="flex items-center gap-1.5">
              <FreshnessDot lastActivityAt={project.last_activity_at} />
              {project.pinned && (
                <span className="text-xs text-amber-500" title="This project is pinned to focus">
                  *
                </span>
              )}
              <h3 className="text-sm font-semibold leading-tight text-mma-dark-blue">
                {project.name}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                onClick={() => onDemote(project.id)}
                className="rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                title="Move to Roster — remove from Spotlight and place in the overflow list"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onNavigate(project.id)}
                className="rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                title="Open detail view — see RACI, description, tasks, notes, links, and full project info"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Badges */}
          <div className="mb-2 flex flex-wrap gap-1">
            <VersionBadge version={project.mma_version} />
            <MMAStatusBadge status={project.mma_status} />
            <PriorityBadge priority={project.priority} onClick={onPriorityChange} />
          </div>

          {/* Contract ref */}
          <div className="mb-2">
            <ContractBadge contractRef={project.mma_contract_ref} />
          </div>

          {/* Description preview */}
          {project.description && (
            <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
              {project.description}
            </p>
          )}

          {/* People */}
          {project.people.length > 0 && (
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
        </div>
      </div>
    </div>
  );
}
