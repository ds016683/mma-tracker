import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import tab1Data from './tab1-data.json';

type TabId = 'mma' | 'v10';

interface NetworkEntry {
  name: string;
  planId: string;
  networkType: string;
  lastUpdated: string;
  version: string;
  isMMA?: boolean;
  states?: string[];
  color?: string;
  networkGroup?: string;
}

interface CarrierGroup {
  name: string;
  networks: NetworkEntry[];
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'mma',  label: 'MMA Networks Through Production' },
  { id: 'v10',  label: 'Networks for future Starset Versions' },
];

export function ProductionNetworksView() {
  const [activeTab, setActiveTab] = useState<TabId>('mma');

  return (
    <div className="flex h-screen flex-col bg-mma-light-bg">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-[#001A41]">Production Networks</h1>
        <p className="text-sm text-gray-500">Starset Analytics network coverage across all production versions.</p>
      </div>
      <div className="border-b border-gray-200 bg-white px-6">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'border-[#009DE0] text-[#001A41]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'mma'  && <Tab1MMANetworks />}
        {activeTab === 'v10'  && <EmptyTab label="Networks for future Starset Versions" />}
      </div>
    </div>
  );
}

function Tab1MMANetworks() {
  const carriers = tab1Data as CarrierGroup[];
  const totalNetworks = carriers.reduce((s, c) => s + c.networks.length, 0);
  return (
    <div className="max-w-5xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-full bg-[#001A41] px-3 py-1 text-xs font-semibold text-white">{carriers.length} carriers</span>
        <span className="rounded-full bg-[#009DE0]/10 px-3 py-1 text-xs font-semibold text-[#009DE0]">{totalNetworks} networks</span>
        <span className="text-xs text-gray-400">v9 production (Jun 2026)</span>
      </div>
      <div className="space-y-2">
        {carriers.map((carrier) => <CarrierCard key={carrier.name} carrier={carrier} showMMABadge={false} />)}
      </div>
    </div>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-200">
      <div className="text-center">
        <p className="text-sm font-medium text-gray-400">{label}</p>
        <p className="mt-1 text-xs text-gray-300">Coming soon</p>
      </div>
    </div>
  );
}

function CarrierCard({ carrier, showMMABadge }: { carrier: CarrierGroup & { networks: NetworkEntry[] }; showMMABadge: boolean }) {
  const [open, setOpen] = useState(false);
  const mmaNetworks = carrier.networks.filter(n => n.isMMA);
  const isAllMMA = showMMABadge && mmaNetworks.length === carrier.networks.length && mmaNetworks.length > 0;
  const isSomeMMA = showMMABadge && mmaNetworks.length > 0 && !isAllMMA;
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50">
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" /> : <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />}
          <span className="font-semibold text-[#001A41]">
            {carrier.name}
            {showMMABadge && isAllMMA && <span className="ml-1 text-[#009DE0]">*</span>}
          </span>
          {showMMABadge && isSomeMMA && (
            <span className="rounded bg-[#009DE0]/10 px-1.5 py-0.5 text-xs text-[#009DE0]">{mmaNetworks.length} MMA*</span>
          )}
        </div>
        <span className="text-xs text-gray-400">{carrier.networks.length} network{carrier.networks.length !== 1 ? 's' : ''}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100">
          <div className="grid grid-cols-12 gap-2 border-b border-gray-50 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <div className="col-span-3">Network Name</div>
            <div className="col-span-3">Plan ID</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Last Updated</div>
            <div className="col-span-1">Version</div>
            <div className="col-span-1">States</div>
          </div>
          {carrier.networks.map((network) => (
            <div key={network.name} className="grid grid-cols-12 gap-2 border-b border-gray-50 px-4 py-2.5 text-sm last:border-0 bg-white">
              <div className="col-span-3 flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 font-medium text-gray-800">
                  {showMMABadge && network.isMMA && <span className="font-bold text-[#009DE0]">*</span>}
                  {network.name}
                </span>
                {network.networkGroup && (
                  <span className={`w-fit rounded px-1.5 py-0.5 text-xs font-medium ${
                    network.networkGroup === 'Core' ? 'bg-blue-50 text-blue-600' :
                    network.networkGroup === 'Regional' ? 'bg-purple-50 text-purple-600' :
                    network.networkGroup === 'Supplemental' ? 'bg-teal-50 text-teal-600' : 'bg-gray-100 text-gray-500'
                  }`}>{network.networkGroup}</span>
                )}
              </div>
              <div className="col-span-3 font-mono text-xs text-gray-500 self-center">{network.planId || <span className="text-gray-300">—</span>}</div>
              <div className="col-span-2 self-center">
                {network.networkType ? <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{network.networkType}</span> : <span className="text-gray-300 text-xs">—</span>}
              </div>
              <div className="col-span-2 self-center text-xs text-gray-500">{network.lastUpdated || <span className="text-gray-300">—</span>}</div>
              <div className="col-span-1 self-center text-xs text-gray-400">{network.version || <span className="text-gray-300">—</span>}</div>
              <div className="col-span-1 self-center text-xs text-gray-500">
                {network.states && network.states.length > 0 ? network.states.join(', ') : <span className="text-gray-300">—</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

