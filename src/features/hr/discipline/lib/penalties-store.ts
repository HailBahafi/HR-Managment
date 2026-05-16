import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRDisciplinePenaltyRecord } from './types';

const SEED: HRDisciplinePenaltyRecord[] = [
  { id:'pen-1', employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', caseId:'case-1',  caseNumber:'VIO-2026-0001', penaltyType:'warning',                    decisionDate:'2026-01-10', notes:'تحذير شفهي أمام المدير المباشر.',                                      createdAt:'2026-01-10T09:00:00Z' },
  { id:'pen-2', employeeId:'e3', employeeNameAr:'فهد العنزي',         caseId:'case-3',  caseNumber:'VIO-2026-0003', penaltyType:'reprimand',                  decisionDate:'2026-03-10', notes:'خصم يوم من الراتب وتوبيخ رسمي.',                            createdAt:'2026-03-10T10:00:00Z' },
  { id:'pen-3', employeeId:'e4', employeeNameAr:'لينا الحربي',        caseId:'case-5',  caseNumber:'VIO-2026-0005', penaltyType:'monetary',                   decisionDate:'2026-03-18', notes:'غرامة مالية 500 ريال وتقييد صلاحيات الوصول.',                   createdAt:'2026-03-18T08:00:00Z' },
  { id:'pen-4', employeeId:'e5', employeeNameAr:'سلطان الدوسري',      caseId:'case-6',  caseNumber:'VIO-2026-0006', penaltyType:'warning',                    decisionDate:'2026-03-22', notes:'إنذار خطي رسمي وخصم يومين.',                              createdAt:'2026-03-22T09:00:00Z' },
  { id:'pen-5', employeeId:'e5', employeeNameAr:'سلطان الدوسري',      caseId:'case-10', caseNumber:'VIO-2026-0010', penaltyType:'monetary',                   decisionDate:'2026-04-01', notes:'غرامة 1000 ريال وتقييد صلاحية الإنترنت.',                   createdAt:'2026-04-01T10:00:00Z' },
  { id:'pen-6', employeeId:'e3', employeeNameAr:'فهد العنزي',         caseId:'case-9',  caseNumber:'VIO-2026-0009', penaltyType:'warning',                    decisionDate:'2026-04-01', notes:'إنذار نهائي مع خصم ثلاثة أيام من الراتب.',              createdAt:'2026-04-01T11:00:00Z' },
  { id:'pen-7', employeeId:'e6', employeeNameAr:'هدى العمري',         caseId:'case-18', caseNumber:'VIO-2026-0018', penaltyType:'reprimand',                  decisionDate:'2026-04-14', notes:'توبيخ رسمي وخصم 300 ريال.',                                    createdAt:'2026-04-14T08:30:00Z' },
  { id:'pen-8', employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', caseId:'case-19', caseNumber:'VIO-2026-0019', penaltyType:'termination_recommendation', decisionDate:'2026-04-16', notes:'خصم 1500 ريال وتوصية بإنهاء الخدمة حسب اللوائح.', createdAt:'2026-04-16T09:00:00Z' },
];

function uid() { return `pen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function now() { return new Date().toISOString(); }

interface PenaltiesState {
  penalties: HRDisciplinePenaltyRecord[];
  add: (d: Omit<HRDisciplinePenaltyRecord,'id'|'createdAt'>) => void;
  remove: (id: string) => void;
}

export const useHRDisciplinePenaltiesStore = create<PenaltiesState>()(
  persist(
    (set) => ({
      penalties: SEED,
      add: (d) => set(s => ({ penalties: [...s.penalties, { ...d, id:uid(), createdAt:now() }] })),
      remove: (id) => set(s => ({ penalties: s.penalties.filter(p => p.id !== id) })),
    }),
    { name:'hr_discipline_penalties_v1', storage: createJSONStorage(() => localStorage), version:2, migrate: () => ({ penalties: SEED }) },
  ),
);
