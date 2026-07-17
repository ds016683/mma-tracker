import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, X, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import tab1Data from './tab1-data.json';

type TabId = 'mma' | 'future';

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

// ─── Future Network Entry ──────────────────────────────────────────────────────

interface FutureNetwork {
  id: string;
  payer: string;
  planName: string;
  planId: string;
  networkType: string;
  states: string[];
  notes: string;
  mrfUrl: string;
  status: 'Pipeline' | 'Evaluating' | 'Pending MRF' | 'Ready';
  addedBy: string;
  addedDate: string;
}

const SEED_FUTURE_NETWORKS: FutureNetwork[] = [
  {
    id: 'seed-1',
    payer: 'BCBS',
    planName: 'BCBS Select Plans',
    planId: '',
    networkType: 'BCBS SELECT',
    states: [],
    notes: 'Select-tier BCBS plans across all states. Exact plan IDs and MRF sources TBD by state.',
    mrfUrl: '',
    status: 'Pipeline',
    addedBy: 'Tanner Johnson',
    addedDate: '2026-07-17',
  },
  {
    id: 'seed-2',
    payer: 'Geisinger Health Plan',
    planName: 'Geisinger Health Plan',
    planId: '',
    networkType: 'Provider-Sponsored',
    states: ['PA'],
    notes: 'Provider-sponsored plan based in central/northeast Pennsylvania. MRF currency and ingestion feasibility to be confirmed.',
    mrfUrl: '',
    status: 'Evaluating',
    addedBy: 'Tanner Johnson',
    addedDate: '2026-07-17',
  },
  {
    id: 'seed-3',
    payer: 'Cofinity',
    planName: 'Cofinity (Aetna Network)',
    planId: '',
    networkType: 'TPA / Rental Network',
    states: ['MI'],
    notes: 'TPA/rental network product serving Michigan employers. MRF sourced through Aetna. Ingestion path TBD.',
    mrfUrl: '',
    status: 'Pending MRF',
    addedBy: 'Tanner Johnson',
    addedDate: '2026-07-17',
  },
  {
    id: 'seed-4',
    payer: 'Aetna',
    planName: 'Aetna 2.0 MRF',
    planId: '',
    networkType: 'Aetna',
    states: [],
    notes: 'Next-generation Aetna MRF format. Evaluate for enhanced rate data and methodology improvements over current Aetna ingestion.',
    mrfUrl: '',
    status: 'Pipeline',
    addedBy: 'Tanner Johnson',
    addedDate: '2026-07-17',
  },
  {
    id: 'seed-5',
    payer: 'United Healthcare (UHC)',
    planName: 'United Healthcare Regional',
    planId: '',
    networkType: 'UHC',
    states: [],
    notes: 'UHC regional network variants across multiple states. Specific networks and state footprint to be defined with MMA.',
    mrfUrl: '',
    status: 'Pipeline',
    addedBy: 'Tanner Johnson',
    addedDate: '2026-07-17',
  },
];

