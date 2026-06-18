import { X, GitBranch } from 'lucide-react';
import type { HospitalRow } from './HospitalPinLayer';
import { TIER_COLOR, TIER_LABEL } from './HospitalPinLayer';

const BUCA = ['Aetna', 'BCBS', 'Cigna', 'UHC'];

interface Props {
  hospital: HospitalRow | null;
  onClose: () => void;
  onTrace: (npi: string, name: string) => void;  // jump to Billing Code Trace with NPI pre-filled
}

export function HospitalSidePanel({ hospital, onClose, onTrace }: Props) {
  const visible = hospital !== null;

  return (
    <>
      {/* Backdrop */}
      {visible && (
        <div
          className="fixed inset-0 z-30"
          style={{ background: 'transparent' }}
          onClick={onClose}
        />
      )}

      {/* Slide-in panel */}
      <div
        className="fixed top-0 right-0 h-full z-40 flex flex-col bg-white shadow-2xl"
        style={{
          width: 340,
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          borderLeft: '1px solid #e5e7eb',
        }}
      >
        {hospital && (() => {
          const [npi, name, state,,, tier, net, mrf, beds, util, type] = hospital;
          const tierColor = TIER_COLOR[tier];
          const networks = BUCA.slice(0, net);
          const missing = BUCA.slice(net);

          return (
            <>
              {/* Header */}
              <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${tierColor}20`, color: tierColor }}
                    >
                      {TIER_LABEL[tier]}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">{name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{state}{type ? ` · ${type}` : ''}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 mt-0.5">
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                {/* Key specs */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Facility</div>
                  <div className="space-y-1.5 text-sm">
                    {[
                      ['NPI', String(npi)],
                      ['State', state],
                      ['Type', type || '—'],
                      ['Beds', beds > 0 ? String(beds) : '—'],
                      ['Utilization', util > 0 ? `${util.toLocaleString()} claims` : '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MRF status */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">MRF Processing</div>
                  <div className={`flex items-center gap-2 text-sm font-medium ${mrf ? 'text-green-700' : 'text-gray-400'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${mrf ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {mrf ? 'Active in v8 MRF pipeline' : 'Not in v8 MRF pipeline'}
                  </div>
                </div>

                {/* Network coverage */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Network Coverage — {net}/4
                  </div>
                  {/* Coverage bar */}
                  <div className="w-full h-2 bg-gray-100 rounded-full mb-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(net / 4) * 100}%`, background: tierColor }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    {BUCA.map(n => {
                      const present = networks.includes(n);
                      return (
                        <div key={n} className="flex items-center gap-2 text-sm">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${present ? 'bg-green-500' : 'bg-gray-200'}`} />
                          <span className={present ? 'text-gray-800' : 'text-gray-400'}>{n}</span>
                          {present && <span className="text-xs text-green-600 ml-auto">✓ in network</span>}
                          {!present && <span className="text-xs text-gray-300 ml-auto">not covered</span>}
                        </div>
                      );
                    })}
                  </div>
                  {missing.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Missing: {missing.join(', ')}
                    </p>
                  )}
                </div>

              </div>

              {/* Footer — Trace CTA */}
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => onTrace(String(npi), name)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <GitBranch size={15} />
                  Trace billing codes for this hospital
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Opens Billing Code Trace with NPI {npi} pre-filled
                </p>
              </div>
            </>
          );
        })()}
      </div>
    </>
  );
}
