import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  employeeAdvancesApi,
  type EmployeeAdvanceResponseDto,
  type AdvanceKindDto,
  type RepaymentModeDto,
} from './api/employee-advances';

export type HREmployeeAdvanceStatus = 'outstanding' | 'repaid' | 'cancelled';

export type HREmployeeAdvanceKind = 'housing' | 'personal' | 'urgent' | 'violation';

export type HREmployeeAdvanceRepaymentMode = 'by_months' | 'by_monthly_amount';

export type HREmployeeAdvance = {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  amount: number;
  currency: string;
  advanceDate: string;
  note: string;
  status: HREmployeeAdvanceStatus;
  /** نوع السلفة */
  advanceKind: HREmployeeAdvanceKind;
  /** آلية احتساب القسط الشهري */
  repaymentMode: HREmployeeAdvanceRepaymentMode;
  /** عند الوضع «عدد أشهر محدد»: عدد أشهر السداد */
  repaymentMonths: number | null;
  /** عند الوضع «مبلغ شهري محدد»: مبلغ القسط الشهري */
  monthlyInstallmentAmount: number | null;
  updatedAt: string;
};

function mapStatus(s: EmployeeAdvanceResponseDto['status']): HREmployeeAdvanceStatus {
  if (s === 'fully_repaid') return 'repaid';
  if (s === 'rejected' || s === 'cancelled') return 'cancelled';
  return 'outstanding';
}

function mapKind(k: AdvanceKindDto | null): HREmployeeAdvanceKind {
  if (k === 'housing') return 'housing';
  if (k === 'emergency') return 'urgent';
  return 'personal';
}

function mapRepaymentMode(m: RepaymentModeDto | null): HREmployeeAdvanceRepaymentMode {
  if (m === 'monthly_payroll') return 'by_months';
  return 'by_monthly_amount';
}

function mapApi(r: EmployeeAdvanceResponseDto): HREmployeeAdvance {
  return {
    id: r.id,
    employeeId: r.employeeId,
    employeeNameAr: r.employeeNameAr,
    amount: parseFloat(r.amount) || 0,
    currency: r.currency,
    advanceDate: r.advanceDate,
    note: r.note ?? '',
    status: mapStatus(r.status),
    advanceKind: mapKind(r.advanceKind),
    repaymentMode: mapRepaymentMode(r.repaymentMode),
    repaymentMonths: r.repaymentMonths ?? null,
    monthlyInstallmentAmount: r.monthlyInstallmentAmount != null
      ? parseFloat(r.monthlyInstallmentAmount)
      : null,
    updatedAt: r.updatedAt,
  };
}

function toBackendKind(k: HREmployeeAdvanceKind): AdvanceKindDto {
  if (k === 'housing') return 'housing';
  if (k === 'urgent') return 'emergency';
  return 'salary_advance';
}

function toBackendRepaymentMode(m: HREmployeeAdvanceRepaymentMode): RepaymentModeDto {
  if (m === 'by_months') return 'monthly_payroll';
  return 'flexible';
}

type State = {
  items: HREmployeeAdvance[];
  isLoading: boolean;
  error: string | null;
  fetch: (params?: { employeeId?: string; status?: string }) => Promise<void>;
  add: (a: Omit<HREmployeeAdvance, 'id' | 'updatedAt'>) => Promise<HREmployeeAdvance>;
  update: (id: string, patch: Partial<Omit<HREmployeeAdvance, 'id' | 'updatedAt'>>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
};

export const useHREmployeeAdvancesStore = create<State>()((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetch: async (params) => {
    const companyId = useAuthStore.getState().activeCompanyId;
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await employeeAdvancesApi.list({
        companyId,
        employeeId: params?.employeeId,
        status: params?.status,
        limit: 200,
      });
      set({ items: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  add: async (a) => {
    const companyId = useAuthStore.getState().activeCompanyId ?? '';
    const created = await employeeAdvancesApi.create({
      companyId,
      employeeId: a.employeeId,
      amount: a.amount,
      currency: a.currency,
      advanceDate: a.advanceDate,
      note: a.note,
      advanceKind: toBackendKind(a.advanceKind),
      repaymentMode: toBackendRepaymentMode(a.repaymentMode),
      repaymentMonths: a.repaymentMonths ?? undefined,
      monthlyInstallmentAmount: a.monthlyInstallmentAmount ?? undefined,
    });
    const mapped = mapApi(created);
    set(s => ({ items: [mapped, ...s.items] }));
    return mapped;
  },

  update: async (id, patch) => {
    try {
      const updated = await employeeAdvancesApi.update(id, {
        amount: patch.amount,
        currency: patch.currency,
        advanceDate: patch.advanceDate,
        note: patch.note,
        advanceKind: patch.advanceKind != null ? toBackendKind(patch.advanceKind) : undefined,
        repaymentMode: patch.repaymentMode != null ? toBackendRepaymentMode(patch.repaymentMode) : undefined,
        repaymentMonths: patch.repaymentMonths ?? undefined,
        monthlyInstallmentAmount: patch.monthlyInstallmentAmount ?? undefined,
      });
      set(s => ({ items: s.items.map(row => row.id === id ? mapApi(updated) : row) }));
      return true;
    } catch {
      return false;
    }
  },

  remove: async (id) => {
    try {
      await employeeAdvancesApi.delete(id);
      set(s => ({ items: s.items.filter(row => row.id !== id) }));
      return true;
    } catch {
      return false;
    }
  },
}));

export const ADVANCE_STATUS_LABELS: Record<HREmployeeAdvanceStatus, string> = {
  outstanding: 'قائمة',
  repaid: 'مُسدَّدة',
  cancelled: 'ملغاة',
};

export const ADVANCE_KIND_LABELS: Record<HREmployeeAdvanceKind, string> = {
  housing: 'سكني',
  personal: 'شخصي',
  urgent: 'عاجل',
  violation: 'مخالفة',
};

export const REPAYMENT_MODE_LABELS: Record<HREmployeeAdvanceRepaymentMode, string> = {
  by_months: 'عدد أشهر محدد',
  by_monthly_amount: 'مبلغ شهري محدد',
};
