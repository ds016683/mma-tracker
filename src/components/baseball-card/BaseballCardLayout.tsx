import { useState } from 'react';
import { DollarSign, Layers, FileText } from 'lucide-react';
import mmaLogo from '../../assets/mma-logo.png';
import thsLogo from '../../assets/ths-logo.png';
import { BudgetView } from './BudgetView';
import { WorkOrdersView } from './WorkOrdersView';
import {
  SCHEDULE_E_ITEMS, SCHEDULE_F_ITEMS,
  SCHEDULE_E_POOL_START, SCHEDULE_E_TOTAL_ALLOCATED,
  SCHEDULE_F_POOL_START, SCHEDULE_F_TOTAL_ALLOCATED,
} from '../../lib/baseball-card/seed-data';

export type BoardView = 'work-orders' | 'schedule-e' | 'schedule-f';

interface BaseballCardLayoutProps {
  onSwitchToGantt?: () => void;
  forceView?: BoardView;
}

export function BaseballCardLayout({ forceView }: BaseballCardLayoutProps) {
  const [localView, setLocalView] = useState<BoardView>('work-orders');

  const activeView: BoardView = forceView ?? localView;

  const isWorkOrders = activeView === 'work-orders';
  const isScheduleE  = activeView === 'schedule-e';
  const isScheduleF  = activeView === 'schedule-f';

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
          <h1 className="text-xl font-bold text-mma-dark-blue">Work Order Tracker</h1>
          <p className="text-sm text-mma-blue-gray">Schedule E & F — Active Engagement</p>
        </div>
        {/* spacer to keep header balanced */}
        <div className="w-32" />
      </div>

      {/* Nav tabs */}
      <nav className="flex gap-1 rounded-lg bg-mma-dark-blue/5 p-1">
        <NavTab
          active={isWorkOrders}
          onClick={() => setLocalView('work-orders')}
          icon={<FileText className="h-4 w-4" />}
          label="Work Orders"
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

      {isWorkOrders && <WorkOrdersView />}

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
