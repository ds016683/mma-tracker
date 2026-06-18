import { useState } from 'react';
import { GitBranch, BarChart2 } from 'lucide-react';
import { CoverageAnalyticsPanel } from './CoverageAnalyticsPanel';
import { BillingCodeTracePanel } from './BillingCodeTracePanel';

type Mode = 'coverage' | 'trace';

export function PipelineIntelligenceView() {
  const [mode, setMode] = useState<Mode>('coverage');
  const [traceNpi, setTraceNpi] = useState<string>('');
  const [traceName, setTraceName] = useState<string>('');

  function handleTraceHospital(npi: string, name: string) {
    setTraceNpi(npi);
    setTraceName(name);
    setMode('trace');
  }

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

          {/* Mode switcher — prominent tab-style */}
          <div className="flex rounded-xl border-2 border-blue-200 overflow-hidden shadow-sm bg-white">
            <button
              onClick={() => setMode('coverage')}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all ${
                mode === 'coverage'
                  ? 'bg-blue-600 text-white shadow-inner'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <BarChart2 size={15} />
              Coverage Analytics
            </button>
            <div className="w-px bg-blue-200" />
            <button
              onClick={() => setMode('trace')}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all ${
                mode === 'trace'
                  ? 'bg-blue-600 text-white shadow-inner'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <GitBranch size={15} />
              Billing Code Trace
            </button>
          </div>
        </div>

        {/* Mode pill description */}
        <div className="mt-2">
          <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
            mode === 'coverage'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-indigo-50 text-indigo-700'
          }`}>
            {mode === 'coverage'
              ? '📊 Geographic coverage breadth and descriptive stats across the pipeline'
              : '🔍 Trace a specific billing code + provider through each pipeline stage'}
          </span>
        </div>
      </div>

      {mode === 'coverage'
        ? <CoverageAnalyticsPanel onTraceHospital={handleTraceHospital} />
        : <BillingCodeTracePanel initialNpi={traceNpi} initialName={traceName} onNpiUsed={() => { setTraceNpi(''); setTraceName(''); }} />
      }
    </div>
  );
}
