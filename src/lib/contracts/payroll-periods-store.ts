import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HRPayrollPeriodStatus = 'draft' | 'open' | 'closed';
export type HRPayrollCompensationReviewStatus = 'draft' | 'first_review' | 'second_review' | 'approved';

export type HRPayrollMonthlyInputKind =
  | 'absence_days'
  | 'late_minutes'
  | 'overtime_hours'
  | 'deduction_amount'
  | 'allowance_amount'
  | 'advance_recovery'
  | 'other';

export type HRPayrollMonthlyInput = {
  kind: HRPayrollMonthlyInputKind;
  value: number;
  note: string;
};

export type HRPayrollEmploymentLine = {
  id: string;
  sortOrder: number;
  employeeId: string;
  employeeNameAr: string;
  departmentSnapshot: string;
  jobTitleArSnapshot: string;
  baseSalarySnapshot: number;
  contractCurrency: string;
  contractId: string;
  contractNumber: string;
  capturedAt: string;
};

export type HRPayrollPeriodRecord = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  periodStart: string;
  periodEnd: string;
  status: HRPayrollPeriodStatus;
  compensationReviewStatus: HRPayrollCompensationReviewStatus;
  snapshotContractIds: string[];
  employmentLines: HRPayrollEmploymentLine[];
  linesMaterializedAt: string | null;
  employmentLineMonthlyInputs: Record<string, HRPayrollMonthlyInput[]>;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type HRPayrollPeriodDraft = Omit<HRPayrollPeriodRecord, 'id' | 'createdAt' | 'updatedAt'>;

const nowIso = () => new Date().toISOString();
function newId() { return `prd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`; }

/** ════════════════════════════════════════════════════════════════════════════
 *  Comprehensive mock data — 5 periods, 8 employees, full monthly inputs
 *  employees: e1–e8 matched against ctr-seed-1..13 in contracts-store
 * ════════════════════════════════════════════════════════════════════════════ */

