import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { payrollPeriodsApi, type PayrollPeriodResponseDto } from './api/payroll-periods';

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

const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_MAP: Record<string, HRPayrollPeriodStatus> = {
  draft: 'draft',
  open: 'open',
  locked: 'open',
  closed: 'closed',
  cancelled: 'closed',
};

function mapApi(r: PayrollPeriodResponseDto): HRPayrollPeriodRecord {
  const m = r.periodMonth;
  const y = r.periodYear;
  return {
    id: r.id,
    code: `PAY-${y}-${String(m).padStart(2, '0')}`,
    nameAr: `${MONTH_NAMES_AR[m - 1]} ${y}`,
    nameEn: `${MONTH_NAMES_EN[m - 1]} ${y}`,
    periodStart: r.startDate,
    periodEnd: r.endDate,
    status: STATUS_MAP[r.status] ?? 'draft',
    compensationReviewStatus: 'draft',
    snapshotContractIds: [],
    employmentLines: [],
    linesMaterializedAt: null,
    employmentLineMonthlyInputs: {},
    notes: r.notes ?? '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

interface State {
  periods: HRPayrollPeriodRecord[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: HRPayrollPeriodDraft) => Promise<string>;
  update: (id: string, patch: Partial<HRPayrollPeriodDraft>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  open: (id: string) => Promise<boolean>;
  close: (id: string) => Promise<boolean>;
  setCompensationStatus: (id: string, s: HRPayrollCompensationReviewStatus) => boolean;
  setMonthlyInputs: (periodId: string, lineId: string, inputs: HRPayrollMonthlyInput[]) => void;
}

export const useHRPayrollPeriodsStore = create<State>()((set, get) => ({
  periods: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = useAuthStore.getState().activeCompanyId;
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await payrollPeriodsApi.list({ companyId, limit: 200 });
      set({ periods: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  add: async (data) => {
    const companyId = useAuthStore.getState().activeCompanyId ?? '';
    // Extract year/month from periodStart (format: YYYY-MM-DD)
    const [yearStr, monthStr] = data.periodStart.split('-');
    const periodYear = parseInt(yearStr ?? '0', 10);
    const periodMonth = parseInt(monthStr ?? '0', 10);
    const created = await payrollPeriodsApi.create({
      companyId,
      periodYear,
      periodMonth,
      startDate: data.periodStart,
      endDate: data.periodEnd,
      payrollDate: data.periodEnd,
      status: data.status === 'open' ? 'open' : data.status === 'closed' ? 'closed' : 'draft',
      notes: data.notes || undefined,
    });
    const mapped = mapApi(created);
    set(s => ({ periods: [mapped, ...s.periods] }));
    return mapped.id;
  },

  update: async (id, patch) => {
    try {
      const updateBody: Parameters<typeof payrollPeriodsApi.update>[1] = {};
      if (patch.periodStart) updateBody.startDate = patch.periodStart;
      if (patch.periodEnd) {
        updateBody.endDate = patch.periodEnd;
        updateBody.payrollDate = patch.periodEnd;
      }
      if (patch.notes !== undefined) updateBody.notes = patch.notes;
      const updated = await payrollPeriodsApi.update(id, updateBody);
      set(s => ({
        periods: s.periods.map(p => {
          if (p.id !== id) return p;
          const base = mapApi(updated);
          // Preserve local-only fields from current state
          return {
            ...base,
            compensationReviewStatus: patch.compensationReviewStatus ?? p.compensationReviewStatus,
            snapshotContractIds: patch.snapshotContractIds ?? p.snapshotContractIds,
            employmentLines: patch.employmentLines ?? p.employmentLines,
            linesMaterializedAt: patch.linesMaterializedAt !== undefined ? patch.linesMaterializedAt : p.linesMaterializedAt,
            employmentLineMonthlyInputs: patch.employmentLineMonthlyInputs ?? p.employmentLineMonthlyInputs,
          };
        }),
      }));
      return true;
    } catch {
      return false;
    }
  },

  remove: async (id) => {
    try {
      await payrollPeriodsApi.delete(id);
      set(s => ({ periods: s.periods.filter(p => p.id !== id) }));
      return true;
    } catch {
      return false;
    }
  },

  open: async (id) => {
    try {
      const updated = await payrollPeriodsApi.update(id, { status: 'open' });
      set(s => ({
        periods: s.periods.map(p => p.id === id ? { ...p, ...mapApi(updated) } : p),
      }));
      return true;
    } catch {
      return false;
    }
  },

  close: async (id) => {
    try {
      const updated = await payrollPeriodsApi.update(id, { status: 'closed' });
      set(s => ({
        periods: s.periods.map(p => p.id === id ? { ...p, ...mapApi(updated) } : p),
      }));
      return true;
    } catch {
      return false;
    }
  },

  setCompensationStatus: (id, s) => {
    const row = get().periods.find(p => p.id === id);
    if (!row) return false;
    set(st => ({
      periods: st.periods.map(p => p.id === id ? { ...p, compensationReviewStatus: s } : p),
    }));
    return true;
  },

  setMonthlyInputs: (periodId, lineId, inputs) => {
    set(s => ({
      periods: s.periods.map(p => {
        if (p.id !== periodId) return p;
        return {
          ...p,
          employmentLineMonthlyInputs: { ...p.employmentLineMonthlyInputs, [lineId]: inputs },
        };
      }),
    }));
  },
}));

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
