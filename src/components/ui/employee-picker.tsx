'use client';

import * as React from 'react';
import { Users, X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/shared/utils';

export function EmployeePicker({
  employees,
  selected,
  onChange,
}: {
  employees: { id: string; name: string }[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const safeEmployees = React.useMemo(
    () =>
      employees.filter(
        (e): e is { id: string; name: string } =>
          e != null && typeof e.id === 'string' && typeof e.name === 'string',
      ),
    [employees],
  );

  const filtered = search.trim()
    ? safeEmployees.filter(e => e.name.includes(search.trim()))
    : safeEmployees;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(next);
  };

  const clearAll = () => onChange(new Set());

  const allSelected = safeEmployees.length > 0 && safeEmployees.every(e => selected.has(e.id));

  const toggleAll = () => {
    if (allSelected) onChange(new Set());
    else onChange(new Set(safeEmployees.map(e => e.id)));
  };

  const label = (selected.size === 0 || allSelected)
    ? 'جميع الموظفين'
    : selected.size === 1
      ? (safeEmployees.find(e => e.id === [...selected][0])?.name ?? '1 موظف')
      : `${selected.size} موظفين`;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex h-8 max-w-[10rem] items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all',
          selected.size > 0 && !allSelected
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground',
        )}
      >
        <Users className="h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 max-w-[6.5rem] flex-1 truncate text-start">{label}</span>
        {selected.size > 0 && !allSelected && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); clearAll(); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); clearAll(); } }}
            className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 hover:bg-primary/30 cursor-pointer"
          >
            <X className="h-2.5 w-2.5" />
          </span>
        )}
        <ChevronDown className={cn('h-3.5 w-3.5 opacity-50 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-64 rounded-xl border border-border bg-popover shadow-elevated backdrop-blur-xl">
          <div className="border-b border-border p-2">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث عن موظف…"
              className="w-full rounded-lg bg-muted/40 px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="button"
            onClick={toggleAll}
            className={cn(
              'flex w-full items-center gap-2.5 border-b border-border/40 px-3 py-2 text-sm transition-colors hover:bg-muted/40',
              allSelected ? 'text-primary font-medium' : 'text-muted-foreground',
            )}
          >
            <span className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
              allSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
            )}>
              {allSelected && <Check className="h-3 w-3" />}
            </span>
            جميع الموظفين
          </button>

          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">لا نتائج</p>
            )}
            {filtered.map(emp => {
              const isSelected = selected.has(emp.id);
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggle(emp.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted/40',
                    isSelected ? 'text-primary font-medium' : 'text-foreground/80',
                  )}
                >
                  <span className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                  )}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </span>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {emp.name.charAt(0)}
                  </div>
                  <span className="truncate">{emp.name}</span>
                </button>
              );
            })}
          </div>

          {selected.size > 0 && !allSelected && (
            <div className="border-t border-border p-2">
              <p className="text-center text-xs text-muted-foreground">{selected.size} موظف محدد</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
