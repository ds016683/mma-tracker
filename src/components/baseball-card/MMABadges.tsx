import type { MMATaskStatus } from '../../lib/baseball-card/types';
import { MMA_STATUS_OPTIONS, MMA_VERSION_OPTIONS, MMA_CONTRACT_REF_OPTIONS } from '../../lib/baseball-card/types';
import { InlineDropdown } from './InlineDropdown';

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

interface MMAStatusBadgeProps {
  status: MMATaskStatus;
  onChange?: (status: MMATaskStatus) => void;
}

export function MMAStatusBadge({ status, onChange }: MMAStatusBadgeProps) {
  const badge = (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]} ${onChange ? 'cursor-pointer hover:opacity-80' : ''}`}
      title={`MMA Status: ${status}${onChange ? ' (click to change)' : ''}`}
    >
      {status}
    </span>
  );

  if (!onChange) return badge;

  return (
    <InlineDropdown options={MMA_STATUS_OPTIONS} value={status} onChange={onChange}>
      {badge}
    </InlineDropdown>
  );
}

interface VersionBadgeProps {
  version: string;
  onChange?: (version: string) => void;
}

export function VersionBadge({ version, onChange }: VersionBadgeProps) {
  if (!version) return null;

  const badge = (
    <span
      className={`inline-flex items-center rounded-full border border-mma-blue/20 bg-mma-blue/10 px-2 py-0.5 text-xs font-medium text-mma-dark-teal ${onChange ? 'cursor-pointer hover:opacity-80' : ''}`}
      title={`Target version: ${version}${onChange ? ' (click to change)' : ''}`}
    >
      {version}
    </span>
  );

  if (!onChange) return badge;

  return (
    <InlineDropdown options={MMA_VERSION_OPTIONS as unknown as readonly string[]} value={version} onChange={onChange}>
      {badge}
    </InlineDropdown>
  );
}

interface ContractBadgeProps {
  contractRef: string;
  onChange?: (contractRef: string) => void;
}

export function ContractBadge({ contractRef, onChange }: ContractBadgeProps) {
  if (!contractRef) return null;
  const isCore = contractRef.includes('Core');
  const isEnhancement = contractRef.includes('Enhancement');
  const color = isCore
    ? 'border-mma-purple/20 bg-mma-purple/10 text-mma-purple'
    : isEnhancement
      ? 'border-mma-turquoise/20 bg-mma-turquoise/10 text-mma-turquoise'
      : 'border-gray-200 bg-gray-50 text-mma-text';

  const badge = (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${color} ${onChange ? 'cursor-pointer hover:opacity-80' : ''}`}
      title={`Contract reference: ${contractRef}${onChange ? ' (click to change)' : ''}`}
    >
      {contractRef}
    </span>
  );

  if (!onChange) return badge;

  return (
    <InlineDropdown options={MMA_CONTRACT_REF_OPTIONS as unknown as readonly string[]} value={contractRef} onChange={onChange}>
      {badge}
    </InlineDropdown>
  );
}
