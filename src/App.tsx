// trigger: monday-api-key-baked
import { lazy, Suspense, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectsProvider, useProjects } from './contexts/ProjectsContext';
import { AuthPage } from './components/auth/AuthPage';
import { BaseballCardLayout } from './components/baseball-card/BaseballCardLayout';
import { AppDrawer } from './components/navigation/AppDrawer';
import type { AppView } from './components/navigation/AppDrawer';
import { HaikuAssistant } from './components/ai/HaikuAssistant';

// Lazy-load all views — keeps main bundle small, each view loads on first visit only
const DataIntelligenceView     = lazy(() => import('./components/starset/DataIntelligenceView').then(m => ({ default: m.DataIntelligenceView })));
const ReportingQueriesView     = lazy(() => import('./components/starset/ReportingQueriesView').then(m => ({ default: m.ReportingQueriesView })));
const RegionalMapView          = lazy(() => import('./components/starset/RegionalMapView').then(m => ({ default: m.RegionalMapView })));
const ProductionNetworksView   = lazy(() => import('./components/starset/ProductionNetworksView').then(m => ({ default: m.ProductionNetworksView })));
const ProductionRunSummariesView = lazy(() => import('./components/starset/ProductionRunSummariesView').then(m => ({ default: m.ProductionRunSummariesView })));
const TierShiftSummaryView     = lazy(() => import('./components/starset/TierShiftSummaryView').then(m => ({ default: m.TierShiftSummaryView })));
const MSACarrierCoverageView   = lazy(() => import('./components/starset/MSACarrierCoverageView').then(m => ({ default: m.MSACarrierCoverageView })));
const CarrierRankingView       = lazy(() => import('./components/starset/CarrierRankingView').then(m => ({ default: m.CarrierRankingView })));
const CoreBucaCarrierRankingView = lazy(() => import('./components/starset/CoreBucaCarrierRankingView').then(m => ({ default: m.CoreBucaCarrierRankingView })));
const ProjectPlanView          = lazy(() => import('./components/project-plan/ProjectPlanView').then(m => ({ default: m.ProjectPlanView })));
const GanttView                = lazy(() => import('./components/gantt/GanttView').then(m => ({ default: m.GanttView })));
const PromiseHealthPlanView    = lazy(() => import('./components/promise/PromiseHealthPlanView').then(m => ({ default: m.PromiseHealthPlanView })));
const HospitalCoverageView     = lazy(() => import('./components/hospitals/HospitalCoverageView').then(m => ({ default: m.HospitalCoverageView })));
const PipelineIntelligenceView = lazy(() => import('./components/hospitals/PipelineIntelligenceView').then(m => ({ default: m.PipelineIntelligenceView })));
const HospitalMrfPipelineView  = lazy(() => import('./components/hospitals/HospitalMrfPipelineView').then(m => ({ default: m.HospitalMrfPipelineView })));
const CallNotesView            = lazy(() => import('./components/call-notes/CallNotesView').then(m => ({ default: m.CallNotesView })));
const ReportsAndReleaseNotesView = lazy(() => import('./components/reports/ReportsAndReleaseNotesView').then(m => ({ default: m.ReportsAndReleaseNotesView })));
const HorizonSignalView        = lazy(() => import('./components/horizon-signal/HorizonSignalView').then(m => ({ default: m.HorizonSignalView })));
const CoverageMap              = lazy(() => import('./components/region/CoverageMap').then(m => ({ default: m.CoverageMap })));

const ViewLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-sm text-mma-blue-gray">Loading…</div>
  </div>
);

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
        <Suspense fallback={<ViewLoader />}>
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
          {activeView === 'coverage-map' && <CoverageMap />}
          {activeView === 'payer-networks' && <ProductionNetworksView />}
          {activeView === 'hospital-mrf-pipeline' && <HospitalMrfPipelineView />}
          {activeView === 'hospital-coverage' && <HospitalCoverageView />}
          {activeView === 'pipeline-intelligence' && <PipelineIntelligenceView />}
          {activeView === 'promise-health-plan' && <PromiseHealthPlanView />}
          {activeView === 'call-notes' && <CallNotesView />}
          {activeView === 'reports-release-notes' && <ReportsAndReleaseNotesView />}
          {activeView === 'horizon-signal' && <HorizonSignalView />}
          {activeView === 'production-run-summaries' && <ProductionRunSummariesView />}
          {activeView === 'tier-shift-summary' && <TierShiftSummaryView />}
          {activeView === 'msa-carrier-coverage' && <MSACarrierCoverageView />}
          {activeView === 'carrier-ranking' && <CarrierRankingView />}
          {activeView === 'core-buca-carrier-ranking' && <CoreBucaCarrierRankingView />}
        </Suspense>
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
