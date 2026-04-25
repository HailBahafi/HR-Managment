import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRDisciplineInvestigationRecord } from './types';

function uid() { return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function now() { return new Date().toISOString(); }

interface InvestigationsState {
  investigations: HRDisciplineInvestigationRecord[];
  add: (d: Omit<HRDisciplineInvestigationRecord,'id'|'createdAt'|'updatedAt'>) => void;
  update: (id: string, patch: Partial<HRDisciplineInvestigationRecord>) => void;
  remove: (id: string) => void;
}

export const useHRDisciplineInvestigationsStore = create<InvestigationsState>()(
  persist(
    (set) => ({
      investigations: [],
      add: (d) => set(s => ({ investigations: [...s.investigations, { ...d, id:uid(), createdAt:now(), updatedAt:now() }] })),
      update: (id, patch) => set(s => ({ investigations: s.investigations.map(i => i.id === id ? { ...i, ...patch, updatedAt:now() } : i) })),
      remove: (id) => set(s => ({ investigations: s.investigations.filter(i => i.id !== id) })),
    }),
    { name:'hr_discipline_investigations_v1', storage: createJSONStorage(() => localStorage), version:1 },
  ),
);
