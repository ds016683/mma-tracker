import { createContext, useContext, type ReactNode } from 'react';
import { useBaseballCard } from '../hooks/useBaseballCard';

type UseBaseballCardReturn = ReturnType<typeof useBaseballCard>;

const ProjectsContext = createContext<UseBaseballCardReturn | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const value = useBaseballCard();
  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects(): UseBaseballCardReturn {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider');
  return ctx;
}
