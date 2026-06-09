import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { payrollPeriodsApi, type PayrollPeriodResponseDto } from './api/payroll-periods';
import {
  monthlyInputsApi,
  type MonthlyInputResponseDto,
  type MonthlyInputKindDto,
  type MonthlyInputDirectionDto,
} from './api/monthly-inputs';
import type { HRContractRecord } from './contracts-store';

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

// Map a backend MonthlyInputResponseDto to a frontend HRPayrollMonthlyInput.
// baseSalarySnapshot is required to convert absence SAR → days correctly.
function fromBackendInput(dto: MonthlyInputResponseDto, baseSalarySnapshot = 0): HRPayrollMonthlyInput {
  const amount = parseFloat(String(dto.amount)) || 0;
  switch (dto.inputKind) {
    case 'overtime':
      return { kind: 'overtime_hours', value: amount, note: dto.note ?? '' };
    case 'allowance_extra':
    case 'bonus':
      return { kind: 'allowance_amount', value: amount, note: dto.note ?? '' };
    case 'absence_deduction': {
      const dailyRate = baseSalarySnapshot > 0 ? baseSalarySnapshot / 30 : 1;
      const days = Math.round((amount / dailyRate) * 1000) / 1000;
      return { kind: 'absence_days', value: days, note: dto.note ?? '' };
    }
    case 'lateness_deduction':
      return { kind: 'late_minutes', value: amount, note: dto.note ?? '' };
    case 'advance_installment':
    case 'loan_installment':
      return { kind: 'advance_recovery', value: amount, note: dto.note ?? '' };
    case 'discipline_deduction':
    case 'other_deduction':
      return { kind: 'deduction_amount', value: amount, note: dto.note ?? '' };
    default:
      return { kind: 'other', value: amount, note: dto.note ?? '' };
  }
}

