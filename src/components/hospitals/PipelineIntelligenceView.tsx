import { useState } from 'react';
import { GitBranch, BarChart2 } from 'lucide-react';
import { CoverageAnalyticsPanel } from './CoverageAnalyticsPanel';
import { BillingCodeTracePanel } from './BillingCodeTracePanel';

type Mode = 'coverage' | 'trace';

export function PipelineIntelligenceView() {
  const [mode, setMode] = useState<Mode>('coverage');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pipeline Intelligence</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              MRF → PP.0 → Network Classification → MMA Transfer · Hospital provider lineage
            </p>
          </div>
          {/* Mode switcher */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <button
              onClick={() => setMode('coverage')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${mode === 'coverage' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <BarChart2 size={15} />
              Coverage Analytics
            </button>
            <button
              onClick={() => setMode('trace')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${mode === 'trace' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <GitBranch size={15} />
              Billing Code Trace
            </button>
          </div>
        </div>

        {/* Mode description */}
        <div className="mt-2 text-xs text-gray-400">
          {mode === 'coverage'
            ? 'Geographic breadth and descriptive statistics across the price transparency pipeline by payer and provider.'
            : 'Trace a specific billing code + NPI + network through each pipeline stage from MRF source to MMA transfer output.'}
        </div>
      </div>

      {mode === 'coverage' ? <CoverageAnalyticsPanel /> : <BillingCodeTracePanel />}
    </div>
  );
}
