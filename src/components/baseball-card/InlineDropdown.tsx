import { useState, useEffect, useRef } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    setFocusIndex(options.indexOf(value));

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusIndex(i => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusIndex >= 0) {
          onChange(options[focusIndex]);
          setOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  }

  function select(option: T) {
    onChange(option);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative inline-block" onKeyDown={handleKeyDown}>
      <div
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={0}
        className="cursor-pointer"
      >
        {children}
      </div>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-48 min-w-[160px] overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {options.map((option, i) => (
            <li
              key={option}
              role="option"
              aria-selected={option === value}
              onClick={(e) => { e.stopPropagation(); select(option); }}
              className={`cursor-pointer px-3 py-1.5 text-sm ${
                i === focusIndex ? 'bg-mma-blue/10 text-mma-dark-blue' : 'text-gray-700 hover:bg-gray-50'
              } ${option === value ? 'font-medium' : ''}`}
            >
              {labels?.[option] ?? option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
