export type ProjectStatus = 'active' | 'pencils_down' | 'on_hold' | 'archived';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type FreshnessTier = 'fresh' | 'warning' | 'stale';

// MMA-specific fields
export type MMATaskStatus =
  | 'In Production'
  | 'Set for Methods Sprint'
  | 'Confirming Completion'
  | 'Pre-Data Order'
  | 'In Queue'
  | 'Data is in PP'
  | 'Unknown'
  | 'TBD'
  | 'Complete'
  | 'Done';

export type MMATaskPriority = 'Very High' | 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
}

export interface Note {
  id: string;
  text: string;
  created_at: string;
}

export interface ProjectLink {
  id: string;
  url: string;
  label: string;
  created_at: string;
}

export interface Person {
  id: string;
  name: string;
  role?: string;
}

export interface BaseballCardProject {
  id: string;
  name: string;
  description: string;
  people: Person[];
  status: ProjectStatus;
  category: string;
  priority: Priority;
  pinned: boolean;
  manual_rank: number | null;
  last_activity_at: string;
  created_at: string;
  target_date: string | null;
  tags: string[];
  archived_at: string | null;
  tasks: Task[];
  notes: Note[];
  links: ProjectLink[];
  // MMA-specific fields from spreadsheet
  mma_version: string;
  mma_status: MMATaskStatus;
  mma_priority: MMATaskPriority;
  mma_contract_ref: string;
  mma_accountable: string;
  mma_responsible: string;
  mma_contributor: string;
  mma_informed: string;
  mma_estimated_turn_time: string;
  mma_comments: string;
  mma_date: string;
}

export interface PartitionedPortfolio {
  spotlight: BaseballCardProject[];
  roster: BaseballCardProject[];
  archive: BaseballCardProject[];
}

// Dropdown option lists
export const MMA_VERSION_OPTIONS = ['v7', 'v8', 'v9', 'v9 - v10', 'v9 - 11', 'v10', 'v11'] as const;
export const MMA_CONTRACT_REF_OPTIONS = ['Schedule E - Core', 'Schedule E - Enhancements', 'Schedule F', 'TBD'] as const;
export const MMA_STATUS_OPTIONS: readonly MMATaskStatus[] = [
  'In Production', 'Set for Methods Sprint', 'Confirming Completion',
  'Pre-Data Order', 'In Queue', 'Data is in PP', 'Unknown', 'TBD', 'Complete', 'Done',
] as const;

// Budget types for Schedule E / F
export interface BudgetItem {
  id: string;
  ewoNumber: string;
  projectId: string;
  description: string;
  approvedBudget: number;
  monthlyAllocations: number[];
  poolBalance: number;
}
