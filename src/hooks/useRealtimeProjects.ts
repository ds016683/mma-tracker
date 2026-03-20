import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import type { BaseballCardProject, Task, Note, ProjectLink, Person } from '../lib/baseball-card/types';

type SetProjects = React.Dispatch<React.SetStateAction<BaseballCardProject[]>>;

interface UseRealtimeProjectsOptions {
  setProjects: SetProjects;
  pendingWriteIds: React.RefObject<Set<string>>;
  refetch: () => Promise<void>;
}

export function useRealtimeProjects({ setProjects, pendingWriteIds, refetch }: UseRealtimeProjectsOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const wasDisconnected = useRef(false);

  useEffect(() => {
    const channel = supabase
      .channel('projects-realtime')
      // ── projects table ──
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'projects' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (pendingWriteIds.current.has(row.id as string)) return;

          const project: BaseballCardProject = {
            ...(row as unknown as Omit<BaseballCardProject, 'tasks' | 'notes' | 'links' | 'people'>),
            tasks: [],
            notes: [],
            links: [],
            people: [],
          };
          setProjects(prev => {
            if (prev.some(p => p.id === project.id)) return prev;
            return [...prev, project];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (pendingWriteIds.current.has(row.id as string)) return;

          setProjects(prev => prev.map(p => {
            if (p.id !== row.id) return p;
            return {
              ...p,
              ...(row as unknown as Omit<BaseballCardProject, 'tasks' | 'notes' | 'links' | 'people'>),
            };
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'projects' },
        (payload) => {
          const row = payload.old as Record<string, unknown>;
          if (pendingWriteIds.current.has(row.id as string)) return;
          setProjects(prev => prev.filter(p => p.id !== row.id));
        }
      )

      // ── project_tasks table ──
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_tasks' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const task: Task = {
            id: row.id as string,
            text: row.text as string,
            done: row.done as boolean,
            created_at: row.created_at as string,
          };
          setProjects(prev => prev.map(p => {
            if (p.id !== row.project_id) return p;
            if (p.tasks.some(t => t.id === task.id)) return p;
            return { ...p, tasks: [...p.tasks, task] };
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'project_tasks' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setProjects(prev => prev.map(p => {
            if (p.id !== row.project_id) return p;
            return {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === row.id
                  ? { ...t, text: row.text as string, done: row.done as boolean }
                  : t
              ),
            };
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'project_tasks' },
        (payload) => {
          const row = payload.old as Record<string, unknown>;
          setProjects(prev => prev.map(p => ({
            ...p,
            tasks: p.tasks.filter(t => t.id !== row.id),
          })));
        }
      )

      // ── project_notes table ──
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_notes' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const note: Note = {
            id: row.id as string,
            text: row.text as string,
            created_at: row.created_at as string,
          };
          setProjects(prev => prev.map(p => {
            if (p.id !== row.project_id) return p;
            if (p.notes.some(n => n.id === note.id)) return p;
            return { ...p, notes: [...p.notes, note] };
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'project_notes' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setProjects(prev => prev.map(p => {
            if (p.id !== row.project_id) return p;
            return {
              ...p,
              notes: p.notes.map(n =>
                n.id === row.id ? { ...n, text: row.text as string } : n
              ),
            };
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'project_notes' },
        (payload) => {
          const row = payload.old as Record<string, unknown>;
          setProjects(prev => prev.map(p => ({
            ...p,
            notes: p.notes.filter(n => n.id !== row.id),
          })));
        }
      )

      // ── project_links table ──
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_links' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const link: ProjectLink = {
            id: row.id as string,
            url: row.url as string,
            label: row.label as string,
            created_at: row.created_at as string,
          };
          setProjects(prev => prev.map(p => {
            if (p.id !== row.project_id) return p;
            if (p.links.some(l => l.id === link.id)) return p;
            return { ...p, links: [...p.links, link] };
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'project_links' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setProjects(prev => prev.map(p => {
            if (p.id !== row.project_id) return p;
            return {
              ...p,
              links: p.links.map(l =>
                l.id === row.id
                  ? { ...l, url: row.url as string, label: row.label as string }
                  : l
              ),
            };
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'project_links' },
        (payload) => {
          const row = payload.old as Record<string, unknown>;
          setProjects(prev => prev.map(p => ({
            ...p,
            links: p.links.filter(l => l.id !== row.id),
          })));
        }
      )

      // ── project_people table ──
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_people' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const person: Person = {
            id: row.id as string,
            name: row.name as string,
            role: (row.role as string) ?? undefined,
          };
          setProjects(prev => prev.map(p => {
            if (p.id !== row.project_id) return p;
            if (p.people.some(pp => pp.id === person.id)) return p;
            return { ...p, people: [...p.people, person] };
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'project_people' },
        (payload) => {
          const row = payload.old as Record<string, unknown>;
          setProjects(prev => prev.map(p => ({
            ...p,
            people: p.people.filter(pp => pp.id !== row.id),
          })));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && wasDisconnected.current) {
          // Reconnected — full re-fetch to recover missed events
          wasDisconnected.current = false;
          refetch();
        }
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          wasDisconnected.current = true;
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [setProjects, pendingWriteIds, refetch]);
}
