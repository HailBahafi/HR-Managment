import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  HRRequestSubmissionRecord,
  HRSubmissionApprovalSnapshot,
  HRSubmissionApprovalStageState,
} from './types';

function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

const TPL_STANDARD_AR = 'سلسلة الموافقة القياسية';
const TPL_FAST_AR = 'موافقة سريعة';

const SNAP_STANDARD_IN_PROGRESS: HRSubmissionApprovalSnapshot = {
  assignmentTemplateId: 'aat-standard',
  assignmentTemplateNameAr: TPL_STANDARD_AR,
  stages: [
    { stageId: 'ats-1', mode: 'sequential', approverEmployeeIds: ['e1'], approverNamesAr: ['عبدالرحمن المالكي'], state: 'approved' },
    { stageId: 'ats-2', mode: 'sequential', approverEmployeeIds: ['e2'], approverNamesAr: ['ريم الشهراني'], state: 'pending' },
  ],
};

const SNAP_STANDARD_ALL_DONE: HRSubmissionApprovalSnapshot = {
  assignmentTemplateId: 'aat-standard',
  assignmentTemplateNameAr: TPL_STANDARD_AR,
  stages: [
    { stageId: 'ats-1', mode: 'sequential', approverEmployeeIds: ['e1'], approverNamesAr: ['عبدالرحمن المالكي'], state: 'approved' },
    { stageId: 'ats-2', mode: 'sequential', approverEmployeeIds: ['e2'], approverNamesAr: ['ريم الشهراني'], state: 'approved' },
  ],
};

const SNAP_STANDARD_REJECTED: HRSubmissionApprovalSnapshot = {
  assignmentTemplateId: 'aat-standard',
  assignmentTemplateNameAr: TPL_STANDARD_AR,
  stages: [
    { stageId: 'ats-1', mode: 'sequential', approverEmployeeIds: ['e1'], approverNamesAr: ['عبدالرحمن المالكي'], state: 'approved' },
    { stageId: 'ats-2', mode: 'sequential', approverEmployeeIds: ['e2'], approverNamesAr: ['ريم الشهراني'], state: 'rejected' },
  ],
};

const SNAP_STANDARD_PENDING_FIRST: HRSubmissionApprovalSnapshot = {
  assignmentTemplateId: 'aat-standard',
  assignmentTemplateNameAr: TPL_STANDARD_AR,
  stages: [
    { stageId: 'ats-1', mode: 'sequential', approverEmployeeIds: ['e1'], approverNamesAr: ['عبدالرحمن المالكي'], state: 'pending' },
    { stageId: 'ats-2', mode: 'sequential', approverEmployeeIds: ['e2'], approverNamesAr: ['ريم الشهراني'], state: 'pending' },
  ],
};

const SNAP_FAST_PENDING: HRSubmissionApprovalSnapshot = {
  assignmentTemplateId: 'aat-fast',
  assignmentTemplateNameAr: TPL_FAST_AR,
  stages: [
    { stageId: 'ats-3', mode: 'any_one', approverEmployeeIds: ['e1', 'e3'], approverNamesAr: ['عبدالرحمن المالكي', 'فهد العنزي'], state: 'pending' },
  ],
};

const SNAP_FAST_APPROVED: HRSubmissionApprovalSnapshot = {
  assignmentTemplateId: 'aat-fast',
  assignmentTemplateNameAr: TPL_FAST_AR,
  stages: [
    { stageId: 'ats-3', mode: 'any_one', approverEmployeeIds: ['e1', 'e3'], approverNamesAr: ['عبدالرحمن المالكي', 'فهد العنزي'], state: 'approved' },
  ],
};

const TPL_DOUBLE_SAME_AR = 'موافقتان متتابعتان (نفس المعتمد)';

/** مرحلتان لنفس المعتمد e1 — يظهر صفّا موافقة/رفض حتى يُكمّل الموافقتين */
const SNAP_DOUBLE_SAME_PENDING_FIRST: HRSubmissionApprovalSnapshot = {
  assignmentTemplateId: 'aat-double-same',
  assignmentTemplateNameAr: TPL_DOUBLE_SAME_AR,
  stages: [
    { stageId: 'ats-d1', mode: 'sequential', approverEmployeeIds: ['e1'], approverNamesAr: ['عبدالرحمن المالكي'], state: 'pending' },
    { stageId: 'ats-d2', mode: 'sequential', approverEmployeeIds: ['e1'], approverNamesAr: ['عبدالرحمن المالكي'], state: 'pending' },
  ],
};

