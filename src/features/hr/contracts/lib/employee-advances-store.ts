import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

type State = {
  items: HREmployeeAdvance[];
  add: (a: Omit<HREmployeeAdvance, 'id' | 'updatedAt'>) => HREmployeeAdvance;
  update: (id: string, patch: Partial<Omit<HREmployeeAdvance, 'id' | 'updatedAt'>>) => boolean;
  remove: (id: string) => boolean;
};

const nowIso = () => new Date().toISOString();
function newId() { return `adv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`; }

const KIND_KEYS: HREmployeeAdvanceKind[] = ['housing', 'personal', 'urgent', 'violation'];
const MODE_KEYS: HREmployeeAdvanceRepaymentMode[] = ['by_months', 'by_monthly_amount'];

export function normalizeHREmployeeAdvance(raw: Partial<HREmployeeAdvance> & Record<string, unknown>): HREmployeeAdvance {
  const k = raw.advanceKind as string | undefined;
  const advanceKind: HREmployeeAdvanceKind = KIND_KEYS.includes(k as HREmployeeAdvanceKind) ? (k as HREmployeeAdvanceKind) : 'personal';
  const m = raw.repaymentMode as string | undefined;
  const repaymentMode: HREmployeeAdvanceRepaymentMode = MODE_KEYS.includes(m as HREmployeeAdvanceRepaymentMode)
    ? (m as HREmployeeAdvanceRepaymentMode)
    : 'by_months';
  const rm = raw.repaymentMonths != null ? Math.min(600, Math.max(1, Math.floor(Number(raw.repaymentMonths)))) : null;
  const mi = raw.monthlyInstallmentAmount != null ? Math.max(0, Number(raw.monthlyInstallmentAmount)) : null;
  return {
    id: String(raw.id ?? newId()),
    employeeId: String(raw.employeeId ?? '').trim(),
    employeeNameAr: String(raw.employeeNameAr ?? ''),
    amount: Math.max(0, Number(raw.amount) || 0),
    currency: String(raw.currency || 'SAR'),
    advanceDate: String(raw.advanceDate ?? ''),
    note: String(raw.note ?? '').trim(),
    status: (raw.status === 'repaid' || raw.status === 'cancelled' ? raw.status : 'outstanding') as HREmployeeAdvanceStatus,
    advanceKind,
    repaymentMode,
    repaymentMonths: repaymentMode === 'by_months' ? (rm ?? 12) : null,
    monthlyInstallmentAmount: repaymentMode === 'by_monthly_amount' ? (mi && mi > 0 ? mi : null) : null,
    updatedAt: String(raw.updatedAt ?? nowIso()),
  };
}

const ADV_TS = [
  '2025-01-10T00:00:00.000Z', '2024-11-05T00:00:00.000Z', '2024-12-20T00:00:00.000Z',
  '2024-09-15T00:00:00.000Z', '2025-02-01T00:00:00.000Z', '2025-03-12T00:00:00.000Z',
  '2025-01-25T00:00:00.000Z', '2024-10-08T00:00:00.000Z', '2025-03-01T00:00:00.000Z',
  '2024-08-20T00:00:00.000Z', '2025-02-15T00:00:00.000Z', '2024-07-01T00:00:00.000Z',
  '2025-04-01T00:00:00.000Z', '2025-04-10T00:00:00.000Z',
];

