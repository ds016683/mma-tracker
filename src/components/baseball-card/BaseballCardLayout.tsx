import { useState, useRef } from 'react';
import { Plus, Download, Upload, LayoutGrid, DollarSign, Layers } from 'lucide-react';
import { useBaseballCard } from '../../hooks/useBaseballCard';
import { SpotlightGrid } from './SpotlightGrid';
import { RosterList } from './RosterList';
import { Archive } from './Archive';
import { ProjectDetail } from './ProjectDetail';
import { CreateProjectForm } from './CreateProjectForm';
import { BudgetView } from './BudgetView';
import {
  SCHEDULE_E_ITEMS, SCHEDULE_F_ITEMS,
  SCHEDULE_E_POOL_START, SCHEDULE_E_TOTAL_ALLOCATED,
  SCHEDULE_F_POOL_START, SCHEDULE_F_TOTAL_ALLOCATED,
} from '../../lib/baseball-card/seed-data';

type View = 'board' | 'schedule-e' | 'schedule-f';

export function BaseballCardLayout() {
  const {
    spotlight, roster, archive,
    createProject, updateProject, deleteProject,
    pinProject, reorderSpotlight, promoteToSpotlight, demoteToRoster,
    exportToJson, importFromJson,
  } = useBaseballCard();

  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [view, setView] = useState<View>('board');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detailProject = detailProjectId
    ? [...spotlight, ...roster, ...archive].find(p => p.id === detailProjectId) ?? null
    : null;

  // Detail view
  if (detailProject) {
    return (
      <div className="mx-auto max-w-2xl">
        <ProjectDetail
          project={detailProject}
          onUpdate={updateProject}
          onPin={pinProject}
          onDelete={(id) => { deleteProject(id); setDetailProjectId(null); }}
          onBack={() => setDetailProjectId(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">MMA Master Tracker</h1>
          <p className="text-sm text-gray-500">Production tasks as of March 9, 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            title="Import from JSON — load a previously exported portfolio backup"
          >
            <Upload className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importFromJson(file);
              e.target.value = '';
            }}
          />
          <button
            onClick={exportToJson}
            className="rounded p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            title="Export to JSON — download your entire portfolio as a backup file"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700 transition-colors"
            title="Create a new task card"
          >
            <Plus className="h-4 w-4 inline -mt-0.5 mr-1" />
            New Card
          </button>
        </div>
      </div>

      {/* Nav tabs */}
      <nav className="flex gap-1 rounded-lg bg-gray-100 p-1">
        <NavTab active={view === 'board'} onClick={() => setView('board')} icon={<LayoutGrid className="h-4 w-4" />} label="Task Board" />
        <NavTab active={view === 'schedule-e'} onClick={() => setView('schedule-e')} icon={<DollarSign className="h-4 w-4" />} label="Schedule E" />
        <NavTab active={view === 'schedule-f'} onClick={() => setView('schedule-f')} icon={<Layers className="h-4 w-4" />} label="Schedule F" />
      </nav>

      {/* Schedule E */}
      {view === 'schedule-e' && (
        <BudgetView
          title="Schedule E — Data Enhancements"
          subtitle="EWO budget tracking and monthly allocation burn"
          items={SCHEDULE_E_ITEMS}
          totalAllocated={SCHEDULE_E_TOTAL_ALLOCATED}
          poolStart={SCHEDULE_E_POOL_START}
          accentHex="#7c3aed"
        />
      )}

      {/* Schedule F */}
      {view === 'schedule-f' && (
        <BudgetView
          title="Schedule F — Data Innovation"
          subtitle="IWO budget tracking and monthly allocation burn"
          items={SCHEDULE_F_ITEMS}
          totalAllocated={SCHEDULE_F_TOTAL_ALLOCATED}
          poolStart={SCHEDULE_F_POOL_START}
          accentHex="#0d9488"
        />
      )}

      {/* Board view */}
      {view === 'board' && (
        <>
          {showCreateForm && (
            <CreateProjectForm
              onCreate={(fields) => { createProject(fields); setShowCreateForm(false); }}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {/* Spotlight */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-700">
              Spotlight
              <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">{spotlight.length}</span>
            </h2>
            <SpotlightGrid
              projects={spotlight}
              onProjectUpdate={updateProject}
              onReorder={reorderSpotlight}
              onNavigate={setDetailProjectId}
              onDemote={demoteToRoster}
            />
          </div>

          {/* Roster */}
          {roster.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-700">
                Roster
                <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600">{roster.length}</span>
              </h2>
              <RosterList
                projects={roster}
                onProjectUpdate={updateProject}
                onPromote={promoteToSpotlight}
                onNavigate={setDetailProjectId}
              />
            </div>
          )}

          {/* Archive */}
          {archive.length > 0 && <Archive projects={archive} onNavigate={setDetailProjectId} />}
        </>
      )}
    </div>
  );
}

function NavTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