const STATUS_META: Record<FutureNetwork['status'], { bg: string; text: string; dot: string }> = {
  Pipeline:     { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400'   },
  Evaluating:   { bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-400'  },
  'Pending MRF':{ bg: 'bg-orange-50',  text: 'text-orange-700', dot: 'bg-orange-400' },
  Ready:        { bg: 'bg-green-50',   text: 'text-green-700',  dot: 'bg-green-500'  },
};

const US_STATES = [
  'AK','AL','AR','AZ','CA','CO','CT','DC','DE','FL','GA','HI','IA','ID','IL','IN',
  'KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ',
  'NM','NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA',
  'WI','WV','WY',
];

const TABS: { id: TabId; label: string }[] = [
  { id: 'mma',    label: 'MMA Networks Through Production' },
  { id: 'future', label: 'Networks for future Starset Versions' },
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
        {activeTab === 'mma'    && <Tab1MMANetworks />}
        {activeTab === 'future' && <FutureNetworksTab />}
      </div>
    </div>
  );
}

// ─── Tab 1: MMA Networks Through Production ───────────────────────────────────

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

// ─── Tab 2: Future Networks ────────────────────────────────────────────────────

function FutureNetworksTab() {
  const [networks, setNetworks] = useState<FutureNetwork[]>(SEED_FUTURE_NETWORKS);
  const [showForm, setShowForm] = useState(false);

  const addNetwork = (n: FutureNetwork) => {
    setNetworks(prev => [n, ...prev]);
    setShowForm(false);
  };

  const removeNetwork = (id: string) => {
    setNetworks(prev => prev.filter(n => n.id !== id));
  };

  const statusCounts = Object.keys(STATUS_META).reduce((acc, s) => {
    acc[s] = networks.filter(n => n.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-5xl">
      {/* Header row */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#001A41] px-3 py-1 text-xs font-semibold text-white">{networks.length} networks</span>
          {Object.entries(statusCounts).map(([status, count]) =>
            count > 0 ? (
              <span key={status} className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_META[status as FutureNetwork['status']].bg} ${STATUS_META[status as FutureNetwork['status']].text}`}>
                {count} {status}
              </span>
            ) : null
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-[#001A41] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#002966]"
        >
          <Plus className="h-4 w-4" />
          Add Network
        </button>
      </div>

      {/* Info banner */}
      <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
        <p className="text-xs text-amber-700">
          These networks are candidates for future Starset versions. They are not yet in production. Status reflects current ingestion / MRF evaluation progress.
        </p>
      </div>

      {/* Network cards */}
      <div className="space-y-3">
        {networks.map(n => (
          <FutureNetworkCard key={n.id} network={n} onRemove={removeNetwork} />
        ))}
      </div>

      {/* Add Network modal */}
      {showForm && <AddNetworkModal onAdd={addNetwork} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function FutureNetworkCard({ network, onRemove }: { network: FutureNetwork; onRemove: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[network.status];

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" /> : <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />}
          <div>
            <span className="font-semibold text-[#001A41]">{network.planName}</span>
            <span className="ml-2 text-xs text-gray-400">{network.payer}</span>
          </div>
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.bg} ${meta.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {network.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {network.states.length > 0 ? network.states.join(', ') : 'All States'}
          {network.mrfUrl && <ExternalLink className="h-3.5 w-3.5 text-[#009DE0]" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/40">
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <div>
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Network Type</p>
              <p className="text-gray-700">{network.networkType || <span className="text-gray-300">—</span>}</p>
            </div>
            <div>
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Plan ID</p>
              <p className="font-mono text-xs text-gray-600">{network.planId || <span className="text-gray-300">—</span>}</p>
            </div>
            <div>
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">States</p>
              <p className="text-gray-700">{network.states.length > 0 ? network.states.join(', ') : 'All'}</p>
            </div>
            <div>
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Added By</p>
              <p className="text-gray-700">{network.addedBy}</p>
            </div>
            <div>
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Date Added</p>
              <p className="text-gray-700">{network.addedDate}</p>
            </div>
            {network.mrfUrl && (
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">MRF Link</p>
                <a
                  href={network.mrfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#009DE0] hover:underline truncate text-xs"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  {network.mrfUrl}
                </a>
              </div>
            )}
          </div>
          {network.notes && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Notes</p>
              <p className="text-sm text-gray-600 leading-relaxed">{network.notes}</p>
            </div>
          )}
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => onRemove(network.id)}
              className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Network Modal ────────────────────────────────────────────────────────

interface FormState {
  payer: string;
  planName: string;
  planId: string;
  networkType: string;
  states: string[];
  allStates: boolean;
  mrfUrl: string;
  status: FutureNetwork['status'];
  notes: string;
  addedBy: string;
}

const BLANK_FORM: FormState = {
  payer: '', planName: '', planId: '', networkType: '', states: [], allStates: false,
  mrfUrl: '', status: 'Pipeline', notes: '', addedBy: '',
};

const NETWORK_TYPES = [
  'Aetna', 'BCBS PPO', 'BCBS HPN', 'BCBS Home Plan', 'BCBS SELECT',
  'Cigna', 'UHC', 'Kaiser', 'Provider-Sponsored', 'TPA / Rental Network', 'Other',
];

function AddNetworkModal({ onAdd, onClose }: { onAdd: (n: FutureNetwork) => void; onClose: () => void }) {
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = (field: keyof FormState, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const toggleState = (s: string) => {
    setForm(prev => ({
      ...prev,
      states: prev.states.includes(s) ? prev.states.filter(x => x !== s) : [...prev.states, s].sort(),
    }));
  };

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.payer.trim())    e.payer    = 'Required';
    if (!form.planName.trim()) e.planName = 'Required';
    if (!form.addedBy.trim())  e.addedBy  = 'Required';
    if (form.mrfUrl && !/^https?:\/\/.+/.test(form.mrfUrl)) e.mrfUrl = 'Must be a valid URL (https://...)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onAdd({
      id: `user-${Date.now()}`,
      payer: form.payer.trim(),
      planName: form.planName.trim(),
      planId: form.planId.trim(),
      networkType: form.networkType.trim(),
      states: form.allStates ? [] : form.states,
      mrfUrl: form.mrfUrl.trim(),
      status: form.status,
      notes: form.notes.trim(),
      addedBy: form.addedBy.trim(),
      addedDate: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#001A41]">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#001A41]">Add Network to Pipeline</h2>
              <p className="text-xs text-gray-400">Future Starset version candidate</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form body */}
        <div className="px-6 py-5 space-y-5">
          {/* Row 1: Payer + Plan Name */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Payer / Carrier" required error={errors.payer}>
              <input
                type="text"
                placeholder="e.g. BCBS FL, Aetna, Cigna"
                value={form.payer}
                onChange={e => set('payer', e.target.value)}
                className={inputCls(!!errors.payer)}
              />
            </Field>
            <Field label="Plan Name" required error={errors.planName}>
              <input
                type="text"
                placeholder="e.g. Blue High Performance HPN"
                value={form.planName}
                onChange={e => set('planName', e.target.value)}
                className={inputCls(!!errors.planName)}
              />
            </Field>
          </div>

          {/* Row 2: Plan ID + Network Type */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Plan ID">
              <input
                type="text"
                placeholder="e.g. BCBS_HPN_Network"
                value={form.planId}
                onChange={e => set('planId', e.target.value)}
                className={inputCls(false)}
              />
            </Field>
            <Field label="Network Type">
              <select value={form.networkType} onChange={e => set('networkType', e.target.value)} className={inputCls(false)}>
                <option value="">Select type…</option>
                {NETWORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          {/* Row 3: Status + Added By */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value as FutureNetwork['status'])} className={inputCls(false)}>
                {Object.keys(STATUS_META).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Added By" required error={errors.addedBy}>
              <input
                type="text"
                placeholder="Your name"
                value={form.addedBy}
                onChange={e => set('addedBy', e.target.value)}
                className={inputCls(!!errors.addedBy)}
              />
            </Field>
          </div>

          {/* MRF URL */}
          <Field label="MRF Download Link" error={errors.mrfUrl}>
            <div className="relative">
              <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
              <input
                type="url"
                placeholder="https://..."
                value={form.mrfUrl}
                onChange={e => set('mrfUrl', e.target.value)}
                className={`${inputCls(!!errors.mrfUrl)} pl-9`}
              />
            </div>
          </Field>

          {/* States */}
          <Field label="States">
            <label className="mb-2 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.allStates}
                onChange={e => set('allStates', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#009DE0] accent-[#009DE0]"
              />
              <span className="text-sm text-gray-600">All states / nationwide</span>
            </label>
            {!form.allStates && (
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-3 max-h-36 overflow-y-auto">
                {US_STATES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleState(s)}
                    className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                      form.states.includes(s)
                        ? 'bg-[#001A41] text-white'
                        : 'bg-white text-gray-500 border border-gray-200 hover:border-[#009DE0] hover:text-[#009DE0]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {!form.allStates && form.states.length > 0 && (
              <p className="mt-1 text-xs text-gray-400">{form.states.length} state{form.states.length !== 1 ? 's' : ''} selected</p>
            )}
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              rows={3}
              placeholder="Context, MRF status, open questions, agent notes…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className={`${inputCls(false)} resize-none`}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            Date added set to today automatically
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              className="rounded-lg bg-[#009DE0] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0082ba] transition-colors"
            >
              Add to Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full rounded-lg border px-3 py-2 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-300 focus:ring-2 focus:ring-[#009DE0]/30 ${
    hasError ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 bg-white focus:border-[#009DE0]'
  }`;
}

// ─── Shared CarrierCard (MMA tab) ─────────────────────────────────────────────

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
                    network.networkGroup === 'Core'         ? 'bg-blue-50 text-blue-600' :
                    network.networkGroup === 'Regional'     ? 'bg-purple-50 text-purple-600' :
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