const SEED: HREmployeeAdvance[] = [
  { id: 'adv-seed-1', employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', amount: 5000, currency: 'SAR', advanceDate: '2025-01-10', note: 'سلفة شخصية', status: 'outstanding', advanceKind: 'personal', repaymentMode: 'by_months', repaymentMonths: 10, monthlyInstallmentAmount: null, updatedAt: ADV_TS[0] },
  { id: 'adv-seed-2', employeeId: 'e2', employeeNameAr: 'ريم الشهراني', amount: 3000, currency: 'SAR', advanceDate: '2024-11-05', note: 'ظروف طارئة — تم سدادها', status: 'repaid', advanceKind: 'urgent', repaymentMode: 'by_monthly_amount', repaymentMonths: null, monthlyInstallmentAmount: 500, updatedAt: ADV_TS[1] },
  { id: 'adv-seed-3', employeeId: 'e3', employeeNameAr: 'فهد العنزي', amount: 8000, currency: 'SAR', advanceDate: '2024-12-20', note: 'سلفة راتب — يُسترد شهريّاً', status: 'outstanding', advanceKind: 'personal', repaymentMode: 'by_months', repaymentMonths: 12, monthlyInstallmentAmount: null, updatedAt: ADV_TS[2] },
  { id: 'adv-seed-4', employeeId: 'e4', employeeNameAr: 'لينا الحربي', amount: 2000, currency: 'SAR', advanceDate: '2024-09-15', note: 'تم إلغاؤها بطلب الموظف', status: 'cancelled', advanceKind: 'personal', repaymentMode: 'by_months', repaymentMonths: 6, monthlyInstallmentAmount: null, updatedAt: ADV_TS[3] },
  { id: 'adv-seed-5', employeeId: 'e5', employeeNameAr: 'سلطان الدوسري', amount: 4500, currency: 'SAR', advanceDate: '2025-02-01', note: 'سلفة منزلية', status: 'outstanding', advanceKind: 'housing', repaymentMode: 'by_months', repaymentMonths: 18, monthlyInstallmentAmount: null, updatedAt: ADV_TS[4] },
  { id: 'adv-seed-6', employeeId: 'e2', employeeNameAr: 'ريم الشهراني', amount: 1500, currency: 'SAR', advanceDate: '2025-03-12', note: 'دفعة ثانية — قائمة', status: 'outstanding', advanceKind: 'personal', repaymentMode: 'by_monthly_amount', repaymentMonths: null, monthlyInstallmentAmount: 300, updatedAt: ADV_TS[5] },
  { id: 'adv-seed-7', employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', amount: 10000, currency: 'SAR', advanceDate: '2025-01-25', note: 'سلفة طوارئ طبية — تم سدادها', status: 'repaid', advanceKind: 'urgent', repaymentMode: 'by_months', repaymentMonths: 20, monthlyInstallmentAmount: null, updatedAt: ADV_TS[6] },
  { id: 'adv-seed-8', employeeId: 'e6', employeeNameAr: 'هدى العمري', amount: 6000, currency: 'SAR', advanceDate: '2024-10-08', note: 'سلفة شخصية — تم سدادها', status: 'repaid', advanceKind: 'personal', repaymentMode: 'by_months', repaymentMonths: 12, monthlyInstallmentAmount: null, updatedAt: ADV_TS[7] },
  { id: 'adv-seed-9', employeeId: 'e6', employeeNameAr: 'هدى العمري', amount: 3500, currency: 'SAR', advanceDate: '2025-03-01', note: 'سلفة تعليمية', status: 'outstanding', advanceKind: 'personal', repaymentMode: 'by_months', repaymentMonths: 14, monthlyInstallmentAmount: null, updatedAt: ADV_TS[8] },
  { id: 'adv-seed-10', employeeId: 'e7', employeeNameAr: 'يوسف الزهراني', amount: 4000, currency: 'SAR', advanceDate: '2024-08-20', note: 'سلفة راتب — تم سدادها', status: 'repaid', advanceKind: 'personal', repaymentMode: 'by_monthly_amount', repaymentMonths: null, monthlyInstallmentAmount: 800, updatedAt: ADV_TS[9] },
  { id: 'adv-seed-11', employeeId: 'e7', employeeNameAr: 'يوسف الزهراني', amount: 2500, currency: 'SAR', advanceDate: '2025-02-15', note: 'سلفة شخصية — قائمة', status: 'outstanding', advanceKind: 'personal', repaymentMode: 'by_months', repaymentMonths: 8, monthlyInstallmentAmount: null, updatedAt: ADV_TS[10] },
  { id: 'adv-seed-12', employeeId: 'e8', employeeNameAr: 'مها السبيعي', amount: 7000, currency: 'SAR', advanceDate: '2024-07-01', note: 'سلفة راتب كبيرة — تم سدادها', status: 'repaid', advanceKind: 'housing', repaymentMode: 'by_months', repaymentMonths: 24, monthlyInstallmentAmount: null, updatedAt: ADV_TS[11] },
  { id: 'adv-seed-13', employeeId: 'e3', employeeNameAr: 'فهد العنزي', amount: 5000, currency: 'SAR', advanceDate: '2025-04-01', note: 'سلفة لشراء سيارة', status: 'outstanding', advanceKind: 'housing', repaymentMode: 'by_months', repaymentMonths: 30, monthlyInstallmentAmount: null, updatedAt: ADV_TS[12] },
  { id: 'adv-seed-14', employeeId: 'e5', employeeNameAr: 'سلطان الدوسري', amount: 1000, currency: 'SAR', advanceDate: '2025-04-10', note: 'سلفة طارئة — ملغاة', status: 'cancelled', advanceKind: 'violation', repaymentMode: 'by_months', repaymentMonths: 4, monthlyInstallmentAmount: null, updatedAt: ADV_TS[13] },
];

export const useHREmployeeAdvancesStore = create<State>()(
  persist(
    (set, get) => ({
      items: SEED.map(x => ({ ...x })),
      add: (a) => {
        const row = normalizeHREmployeeAdvance({ ...a, id: newId(), updatedAt: nowIso() });
        set(s => ({ items: [row, ...s.items] }));
        return row;
      },
      update: (id, patch) => {
        const { items } = get();
        const i = items.findIndex(x => x.id === id);
        if (i < 0) return false;
        const cur = items[i]!;
        const next = normalizeHREmployeeAdvance({ ...cur, ...patch, id: cur.id, updatedAt: nowIso() });
        const list = items.slice(); list[i] = next;
        set({ items: list });
        return true;
      },
      remove: (id) => {
        if (!get().items.some(x => x.id === id)) return false;
        set(s => ({ items: s.items.filter(x => x.id !== id) }));
        return true;
      },
    }),
    {
      name: 'hr_employee_advances_v1',
      version: 4,
      partialize: s => ({ items: s.items }),
      migrate: (persisted: unknown) => {
        const ps = persisted as { items?: unknown[] };
        const raw = Array.isArray(ps?.items) ? ps.items : [];
        const items = raw.length > 0 ? raw.map(x => normalizeHREmployeeAdvance(x as Partial<HREmployeeAdvance>)) : SEED.map(r => ({ ...r }));
        return { items };
      },
    },
  ),
);

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
