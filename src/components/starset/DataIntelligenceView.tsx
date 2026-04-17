import { useState } from 'react';
import { WaterTreatmentView } from './WaterTreatmentView';
import { AnalyticTestsView } from './AnalyticTestsView';

type DITab = 'pipeline' | 'tests';

const TABS: { id: DITab; label: string; description: string }[] = [
  { id: 'pipeline', label: 'Data Pipeline',  description: 'How raw MRF data becomes trusted intelligence' },
  { id: 'tests',    label: 'Analytic Tests', description: 'Four tests your price transparency data should pass' },
];

export function DataIntelligenceView() {
  const [activeTab, setActiveTab] = useState<DITab>('pipeline');

  return (
    <div className="flex h-screen flex-col bg-mma-light-bg">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-[#001A41]">Network Navigator Deployment</h1>
        <p className="text-sm text-gray-500">
          Data pipeline, analytic validation, and reporting intelligence for MMA Network Navigator.
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white px-6">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-[#009DE0] text-[#001A41]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'pipeline' && <WaterTreatmentView />}
        {activeTab === 'tests' && <AnalyticTestsView />}

      </div>
    </div>
  );
}
