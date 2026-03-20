import { useState, useEffect, useCallback, useRef } from 'react';
import { partitionProjects } from '../lib/baseball-card/partition';
import type { BaseballCardProject, Person, Priority } from '../lib/baseball-card/types';
import { useRealtimeProjects } from './useRealtimeProjects';
import {
  fetchAllProjects,
  insertProject,
  updateProjectRow,
  deleteProjectRow,
  reorderSpotlightRpc,
  pinProjectDb,
  upsertTask,
  deleteTask as deleteTaskDb,
  upsertNote,
  deleteNote as deleteNoteDb,
  upsertLink,
  deleteLink as deleteLinkDb,
  syncPeople,
} from '../lib/supabase/queries';

const STORAGE_KEY = 'mma-tracker-portfolio';

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Load projects from localStorage (migration source only) */
function loadLocalProjects(): BaseballCardProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through
  }
  return [];
}

export function useBaseballCard() {
  const [projects, setProjects] = useState<BaseballCardProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track IDs of writes we initiated so Realtime can skip them
  const pendingWriteIds = useRef(new Set<string>());

  // ── Initial fetch + localStorage migration ──
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchAllProjects();
        if (cancelled) return;

        if (data.length > 0) {
          // Supabase has data — use it, clear any stale localStorage
          setProjects(data);
          localStorage.removeItem(STORAGE_KEY);
        } else {
          // Supabase is empty — check for localStorage data to migrate
          const localData = loadLocalProjects();
          if (localData.length > 0) {
            setProjects(localData);
            // Upload to Supabase in background
            for (const project of localData) {
              await insertProject(project).catch((err) => {
                console.error('Migration failed for project:', project.id, err);
              });
            }
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message ?? 'Failed to load projects');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Refetch (used by Realtime reconnect) ──
  const refetch = useCallback(async () => {
    try {
      const data = await fetchAllProjects();
      setProjects(data);
    } catch {
      // silent — Realtime will retry
    }
  }, []);

  // ── Realtime subscriptions ──
  useRealtimeProjects({ setProjects, pendingWriteIds, refetch });

  // ── Create ──
  const createProject = useCallback((fields: {
    name: string;
    description?: string;
    people?: Person[];
    category: string;
    priority?: Priority;
    target_date?: string | null;
    tags?: string[];
  }) => {
    const now = new Date().toISOString();
    const project: BaseballCardProject = {
      id: generateId(),
      name: fields.name,
      description: fields.description ?? '',
      people: fields.people ?? [],
      status: 'active',
      category: fields.category,
      priority: fields.priority ?? 'medium',
      pinned: false,
      manual_rank: null,
      last_activity_at: now,
      created_at: now,
      target_date: fields.target_date ?? null,
      tags: fields.tags ?? [],
      archived_at: null,
      tasks: [],
      notes: [],
      links: [],
      mma_version: '',
      mma_status: 'TBD',
      mma_priority: 'Medium',
      mma_contract_ref: '',
      mma_accountable: '',
      mma_responsible: '',
      mma_contributor: '',
      mma_informed: '',
      mma_estimated_turn_time: '',
      mma_comments: '',
      mma_date: now.slice(0, 10),
    };

    // Optimistic update
    setProjects(prev => [...prev, project]);
    pendingWriteIds.current.add(project.id);

    insertProject(project).catch((err) => {
      console.error('Failed to create project:', err);
      // Rollback
      setProjects(prev => prev.filter(p => p.id !== project.id));
    }).finally(() => {
      pendingWriteIds.current.delete(project.id);
    });

    return project;
  }, []);

  // ── Update ──
  const updateProject = useCallback((id: string, updates: Partial<BaseballCardProject>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates, last_activity_at: new Date().toISOString() };
      if (updates.status === 'archived') updated.archived_at = new Date().toISOString();
      return updated;
    }));

    pendingWriteIds.current.add(id);

    // Separate sub-entity updates from project row updates
    const { tasks, notes, links, people, ...rowUpdates } = updates;
    rowUpdates.last_activity_at = new Date().toISOString();
    if (updates.status === 'archived') rowUpdates.archived_at = new Date().toISOString();

    const ops: Promise<void>[] = [];

    // Always update the project row (at least for last_activity_at)
    ops.push(updateProjectRow(id, rowUpdates));

    // Sync sub-entities if they changed
    if (tasks !== undefined) {
      // Diff approach: upsert all current tasks, delete removed ones
      ops.push((async () => {
        const currentProject = projects.find(p => p.id === id);
        const oldTaskIds = new Set(currentProject?.tasks.map(t => t.id) ?? []);
        const newTaskIds = new Set(tasks.map(t => t.id));
        for (const task of tasks) {
          await upsertTask(id, task);
        }
        for (const oldId of oldTaskIds) {
          if (!newTaskIds.has(oldId)) await deleteTaskDb(oldId);
        }
      })());
    }

    if (notes !== undefined) {
      ops.push((async () => {
        const currentProject = projects.find(p => p.id === id);
        const oldNoteIds = new Set(currentProject?.notes.map(n => n.id) ?? []);
        const newNoteIds = new Set(notes.map(n => n.id));
        for (const note of notes) {
          await upsertNote(id, note);
        }
        for (const oldId of oldNoteIds) {
          if (!newNoteIds.has(oldId)) await deleteNoteDb(oldId);
        }
      })());
    }

    if (links !== undefined) {
      ops.push((async () => {
        const currentProject = projects.find(p => p.id === id);
        const oldLinkIds = new Set(currentProject?.links.map(l => l.id) ?? []);
        const newLinkIds = new Set(links.map(l => l.id));
        for (const link of links) {
          await upsertLink(id, link);
        }
        for (const oldId of oldLinkIds) {
          if (!newLinkIds.has(oldId)) await deleteLinkDb(oldId);
        }
      })());
    }

    if (people !== undefined) {
      ops.push(syncPeople(id, people));
    }

    Promise.all(ops).catch((err) => {
      console.error('Failed to update project:', err);
    }).finally(() => {
      pendingWriteIds.current.delete(id);
    });
  }, [projects]);

  // ── Delete ──
  const deleteProject = useCallback((id: string) => {
    const removed = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    pendingWriteIds.current.add(id);

    deleteProjectRow(id).catch((err) => {
      console.error('Failed to delete project:', err);
      if (removed) setProjects(prev => [...prev, removed]);
    }).finally(() => {
      pendingWriteIds.current.delete(id);
    });
  }, [projects]);

  // ── Pin ──
  const pinProject = useCallback((id: string) => {
    const target = projects.find(p => p.id === id);
    if (!target) return;

    setProjects(prev => prev.map(p => ({
      ...p,
      pinned: p.id === id ? !p.pinned : false,
      last_activity_at: p.id === id ? new Date().toISOString() : p.last_activity_at,
    })));

    pendingWriteIds.current.add(id);
    pinProjectDb(id, target.pinned).catch((err) => {
      console.error('Failed to pin project:', err);
    }).finally(() => {
      pendingWriteIds.current.delete(id);
    });
  }, [projects]);

  // ── Reorder spotlight ──
  const reorderSpotlight = useCallback((orderedIds: string[], draggedId?: string) => {
    const rankUpdates: { id: string; rank: number }[] = [];

    setProjects(prev => {
      const updated = [...prev];
      orderedIds.forEach((id, index) => {
        const idx = updated.findIndex(p => p.id === id);
        if (idx !== -1) {
          if (updated[idx].manual_rank != null || id === draggedId) {
            updated[idx] = { ...updated[idx], manual_rank: index + 1 };
            rankUpdates.push({ id, rank: index + 1 });
          }
        }
      });
      return updated;
    });

    if (rankUpdates.length > 0) {
      reorderSpotlightRpc(rankUpdates).catch((err) => {
        console.error('Failed to reorder spotlight:', err);
      });
    }
  }, []);

  // ── Promote / Demote ──
  const promoteToSpotlight = useCallback((id: string) => {
    const maxRank = Math.max(0, ...projects.filter(p => p.manual_rank != null).map(p => p.manual_rank!));
    const newRank = maxRank + 1;
    const now = new Date().toISOString();

    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, manual_rank: newRank, status: 'active' as const, last_activity_at: now };
    }));

    pendingWriteIds.current.add(id);
    updateProjectRow(id, { manual_rank: newRank, status: 'active', last_activity_at: now }).catch((err) => {
      console.error('Failed to promote project:', err);
    }).finally(() => {
      pendingWriteIds.current.delete(id);
    });
  }, [projects]);

  const demoteToRoster = useCallback((id: string) => {
    const now = new Date().toISOString();

    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, manual_rank: null, last_activity_at: now };
    }));

    pendingWriteIds.current.add(id);
    updateProjectRow(id, { manual_rank: null, last_activity_at: now }).catch((err) => {
      console.error('Failed to demote project:', err);
    }).finally(() => {
      pendingWriteIds.current.delete(id);
    });
  }, []);

  // ── Export ──
  const exportToJson = useCallback(() => {
    const data = JSON.stringify(projects, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mma-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [projects]);

  // ── Import (additive merge) ──
  const importFromJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as BaseballCardProject[];
        if (!Array.isArray(imported)) return;

        const existingIds = new Set(projects.map(p => p.id));
        const newProjects = imported.filter(p => !existingIds.has(p.id));

        if (newProjects.length === 0) return;

        // Optimistic update
        setProjects(prev => [...prev, ...newProjects]);

        // Write to Supabase
        for (const project of newProjects) {
          await insertProject(project).catch((err) => {
            console.error('Failed to import project:', project.id, err);
          });
        }
      } catch {
        // Invalid JSON — silently ignore
      }
    };
    reader.readAsText(file);
  }, [projects]);

  const { spotlight, roster, archive } = partitionProjects(projects);

  return {
    projects, spotlight, roster, archive,
    loading, error,
    createProject, updateProject, deleteProject,
    pinProject, reorderSpotlight, promoteToSpotlight, demoteToRoster,
    exportToJson, importFromJson,
    refetch, pendingWriteIds,
  };
}
