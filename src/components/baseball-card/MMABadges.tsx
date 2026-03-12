import type { MMATaskStatus } from '../../lib/baseball-card/types';

const STATUS_STYLES: Record<MMATaskStatus, string> = {
  'In Production': 'bg-mma-green/10 text-mma-green border-mma-green/20',
  'Set for Methods Sprint': 'bg-mma-blue/10 text-mma-blue border-mma-blue/20',
  'Confirming Completion': 'bg-mma-yellow/10 text-mma-yellow border-mma-yellow/30',
  'Pre-Data Order': 'bg-mma-purple/10 text-mma-purple border-mma-purple/20',
  'In Queue': 'bg-mma-teal/10 text-mma-teal border-mma-teal/20',
  'Data is in PP': 'bg-mma-dark-blue/10 text-mma-dark-blue border-mma-dark-blue/20',
  'Unknown': 'bg-gray-100 text-mma-text border-gray-200',
  'TBD': 'bg-gray-100 text-mma-text border-gray-200',
  'Complete': 'bg-mma-turquoise/10 text-mma-turquoise border-mma-turquoise/20',
  'Done': 'bg-mma-turquoise/10 text-mma-turquoise border-mma-turquoise/20',
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
      className="inline-flex items-center rounded-full border border-mma-blue/20 bg-mma-blue/10 px-2 py-0.5 text-xs font-medium text-mma-dark-teal"
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
    ? 'border-mma-purple/20 bg-mma-purple/10 text-mma-purple'
    : isEnhancement
      ? 'border-mma-turquoise/20 bg-mma-turquoise/10 text-mma-turquoise'
      : 'border-gray-200 bg-gray-50 text-mma-text';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}
      title={`Contract reference: ${contractRef}`}
    >
      {contractRef}
    </span>
  );
}
