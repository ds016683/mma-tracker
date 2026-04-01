import { useState, useEffect } from 'react';
import { LayoutGrid, Droplets, FlaskConical, BarChart2, LogOut, Menu, X, GanttChart } from 'lucide-react';
import mmaLogo from '../../assets/mma-logo.png';
import thsLogo from '../../assets/ths-logo.png';
import { useAuth } from '../../contexts/AuthContext';

export type AppView = 'tracker' | 'gantt' | 'treatment' | 'analytic-tests' | 'reporting-queries';

interface AppDrawerProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

const navItems: { id: AppView; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'tracker', label: 'Master Tracker', icon: LayoutGrid },
  { id: 'gantt', label: 'Gantt Chart', icon: GanttChart },
  { id: 'treatment', label: 'Data Treatment Process', icon: Droplets },
  { id: 'analytic-tests', label: '4 Analytic Tests', icon: FlaskConical },
  { id: 'reporting-queries', label: 'Reporting Queries', icon: BarChart2 },
];

export function AppDrawer({ activeView, onViewChange }: AppDrawerProps) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

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

      {/* Overlay (mobile only) */}
      {open && !isDesktop && (
        <div
          className="fixed inset-0 z-[998] bg-[#001A41]/45"
          onClick={() => setOpen(false)}
        />
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

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-0.5 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex w-full items-center gap-3 border-none bg-transparent px-5 py-3.5 text-left font-medium transition-all ${
                  isActive
                    ? 'border-l-[3px] border-l-[#009DE0] bg-[#009DE0]/20 pl-[calc(1.25rem-3px)] text-[#009DE0]'
                    : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                }`}
                style={{ fontFamily: 'inherit', fontSize: '0.92rem' }}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
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

      {/* Spacer for desktop layout */}
      {isDesktop && <div className="w-[280px] flex-shrink-0" />}
    </>
  );
}
