import { useState, useRef } from 'react';
import { Plus, Download, Upload, LayoutGrid, DollarSign, Layers } from 'lucide-react';
import mmaLogo from '../../assets/mma-logo.png';
import thsLogo from '../../assets/ths-logo.png';
import { useBaseballCard } from '../../hooks/useBaseballCard';
import { SpotlightGrid } from './SpotlightGrid';
import { RosterList } from './RosterList';
import { Archive } from './Archive';
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
    loading, error: dataError,
    createProject, updateProject, deleteProject,
    pinProject, reorderSpotlight, promoteToSpotlight, demoteToRoster,
    exportToJson, importFromJson,
  } = useBaseballCard();

  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [view, setView] = useState<View>('board');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleExpand(id: string) {
    setExpandedCardId(prev => prev === id ? null : id);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-20 text-center">
        <div className="text-sm text-mma-blue-gray">Loading projects...</div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="mx-auto max-w-6xl py-20 text-center">
        <div className="text-sm text-red-600">Error: {dataError}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img src={mmaLogo} alt="Marsh McLennan Agency" className="h-8 w-auto" />
          <div className="h-8 w-px bg-gray-300" />
          <img src={thsLogo} alt="Third Horizon" className="h-8 w-auto" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-mma-dark-blue">Master Tracker</h1>
          <p className="text-sm text-mma-blue-gray">Production tasks as of March 9, 2026</p>
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
            className="rounded-md bg-mma-dark-blue px-3 py-1.5 text-sm text-white hover:bg-mma-blue transition-colors"
            title="Create a new task card"
          >
            <Plus className="h-4 w-4 inline -mt-0.5 mr-1" />
            New Card
          </button>
        </div>
      </div>

      {/* Nav tabs */}
      <nav className="flex gap-1 rounded-lg bg-mma-dark-blue/5 p-1">
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
          accentHex="#8246AF"
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
          accentHex="#00968F"
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
            <h2 className="mb-3 text-sm font-semibold text-mma-dark-blue">
              Spotlight
              <span className="ml-2 rounded-full bg-mma-blue/10 px-2 py-0.5 text-xs text-mma-blue">{spotlight.length}</span>
            </h2>
            <SpotlightGrid
              projects={spotlight}
              onProjectUpdate={updateProject}
              onReorder={reorderSpotlight}
              onToggleExpand={toggleExpand}
              expandedCardId={expandedCardId}
              onDemote={demoteToRoster}
              onPin={pinProject}
              onDelete={deleteProject}
            />
          </div>

          {/* Roster */}
          {roster.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-mma-dark-blue">
                Roster
                <span className="ml-2 rounded-full bg-mma-orange/10 px-2 py-0.5 text-xs text-mma-orange">{roster.length}</span>
              </h2>
              <RosterList
                projects={roster}
                onProjectUpdate={updateProject}
                onPromote={promoteToSpotlight}
                onToggleExpand={toggleExpand}
                expandedCardId={expandedCardId}
                onPin={pinProject}
                onDelete={deleteProject}
              />
            </div>
          )}

          {/* Archive */}
          {archive.length > 0 && (
            <Archive
              projects={archive}
              onProjectUpdate={updateProject}
              onToggleExpand={toggleExpand}
              expandedCardId={expandedCardId}
            />
          )}
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
        active ? 'bg-white text-mma-dark-blue shadow-sm' : 'text-mma-blue-gray hover:text-mma-dark-blue'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
