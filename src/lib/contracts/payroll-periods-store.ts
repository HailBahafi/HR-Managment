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

/** Mock تشغيل — يطابق عقود البذرة `ctr-seed-*` وموظفي mock-data (`e1`…). */
const SEED_LINES_JAN: HRPayrollEmploymentLine[] = [
  {
    id: 'prd1-el-1', sortOrder: 1, employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي',
    departmentSnapshot: 'الموارد البشرية', jobTitleArSnapshot: 'مدير الموارد البشرية',
    baseSalarySnapshot: 12000, contractCurrency: 'SAR', contractId: 'ctr-seed-1', contractNumber: 'CL-2024-001',
    capturedAt: '2025-01-28T10:00:00.000Z',
  },
];

const SEED_LINES_FEB: HRPayrollEmploymentLine[] = [
  {
    id: 'prd2-el-1', sortOrder: 1, employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي',
    departmentSnapshot: 'الموارد البشرية', jobTitleArSnapshot: 'مدير الموارد البشرية',
    baseSalarySnapshot: 12000, contractCurrency: 'SAR', contractId: 'ctr-seed-1', contractNumber: 'CL-2024-001',
    capturedAt: '2025-02-25T10:00:00.000Z',
  },
  {
    id: 'prd2-el-2', sortOrder: 2, employeeId: 'e2', employeeNameAr: 'ريم الشهراني',
    departmentSnapshot: 'تقنية المعلومات', jobTitleArSnapshot: 'مدير تقنية المعلومات',
    baseSalarySnapshot: 9000, contractCurrency: 'SAR', contractId: 'ctr-seed-2', contractNumber: 'CL-2024-002',
    capturedAt: '2025-02-25T10:00:00.000Z',
  },
  {
    id: 'prd2-el-3', sortOrder: 3, employeeId: 'e3', employeeNameAr: 'فهد العنزي',
    departmentSnapshot: 'المالية والمحاسبة', jobTitleArSnapshot: 'المدير المالي',
    baseSalarySnapshot: 7500, contractCurrency: 'SAR', contractId: 'ctr-seed-3', contractNumber: 'CL-2024-003',
    capturedAt: '2025-02-25T10:00:00.000Z',
  },
];

const SEED_INPUTS_FEB: Record<string, HRPayrollMonthlyInput[]> = {
  'prd2-el-1': [
    { kind: 'overtime_hours', value: 14, note: 'عمل إضافي — نهاية أسبوع' },
    { kind: 'allowance_amount', value: 500, note: 'مكافأة أداء' },
    { kind: 'absence_days', value: 0.5, note: 'غياب جزئي' },
    { kind: 'late_minutes', value: 35, note: 'تأخير' },
  ],
  'prd2-el-2': [
    { kind: 'overtime_hours', value: 6, note: '' },
    { kind: 'deduction_amount', value: 200, note: 'جزاء إداري' },
  ],
  'prd2-el-3': [
    { kind: 'allowance_amount', value: 1200, note: 'بدل طوارئ مشروع' },
    { kind: 'absence_days', value: 1, note: '' },
    { kind: 'late_minutes', value: 20, note: '' },
  ],
};

const SEED_LINES_MAR: HRPayrollEmploymentLine[] = [
  {
    id: 'prd3-el-1', sortOrder: 1, employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي',
    departmentSnapshot: 'الموارد البشرية', jobTitleArSnapshot: 'مدير الموارد البشرية',
    baseSalarySnapshot: 12000, contractCurrency: 'SAR', contractId: 'ctr-seed-1', contractNumber: 'CL-2024-001',
    capturedAt: '2025-03-02T10:00:00.000Z',
  },
  {
    id: 'prd3-el-2', sortOrder: 2, employeeId: 'e2', employeeNameAr: 'ريم الشهراني',
    departmentSnapshot: 'تقنية المعلومات', jobTitleArSnapshot: 'مدير تقنية المعلومات',
    baseSalarySnapshot: 9000, contractCurrency: 'SAR', contractId: 'ctr-seed-2', contractNumber: 'CL-2024-002',
    capturedAt: '2025-03-02T10:00:00.000Z',
  },
];

