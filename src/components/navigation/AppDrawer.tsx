import { useState, useEffect } from 'react';
import {
  LayoutGrid, LogOut, Menu, X,
  GanttChart, Map, Network, FlaskConical, BarChart2,
  ChevronDown, ChevronRight, FileText, Activity, Handshake, NotebookPen
} from 'lucide-react';
import mmaLogo from '../../assets/mma-logo.png';
import thsLogo from '../../assets/ths-logo.png';
import { useAuth } from '../../contexts/AuthContext';

export type AppView =
  | 'tracker'
  | 'project-plan'
  | 'timeline'
  | 'data-intelligence'
  | 'reporting-queries'
  | 'regional-map'
  | 'production-networks'
  | 'production-progress'
  | 'promise-health-plan'
  | 'call-notes';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Engagement Manager',
    defaultOpen: true,
    items: [
      { id: 'tracker',      label: 'Baseball Cards',        icon: LayoutGrid },
      { id: 'project-plan', label: 'Project Plan',          icon: FileText,  badge: 'Soon' },
      { id: 'timeline',     label: 'Timeline & Milestones', icon: GanttChart },
      { id: 'call-notes',   label: 'Call Notes',            icon: NotebookPen, badge: 'Soon' },
    ],
  },
  {
    label: 'Engagement Documentation',
    defaultOpen: false,
    items: [],
  },
  {
    label: 'Network Navigator Deployment',
    defaultOpen: true,
    items: [
      { id: 'data-intelligence',  label: 'Data Intelligence',  icon: FlaskConical },
      { id: 'reporting-queries',  label: 'Reporting Queries',  icon: BarChart2 },
    ],
  },
  {
    label: 'Production & Region Engagement',
    defaultOpen: true,
    items: [
      { id: 'regional-map',          label: 'Regional Map',        icon: Map },
      { id: 'production-networks',   label: 'Production Networks', icon: Network },
      { id: 'production-progress',   label: 'Production Progress', icon: Activity, badge: 'Soon' },
    ],
  },
  {
    label: 'Joint Project Work',
    defaultOpen: true,
    items: [
      { id: 'promise-health-plan', label: '1. Promise Health Plan - Rate Analysis', icon: Handshake, badge: 'Soon' },
    ],
  },
];

interface AppDrawerProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

export function AppDrawer({ activeView, onViewChange }: AppDrawerProps) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAV_GROUPS.forEach(g => { initial[g.label] = g.defaultOpen ?? true; });
    return initial;
  });

  useEffect(() => {
    const onResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (!desktop) setOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const drawerVisible = open || isDesktop;

  const handleNavClick = (view: AppView) => {
    onViewChange(view);
    if (!isDesktop) setOpen(false);
  };

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      {/* Hamburger */}
      {!isDesktop && (
        <button
          onClick={() => setOpen(!open)}
          className="fixed top-3.5 left-3.5 z-[1000] flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border-none bg-[#001A41] text-white shadow-lg transition-all hover:bg-[#003366] hover:scale-105"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      )}

      {/* Overlay */}
      {open && !isDesktop && (
        <div className="fixed inset-0 z-[998] bg-[#001A41]/45" onClick={() => setOpen(false)} />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 z-[999] flex h-screen w-[280px] flex-col shadow-[4px_0_24px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          drawerVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'linear-gradient(180deg, #001A41 0%, #00111F 100%)' }}
      >
        {/* Logo */}
        <div className="border-b border-white/10 px-5 py-5 text-center">
          <div className="flex items-center justify-center gap-3">
            <img src={mmaLogo} alt="Marsh McLennan Agency" className="h-7 w-auto brightness-0 invert" />
            <div className="h-7 w-px bg-white/20" />
            <img src={thsLogo} alt="Third Horizon" className="h-7 w-auto brightness-0 invert" />
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex flex-1 flex-col overflow-y-auto py-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-1">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center justify-between px-5 py-2 text-left transition-colors hover:bg-white/5"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  {group.label}
                </span>
                {openGroups[group.label]
                  ? <ChevronDown className="h-3 w-3 text-white/30" />
                  : <ChevronRight className="h-3 w-3 text-white/30" />
                }
              </button>

              {/* Group items */}
              {openGroups[group.label] && (
                <div className="mb-1">
                  {group.items.length === 0 ? (
                    <p className="px-5 py-2 text-xs italic text-white/20">Coming soon</p>
                  ) : (
                    group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id;
                      const isDisabled = item.badge === 'Soon';
                      return (
                        <button
                          key={item.id}
                          onClick={() => !isDisabled && handleNavClick(item.id)}
                          disabled={isDisabled}
                          className={`flex w-full items-center gap-3 border-none bg-transparent px-5 py-3 text-left font-medium transition-all ${
                            isActive
                              ? 'border-l-[3px] border-l-[#009DE0] bg-[#009DE0]/20 pl-[calc(1.25rem-3px)] text-[#009DE0]'
                              : isDisabled
                              ? 'cursor-not-allowed text-white/25'
                              : 'text-white/65 hover:bg-white/[0.08] hover:text-white'
                          }`}
                          style={{ fontFamily: 'inherit', fontSize: '0.88rem' }}
                        >
                          <Icon className="h-[17px] w-[17px] flex-shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/40">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-md border-none bg-transparent px-2 py-2 text-left text-[0.85rem] text-white/50 transition-colors hover:text-red-400"
            style={{ fontFamily: 'inherit' }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Spacer */}
      {isDesktop && <div className="w-[280px] flex-shrink-0" />}
    </>
  );
}
