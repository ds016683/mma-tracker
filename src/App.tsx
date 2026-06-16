// trigger: monday-api-key-baked
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectsProvider, useProjects } from './contexts/ProjectsContext';
import { AuthPage } from './components/auth/AuthPage';
import { BaseballCardLayout } from './components/baseball-card/BaseballCardLayout';
import { AppDrawer } from './components/navigation/AppDrawer';
import type { AppView } from './components/navigation/AppDrawer';
import { DataIntelligenceView } from './components/starset/DataIntelligenceView';
import { ReportingQueriesView } from './components/starset/ReportingQueriesView';
import { RegionalMapView } from './components/starset/RegionalMapView';
import { ProductionNetworksView } from './components/starset/ProductionNetworksView';
import { HaikuAssistant } from './components/ai/HaikuAssistant';
import { ProjectPlanView } from './components/project-plan/ProjectPlanView';
import { GanttView } from './components/gantt/GanttView';
import { PromiseHealthPlanView } from './components/promise/PromiseHealthPlanView';
import { HospitalCoverageView } from './components/hospitals/HospitalCoverageView';
import { ProductionProgressView } from './components/production/ProductionProgressView';
import { CallNotesView } from './components/call-notes/CallNotesView';
import { ReportsAndReleaseNotesView } from './components/reports/ReportsAndReleaseNotesView';
import { HorizonSignalView } from './components/horizon-signal/HorizonSignalView';
import { ProductionRunSummariesView } from './components/starset/ProductionRunSummariesView';
import { TierShiftSummaryView } from './components/starset/TierShiftSummaryView';
import { MSACarrierCoverageView } from './components/starset/MSACarrierCoverageView';
import { CarrierRankingView } from './components/starset/CarrierRankingView';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeView, setActiveViewRaw] = useState<AppView>(
    () => (localStorage.getItem('mma-active-view') as AppView) ?? 'tracker'
  );
  const setActiveView = (view: AppView) => {
    setActiveViewRaw(view);
    localStorage.setItem('mma-active-view', view);
  };;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mma-light-bg">
        <div className="text-sm text-mma-blue-gray">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <ProjectsProvider>
      <AppInner activeView={activeView} setActiveView={setActiveView} />
    </ProjectsProvider>
  );
}

function AppInner({
  activeView,
  setActiveView,
}: {
  activeView: AppView;
  setActiveView: (v: AppView) => void;
}) {
  const { projects } = useProjects();

  return (
    <div className="flex min-h-screen bg-mma-light-bg">
      <AppDrawer activeView={activeView} onViewChange={setActiveView} />
      <main className="min-h-screen flex-1 transition-[margin] duration-300">
        {activeView === 'tracker' && (
          <div className="p-4 sm:p-6">
            <BaseballCardLayout />
          </div>
        )}
        {activeView === 'project-plan' && <ProjectPlanView />}
        {activeView === 'timeline' && (
          <div className="p-4 sm:p-6">
            <GanttView />
          </div>
        )}
        {activeView === 'data-intelligence' && <DataIntelligenceView />}
        {activeView === 'reporting-queries' && <ReportingQueriesView />}
        {activeView === 'regional-map' && <RegionalMapView />}
        {activeView === 'payer-networks' && <ProductionNetworksView />}
        {activeView === 'hospital-mrf-pipeline' && <ProductionProgressView />}
        {activeView === 'hospital-coverage' && <HospitalCoverageView />}
        {activeView === 'promise-health-plan' && <PromiseHealthPlanView />}
        {activeView === 'call-notes' && <CallNotesView />}
        {activeView === 'reports-release-notes' && <ReportsAndReleaseNotesView />}
        {activeView === 'horizon-signal' && <HorizonSignalView />}
        {activeView === 'production-run-summaries' && <ProductionRunSummariesView />}
        {activeView === 'tier-shift-summary' && <TierShiftSummaryView />}
        {activeView === 'msa-carrier-coverage' && <MSACarrierCoverageView />}
        {activeView === 'carrier-ranking' && <CarrierRankingView />}
        {activeView === 'core-buca-carrier-ranking' && <CarrierRankingView />}
      </main>
      <HaikuAssistant projects={projects} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
