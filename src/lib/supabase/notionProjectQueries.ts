import { supabase } from './client';

export interface SupabaseProject {
  id: string;
  name: string;
  description: string;
  status: string;
  category: string;
  priority: string;
  pinned: boolean;
  manual_rank: number | null;
  last_activity_at: string;
  created_at: string;
  target_date: string | null;
  start_date: string | null;
  end_date: string | null;
  mma_status: string;
  mma_priority: string;
  mma_contract_ref: string;
  mma_accountable: string;
  mma_responsible: string;
  mma_contributor: string;
  mma_informed: string;
  mma_comments: string;
}

export interface SupabaseTask {
  id: string;
  project_id: string;
  text: string;
  task_name: string;
  description: string;
  assigned_to: string;
  start_date: string | null;
  due_date: string | null;
  done: boolean;
}

export interface ProjectWithTasks extends SupabaseProject {
  tasks: SupabaseTask[];
}

export async function fetchProjectsWithTasks(): Promise<ProjectWithTasks[]> {
  const [projRes, taskRes] = await Promise.all([
    supabase.from('projects').select('*').order('manual_rank', { ascending: true }),
    supabase.from('project_tasks').select('*'),
  ]);
  if (projRes.error) throw projRes.error;
  if (taskRes.error) throw taskRes.error;

  const tasksByProject: Record<string, SupabaseTask[]> = {};
  for (const t of (taskRes.data ?? [])) {
    if (!tasksByProject[t.project_id]) tasksByProject[t.project_id] = [];
    tasksByProject[t.project_id].push(t as SupabaseTask);
  }

  return (projRes.data ?? []).map(p => ({
    ...(p as SupabaseProject),
    tasks: tasksByProject[p.id] ?? [],
  }));
}
