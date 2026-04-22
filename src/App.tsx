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

// Placeholder for views coming soon
function PlaceholderView({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex h-screen flex-col bg-mma-light-bg">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-[#001A41]">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-1 text-xs text-gray-300">Jira / Monday.com wiring coming soon</p>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<AppView>('tracker');

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
            <BaseballCardLayout
              onSwitchToGantt={() => setActiveView('timeline')}
              onSwitchToBoard={() => setActiveView('tracker')}
            />
          </div>
        )}
        {activeView === 'project-plan' && (
          <PlaceholderView title="Project Plan" subtitle="Jira / Monday.com integration coming soon" />
        )}
        {activeView === 'timeline' && (
          <div className="p-4 sm:p-6">
            <BaseballCardLayout
              onSwitchToGantt={() => setActiveView('timeline')}
              onSwitchToBoard={() => setActiveView('tracker')}
              forceView="gantt"
            />
          </div>
        )}
        {activeView === 'data-intelligence' && <DataIntelligenceView />}
        {activeView === 'reporting-queries' && <ReportingQueriesView />}
        {activeView === 'regional-map' && <RegionalMapView />}
        {activeView === 'production-networks' && <ProductionNetworksView />}
        {activeView === 'production-progress' && (
          <PlaceholderView title="Production Progress" subtitle="Monday.com integration coming soon" />
        )}
        {activeView === 'promise-health-plan' && (
          <PlaceholderView title="1. Promise Health Plan — Rate Analysis" subtitle="Joint project workspace coming soon" />
        )}
        {activeView === 'call-notes' && (
          <PlaceholderView title="Call Notes" subtitle="Granola integration wired — sync coming soon" />
        )}
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
