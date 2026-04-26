'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

/* ── Types ────────────────────────────────────────────────────────────── */
export type FilterFieldType = 'text' | 'select' | 'multiselect' | 'daterange';

export interface FilterOption { label: string; value: string }

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  options?: FilterOption[];
  placeholder?: string;
}

export type FilterValues = Record<string, string | string[]>;

/* ── Context ──────────────────────────────────────────────────────────── */
interface Ctx {
  open: boolean;
  setOpen(v: boolean): void;
  fields: FilterField[];
  setFields(f: FilterField[]): void;
  values: FilterValues;
  setValue(key: string, val: string | string[]): void;
  reset(): void;
  activeCount: number;
}

const noop = () => {};
export const FilterPanelContext = React.createContext<Ctx>({
  open: false, setOpen: noop,
  fields: [], setFields: noop,
  values: {}, setValue: noop,
  reset: noop, activeCount: 0,
});

export function FilterPanelProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [fields, setFields] = React.useState<FilterField[]>([]);
  const [values, setValues] = React.useState<FilterValues>({});

  // Reset on page change
  React.useEffect(() => {
    setValues({});
    setFields([]);
    setOpen(false);
  }, [pathname]);

  const setValue = (key: string, val: string | string[]) =>
    setValues(prev => ({ ...prev, [key]: val }));

  const reset = () => setValues({});

  const activeCount = Object.entries(values).filter(([, v]) =>
    Array.isArray(v) ? v.length > 0 : v && v !== 'all' && v !== '',
  ).length;

  return (
    <FilterPanelContext value={{ open, setOpen, fields, setFields, values, setValue, reset, activeCount }}>
      {children}
    </FilterPanelContext>
  );
}

export function useFilterPanel() {
  return React.useContext(FilterPanelContext);
}

/** Register page-level filters; cleans up on unmount */
export function usePageFilters(config: FilterField[]) {
  const { setFields, values, setValue, reset } = useFilterPanel();
  // stable ref to avoid re-registering on each render
  const configRef = React.useRef(config);
  React.useEffect(() => {
    setFields(configRef.current);
    return () => setFields([]);
  }, []); // eslint-disable-line
  return { values, setValue, reset };
}
