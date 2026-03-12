import type { MMATaskStatus } from '../../lib/baseball-card/types';

const STATUS_STYLES: Record<MMATaskStatus, string> = {
  'In Production': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Set for Methods Sprint': 'bg-blue-50 text-blue-700 border-blue-200',
  'Confirming Completion': 'bg-amber-50 text-amber-700 border-amber-200',
  'Pre-Data Order': 'bg-purple-50 text-purple-700 border-purple-200',
  'In Queue': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Data is in PP': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Unknown': 'bg-gray-100 text-gray-500 border-gray-200',
  'TBD': 'bg-gray-100 text-gray-500 border-gray-200',
  'Complete': 'bg-green-50 text-green-700 border-green-200',
  'Done': 'bg-green-50 text-green-700 border-green-200',
};

export function MMAStatusBadge({ status }: { status: MMATaskStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
      title={`MMA Status: ${status}`}
    >
      {status}
    </span>
  );
}

export function VersionBadge({ version }: { version: string }) {
  if (!version) return null;
  return (
    <span
      className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700"
      title={`Target version: ${version}`}
    >
      {version}
    </span>
  );
}

export function ContractBadge({ contractRef }: { contractRef: string }) {
  if (!contractRef) return null;
  const isCore = contractRef.includes('Core');
  const isEnhancement = contractRef.includes('Enhancement');
  const color = isCore
    ? 'border-violet-200 bg-violet-50 text-violet-700'
    : isEnhancement
      ? 'border-teal-200 bg-teal-50 text-teal-700'
      : 'border-gray-200 bg-gray-50 text-gray-600';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}
      title={`Contract reference: ${contractRef}`}
    >
      {contractRef}
    </span>
  );
}
