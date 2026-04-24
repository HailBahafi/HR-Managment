import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRRequestSubmissionRecord } from './types';

function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

const SEED: HRRequestSubmissionRecord[] = [
  {
    id: 'sub-001', createdAt: '2026-04-15T09:00:00Z',
    employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', employeeNameEn: 'Abdulrahman Al-Maliki',
    requestTypeId: 'rt-leave', requestTypeNameAr: 'طلب إجازة', requestTypeNameEn: 'Leave Request',
    departmentId: 'd1', departmentNameAr: 'الموارد البشرية', departmentNameEn: 'Human Resources',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'إجازة عائلية', 'f-start': '2026-05-01', 'f-end': '2026-05-07', 'f-urgent': false },
  },
  {
    id: 'sub-002', createdAt: '2026-04-16T11:30:00Z',
    employeeId: 'e2', employeeNameAr: 'ريم الشهراني', employeeNameEn: 'Reem Al-Shahrani',
    requestTypeId: 'rt-equipment', requestTypeNameAr: 'طلب معدات', requestTypeNameEn: 'Equipment Request',
    departmentId: 'd2', departmentNameAr: 'تقنية المعلومات', departmentNameEn: 'Information Technology',
    templateId: 'tpl-it',
    fieldValues: { 'f-issue': 'لابتوب متعطل', 'f-priority': 'high', 'f-device': 'DELL-XPS-009' },
  },
  {
    id: 'sub-003', createdAt: '2026-04-20T08:15:00Z',
    employeeId: 'e5', employeeNameAr: 'خالد العتيبي', employeeNameEn: 'Khalid Al-Otaibi',
    requestTypeId: 'rt-travel', requestTypeNameAr: 'طلب سفر', requestTypeNameEn: 'Travel Request',
    departmentId: 'd5', departmentNameAr: 'المبيعات', departmentNameEn: 'Sales',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'زيارة عميل في جدة', 'f-start': '2026-05-10', 'f-urgent': true },
  },
];

interface SubmissionsState {
  submissions: HRRequestSubmissionRecord[];
  addSubmission: (data: Omit<HRRequestSubmissionRecord, 'id' | 'createdAt'>) => void;
  deleteSubmission: (id: string) => void;
}

export const useHRRequestSubmissionsStore = create<SubmissionsState>()(
  persist(
    (set, get) => ({
      submissions: SEED,
      addSubmission: (data) => {
        const record: HRRequestSubmissionRecord = { ...data, id: `sub-${uid()}`, createdAt: new Date().toISOString() };
        set((s) => ({ submissions: [record, ...s.submissions] }));
      },
      deleteSubmission: (id) => set((s) => ({ submissions: s.submissions.filter(r => r.id !== id) })),
    }),
    {
      name: 'hr-request-submissions-storage',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const s = persisted as SubmissionsState;
        if (version < 2) return { ...s, submissions: s.submissions ?? SEED };
        return s;
      },
    },
  ),
);
