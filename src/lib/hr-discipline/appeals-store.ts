import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRDisciplineAppealRecord } from './types';

function uid() { return `apl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function now() { return new Date().toISOString(); }

const SEED: HRDisciplineAppealRecord[] = [
  {
    id:'apl-1', caseId:'case-2', caseNumber:'VIO-2026-0002',
    employeeId:'e2', employeeNameAr:'فاطمة علي',
    date:'2026-02-10', channel:'hr', status:'in_review',
    grounds:'كانت غائبة لظروف طارئة عائلية ولم تتمكن من الإبلاغ', responseNote:'',
    createdAt:'2026-02-10T00:00:00Z', updatedAt:'2026-02-10T00:00:00Z',
  },
  {
    id:'apl-2', caseId:'case-1', caseNumber:'VIO-2026-0001',
    employeeId:'e1', employeeNameAr:'أحمد محمد',
    date:'2026-01-15', channel:'manager', status:'rejected',
    grounds:'كان التأخير بسبب عطل في المواصلات', responseNote:'لا تُقبل الأعذار بدون وثائق رسمية',
    createdAt:'2026-01-15T00:00:00Z', updatedAt:'2026-01-20T00:00:00Z',
  },
];

interface AppealsState {
  appeals: HRDisciplineAppealRecord[];
  add: (d: Omit<HRDisciplineAppealRecord,'id'|'createdAt'|'updatedAt'>) => void;
  update: (id: string, patch: Partial<HRDisciplineAppealRecord>) => void;
  remove: (id: string) => void;
}

export const useHRDisciplineAppealsStore = create<AppealsState>()(
  persist(
    (set) => ({
      appeals: SEED,
      add: (d) => set(s => ({ appeals: [...s.appeals, { ...d, id:uid(), createdAt:now(), updatedAt:now() }] })),
      update: (id, patch) => set(s => ({ appeals: s.appeals.map(a => a.id === id ? { ...a, ...patch, updatedAt:now() } : a) })),
      remove: (id) => set(s => ({ appeals: s.appeals.filter(a => a.id !== id) })),
    }),
    { name:'hr_discipline_appeals_v1', storage: createJSONStorage(() => localStorage), version:1 },
  ),
);