const SEED: HRPayrollPeriodRecord[] = [
  {
    id: 'prd-seed-1', code: 'PAY-2025-01', nameAr: 'يناير 2025', nameEn: 'January 2025',
    periodStart: '2025-01-01', periodEnd: '2025-01-31',
    status: 'closed', compensationReviewStatus: 'approved',
    snapshotContractIds: ['ctr-seed-1'], employmentLines: SEED_LINES_JAN, linesMaterializedAt: '2025-01-28T10:00:00.000Z',
    employmentLineMonthlyInputs: {
      'prd1-el-1': [{ kind: 'overtime_hours', value: 8, note: '' }, { kind: 'late_minutes', value: 15, note: '' }],
    },
    notes: 'مغلقة واعتُمدت',
    createdAt: '2024-12-25T08:00:00.000Z', updatedAt: '2025-01-31T14:00:00.000Z',
  },
  {
    id: 'prd-seed-2', code: 'PAY-2025-02', nameAr: 'فبراير 2025', nameEn: 'February 2025',
    periodStart: '2025-02-01', periodEnd: '2025-02-28',
    status: 'closed', compensationReviewStatus: 'approved',
    snapshotContractIds: ['ctr-seed-1', 'ctr-seed-2', 'ctr-seed-3'],
    employmentLines: SEED_LINES_FEB, linesMaterializedAt: '2025-02-25T10:00:00.000Z',
    employmentLineMonthlyInputs: SEED_INPUTS_FEB,
    notes: 'بيانات تجريبية: ثلاثة موظفين ومدخلات شهرية',
    createdAt: '2025-01-28T08:00:00.000Z', updatedAt: '2025-02-28T14:00:00.000Z',
  },
  {
    id: 'prd-seed-3', code: 'PAY-2025-03', nameAr: 'مارس 2025', nameEn: 'March 2025',
    periodStart: '2025-03-01', periodEnd: '2025-03-31',
    status: 'open', compensationReviewStatus: 'first_review',
    snapshotContractIds: ['ctr-seed-1', 'ctr-seed-2'],
    employmentLines: SEED_LINES_MAR, linesMaterializedAt: '2025-03-02T10:00:00.000Z',
    employmentLineMonthlyInputs: {
      'prd3-el-1': [{ kind: 'overtime_hours', value: 10, note: '' }],
    },
    notes: 'قيد المراجعة الأولى',
    createdAt: '2025-02-25T08:00:00.000Z', updatedAt: '2025-03-10T09:00:00.000Z',
  },
  {
    id: 'prd-seed-4', code: 'PAY-2025-04', nameAr: 'أبريل 2025', nameEn: 'April 2025',
    periodStart: '2025-04-01', periodEnd: '2025-04-30',
    status: 'draft', compensationReviewStatus: 'draft',
    snapshotContractIds: [], employmentLines: [], linesMaterializedAt: null,
    employmentLineMonthlyInputs: {}, notes: '',
    createdAt: '2025-03-28T08:00:00.000Z', updatedAt: '2025-03-28T08:00:00.000Z',
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
      version: 3,
      partialize: s => ({ periods: s.periods }),
      migrate: (persisted: unknown, fromVersion: number) => {
        const ps = persisted as { periods?: HRPayrollPeriodRecord[] };
        const incoming = ps?.periods ?? [];
        if ((fromVersion ?? 0) >= 3) return ps;
        const seedById = new Map(SEED.map(s => [s.id, s]));
        const merged = incoming.map(p => {
          const seed = seedById.get(p.id);
          if (!seed || (p.employmentLines?.length ?? 0) > 0) return p;
          return {
            ...p,
            employmentLines: seed.employmentLines.map(l => ({ ...l })),
            snapshotContractIds: seed.snapshotContractIds.length ? seed.snapshotContractIds : p.snapshotContractIds,
            linesMaterializedAt: p.linesMaterializedAt ?? seed.linesMaterializedAt,
            employmentLineMonthlyInputs: { ...seed.employmentLineMonthlyInputs, ...p.employmentLineMonthlyInputs },
          };
        });
        const ids = new Set(merged.map(p => p.id));
        const extras = SEED.filter(s => !ids.has(s.id)).map(s => ({ ...s }));
        return { periods: [...extras, ...merged] };
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