interface State {
  periods: HRPayrollPeriodRecord[];
  isLoading: boolean;
  error: string | null;
  /** Raw backend inputs keyed by periodId → employeeId → list. Used to populate lines after materialize. */
  _rawInputs: Record<string, Record<string, MonthlyInputResponseDto[]>>;
  fetch: () => Promise<void>;
  materializeFromContracts: (contracts: HRContractRecord[]) => void;
  add: (data: HRPayrollPeriodDraft) => Promise<string>;
  update: (id: string, patch: Partial<HRPayrollPeriodDraft>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  open: (id: string) => Promise<boolean>;
  close: (id: string) => Promise<boolean>;
  setCompensationStatus: (id: string, s: HRPayrollCompensationReviewStatus) => boolean;
  setMonthlyInputs: (periodId: string, lineId: string, inputs: HRPayrollMonthlyInput[]) => Promise<void>;
  refreshMonthlyInputsForPeriod: (periodId: string) => Promise<void>;
}

export const useHRPayrollPeriodsStore = create<State>()((set, get) => ({
  periods: [],
  isLoading: false,
  error: null,
  _rawInputs: {},

  fetch: async () => {
    const companyId = useAuthStore.getState().activeCompanyId;
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const [periodsResult, inputsResult] = await Promise.all([
        payrollPeriodsApi.list({ companyId, limit: 200 }),
        monthlyInputsApi.list({ companyId, limit: 2000 }),
      ]);

      // Group backend inputs by periodId → employeeId
      const rawInputs: Record<string, Record<string, MonthlyInputResponseDto[]>> = {};
      for (const dto of inputsResult.items) {
        if (!rawInputs[dto.payrollPeriodId]) rawInputs[dto.payrollPeriodId] = {};
        if (!rawInputs[dto.payrollPeriodId][dto.employeeId]) rawInputs[dto.payrollPeriodId][dto.employeeId] = [];
        rawInputs[dto.payrollPeriodId][dto.employeeId].push(dto);
      }

      set({
        periods: periodsResult.items.map(mapApi),
        _rawInputs: rawInputs,
        isLoading: false,
      });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  materializeFromContracts: (contracts) => {
    set((s) => ({
      periods: s.periods.map((period) => {
        if ((period.employmentLines?.length ?? 0) > 0) {
          return period;
        }
        const active = contracts.filter((c) => {
          if (c.status !== 'active') return false;
          if (!c.startDate) return false;
          if (c.startDate > period.periodEnd) return false;
          if (c.endDate && c.endDate < period.periodStart) return false;
          return true;
        });
        if (active.length === 0) return period;

        const capturedAt = new Date().toISOString();
        const lines: HRPayrollEmploymentLine[] = active.map((c, idx) => ({
          id: `${period.id}-${c.id}`,
          sortOrder: idx,
          employeeId: c.employeeId,
          employeeNameAr: c.employeeNameAr || '—',
          departmentSnapshot: c.branchNameAr || '—',
          jobTitleArSnapshot: '—',
          baseSalarySnapshot: c.baseSalary,
          contractCurrency: c.currency,
          contractId: c.id,
          contractNumber: c.contractNumber,
          capturedAt,
        }));

        // Populate monthly inputs from backend raw cache
        const periodRaw = s._rawInputs[period.id] ?? {};
        const employmentLineMonthlyInputs: Record<string, HRPayrollMonthlyInput[]> = {};
        for (const line of lines) {
          const dtos = periodRaw[line.employeeId] ?? [];
          if (dtos.length > 0) {
            employmentLineMonthlyInputs[line.id] = dtos.map(d =>
              fromBackendInput(d, line.baseSalarySnapshot),
            );
          }
        }

        return {
          ...period,
          employmentLines: lines,
          snapshotContractIds: active.map((c) => c.id),
          linesMaterializedAt: capturedAt,
          employmentLineMonthlyInputs,
        };
      }),
    }));
  },

  add: async (data) => {
    const companyId = useAuthStore.getState().activeCompanyId ?? '';
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

  setMonthlyInputs: async (periodId, lineId, inputs) => {
    // Optimistic local update
    set(s => ({
      periods: s.periods.map(p => {
        if (p.id !== periodId) return p;
        return {
          ...p,
          employmentLineMonthlyInputs: { ...p.employmentLineMonthlyInputs, [lineId]: inputs },
        };
      }),
    }));

    const companyId = useAuthStore.getState().activeCompanyId;
    if (!companyId) return;

    const state = get();
    const period = state.periods.find(p => p.id === periodId);
    const line = period?.employmentLines.find(l => l.id === lineId);
    if (!line) return;

    try {
      // Delete all existing backend inputs for this (period, employee) pair that came from the compensation panel
      const existing = await monthlyInputsApi.list({
        companyId,
        payrollPeriodId: periodId,
        employeeId: line.employeeId,
        limit: 500,
      });
      const toDelete = existing.items.filter(
        d => d.sourceTable === 'frontend_compensation_panel',
      );
      await Promise.all(toDelete.map(d => monthlyInputsApi.delete(d.id)));

      // Create new inputs
      const baseSalary = line.baseSalarySnapshot;
      const creates = inputs
        .filter(i => i.value > 0)
        .map(i => {
          let inputKind: MonthlyInputKindDto;
          let direction: MonthlyInputDirectionDto;
          let amount: number;

          switch (i.kind) {
            case 'overtime_hours':
              inputKind = 'overtime'; direction = 'addition'; amount = i.value; break;
            case 'allowance_amount':
              inputKind = 'allowance_extra'; direction = 'addition'; amount = i.value; break;
            case 'absence_days':
              inputKind = 'absence_deduction'; direction = 'deduction';
              amount = Math.round(i.value * (baseSalary / 30) * 100) / 100; break;
            case 'late_minutes':
              inputKind = 'lateness_deduction'; direction = 'deduction'; amount = i.value; break;
            case 'deduction_amount':
              inputKind = 'other_deduction'; direction = 'deduction'; amount = i.value; break;
            case 'advance_recovery':
              inputKind = 'advance_installment'; direction = 'deduction'; amount = i.value; break;
            case 'other':
            default:
              inputKind = 'other_deduction'; direction = 'deduction'; amount = i.value; break;
          }

          return monthlyInputsApi.create({
            companyId,
            payrollPeriodId: periodId,
            employeeId: line.employeeId,
            inputKind,
            direction,
            amount,
            note: i.note || undefined,
            sourceKind: 'manual',
            sourceTable: 'frontend_compensation_panel',
            sourceId: line.employeeId,
          });
        });

      await Promise.all(creates);
    } catch {
      // Keep optimistic state on error; user sees data but it didn't persist
    }
  },

  refreshMonthlyInputsForPeriod: async (periodId) => {
    const companyId = useAuthStore.getState().activeCompanyId;
    if (!companyId) return;

    try {
      const inputsResult = await monthlyInputsApi.list({
        companyId,
        payrollPeriodId: periodId,
        limit: 2000,
      });

      const byEmployee: Record<string, MonthlyInputResponseDto[]> = {};
      for (const dto of inputsResult.items) {
        if (!byEmployee[dto.employeeId]) byEmployee[dto.employeeId] = [];
        byEmployee[dto.employeeId].push(dto);
      }

      set((s) => {
        const period = s.periods.find((p) => p.id === periodId);
        if (!period) return s;

        const employmentLineMonthlyInputs: Record<string, HRPayrollMonthlyInput[]> = {
          ...period.employmentLineMonthlyInputs,
        };
        for (const line of period.employmentLines) {
          const dtos = byEmployee[line.employeeId] ?? [];
          employmentLineMonthlyInputs[line.id] = dtos.map((d) =>
            fromBackendInput(d, line.baseSalarySnapshot),
          );
        }

        return {
          _rawInputs: {
            ...s._rawInputs,
            [periodId]: byEmployee,
          },
          periods: s.periods.map((p) =>
            p.id === periodId ? { ...p, employmentLineMonthlyInputs } : p,
          ),
        };
      });
    } catch {
      // Caller handles user-facing errors
    }
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
