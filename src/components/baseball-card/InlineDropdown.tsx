import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface InlineDropdownProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  children: React.ReactNode;
  labels?: Record<string, string>;
}

export function InlineDropdown<T extends string>({
  options,
  value,
  onChange,
  children,
  labels,
}: InlineDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  // Position for the portal-rendered menu
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Compute menu position when opening
  useEffect(() => {
    if (!open || !triggerRef.current) return;

    setFocusIndex(options.indexOf(value));

    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = Math.min(options.length * 36 + 8, 200); // estimate
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < menuHeight + 8 && spaceAbove > spaceBelow;

    setMenuStyle({
      position: 'fixed',
      zIndex: 9999,
      left: rect.left,
      minWidth: Math.max(rect.width, 180),
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });

    function handleClickOutside(e: MouseEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        listRef.current && !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, options, value]);

  useEffect(() => {
    if (open && focusIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      (items[focusIndex] as HTMLElement)?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusIndex, open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setFocusIndex(i => Math.min(i + 1, options.length - 1)); break;
      case 'ArrowUp':   e.preventDefault(); setFocusIndex(i => Math.max(i - 1, 0)); break;
      case 'Enter':
        e.preventDefault();
        if (focusIndex >= 0) { onChange(options[focusIndex]); setOpen(false); }
        break;
      case 'Escape': e.preventDefault(); setOpen(false); break;
    }
  }

  function select(option: T) {
    onChange(option);
    setOpen(false);
  }

  const menu = open ? (
    <ul
      ref={listRef}
      role="listbox"
      style={menuStyle}
      className="max-h-48 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
    >
      {options.map((option, i) => (
        <li
          key={option}
          role="option"
          aria-selected={option === value}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); select(option); }}
          className={`cursor-pointer px-3 py-1.5 text-sm ${
            i === focusIndex ? 'bg-mma-blue/10 text-mma-dark-blue' : 'text-gray-700 hover:bg-gray-50'
          } ${option === value ? 'font-medium' : ''}`}
        >
          {labels?.[option] ?? option}
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-block"
        onKeyDown={handleKeyDown}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={0}
        style={{ cursor: 'pointer' }}
      >
        {children}
      </div>
      {menu && createPortal(menu, document.body)}
    </>
  );
}