const SNAP_DOUBLE_SAME_STAGE2_PENDING: HRSubmissionApprovalSnapshot = {
  assignmentTemplateId: 'aat-double-same',
  assignmentTemplateNameAr: TPL_DOUBLE_SAME_AR,
  stages: [
    { stageId: 'ats-d1', mode: 'sequential', approverEmployeeIds: ['e1'], approverNamesAr: ['عبدالرحمن المالكي'], state: 'approved' },
    { stageId: 'ats-d2', mode: 'sequential', approverEmployeeIds: ['e1'], approverNamesAr: ['عبدالرحمن المالكي'], state: 'pending' },
  ],
};

const SNAP_DOUBLE_SAME_ALL_DONE: HRSubmissionApprovalSnapshot = {
  assignmentTemplateId: 'aat-double-same',
  assignmentTemplateNameAr: TPL_DOUBLE_SAME_AR,
  stages: [
    { stageId: 'ats-d1', mode: 'sequential', approverEmployeeIds: ['e1'], approverNamesAr: ['عبدالرحمن المالكي'], state: 'approved' },
    { stageId: 'ats-d2', mode: 'sequential', approverEmployeeIds: ['e1'], approverNamesAr: ['عبدالرحمن المالكي'], state: 'approved' },
  ],
};

const SEED: HRRequestSubmissionRecord[] = [
  {
    id: 'sub-001', createdAt: '2026-04-15T09:00:00Z',
    employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', employeeNameEn: 'Abdulrahman Al-Maliki',
    requestTypeId: 'rt-leave', requestTypeNameAr: 'طلب إجازة', requestTypeNameEn: 'Leave Request',
    departmentId: 'd1', departmentNameAr: 'الموارد البشرية', departmentNameEn: 'Human Resources',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'إجازة سنوية عائلية', 'f-start': '2026-04-13', 'f-end': '2026-04-16', 'f-urgent': false },
    approvalSnapshot: SNAP_STANDARD_IN_PROGRESS,
  },
  {
    id: 'sub-e1-002', createdAt: '2026-02-10T10:30:00Z',
    employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', employeeNameEn: 'Abdulrahman Al-Maliki',
    requestTypeId: 'rt-sick', requestTypeNameAr: 'إجازة مرضية', requestTypeNameEn: 'Sick Leave',
    departmentId: 'd1', departmentNameAr: 'الموارد البشرية', departmentNameEn: 'Human Resources',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'التهاب حاد', 'f-start': '2026-02-11', 'f-end': '2026-02-11', 'f-urgent': true },
    approvalSnapshot: SNAP_FAST_PENDING,
  },
  {
    id: 'sub-e1-003', createdAt: '2026-03-08T08:45:00Z',
    employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', employeeNameEn: 'Abdulrahman Al-Maliki',
    requestTypeId: 'rt-equipment', requestTypeNameAr: 'طلب معدات', requestTypeNameEn: 'Equipment Request',
    departmentId: 'd1', departmentNameAr: 'الموارد البشرية', departmentNameEn: 'Human Resources',
    templateId: 'tpl-it',
    fieldValues: { 'f-issue': 'طلب ماوس وكيبورد جديد', 'f-priority': 'medium', 'f-device': '' },
    approvalSnapshot: SNAP_STANDARD_ALL_DONE,
  },
  {
    id: 'sub-e1-004', createdAt: '2026-01-20T09:00:00Z',
    employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', employeeNameEn: 'Abdulrahman Al-Maliki',
    requestTypeId: 'rt-travel', requestTypeNameAr: 'طلب سفر', requestTypeNameEn: 'Travel Request',
    departmentId: 'd1', departmentNameAr: 'الموارد البشرية', departmentNameEn: 'Human Resources',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'حضور ورشة عمل في جدة', 'f-start': '2026-01-25', 'f-end': '2026-01-27', 'f-urgent': false },
    approvalSnapshot: SNAP_FAST_APPROVED,
  },
  {
    id: 'sub-e1-005', createdAt: '2026-04-25T11:00:00Z',
    employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', employeeNameEn: 'Abdulrahman Al-Maliki',
    requestTypeId: 'rt-certificate', requestTypeNameAr: 'طلب شهادة راتب', requestTypeNameEn: 'Salary Certificate',
    departmentId: 'd1', departmentNameAr: 'الموارد البشرية', departmentNameEn: 'Human Resources',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'بنك الراجحي — قرض عقاري', 'f-start': '2026-04-26', 'f-urgent': false },
    approvalSnapshot: SNAP_STANDARD_REJECTED,
  },
  {
    id: 'sub-002', createdAt: '2026-04-16T11:30:00Z',
    employeeId: 'e2', employeeNameAr: 'ريم الشهراني', employeeNameEn: 'Reem Al-Shahrani',
    requestTypeId: 'rt-equipment', requestTypeNameAr: 'طلب معدات', requestTypeNameEn: 'Equipment Request',
    departmentId: 'd2', departmentNameAr: 'تقنية المعلومات', departmentNameEn: 'Information Technology',
    templateId: 'tpl-it',
    fieldValues: { 'f-issue': 'لابتوب متعطل', 'f-priority': 'high', 'f-device': 'DELL-XPS-009' },
    approvalSnapshot: SNAP_STANDARD_PENDING_FIRST,
  },
  {
    id: 'sub-003', createdAt: '2026-04-20T08:15:00Z',
    employeeId: 'e5', employeeNameAr: 'خالد العتيبي', employeeNameEn: 'Khalid Al-Otaibi',
    requestTypeId: 'rt-travel', requestTypeNameAr: 'طلب سفر', requestTypeNameEn: 'Travel Request',
    departmentId: 'd5', departmentNameAr: 'المبيعات', departmentNameEn: 'Sales',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'زيارة عميل في جدة', 'f-start': '2026-05-10', 'f-urgent': true },
    approvalSnapshot: SNAP_FAST_PENDING,
  },
  {
    id: 'sub-dual-01', createdAt: '2026-04-28T08:00:00Z',
    employeeId: 'e6', employeeNameAr: 'هدى العمري', employeeNameEn: 'Huda Al-Amri',
    requestTypeId: 'rt-equipment', requestTypeNameAr: 'طلب معدات', requestTypeNameEn: 'Equipment Request',
    departmentId: 'd2', departmentNameAr: 'تقنية المعلومات', departmentNameEn: 'Information Technology',
    templateId: 'tpl-it',
    fieldValues: { 'f-issue': 'شاشة ثانية للعمل عن بُعد', 'f-priority': 'medium', 'f-device': '' },
    approvalSnapshot: SNAP_DOUBLE_SAME_PENDING_FIRST,
  },
  {
    id: 'sub-dual-02', createdAt: '2026-04-27T14:20:00Z',
    employeeId: 'e4', employeeNameAr: 'لينا الحربي', employeeNameEn: 'Lina Al-Harbi',
    requestTypeId: 'rt-leave', requestTypeNameAr: 'طلب إجازة', requestTypeNameEn: 'Leave Request',
    departmentId: 'd4', departmentNameAr: 'التسويق', departmentNameEn: 'Marketing',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'مؤتمر تسويقي — دبي', 'f-start': '2026-05-12', 'f-end': '2026-05-14', 'f-urgent': false },
    approvalSnapshot: SNAP_DOUBLE_SAME_STAGE2_PENDING,
  },
  {
    id: 'sub-dual-03', createdAt: '2026-04-22T09:30:00Z',
    employeeId: 'e7', employeeNameAr: 'يوسف الزهراني', employeeNameEn: 'Yousef Al-Zahrani',
    requestTypeId: 'rt-certificate', requestTypeNameAr: 'طلب شهادة راتب', requestTypeNameEn: 'Salary Certificate',
    departmentId: 'd3', departmentNameAr: 'المالية والمحاسبة', departmentNameEn: 'Finance & Accounting',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'جهة تمويل', 'f-start': '2026-04-23', 'f-urgent': false },
    approvalSnapshot: SNAP_DOUBLE_SAME_ALL_DONE,
  },
  {
    id: 'sub-dual-04', createdAt: '2026-04-26T11:10:00Z',
    employeeId: 'e8', employeeNameAr: 'مها السبيعي', employeeNameEn: 'Maha Al-Subaie',
    requestTypeId: 'rt-sick', requestTypeNameAr: 'إجازة مرضية', requestTypeNameEn: 'Sick Leave',
    departmentId: 'd4', departmentNameAr: 'التسويق', departmentNameEn: 'Marketing',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'زكام حاد مع حمى', 'f-start': '2026-04-27', 'f-end': '2026-04-28', 'f-urgent': true },
    approvalSnapshot: SNAP_DOUBLE_SAME_PENDING_FIRST,
  },
  {
    id: 'sub-dual-05', createdAt: '2026-04-25T07:45:00Z',
    employeeId: 'e9', employeeNameAr: 'ماجد البقمي', employeeNameEn: 'Majed Al-Baqami',
    requestTypeId: 'rt-travel', requestTypeNameAr: 'طلب سفر', requestTypeNameEn: 'Travel Request',
    departmentId: 'd5', departmentNameAr: 'المبيعات', departmentNameEn: 'Sales',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'معرض الرياض الدولي', 'f-start': '2026-05-05', 'f-end': '2026-05-07', 'f-urgent': false },
    approvalSnapshot: SNAP_STANDARD_PENDING_FIRST,
  },
  {
    id: 'sub-dual-06', createdAt: '2026-04-24T16:00:00Z',
    employeeId: 'e10', employeeNameAr: 'أمل الخالدي', employeeNameEn: 'Amal Al-Khaldi',
    requestTypeId: 'rt-certificate', requestTypeNameAr: 'طلب شهادة راتب', requestTypeNameEn: 'Salary Certificate',
    departmentId: 'd1', departmentNameAr: 'الموارد البشرية', departmentNameEn: 'Human Resources',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'تأشيرة زيارة عائلية', 'f-start': '2026-04-25', 'f-urgent': true },
    approvalSnapshot: SNAP_DOUBLE_SAME_STAGE2_PENDING,
  },
  {
    id: 'sub-dual-07', createdAt: '2026-04-23T10:15:00Z',
    employeeId: 'e3', employeeNameAr: 'فهد العنزي', employeeNameEn: 'Fahad Al-Anzi',
    requestTypeId: 'rt-sick', requestTypeNameAr: 'إجازة مرضية', requestTypeNameEn: 'Sick Leave',
    departmentId: 'd3', departmentNameAr: 'المالية والمحاسبة', departmentNameEn: 'Finance & Accounting',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'موعد مستشفى', 'f-start': '2026-04-24', 'f-end': '2026-04-24', 'f-urgent': false },
    approvalSnapshot: SNAP_STANDARD_PENDING_FIRST,
  },
  {
    id: 'sub-dual-08', createdAt: '2026-04-21T13:40:00Z',
    employeeId: 'e11', employeeNameAr: 'بدر الشمراني', employeeNameEn: 'Badr Al-Shamrani',
    requestTypeId: 'rt-leave', requestTypeNameAr: 'طلب إجازة', requestTypeNameEn: 'Leave Request',
    departmentId: 'd2', departmentNameAr: 'تقنية المعلومات', departmentNameEn: 'Information Technology',
    templateId: 'tpl-general',
    fieldValues: { 'f-reason': 'عطلة نهاية أسبوع ممتدة', 'f-start': '2026-05-01', 'f-end': '2026-05-03', 'f-urgent': false },
    approvalSnapshot: SNAP_DOUBLE_SAME_PENDING_FIRST,
  },
];

