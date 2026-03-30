import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { BaseballCardLayout } from './components/baseball-card/BaseballCardLayout';
import { AppDrawer } from './components/navigation/AppDrawer';
import type { AppView } from './components/navigation/AppDrawer';
import { WaterTreatmentView } from './components/starset/WaterTreatmentView';
import { AnalyticTestsView } from './components/starset/AnalyticTestsView';
import { ReportingQueriesView } from './components/starset/ReportingQueriesView';

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
    <div className="flex min-h-screen bg-mma-light-bg">
      <AppDrawer activeView={activeView} onViewChange={setActiveView} />
      <main className="min-h-screen flex-1 transition-[margin] duration-300">
        {activeView === 'tracker' && (
          <div className="p-4 sm:p-6">
            <BaseballCardLayout />
          </div>
        )}
        {activeView === 'treatment' && <WaterTreatmentView />}
        {activeView === 'analytic-tests' && <AnalyticTestsView />}
        {activeView === 'reporting-queries' && <ReportingQueriesView />}
      </main>
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
