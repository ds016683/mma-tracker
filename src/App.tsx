// trigger: monday-api-key-baked
import { lazy, Suspense, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectsProvider, useProjects } from './contexts/ProjectsContext';
import { AuthPage } from './components/auth/AuthPage';
import { RequestAccountPage } from './components/auth/RequestAccountPage';
import { ApproveRequestPage } from './components/auth/ApproveRequestPage';
import { AcceptInvitationPage } from './components/auth/AcceptInvitationPage';
import { BaseballCardLayout } from './components/baseball-card/BaseballCardLayout';
import { AppDrawer } from './components/navigation/AppDrawer';
import type { AppView } from './components/navigation/AppDrawer';
import { HaikuAssistant } from './components/ai/HaikuAssistant';
import { ROLE_ACCESS } from './lib/roles';
import { supabaseMisconfigured } from './lib/supabase/client';

// Lazy-load all views
const DataIntelligenceView       = lazy(() => import('./components/starset/DataIntelligenceView').then(m => ({ default: m.DataIntelligenceView })));
const ReportingQueriesView       = lazy(() => import('./components/starset/ReportingQueriesView').then(m => ({ default: m.ReportingQueriesView })));
const RegionalMapView            = lazy(() => import('./components/starset/RegionalMapView').then(m => ({ default: m.RegionalMapView })));
const ProductionNetworksView     = lazy(() => import('./components/starset/ProductionNetworksView').then(m => ({ default: m.ProductionNetworksView })));
const ProductionRunSummariesView = lazy(() => import('./components/starset/ProductionRunSummariesView').then(m => ({ default: m.ProductionRunSummariesView })));
const TierShiftSummaryView       = lazy(() => import('./components/starset/TierShiftSummaryView').then(m => ({ default: m.TierShiftSummaryView })));
const MSACarrierCoverageView     = lazy(() => import('./components/starset/MSACarrierCoverageView').then(m => ({ default: m.MSACarrierCoverageView })));
const CarrierRankingView         = lazy(() => import('./components/starset/CarrierRankingView').then(m => ({ default: m.CarrierRankingView })));

const ProjectPlanView            = lazy(() => import('./components/project-plan/ProjectPlanView').then(m => ({ default: m.ProjectPlanView })));
const GanttView                  = lazy(() => import('./components/gantt/GanttView').then(m => ({ default: m.GanttView })));
const PromiseHealthPlanView      = lazy(() => import('./components/promise/PromiseHealthPlanView').then(m => ({ default: m.PromiseHealthPlanView })));
const HospitalCoverageView       = lazy(() => import('./components/hospitals/HospitalCoverageView').then(m => ({ default: m.HospitalCoverageView })));
const PipelineIntelligenceView   = lazy(() => import('./components/hospitals/PipelineIntelligenceView').then(m => ({ default: m.PipelineIntelligenceView })));
const HospitalMrfPipelineView    = lazy(() => import('./components/hospitals/HospitalMrfPipelineView').then(m => ({ default: m.HospitalMrfPipelineView })));
const CallNotesView              = lazy(() => import('./components/call-notes/CallNotesView').then(m => ({ default: m.CallNotesView })));
const ReportsAndReleaseNotesView = lazy(() => import('./components/reports/ReportsAndReleaseNotesView').then(m => ({ default: m.ReportsAndReleaseNotesView })));
const HorizonSignalView          = lazy(() => import('./components/horizon-signal/HorizonSignalView').then(m => ({ default: m.HorizonSignalView })));
const CoverageMap                = lazy(() => import('./components/region/CoverageMap').then(m => ({ default: m.CoverageMap })));
const UserManagementView              = lazy(() => import('./components/admin/UserManagementView').then(m => ({ default: m.UserManagementView })));
const DataGapReportView               = lazy(() => import('./components/region/DataGapReportView').then(m => ({ default: m.DataGapReportView })));
const RequestedDataAdditionsView      = lazy(() => import('./components/region/RequestedDataAdditionsView').then(m => ({ default: m.RequestedDataAdditionsView })));

const ViewLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-sm text-mma-blue-gray">Loading…</div>
  </div>
);

// Region-only views — the only section mma_regional can access
const REGION_VIEWS: AppView[] = ['horizon-signal', 'reporting-queries', 'coverage-map', 'hospital-mrf-pipeline', 'payer-networks', 'data-gap-report'];

function getDefaultView(role: string | null): AppView {
  if (role === 'mma_regional') return 'coverage-map';
  return (localStorage.getItem('mma-active-view') as AppView) ?? 'tracker';
}

