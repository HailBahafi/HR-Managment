import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRDisciplinePayrollDeductionRecord, HRViolationCaseRecord } from './types';

function uid() { return `ded-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function now() { return new Date().toISOString(); }

const SEED: HRDisciplinePayrollDeductionRecord[] = [
  { id:'ded-1', caseId:'case-1', caseNumber:'VIO-2026-0001', employeeId:'e1', employeeNameAr:'أحمد محمد', reasonAr:'التأخر عن العمل', deductionKind:'hours', amount:25, month:'2026-01', status:'posted', createdAt:'2026-01-10T00:00:00Z', updatedAt:'2026-01-10T00:00:00Z' },
  { id:'ded-2', caseId:'case-2', caseNumber:'VIO-2026-0002', employeeId:'e2', employeeNameAr:'فاطمة علي', reasonAr:'الغياب بدون إذن', deductionKind:'day', amount:200, month:'2026-02', status:'ready', createdAt:'2026-02-05T00:00:00Z', updatedAt:'2026-02-05T00:00:00Z' },
  { id:'ded-3', caseId:'case-3', caseNumber:'VIO-2026-0003', employeeId:'e3', employeeNameAr:'خالد إبراهيم', reasonAr:'سوء السلوك', deductionKind:'day', amount:200, month:'2026-03', status:'ready', createdAt:'2026-03-01T00:00:00Z', updatedAt:'2026-03-01T00:00:00Z' },
];

interface DedState {
  deductions: HRDisciplinePayrollDeductionRecord[];
  add: (d: Omit<HRDisciplinePayrollDeductionRecord,'id'|'createdAt'|'updatedAt'>) => void;
  update: (id: string, patch: Partial<HRDisciplinePayrollDeductionRecord>) => void;
  remove: (id: string) => void;
  syncFromCase: (caseRecord: HRViolationCaseRecord, month: string) => void;
}

export const useHRDisciplinePayrollDeductionsStore = create<DedState>()(
  persist(
    (set, get) => ({
      deductions: SEED,
      add: (d) => set(s => ({ deductions: [...s.deductions, { ...d, id:uid(), createdAt:now(), updatedAt:now() }] })),
      update: (id, patch) => set(s => ({ deductions: s.deductions.map(d => d.id === id ? { ...d, ...patch, updatedAt:now() } : d) })),
      remove: (id) => set(s => ({ deductions: s.deductions.filter(d => d.id !== id) })),
      syncFromCase: (caseRecord, month) => {
        if (!caseRecord.typeHasDeduction || caseRecord.typeDeductionKind === 'none') return;
        const kind = caseRecord.typeDeductionKind;
        const val = caseRecord.typeDeductionValue;
        let amount = 0;
        if (kind === 'hours') amount = val * 25;
        else if (kind === 'day') amount = val * 200;
        else if (kind === 'amount') amount = val;
        const existing = get().deductions.find(d => d.caseId === caseRecord.id);
        if (existing) {
          set(s => ({ deductions: s.deductions.map(d => d.id === existing.id ? { ...d, amount, month, reasonAr: caseRecord.typeNameAr, updatedAt:now() } : d) }));
        } else {
          const rec: HRDisciplinePayrollDeductionRecord = {
            id: uid(), caseId: caseRecord.id, caseNumber: caseRecord.caseNumber,
            employeeId: caseRecord.employeeId, employeeNameAr: caseRecord.employeeNameAr,
            reasonAr: caseRecord.typeNameAr, deductionKind: kind, amount, month,
            status: 'ready', createdAt: now(), updatedAt: now(),
          };
          set(s => ({ deductions: [...s.deductions, rec] }));
        }
      },
    }),
    { name:'hr_discipline_payroll_deductions_v1', storage: createJSONStorage(() => localStorage), version:2 },
  ),
);