interface SubmissionsState {
  submissions: HRRequestSubmissionRecord[];
  addSubmission: (data: Omit<HRRequestSubmissionRecord, 'id' | 'createdAt'>) => void;
  deleteSubmission: (id: string) => void;
  patchSubmissionApprovalStage: (
    submissionId: string,
    stageIndex: number,
    state: HRSubmissionApprovalStageState,
  ) => void;
}

export const useHRRequestSubmissionsStore = create<SubmissionsState>()(
  persist(
    (set) => ({
      submissions: SEED,
      addSubmission: (data) => {
        const record: HRRequestSubmissionRecord = { ...data, id: `sub-${uid()}`, createdAt: new Date().toISOString() };
        set((s) => ({ submissions: [record, ...s.submissions] }));
      },
      deleteSubmission: (id) => set((s) => ({ submissions: s.submissions.filter(r => r.id !== id) })),
      patchSubmissionApprovalStage: (submissionId, stageIndex, state) => {
        set((s) => ({
          submissions: s.submissions.map((sub) => {
            if (sub.id !== submissionId || !sub.approvalSnapshot) return sub;
            const stages = sub.approvalSnapshot.stages.map((st, i) =>
              i === stageIndex ? { ...st, state } : st,
            );
            return { ...sub, approvalSnapshot: { ...sub.approvalSnapshot, stages } };
          }),
        }));
      },
    }),
    {
      name: 'hr-request-submissions-storage',
      storage: createJSONStorage(() => localStorage),
      version: 6,
      migrate: (persisted: unknown, version: number) => {
        if (version < 6) return { submissions: SEED };
        return persisted as { submissions: HRRequestSubmissionRecord[] };
      },
    },
  ),
);