// Detect special pages from URL hash/search
function getSpecialPage(): 'approve-request' | 'accept-invitation' | 'request-account' | null {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
  const page = search.get('page') ?? hash.get('page') ?? '';
  const combined = window.location.href;
  if (page === 'approve-request' || combined.includes('approve-request')) return 'approve-request';
  if (page === 'accept-invitation' || combined.includes('accept-invitation')) return 'accept-invitation';
  if (page === 'request-account' || combined.includes('request-account')) return 'request-account';
  return null;
}

function AppContent() {
  const { user, role, loading } = useAuth();
  const specialPage = getSpecialPage();

  const [activeView, setActiveViewRaw] = useState<AppView>(() => getDefaultView(null));

  useEffect(() => {
    if (role) {
      const access = ROLE_ACCESS[role];
      if (access === 'region_only' && !REGION_VIEWS.includes(activeView)) {
        setActiveViewRaw('coverage-map');
      }
    }
  }, [role]);

  const setActiveView = (view: AppView) => {
    // Guard: mma_regional can only access region views
    if (role === 'mma_regional' && !REGION_VIEWS.includes(view)) return;
    setActiveViewRaw(view);
    localStorage.setItem('mma-active-view', view);
  };

  // Special pages are accessible without auth (approve/accept flows)
  if (specialPage === 'approve-request') return <ApproveRequestPage />;
  if (specialPage === 'accept-invitation') return <AcceptInvitationPage />;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mma-light-bg">
        <div className="text-sm text-mma-blue-gray">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (specialPage === 'request-account') return <RequestAccountPage />;
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
  const { role } = useAuth();

  const isRegionOnly = role === 'mma_regional';

  return (
    <div className="flex min-h-screen bg-mma-light-bg">
      <AppDrawer activeView={activeView} onViewChange={setActiveView} />
      <main className="min-h-screen flex-1 transition-[margin] duration-300">
        <Suspense fallback={<ViewLoader />}>
          {/* Full-access views — hidden from mma_regional */}
          {!isRegionOnly && (
            <>
              {activeView === 'tracker' && (
                <div className="p-4 sm:p-6"><BaseballCardLayout /></div>
              )}
              {activeView === 'project-plan' && <ProjectPlanView />}
              {activeView === 'timeline' && (
                <div className="p-4 sm:p-6"><GanttView /></div>
              )}
              {activeView === 'data-intelligence' && <DataIntelligenceView />}
              {activeView === 'production-run-summaries' && <ProductionRunSummariesView />}
              {activeView === 'tier-shift-summary' && <TierShiftSummaryView />}
              {activeView === 'msa-carrier-coverage' && <MSACarrierCoverageView />}
              {activeView === 'carrier-ranking' && <CarrierRankingView />}
              {activeView === 'hospital-coverage' && <HospitalCoverageView />}
              {activeView === 'hospital-mrf-pipeline' && <HospitalMrfPipelineView />}
              {activeView === 'pipeline-intelligence' && <PipelineIntelligenceView />}
              {activeView === 'payer-networks' && <ProductionNetworksView />}
              {activeView === 'call-notes' && <CallNotesView />}
              {activeView === 'reports-release-notes' && <ReportsAndReleaseNotesView />}
              {activeView === 'promise-health-plan' && <PromiseHealthPlanView />}
              {activeView === 'user-management' && <UserManagementView />}
              {activeView === 'requested-data-additions' && <RequestedDataAdditionsView />}
            </>
          )}

          {/* Region Engagement — accessible to all roles */}
          {activeView === 'reporting-queries' && <ReportingQueriesView />}
          {activeView === 'regional-map' && <RegionalMapView />}
          {activeView === 'coverage-map' && <CoverageMap />}
          {activeView === 'horizon-signal' && <HorizonSignalView />}
          {activeView === 'data-gap-report' && <DataGapReportView />}

          {/* Fallback for mma_regional landing on wrong view */}
          {isRegionOnly && !REGION_VIEWS.includes(activeView) && (
            <div className="flex min-h-screen items-center justify-center">
              <p className="text-sm text-mma-blue-gray">Redirecting…</p>
            </div>
          )}
        </Suspense>
      </main>
      <HaikuAssistant projects={projects} />
    </div>
  );
}

export default function App() {
  if (supabaseMisconfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1a26] px-4">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center max-w-sm">
          <p className="text-sm font-semibold text-red-400">Configuration Error</p>
          <p className="mt-2 text-xs text-white/50">Supabase environment variables are missing. Please contact your administrator.</p>
        </div>
      </div>
    );
  }
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
