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

// --- Task (structured) ---
export interface Task {
  id: string;
  // Legacy text field kept for migration compatibility
  text: string;
  done: boolean;
  created_at: string;
  // New structured fields (may be absent on old records)
  task_name?: string;
  description?: string;
  assigned_to?: string;
  due_date?: string | null;
  start_date?: string | null;
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

// --- Activity Feed ---
export interface ActivityEvent {
  id: string;
  project_id: string;
  user_id: string;
  event_type: string;
  description: string;
  created_at: string;
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
  // Gantt dates
  start_date?: string | null;
  end_date?: string | null;
  tags: string[];
  archived_at: string | null;
  tasks: Task[];
  notes: Note[];
  links: ProjectLink[];
  // Activity feed (loaded separately)
  activity?: ActivityEvent[];
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

// --- Status Rollup ---
export type RollupStatus = 'on-track' | 'at-risk' | 'overdue' | 'complete' | 'no-tasks';

export function computeRollup(tasks: Task[]): { pct: number; status: RollupStatus } {
  if (tasks.length === 0) return { pct: 0, status: 'no-tasks' };
  const done = tasks.filter(t => t.done).length;
  const pct = Math.round((done / tasks.length) * 100);
  if (pct === 100) return { pct, status: 'complete' };

  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  let hasOverdue = false;
  let hasAtRisk = false;

  for (const t of tasks) {
    if (t.done) continue;
    const due = t.due_date ? new Date(t.due_date).getTime() : null;
    if (due === null) continue;
    if (due < now) { hasOverdue = true; break; }
    if (due - now <= threeDays) hasAtRisk = true;
  }

  if (hasOverdue) return { pct, status: 'overdue' };
  if (hasAtRisk) return { pct, status: 'at-risk' };
  return { pct, status: 'on-track' };
}

// ── Board categories (ordered) ────────────────────────────────────────────────
export interface BoardCategory {
  id: string;
  label: string;
  borderColor: string;
  iconColor: string;
  labelColor: string;
}

export const BOARD_CATEGORIES: BoardCategory[] = [
  {
    id: 'Production Priorities',
    label: 'Production Priorities',
    borderColor: 'border-th-dark-blue/40',
    iconColor: 'text-th-dark-blue',
    labelColor: 'text-th-dark-blue',
  },
  {
    id: 'Data Enhancements (Schedule E)',
    label: 'Data Enhancements (Schedule E)',
    borderColor: 'border-th-medium-blue/40',
    iconColor: 'text-th-medium-blue',
    labelColor: 'text-th-medium-blue',
  },
  {
    id: 'Innovation Roadmap',
    label: 'Innovation Roadmap',
    borderColor: 'border-th-gold/50',
    iconColor: 'text-th-gold',
    labelColor: 'text-th-gold',
  },
  {
    id: 'Completed',
    label: 'Completed',
    borderColor: 'border-mma-green/30',
    iconColor: 'text-mma-green',
    labelColor: 'text-mma-green',
  },
  {
    id: 'Extraneous',
    label: 'Extraneous',
    borderColor: 'border-gray-200',
    iconColor: 'text-gray-400',
    labelColor: 'text-gray-500',
  },
];

// ── Category migration map (old seed values → new 5-category system) ─────────
export const CATEGORY_MIGRATION_MAP: Record<string, string> = {
  'Schedule E - Core': 'Production Priorities',
  'Schedule E - Enhancements': 'Data Enhancements (Schedule E)',
  'Schedule F': 'Innovation Roadmap',
  'TBD': 'Production Priorities',
};

export function migrateCategory(cat: string): string {
  return CATEGORY_MIGRATION_MAP[cat] ?? cat;
}
