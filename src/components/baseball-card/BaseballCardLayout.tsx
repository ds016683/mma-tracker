import { useState, useRef } from 'react';
import { Plus, Download, Upload, LayoutGrid, DollarSign, Layers, GanttChart } from 'lucide-react';
import mmaLogo from '../../assets/mma-logo.png';
import thsLogo from '../../assets/ths-logo.png';
import { useProjects } from '../../contexts/ProjectsContext';
import { Archive } from './Archive';
import { CategorizedBoardView } from './CategorizedBoardView';
import { CreateProjectForm } from './CreateProjectForm';
import { BudgetView } from './BudgetView';
import { GanttView } from '../gantt/GanttView';
import {
  SCHEDULE_E_ITEMS, SCHEDULE_F_ITEMS,
  SCHEDULE_E_POOL_START, SCHEDULE_E_TOTAL_ALLOCATED,
  SCHEDULE_F_POOL_START, SCHEDULE_F_TOTAL_ALLOCATED,
} from '../../lib/baseball-card/seed-data';

export type BoardView = 'board' | 'gantt' | 'schedule-e' | 'schedule-f';

interface BaseballCardLayoutProps {
  onSwitchToGantt?: () => void;
  forceView?: BoardView;
}

export function BaseballCardLayout({ onSwitchToGantt, forceView }: BaseballCardLayoutProps) {
  const {
    projects, archive,
    loading, error: dataError,
    createProject, updateProject, deleteProject,
    pinProject,
    exportToJson, importFromJson,
  } = useProjects();

  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [localView, setLocalView] = useState<BoardView>('board');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine effective view without TypeScript narrowing the type away
  const activeView: BoardView = forceView ?? localView;

  // Pre-compute these to avoid TS narrowing issues inside conditional render
  const isGantt = activeView === 'gantt';
  const isBoard = activeView === 'board';
  const isScheduleE = activeView === 'schedule-e';
  const isScheduleF = activeView === 'schedule-f';

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
      {/* Gantt view */}
      {isGantt && (
        <GanttView />
      )}

      {/* Board / Schedule views */}
      {!isGantt && (
        <>
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
                title="Import from JSON"
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
                title="Export to JSON"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="rounded-md bg-mma-dark-blue px-3 py-1.5 text-sm text-white hover:bg-mma-blue transition-colors"
              >
                <Plus className="h-4 w-4 inline -mt-0.5 mr-1" />
                New Card
              </button>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="flex gap-1 rounded-lg bg-mma-dark-blue/5 p-1">
            <NavTab
              active={isBoard}
              onClick={() => setLocalView('board')}
              icon={<LayoutGrid className="h-4 w-4" />}
              label="Task Board"
            />
            <NavTab
              active={isGantt}
              onClick={() => { setLocalView('gantt'); onSwitchToGantt?.(); }}
              icon={<GanttChart className="h-4 w-4" />}
              label="Gantt"
            />
            <NavTab
              active={isScheduleE}
              onClick={() => setLocalView('schedule-e')}
              icon={<DollarSign className="h-4 w-4" />}
              label="Schedule E"
            />
            <NavTab
              active={isScheduleF}
              onClick={() => setLocalView('schedule-f')}
              icon={<Layers className="h-4 w-4" />}
              label="Schedule F"
            />
          </nav>

          {isScheduleE && (
            <BudgetView
              title="Schedule E - Data Enhancements"
              subtitle="EWO budget tracking and monthly allocation burn"
              items={SCHEDULE_E_ITEMS}
              totalAllocated={SCHEDULE_E_TOTAL_ALLOCATED}
              poolStart={SCHEDULE_E_POOL_START}
              accentHex="#8246AF"
            />
          )}

          {isScheduleF && (
            <BudgetView
              title="Schedule F - Data Innovation"
              subtitle="IWO budget tracking and monthly allocation burn"
              items={SCHEDULE_F_ITEMS}
              totalAllocated={SCHEDULE_F_TOTAL_ALLOCATED}
              poolStart={SCHEDULE_F_POOL_START}
              accentHex="#00968F"
            />
          )}

          {isBoard && (
            <>
              {showCreateForm && (
                <CreateProjectForm
                  onCreate={(fields) => { createProject(fields); setShowCreateForm(false); }}
                  onCancel={() => setShowCreateForm(false)}
                />
              )}

              <CategorizedBoardView
                projects={projects}
                onProjectUpdate={updateProject}
                onToggleExpand={toggleExpand}
                expandedCardId={expandedCardId}
                onPin={pinProject}
                onDelete={deleteProject}
              />

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
