import { useState, useEffect, useCallback, useRef } from 'react';
import { partitionProjects } from '../lib/baseball-card/partition';
import type { BaseballCardProject, Person, Priority } from '../lib/baseball-card/types';
import { SEED_PROJECTS } from '../lib/baseball-card/seed-data';

const STORAGE_KEY = 'mma-tracker-portfolio';

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadProjects(): BaseballCardProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through
  }
  // Seed from spreadsheet data on first load
  return SEED_PROJECTS;
}

function saveProjects(projects: BaseballCardProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function useBaseballCard() {
  const [projects, setProjects] = useState<BaseballCardProject[]>(loadProjects);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveProjects(projects), 100);
    return () => clearTimeout(saveTimeout.current);
  }, [projects]);

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
    setProjects(prev => [...prev, project]);
    return project;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<BaseballCardProject>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates, last_activity_at: new Date().toISOString() };
      if (updates.status === 'archived') updated.archived_at = new Date().toISOString();
      return updated;
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const pinProject = useCallback((id: string) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      pinned: p.id === id ? !p.pinned : false,
      last_activity_at: p.id === id ? new Date().toISOString() : p.last_activity_at,
    })));
  }, []);

  const reorderSpotlight = useCallback((orderedIds: string[]) => {
    setProjects(prev => {
      const updated = [...prev];
      orderedIds.forEach((id, index) => {
        const idx = updated.findIndex(p => p.id === id);
        if (idx !== -1) updated[idx] = { ...updated[idx], manual_rank: index + 1 };
      });
      return updated;
    });
  }, []);

  const promoteToSpotlight = useCallback((id: string) => {
    setProjects(prev => {
      const maxRank = Math.max(0, ...prev.filter(p => p.manual_rank != null).map(p => p.manual_rank!));
      return prev.map(p => {
        if (p.id !== id) return p;
        return { ...p, manual_rank: maxRank + 1, status: 'active' as const, last_activity_at: new Date().toISOString() };
      });
    });
  }, []);

  const demoteToRoster = useCallback((id: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, manual_rank: null, last_activity_at: new Date().toISOString() };
    }));
  }, []);

  const exportToJson = useCallback(() => {
    const data = JSON.stringify(projects, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${STORAGE_KEY}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [projects]);

  const importFromJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as BaseballCardProject[];
        if (!Array.isArray(imported)) return;
        setProjects(imported);
      } catch {
        // Invalid JSON — silently ignore
      }
    };
    reader.readAsText(file);
  }, []);

  const { spotlight, roster, archive } = partitionProjects(projects);

  return {
    projects, spotlight, roster, archive,
    createProject, updateProject, deleteProject,
    pinProject, reorderSpotlight, promoteToSpotlight, demoteToRoster,
    exportToJson, importFromJson,
  };
}
