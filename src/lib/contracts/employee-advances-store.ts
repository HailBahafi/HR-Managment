import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HREmployeeAdvanceStatus = 'outstanding' | 'repaid' | 'cancelled';

export type HREmployeeAdvance = {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  amount: number;
  currency: string;
  advanceDate: string;
  note: string;
  status: HREmployeeAdvanceStatus;
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

const SEED: HREmployeeAdvance[] = [
  { id: 'adv-seed-1', employeeId: 'e1', employeeNameAr: 'عبدالرحمن المالكي', amount: 5000, currency: 'SAR', advanceDate: '2025-01-10', note: 'سلفة شخصية', status: 'outstanding', updatedAt: nowIso() },
  { id: 'adv-seed-2', employeeId: 'e2', employeeNameAr: 'ريم الشهراني', amount: 3000, currency: 'SAR', advanceDate: '2024-11-05', note: 'ظروف طارئة', status: 'repaid', updatedAt: nowIso() },
  { id: 'adv-seed-3', employeeId: 'e3', employeeNameAr: 'فهد العنزي', amount: 8000, currency: 'SAR', advanceDate: '2024-12-20', note: 'سلفة راتب', status: 'outstanding', updatedAt: nowIso() },
  { id: 'adv-seed-4', employeeId: 'e4', employeeNameAr: 'لينا الحربي', amount: 2000, currency: 'SAR', advanceDate: '2024-09-15', note: 'تم إلغاؤها', status: 'cancelled', updatedAt: nowIso() },
  { id: 'adv-seed-5', employeeId: 'e5', employeeNameAr: 'سلطان الدوسري', amount: 4500, currency: 'SAR', advanceDate: '2025-02-01', note: '', status: 'outstanding', updatedAt: nowIso() },
  { id: 'adv-seed-6', employeeId: 'e2', employeeNameAr: 'ريم الشهراني', amount: 1500, currency: 'SAR', advanceDate: '2025-03-12', note: 'دفعة ثانية', status: 'outstanding', updatedAt: nowIso() },
];

export const useHREmployeeAdvancesStore = create<State>()(
  persist(
    (set, get) => ({
      items: SEED.map(x => ({ ...x })),
      add: (a) => {
        const row: HREmployeeAdvance = {
          id: newId(), employeeId: a.employeeId.trim(), employeeNameAr: a.employeeNameAr,
          amount: Math.max(0, a.amount), currency: a.currency || 'SAR',
          advanceDate: a.advanceDate, note: a.note?.trim() ?? '', status: a.status, updatedAt: nowIso(),
        };
        set(s => ({ items: [row, ...s.items] }));
        return row;
      },
      update: (id, patch) => {
        const { items } = get();
        const i = items.findIndex(x => x.id === id);
        if (i < 0) return false;
        const cur = items[i]!;
        const next: HREmployeeAdvance = { ...cur, ...patch, updatedAt: nowIso() };
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
    { name: 'hr_employee_advances_v1', version: 2, partialize: s => ({ items: s.items }) },
  ),
);

export const ADVANCE_STATUS_LABELS: Record<HREmployeeAdvanceStatus, string> = {
  outstanding: 'قائمة',
  repaid: 'مُسدَّدة',
  cancelled: 'ملغاة',
};
