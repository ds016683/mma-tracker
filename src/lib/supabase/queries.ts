import { supabase } from './client';
import type { BaseballCardProject, Task, Note, ProjectLink, Person } from '../baseball-card/types';

// ── Fetch all projects with sub-entities ──

interface ProjectRow {
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
  tags: string[];
  archived_at: string | null;
  mma_version: string;
  mma_status: string;
  mma_priority: string;
  mma_contract_ref: string;
  mma_accountable: string;
  mma_responsible: string;
  mma_contributor: string;
  mma_informed: string;
  mma_estimated_turn_time: string;
  mma_comments: string;
  mma_date: string;
}

export async function fetchAllProjects(): Promise<BaseballCardProject[]> {
  const [projectsRes, tasksRes, notesRes, linksRes, peopleRes] = await Promise.all([
    supabase.from('projects').select('*'),
    supabase.from('project_tasks').select('*'),
    supabase.from('project_notes').select('*'),
    supabase.from('project_links').select('*'),
    supabase.from('project_people').select('*'),
  ]);

  if (projectsRes.error) throw projectsRes.error;
  if (tasksRes.error) throw tasksRes.error;
  if (notesRes.error) throw notesRes.error;
  if (linksRes.error) throw linksRes.error;
  if (peopleRes.error) throw peopleRes.error;

  const tasksByProject = groupBy(tasksRes.data, 'project_id');
  const notesByProject = groupBy(notesRes.data, 'project_id');
  const linksByProject = groupBy(linksRes.data, 'project_id');
  const peopleByProject = groupBy(peopleRes.data, 'project_id');

  return (projectsRes.data as ProjectRow[]).map((row) => ({
    ...row,
    status: row.status as BaseballCardProject['status'],
    priority: row.priority as BaseballCardProject['priority'],
    mma_status: row.mma_status as BaseballCardProject['mma_status'],
    mma_priority: row.mma_priority as BaseballCardProject['mma_priority'],
    tasks: (tasksByProject[row.id] ?? []).map((t): Task => ({
      id: t.id,
      text: t.text,
      done: t.done,
      created_at: t.created_at,
    })),
    notes: (notesByProject[row.id] ?? []).map((n): Note => ({
      id: n.id,
      text: n.text,
      created_at: n.created_at,
    })),
    links: (linksByProject[row.id] ?? []).map((l): ProjectLink => ({
      id: l.id,
      url: l.url,
      label: l.label,
      created_at: l.created_at,
    })),
    people: (peopleByProject[row.id] ?? []).map((p): Person => ({
      id: p.id,
      name: p.name,
      role: p.role ?? undefined,
    })),
  }));
}

// ── Project CRUD ──

export async function insertProject(project: BaseballCardProject) {
  const { people, tasks, notes, links, ...row } = project;

  const { error } = await supabase.from('projects').insert(row);
  if (error) throw error;

  if (people.length > 0) {
    const { error: pErr } = await supabase.from('project_people').insert(
      people.map((p) => ({ ...p, project_id: project.id, role: p.role ?? null }))
    );
    if (pErr) throw pErr;
  }
}

export async function updateProjectRow(
  id: string,
  updates: Partial<Omit<BaseballCardProject, 'tasks' | 'notes' | 'links' | 'people'>>
) {
  const { error } = await supabase.from('projects').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteProjectRow(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ── Sub-entity CRUD ──

export async function upsertTask(projectId: string, task: Task) {
  const { error } = await supabase.from('project_tasks').upsert({
    id: task.id,
    project_id: projectId,
    text: task.text,
    done: task.done,
    created_at: task.created_at,
  });
  if (error) throw error;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase.from('project_tasks').delete().eq('id', taskId);
  if (error) throw error;
}

export async function upsertNote(projectId: string, note: Note) {
  const { error } = await supabase.from('project_notes').upsert({
    id: note.id,
    project_id: projectId,
    text: note.text,
    created_at: note.created_at,
  });
  if (error) throw error;
}

export async function deleteNote(noteId: string) {
  const { error } = await supabase.from('project_notes').delete().eq('id', noteId);
  if (error) throw error;
}

export async function upsertLink(projectId: string, link: ProjectLink) {
  const { error } = await supabase.from('project_links').upsert({
    id: link.id,
    project_id: projectId,
    url: link.url,
    label: link.label,
    created_at: link.created_at,
  });
  if (error) throw error;
}

export async function deleteLink(linkId: string) {
  const { error } = await supabase.from('project_links').delete().eq('id', linkId);
  if (error) throw error;
}

export async function syncPeople(projectId: string, people: Person[]) {
  // Delete all existing people for this project, then re-insert
  const { error: delErr } = await supabase.from('project_people').delete().eq('project_id', projectId);
  if (delErr) throw delErr;

  if (people.length > 0) {
    const { error: insErr } = await supabase.from('project_people').insert(
      people.map((p) => ({ id: p.id, project_id: projectId, name: p.name, role: p.role ?? null }))
    );
    if (insErr) throw insErr;
  }
}

// ── Spotlight reorder RPC ──

export async function reorderSpotlightRpc(rankUpdates: { id: string; rank: number }[]) {
  const { error } = await supabase.rpc('reorder_spotlight', {
    rank_updates: JSON.stringify(rankUpdates),
  });
  if (error) throw error;
}

// ── Pin project (unpins all others, pins target) ──

export async function pinProjectDb(id: string, currentlyPinned: boolean) {
  // Unpin all
  const { error: unpinErr } = await supabase
    .from('projects')
    .update({ pinned: false })
    .neq('id', id);
  if (unpinErr) throw unpinErr;

  // Toggle the target
  const { error } = await supabase
    .from('projects')
    .update({ pinned: !currentlyPinned, last_activity_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ── Helpers ──

function groupBy<T extends Record<string, unknown>>(items: T[], key: string): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const item of items) {
    const k = item[key] as string;
    (map[k] ??= []).push(item);
  }
  return map;
}
