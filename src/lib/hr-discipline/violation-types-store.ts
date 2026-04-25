import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRViolationTypeRecord } from './types';

function uid() { return `vt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function now() { return new Date().toISOString(); }

const SEED: HRViolationTypeRecord[] = [
  { id:'vt-1', code:'LATE', nameAr:'التأخر عن العمل', nameEn:'Late Arrival', sortOrder:1, isActive:true, hasDeduction:true, deductionKind:'hours', deductionValue:1, needsWarning:true, needsInvestigation:false, needsApproval:false, approvalTemplateId:null, updatedAt:'2026-01-01T00:00:00Z' },
  { id:'vt-2', code:'DRESS', nameAr:'مخالفة الزي الرسمي', nameEn:'Dress Code Violation', sortOrder:2, isActive:true, hasDeduction:false, deductionKind:'none', deductionValue:0, needsWarning:true, needsInvestigation:false, needsApproval:false, approvalTemplateId:null, updatedAt:'2026-01-01T00:00:00Z' },
  { id:'vt-3', code:'MIS', nameAr:'سوء السلوك', nameEn:'Misconduct', sortOrder:3, isActive:true, hasDeduction:true, deductionKind:'day', deductionValue:1, needsWarning:true, needsInvestigation:true, needsApproval:true, approvalTemplateId:null, updatedAt:'2026-01-01T00:00:00Z' },
  { id:'vt-4', code:'ABS_NX', nameAr:'الغياب بدون إذن', nameEn:'Absence Without Leave', sortOrder:4, isActive:true, hasDeduction:true, deductionKind:'day', deductionValue:1, needsWarning:false, needsInvestigation:true, needsApproval:true, approvalTemplateId:null, updatedAt:'2026-01-01T00:00:00Z' },
  { id:'vt-5', code:'EARLY', nameAr:'الانصراف المبكر', nameEn:'Early Departure', sortOrder:5, isActive:true, hasDeduction:true, deductionKind:'hours', deductionValue:1, needsWarning:false, needsInvestigation:false, needsApproval:false, approvalTemplateId:null, updatedAt:'2026-01-01T00:00:00Z' },
];

interface VTState {
  types: HRViolationTypeRecord[];
  add: (d: Omit<HRViolationTypeRecord,'id'|'updatedAt'>) => { ok:boolean; error?:string };
  update: (id:string, d: Partial<Omit<HRViolationTypeRecord,'id'>>) => { ok:boolean; error?:string };
  remove: (id:string) => void;
}

export const useHRViolationTypesStore = create<VTState>()(
  persist(
    (set, get) => ({
      types: SEED,
      add: (d) => {
        const code = d.code.toUpperCase().trim();
        if (!code) return { ok:false, error:'الرمز مطلوب' };
        if (!d.nameAr.trim()) return { ok:false, error:'الاسم بالعربية مطلوب' };
        if (get().types.find(t => t.code === code)) return { ok:false, error:'الرمز مستخدم مسبقاً' };
        set(s => ({ types: [...s.types, { ...d, code, id:uid(), updatedAt:now() }] }));
        return { ok:true };
      },
      update: (id, d) => {
        const code = d.code ? d.code.toUpperCase().trim() : undefined;
        if (code && get().types.find(t => t.code === code && t.id !== id)) return { ok:false, error:'الرمز مستخدم مسبقاً' };
        set(s => ({ types: s.types.map(t => t.id === id ? { ...t, ...d, ...(code ? {code} : {}), updatedAt:now() } : t) }));
        return { ok:true };
      },
      remove: (id) => set(s => ({ types: s.types.filter(t => t.id !== id) })),
    }),
    { name:'hr_violation_types_v1', storage: createJSONStorage(() => localStorage), version:3 },
  ),
);
