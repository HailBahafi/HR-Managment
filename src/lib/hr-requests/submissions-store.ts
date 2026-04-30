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
    fieldValues: { 'f-reason': 'إجازة سنوية عائلية', 'f-start': '2026-04-13', 'f-end': '2026-04-16', 'f-urgent': false },
  },
  {
    id: 'sub-e1-002', createdAt: '2026-02-10T10:30:00Z',
    employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', employeeNameEn: 'Abdulrahman Al-Maliki',
    requestTypeId: 'rt-sick', requestTypeNameAr: 'إجازة مرضية', requestTypeNameEn: 'Sick Leave',
    departmentId: 'd1', departmentNameAr: 'الموارد البشرية', departmentNameEn: 'Human Resources',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'التهاب حاد', 'f-start': '2026-02-11', 'f-end': '2026-02-11', 'f-urgent': true },
  },
  {
    id: 'sub-e1-003', createdAt: '2026-03-08T08:45:00Z',
    employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', employeeNameEn: 'Abdulrahman Al-Maliki',
    requestTypeId: 'rt-equipment', requestTypeNameAr: 'طلب معدات', requestTypeNameEn: 'Equipment Request',
    departmentId: 'd1', departmentNameAr: 'الموارد البشرية', departmentNameEn: 'Human Resources',
    templateId: 'tpl-general',
    fieldValues: { 'f-issue': 'طلب ماوس وكيبورد جديد', 'f-priority': 'normal' },
  },
  {
    id: 'sub-e1-004', createdAt: '2026-01-20T09:00:00Z',
    employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', employeeNameEn: 'Abdulrahman Al-Maliki',
    requestTypeId: 'rt-travel', requestTypeNameAr: 'طلب سفر', requestTypeNameEn: 'Travel Request',
    departmentId: 'd1', departmentNameAr: 'الموارد البشرية', departmentNameEn: 'Human Resources',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'حضور ورشة عمل في جدة', 'f-start': '2026-01-25', 'f-end': '2026-01-27', 'f-urgent': false },
  },
  {
    id: 'sub-e1-005', createdAt: '2026-04-25T11:00:00Z',
    employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', employeeNameEn: 'Abdulrahman Al-Maliki',
    requestTypeId: 'rt-certificate', requestTypeNameAr: 'طلب شهادة راتب', requestTypeNameEn: 'Salary Certificate',
    departmentId: 'd1', departmentNameAr: 'الموارد البشرية', departmentNameEn: 'Human Resources',
    templateId: null,
    fieldValues: { 'f-purpose': 'بنك الراجحي - قرض عقاري' },
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
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        if (version < 3) return { submissions: SEED };
        return persisted as SubmissionsState;
      },
    },
  ),
);
