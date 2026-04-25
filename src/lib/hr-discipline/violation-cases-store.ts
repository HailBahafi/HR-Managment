import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRViolationCaseRecord, HRApproverRole } from './types';

function uid() { return `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function now() { return new Date().toISOString(); }

function buildApproversQueue(needsApproval: boolean, templateStageCount: number): HRApproverRole[] {
  if (!needsApproval) return [];
  const roles: HRApproverRole[] = ['manager', 'hr', 'executive'];
  const count = Math.min(Math.max(templateStageCount || 3, 1), 3);
  return roles.slice(0, count);
}

const SEED: HRViolationCaseRecord[] = [
  {
    id:'case-1', caseNumber:'VIO-2026-0001',
    employeeId:'e1', employeeNameAr:'أحمد محمد', employeeNameEn:'Ahmed Mohammed',
    date:'2026-01-08', description:'تأخر 45 دقيقة عن موعد الدوام الرسمي', notes:'', attachmentsNote:'',
    violationTypeId:'vt-1', typeCode:'LATE', typeNameAr:'التأخر عن العمل',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:false,
    approvalTemplateId:null, status:'approved', requiredApprovers:[], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:true, createdAt:'2026-01-08T09:00:00Z', updatedAt:'2026-01-08T10:00:00Z',
  },
  {
    id:'case-2', caseNumber:'VIO-2026-0002',
    employeeId:'e2', employeeNameAr:'فاطمة علي', employeeNameEn:'Fatima Ali',
    date:'2026-02-03', description:'غياب يوم كامل بدون إذن مسبق', notes:'تم التواصل مع الموظفة ولم يُبلَّغ', attachmentsNote:'',
    violationTypeId:'vt-4', typeCode:'ABS_NX', typeNameAr:'الغياب بدون إذن',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:false, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'تمت المراجعة', at:'2026-02-04T08:00:00Z' }],
    postedToPayroll:false, createdAt:'2026-02-03T14:00:00Z', updatedAt:'2026-02-04T08:00:00Z',
  },
  {
    id:'case-3', caseNumber:'VIO-2026-0003',
    employeeId:'e3', employeeNameAr:'خالد إبراهيم', employeeNameEn:'Khalid Ibrahim',
    date:'2026-02-28', description:'سوء سلوك مع زميل في العمل', notes:'شهادة شهود متوفرة', attachmentsNote:'تقرير الشهود',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'draft', requiredApprovers:[], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-03-01T10:00:00Z', updatedAt:'2026-03-01T10:00:00Z',
  },
];

interface CasesState {
  cases: HRViolationCaseRecord[];
  _seq: number;
  add: (draft: Omit<HRViolationCaseRecord,'id'|'caseNumber'|'status'|'requiredApprovers'|'currentApprovalIndex'|'approvalLog'|'postedToPayroll'|'createdAt'|'updatedAt'>) => { ok:boolean; id?:string; error?:string };
  submit: (id: string) => { ok:boolean; error?:string };
  approve: (id: string, role: HRApproverRole, note?: string) => { ok:boolean; error?:string };
  reject: (id: string, role: HRApproverRole, note?: string) => { ok:boolean; error?:string };
  requestEdit: (id: string, role: HRApproverRole, note: string) => { ok:boolean; error?:string };
  update: (id: string, patch: Partial<HRViolationCaseRecord>) => void;
  remove: (id: string) => void;
  markPayrollPosted: (id: string) => void;
}

export const useHRViolationCasesStore = create<CasesState>()(
  persist(
    (set, get) => ({
      cases: SEED,
      _seq: 3,

      add: (draft) => {
        const state = get();
        const newSeq = state._seq + 1;
        const year = new Date().getFullYear();
        const caseNumber = `VIO-${year}-${String(newSeq).padStart(4,'0')}`;
        const approvers = buildApproversQueue(draft.typeNeedsApproval, draft.approvalTemplateId ? 2 : 3);
        const rec: HRViolationCaseRecord = {
          ...draft, id:uid(), caseNumber, status:'draft',
          requiredApprovers: approvers, currentApprovalIndex:0,
          approvalLog:[], postedToPayroll:false,
          createdAt:now(), updatedAt:now(),
        };
        set(s => ({ cases:[...s.cases, rec], _seq: newSeq }));
        return { ok:true, id: rec.id };
      },

      submit: (id) => {
        const c = get().cases.find(x => x.id === id);
        if (!c) return { ok:false, error:'القضية غير موجودة' };
        if (!c.typeNeedsApproval) {
          // auto approve
          set(s => ({ cases: s.cases.map(x => x.id === id ? { ...x, status:'approved', updatedAt:now() } : x) }));
          const updated = get().cases.find(x => x.id === id)!;
          if (updated.typeHasDeduction) {
            const month = new Date().toISOString().slice(0,7);
            import('./payroll-deductions-store').then(m => m.useHRDisciplinePayrollDeductionsStore.getState().syncFromCase(updated, month));
          }
        } else {
          set(s => ({ cases: s.cases.map(x => x.id === id ? { ...x, status:'under_review', updatedAt:now() } : x) }));
        }
        return { ok:true };
      },

      approve: (id, role, note) => {
        const c = get().cases.find(x => x.id === id);
        if (!c) return { ok:false, error:'القضية غير موجودة' };
        const logEntry = { role, action: 'approved' as const, note, at: now() };
        const newIndex = c.currentApprovalIndex + 1;
        const isLast = newIndex >= c.requiredApprovers.length;
        const newStatus = isLast ? 'approved' : 'under_review';
        set(s => ({
          cases: s.cases.map(x => x.id === id ? {
            ...x, status: newStatus as HRViolationCaseRecord['status'],
            currentApprovalIndex: newIndex,
            approvalLog: [...x.approvalLog, logEntry],
            updatedAt: now(),
          } : x),
        }));
        if (isLast) {
          const updated = get().cases.find(x => x.id === id)!;
          if (updated.typeHasDeduction) {
            const month = new Date().toISOString().slice(0,7);
            import('./payroll-deductions-store').then(m => m.useHRDisciplinePayrollDeductionsStore.getState().syncFromCase(updated, month));
          }
        }
        return { ok:true };
      },

      reject: (id, role, note) => {
        const logEntry = { role, action: 'rejected' as const, note, at: now() };
        set(s => ({
          cases: s.cases.map(x => x.id === id ? {
            ...x, status: 'rejected' as const,
            approvalLog: [...x.approvalLog, logEntry],
            updatedAt: now(),
          } : x),
        }));
        return { ok:true };
      },

      requestEdit: (id, role, note) => {
        const logEntry = { role, action: 'edit_requested' as const, note, at: now() };
        set(s => ({
          cases: s.cases.map(x => x.id === id ? {
            ...x, status: 'draft' as const,
            approvalLog: [...x.approvalLog, logEntry],
            updatedAt: now(),
          } : x),
        }));
        return { ok:true };
      },

      update: (id, patch) => set(s => ({
        cases: s.cases.map(x => x.id === id ? { ...x, ...patch, updatedAt:now() } : x),
      })),

      remove: (id) => set(s => ({ cases: s.cases.filter(x => x.id !== id) })),

      markPayrollPosted: (id) => set(s => ({
        cases: s.cases.map(x => x.id === id ? { ...x, postedToPayroll:true, updatedAt:now() } : x),
      })),
    }),
    { name:'hr_discipline_cases_v1', storage: createJSONStorage(() => localStorage), version:2 },
  ),
);