// ── Jan 2025 ──────────────────────────────────────────────────────────────────
const SEED_LINES_JAN: HRPayrollEmploymentLine[] = [
  { id: 'prd1-el-1', sortOrder: 1, employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', departmentSnapshot: 'الموارد البشرية',   jobTitleArSnapshot: 'مدير الموارد البشرية',     baseSalarySnapshot: 12000, contractCurrency: 'SAR', contractId: 'ctr-seed-1',  contractNumber: 'CL-2024-001', capturedAt: '2025-01-28T10:00:00.000Z' },
  { id: 'prd1-el-2', sortOrder: 2, employeeId: 'e2', employeeNameAr: 'ريم الشهراني',       departmentSnapshot: 'تقنية المعلومات',   jobTitleArSnapshot: 'مدير تقنية المعلومات',     baseSalarySnapshot: 9000,  contractCurrency: 'SAR', contractId: 'ctr-seed-2',  contractNumber: 'CL-2024-002', capturedAt: '2025-01-28T10:00:00.000Z' },
  { id: 'prd1-el-3', sortOrder: 3, employeeId: 'e3', employeeNameAr: 'فهد العنزي',         departmentSnapshot: 'المالية والمحاسبة', jobTitleArSnapshot: 'المدير المالي',            baseSalarySnapshot: 7500,  contractCurrency: 'SAR', contractId: 'ctr-seed-3',  contractNumber: 'CL-2024-003', capturedAt: '2025-01-28T10:00:00.000Z' },
];
const SEED_INPUTS_JAN: Record<string, HRPayrollMonthlyInput[]> = {
  'prd1-el-1': [{ kind: 'overtime_hours', value: 600,  note: 'عمل إضافي — ورشة مستهدفة' }, { kind: 'late_minutes', value: 40,  note: 'تأخير' }],
  'prd1-el-2': [{ kind: 'allowance_amount', value: 500, note: 'مكافأة جهود' }, { kind: 'absence_days', value: 1, note: 'غياب' }],
  'prd1-el-3': [{ kind: 'overtime_hours', value: 375,  note: 'إغلاق حسابات يناير' }, { kind: 'late_minutes', value: 25, note: '' }],
};

// ── Feb 2025 ──────────────────────────────────────────────────────────────────
const SEED_LINES_FEB: HRPayrollEmploymentLine[] = [
  { id: 'prd2-el-1', sortOrder: 1, employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', departmentSnapshot: 'الموارد البشرية',   jobTitleArSnapshot: 'مدير الموارد البشرية',     baseSalarySnapshot: 12000, contractCurrency: 'SAR', contractId: 'ctr-seed-1',  contractNumber: 'CL-2024-001', capturedAt: '2025-02-25T10:00:00.000Z' },
  { id: 'prd2-el-2', sortOrder: 2, employeeId: 'e2', employeeNameAr: 'ريم الشهراني',       departmentSnapshot: 'تقنية المعلومات',   jobTitleArSnapshot: 'مدير تقنية المعلومات',     baseSalarySnapshot: 9000,  contractCurrency: 'SAR', contractId: 'ctr-seed-2',  contractNumber: 'CL-2024-002', capturedAt: '2025-02-25T10:00:00.000Z' },
  { id: 'prd2-el-3', sortOrder: 3, employeeId: 'e3', employeeNameAr: 'فهد العنزي',         departmentSnapshot: 'المالية والمحاسبة', jobTitleArSnapshot: 'المدير المالي',            baseSalarySnapshot: 7500,  contractCurrency: 'SAR', contractId: 'ctr-seed-3',  contractNumber: 'CL-2024-003', capturedAt: '2025-02-25T10:00:00.000Z' },
  { id: 'prd2-el-4', sortOrder: 4, employeeId: 'e4', employeeNameAr: 'لينا الحربي',        departmentSnapshot: 'التسويق',           jobTitleArSnapshot: 'مدير التسويق',             baseSalarySnapshot: 5500,  contractCurrency: 'SAR', contractId: 'ctr-seed-8',  contractNumber: 'CL-2025-004', capturedAt: '2025-02-25T10:00:00.000Z' },
  { id: 'prd2-el-5', sortOrder: 5, employeeId: 'e5', employeeNameAr: 'سلطان الدوسري',      departmentSnapshot: 'المبيعات',          jobTitleArSnapshot: 'مدير المبيعات',            baseSalarySnapshot: 6500,  contractCurrency: 'SAR', contractId: 'ctr-seed-9',  contractNumber: 'CL-2025-005', capturedAt: '2025-02-25T10:00:00.000Z' },
];
const SEED_INPUTS_FEB: Record<string, HRPayrollMonthlyInput[]> = {
  'prd2-el-1': [{ kind: 'overtime_hours', value: 900,  note: 'عمل إضافي — نهاية أسبوع' }, { kind: 'allowance_amount', value: 1500, note: 'مكافأة أداء' }, { kind: 'absence_days', value: 0.5, note: 'غياب جزئي' }, { kind: 'late_minutes', value: 60, note: 'تأخير' }],
  'prd2-el-2': [{ kind: 'overtime_hours', value: 450,  note: 'تحديث بنية تقنية' }, { kind: 'deduction_amount', value: 300, note: 'جزاء إداري' }],
  'prd2-el-3': [{ kind: 'allowance_amount', value: 1200, note: 'بدل طوارئ مشروع' }, { kind: 'absence_days', value: 1, note: '' }, { kind: 'late_minutes', value: 30, note: '' }],
  'prd2-el-4': [{ kind: 'late_minutes', value: 90,    note: 'تأخير متكرر' }, { kind: 'deduction_amount', value: 300, note: 'جزاء إداري — تأخير تسليم' }],
  'prd2-el-5': [{ kind: 'overtime_hours', value: 488,  note: 'تغطية نهاية الأسبوع' }, { kind: 'allowance_amount', value: 800, note: 'مكافأة تجاوز المبيعات' }],
};

// ── Mar 2025 — 8 employees, comprehensive ────────────────────────────────────
const SEED_LINES_MAR: HRPayrollEmploymentLine[] = [
  { id: 'prd3-el-1', sortOrder: 1, employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', departmentSnapshot: 'الموارد البشرية',   jobTitleArSnapshot: 'مدير الموارد البشرية',     baseSalarySnapshot: 12000, contractCurrency: 'SAR', contractId: 'ctr-seed-1',  contractNumber: 'CL-2024-001', capturedAt: '2025-03-02T10:00:00.000Z' },
  { id: 'prd3-el-2', sortOrder: 2, employeeId: 'e2', employeeNameAr: 'ريم الشهراني',       departmentSnapshot: 'تقنية المعلومات',   jobTitleArSnapshot: 'مدير تقنية المعلومات',     baseSalarySnapshot: 9000,  contractCurrency: 'SAR', contractId: 'ctr-seed-2',  contractNumber: 'CL-2024-002', capturedAt: '2025-03-02T10:00:00.000Z' },
  { id: 'prd3-el-3', sortOrder: 3, employeeId: 'e3', employeeNameAr: 'فهد العنزي',         departmentSnapshot: 'المالية والمحاسبة', jobTitleArSnapshot: 'المدير المالي',            baseSalarySnapshot: 7500,  contractCurrency: 'SAR', contractId: 'ctr-seed-3',  contractNumber: 'CL-2024-003', capturedAt: '2025-03-02T10:00:00.000Z' },
  { id: 'prd3-el-4', sortOrder: 4, employeeId: 'e4', employeeNameAr: 'لينا الحربي',        departmentSnapshot: 'التسويق',           jobTitleArSnapshot: 'مدير التسويق',             baseSalarySnapshot: 5500,  contractCurrency: 'SAR', contractId: 'ctr-seed-8',  contractNumber: 'CL-2025-004', capturedAt: '2025-03-02T10:00:00.000Z' },
  { id: 'prd3-el-5', sortOrder: 5, employeeId: 'e5', employeeNameAr: 'سلطان الدوسري',      departmentSnapshot: 'المبيعات',          jobTitleArSnapshot: 'مدير المبيعات',            baseSalarySnapshot: 6500,  contractCurrency: 'SAR', contractId: 'ctr-seed-9',  contractNumber: 'CL-2025-005', capturedAt: '2025-03-02T10:00:00.000Z' },
  { id: 'prd3-el-6', sortOrder: 6, employeeId: 'e6', employeeNameAr: 'هدى العمري',         departmentSnapshot: 'العمليات',          jobTitleArSnapshot: 'مدير العمليات',            baseSalarySnapshot: 8500,  contractCurrency: 'SAR', contractId: 'ctr-seed-10', contractNumber: 'CL-2025-006', capturedAt: '2025-03-02T10:00:00.000Z' },
  { id: 'prd3-el-7', sortOrder: 7, employeeId: 'e7', employeeNameAr: 'يوسف الزهراني',      departmentSnapshot: 'خدمة العملاء',      jobTitleArSnapshot: 'مدير خدمة العملاء',        baseSalarySnapshot: 7200,  contractCurrency: 'SAR', contractId: 'ctr-seed-11', contractNumber: 'CL-2025-007', capturedAt: '2025-03-02T10:00:00.000Z' },
  { id: 'prd3-el-8', sortOrder: 8, employeeId: 'e8', employeeNameAr: 'مها السبيعي',        departmentSnapshot: 'الجودة',            jobTitleArSnapshot: 'مدير الجودة',              baseSalarySnapshot: 6800,  contractCurrency: 'SAR', contractId: 'ctr-seed-12', contractNumber: 'CL-2025-008', capturedAt: '2025-03-02T10:00:00.000Z' },
];
const SEED_INPUTS_MAR: Record<string, HRPayrollMonthlyInput[]> = {
  'prd3-el-1': [{ kind: 'overtime_hours', value: 750,  note: 'اجتماعات تطوير الكوادر' },     { kind: 'allowance_amount', value: 1500, note: 'مكافأة أداء ربعية' },         { kind: 'late_minutes', value: 50,  note: 'تأخير' }],
  'prd3-el-2': [{ kind: 'absence_days',   value: 2,    note: 'إجازة مرضية' },                 { kind: 'deduction_amount', value: 500, note: 'خصم جزاء — إطلاق نظام' },    { kind: 'late_minutes', value: 120, note: 'تأخير متكرر' }],
  'prd3-el-3': [{ kind: 'overtime_hours', value: 375,  note: 'إعداد القوائم المالية' },       { kind: 'allowance_amount', value: 1200, note: 'بدل مشروع مالي طارئ' }],
  'prd3-el-4': [{ kind: 'absence_days',   value: 1,    note: 'غياب' },                        { kind: 'late_minutes', value: 183,  note: 'تأخير' },                        { kind: 'deduction_amount', value: 300, note: 'جزاء — إهمال تقرير' }],
  'prd3-el-5': [{ kind: 'overtime_hours', value: 325,  note: 'اتصالات مع عملاء خارجيين' },   { kind: 'allowance_amount', value: 800, note: 'مكافأة تجاوز الهدف' },         { kind: 'advance_recovery', value: 500, note: 'استرداد سلفة يناير' }],
  'prd3-el-6': [{ kind: 'overtime_hours', value: 1275, note: 'إشراف على عمليات ليلية' },      { kind: 'allowance_amount', value: 2000, note: 'مكافأة تميّز العمليات' }],
  'prd3-el-7': [{ kind: 'absence_days',   value: 2.5,  note: 'إجازة اضطرارية' },              { kind: 'late_minutes', value: 60,   note: 'تأخير' }],
  'prd3-el-8': [{ kind: 'overtime_hours', value: 510,  note: 'مراجعة جودة الدفعة 7' },        { kind: 'allowance_amount', value: 1500, note: 'مكافأة شهادة جودة' }],
};

// ── Apr 2025 — 8 employees ────────────────────────────────────────────────────
const SEED_LINES_APR: HRPayrollEmploymentLine[] = [
  { id: 'prd4-el-1', sortOrder: 1, employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', departmentSnapshot: 'الموارد البشرية',   jobTitleArSnapshot: 'مدير الموارد البشرية',     baseSalarySnapshot: 12000, contractCurrency: 'SAR', contractId: 'ctr-seed-1',  contractNumber: 'CL-2024-001', capturedAt: '2025-04-01T10:00:00.000Z' },
  { id: 'prd4-el-2', sortOrder: 2, employeeId: 'e2', employeeNameAr: 'ريم الشهراني',       departmentSnapshot: 'تقنية المعلومات',   jobTitleArSnapshot: 'مدير تقنية المعلومات',     baseSalarySnapshot: 9000,  contractCurrency: 'SAR', contractId: 'ctr-seed-2',  contractNumber: 'CL-2024-002', capturedAt: '2025-04-01T10:00:00.000Z' },
  { id: 'prd4-el-3', sortOrder: 3, employeeId: 'e3', employeeNameAr: 'فهد العنزي',         departmentSnapshot: 'المالية والمحاسبة', jobTitleArSnapshot: 'المدير المالي',            baseSalarySnapshot: 7500,  contractCurrency: 'SAR', contractId: 'ctr-seed-3',  contractNumber: 'CL-2024-003', capturedAt: '2025-04-01T10:00:00.000Z' },
  { id: 'prd4-el-4', sortOrder: 4, employeeId: 'e4', employeeNameAr: 'لينا الحربي',        departmentSnapshot: 'التسويق',           jobTitleArSnapshot: 'مدير التسويق',             baseSalarySnapshot: 5500,  contractCurrency: 'SAR', contractId: 'ctr-seed-8',  contractNumber: 'CL-2025-004', capturedAt: '2025-04-01T10:00:00.000Z' },
  { id: 'prd4-el-5', sortOrder: 5, employeeId: 'e5', employeeNameAr: 'سلطان الدوسري',      departmentSnapshot: 'المبيعات',          jobTitleArSnapshot: 'مدير المبيعات',            baseSalarySnapshot: 6500,  contractCurrency: 'SAR', contractId: 'ctr-seed-9',  contractNumber: 'CL-2025-005', capturedAt: '2025-04-01T10:00:00.000Z' },
  { id: 'prd4-el-6', sortOrder: 6, employeeId: 'e6', employeeNameAr: 'هدى العمري',         departmentSnapshot: 'العمليات',          jobTitleArSnapshot: 'مدير العمليات',            baseSalarySnapshot: 8500,  contractCurrency: 'SAR', contractId: 'ctr-seed-10', contractNumber: 'CL-2025-006', capturedAt: '2025-04-01T10:00:00.000Z' },
  { id: 'prd4-el-7', sortOrder: 7, employeeId: 'e7', employeeNameAr: 'يوسف الزهراني',      departmentSnapshot: 'خدمة العملاء',      jobTitleArSnapshot: 'مدير خدمة العملاء',        baseSalarySnapshot: 7200,  contractCurrency: 'SAR', contractId: 'ctr-seed-11', contractNumber: 'CL-2025-007', capturedAt: '2025-04-01T10:00:00.000Z' },
  { id: 'prd4-el-8', sortOrder: 8, employeeId: 'e8', employeeNameAr: 'مها السبيعي',        departmentSnapshot: 'الجودة',            jobTitleArSnapshot: 'مدير الجودة',              baseSalarySnapshot: 6800,  contractCurrency: 'SAR', contractId: 'ctr-seed-12', contractNumber: 'CL-2025-008', capturedAt: '2025-04-01T10:00:00.000Z' },
];
const SEED_INPUTS_APR: Record<string, HRPayrollMonthlyInput[]> = {
  'prd4-el-1': [{ kind: 'allowance_amount', value: 2000, note: 'مكافأة نهاية الربع الأول' },  { kind: 'overtime_hours', value: 600,  note: 'تخطيط الربع الثاني' }],
  'prd4-el-2': [{ kind: 'overtime_hours',   value: 675,  note: 'ترقية خادم الإنتاج' },         { kind: 'allowance_amount', value: 1000, note: 'مكافأة' }],
  'prd4-el-3': [{ kind: 'overtime_hours',   value: 500,  note: 'إعداد تقرير ضريبي' },           { kind: 'absence_days', value: 0.5,  note: 'غياب جزئي' }],
  'prd4-el-4': [{ kind: 'allowance_amount', value: 1200, note: 'مكافأة حملة تسويقية ناجحة' }],
  'prd4-el-5': [{ kind: 'overtime_hours',   value: 650,  note: 'متابعة صفقات نهاية الربع' },    { kind: 'allowance_amount', value: 1500, note: 'مكافأة أفضل مبيعات' },      { kind: 'advance_recovery', value: 500, note: 'استرداد سلفة' }],
  'prd4-el-6': [{ kind: 'overtime_hours',   value: 850,  note: 'صيانة خط الإنتاج' },            { kind: 'absence_days', value: 1,    note: 'غياب' }],
  'prd4-el-7': [{ kind: 'overtime_hours',   value: 360,  note: 'تدريب فريق الدعم' },             { kind: 'late_minutes', value: 80,   note: 'تأخير' }],
  'prd4-el-8': [{ kind: 'allowance_amount', value: 1800, note: 'مكافأة اجتياز معيار ISO' },     { kind: 'overtime_hours', value: 340,  note: 'تدقيق جودة' }],
};

const SEED: HRPayrollPeriodRecord[] = [
  {
    id: 'prd-seed-1', code: 'PAY-2025-01', nameAr: 'يناير 2025', nameEn: 'January 2025',
    periodStart: '2025-01-01', periodEnd: '2025-01-31',
    status: 'closed', compensationReviewStatus: 'approved',
    snapshotContractIds: ['ctr-seed-1', 'ctr-seed-2', 'ctr-seed-3'],
    employmentLines: SEED_LINES_JAN, linesMaterializedAt: '2025-01-28T10:00:00.000Z',
    employmentLineMonthlyInputs: SEED_INPUTS_JAN,
    notes: 'مغلقة واعتُمدت — 3 موظفين',
    createdAt: '2024-12-25T08:00:00.000Z', updatedAt: '2025-01-31T14:00:00.000Z',
  },
  {
    id: 'prd-seed-2', code: 'PAY-2025-02', nameAr: 'فبراير 2025', nameEn: 'February 2025',
    periodStart: '2025-02-01', periodEnd: '2025-02-28',
    status: 'closed', compensationReviewStatus: 'approved',
    snapshotContractIds: ['ctr-seed-1', 'ctr-seed-2', 'ctr-seed-3', 'ctr-seed-8', 'ctr-seed-9'],
    employmentLines: SEED_LINES_FEB, linesMaterializedAt: '2025-02-25T10:00:00.000Z',
    employmentLineMonthlyInputs: SEED_INPUTS_FEB,
    notes: 'مغلقة واعتُمدت — 5 موظفين مع مكافآت ومخصومات',
    createdAt: '2025-01-28T08:00:00.000Z', updatedAt: '2025-02-28T14:00:00.000Z',
  },
  {
    id: 'prd-seed-3', code: 'PAY-2025-03', nameAr: 'مارس 2025', nameEn: 'March 2025',
    periodStart: '2025-03-01', periodEnd: '2025-03-31',
    status: 'open', compensationReviewStatus: 'first_review',
    snapshotContractIds: ['ctr-seed-1', 'ctr-seed-2', 'ctr-seed-3', 'ctr-seed-8', 'ctr-seed-9', 'ctr-seed-10', 'ctr-seed-11', 'ctr-seed-12'],
    employmentLines: SEED_LINES_MAR, linesMaterializedAt: '2025-03-02T10:00:00.000Z',
    employmentLineMonthlyInputs: SEED_INPUTS_MAR,
    notes: 'قيد المراجعة الأولى — 8 موظفين بمدخلات شاملة',
    createdAt: '2025-02-25T08:00:00.000Z', updatedAt: '2025-03-10T09:00:00.000Z',
  },
  {
    id: 'prd-seed-4', code: 'PAY-2025-04', nameAr: 'أبريل 2025', nameEn: 'April 2025',
    periodStart: '2025-04-01', periodEnd: '2025-04-30',
    status: 'open', compensationReviewStatus: 'second_review',
    snapshotContractIds: ['ctr-seed-1', 'ctr-seed-2', 'ctr-seed-3', 'ctr-seed-8', 'ctr-seed-9', 'ctr-seed-10', 'ctr-seed-11', 'ctr-seed-12'],
    employmentLines: SEED_LINES_APR, linesMaterializedAt: '2025-04-01T10:00:00.000Z',
    employmentLineMonthlyInputs: SEED_INPUTS_APR,
    notes: 'قيد المراجعة الثانية — مكافآت نهاية الربع الأول',
    createdAt: '2025-03-28T08:00:00.000Z', updatedAt: '2025-04-15T11:00:00.000Z',
  },
  {
    id: 'prd-seed-5', code: 'PAY-2025-05', nameAr: 'مايو 2025', nameEn: 'May 2025',
    periodStart: '2025-05-01', periodEnd: '2025-05-31',
    status: 'draft', compensationReviewStatus: 'draft',
    snapshotContractIds: [], employmentLines: [], linesMaterializedAt: null,
    employmentLineMonthlyInputs: {}, notes: 'مسودة — لم تُفتح بعد',
    createdAt: '2025-04-25T08:00:00.000Z', updatedAt: '2025-04-25T08:00:00.000Z',
  },
];

interface State {
  periods: HRPayrollPeriodRecord[];
  add: (data: HRPayrollPeriodDraft) => string;
  update: (id: string, patch: Partial<HRPayrollPeriodDraft>) => boolean;
  remove: (id: string) => boolean;
  open: (id: string) => boolean;
  close: (id: string) => boolean;
  setCompensationStatus: (id: string, s: HRPayrollCompensationReviewStatus) => boolean;
  setMonthlyInputs: (periodId: string, lineId: string, inputs: HRPayrollMonthlyInput[]) => void;
}

export const useHRPayrollPeriodsStore = create<State>()(
  persist(
    (set, get) => ({
      periods: SEED.map(p => ({ ...p })),

      add: (data) => {
        const id = newId();
        set(s => ({
          periods: [{ ...data, id, createdAt: nowIso(), updatedAt: nowIso() }, ...s.periods],
        }));
        return id;
      },

      update: (id, patch) => {
        const row = get().periods.find(p => p.id === id);
        if (!row || row.status === 'closed') return false;
        set(s => ({
          periods: s.periods.map(p => p.id === id ? { ...p, ...patch, updatedAt: nowIso() } : p),
        }));
        return true;
      },

      remove: (id) => {
        const row = get().periods.find(p => p.id === id);
        if (!row || row.status !== 'draft') return false;
        set(s => ({ periods: s.periods.filter(p => p.id !== id) }));
        return true;
      },

      open: (id) => {
        const row = get().periods.find(p => p.id === id);
        if (!row || row.status !== 'draft') return false;
        set(s => ({ periods: s.periods.map(p => p.id === id ? { ...p, status: 'open' as const, updatedAt: nowIso() } : p) }));
        return true;
      },

      close: (id) => {
        const row = get().periods.find(p => p.id === id);
        if (!row || row.status !== 'open') return false;
        set(s => ({ periods: s.periods.map(p => p.id === id ? { ...p, status: 'closed' as const, updatedAt: nowIso() } : p) }));
        return true;
      },

      setCompensationStatus: (id, s) => {
        const row = get().periods.find(p => p.id === id);
        if (!row) return false;
        set(st => ({ periods: st.periods.map(p => p.id === id ? { ...p, compensationReviewStatus: s, updatedAt: nowIso() } : p) }));
        return true;
      },

      setMonthlyInputs: (periodId, lineId, inputs) => {
        set(s => ({
          periods: s.periods.map(p => {
            if (p.id !== periodId) return p;
            return {
              ...p,
              employmentLineMonthlyInputs: { ...p.employmentLineMonthlyInputs, [lineId]: inputs },
              updatedAt: nowIso(),
            };
          }),
        }));
      },
    }),
    {
      name: 'hr_payroll_periods_v1',
      version: 4,
      partialize: s => ({ periods: s.periods }),
      migrate: (_persisted: unknown, fromVersion: number) => {
        if ((fromVersion ?? 0) >= 4) {
          const ps = _persisted as { periods?: HRPayrollPeriodRecord[] };
          return { periods: ps?.periods ?? SEED.map(p => ({ ...p })) };
        }
        return { periods: SEED.map(p => ({ ...p })) };
      },
    },
  ),
);

export const PERIOD_STATUS_LABELS: Record<HRPayrollPeriodStatus, string> = {
  draft: 'مسودة',
  open: 'جاهزة للتشغيل',
  closed: 'مغلقة',
};

export const PERIOD_STATUS_COLORS: Record<HRPayrollPeriodStatus, string> = {
  draft: 'text-muted-foreground border-border bg-muted/40',
  open: 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30',
  closed: 'text-slate-600 border-slate-200 bg-slate-50 dark:text-slate-400 dark:border-slate-700 dark:bg-slate-900/30',
};

export const COMPENSATION_STATUS_LABELS: Record<HRPayrollCompensationReviewStatus, string> = {
  draft: 'مسودة',
  first_review: 'مراجعة أولى',
  second_review: 'مراجعة ثانية',
  approved: 'معتمدة',
};

export const MONTHLY_INPUT_KIND_LABELS: Record<HRPayrollMonthlyInputKind, string> = {
  absence_days: 'أيام غياب',
  late_minutes: 'دقائق تأخير',
  overtime_hours: 'ساعات عمل إضافي',
  deduction_amount: 'خصم إضافي',
  allowance_amount: 'بدل إضافي',
  advance_recovery: 'استرداد سلفة',
  other: 'أخرى',
};
