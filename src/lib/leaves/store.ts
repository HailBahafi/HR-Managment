import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRLeaveTypeRecord, HRPublicHolidayRecord } from './types';

// ─── ID helper ────────────────────────────────────────────────────────────────

function lid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

// ─── Leave types seed ─────────────────────────────────────────────────────────

const LEAVE_TYPES_SEED: HRLeaveTypeRecord[] = [
  { id: 'lt-annual', code: 'ANNUAL', nameAr: 'إجازة سنوية', nameEn: 'Annual Leave', paid: true, deductsFromBalance: true, requiresApproval: true, maxDaysPerRequest: 21, sortOrder: 1, isActive: true, updatedAt: now() },
  { id: 'lt-sick', code: 'SICK', nameAr: 'إجازة مرضية', nameEn: 'Sick Leave', paid: true, deductsFromBalance: true, requiresApproval: false, maxDaysPerRequest: 30, sortOrder: 2, isActive: true, updatedAt: now() },
  { id: 'lt-emergency', code: 'EMERGENCY', nameAr: 'إجازة طارئة', nameEn: 'Emergency Leave', paid: true, deductsFromBalance: true, requiresApproval: true, maxDaysPerRequest: 3, sortOrder: 3, isActive: true, updatedAt: now() },
  { id: 'lt-unpaid', code: 'UNPAID', nameAr: 'إجازة بدون راتب', nameEn: 'Unpaid Leave', paid: false, deductsFromBalance: false, requiresApproval: true, maxDaysPerRequest: null, sortOrder: 4, isActive: true, updatedAt: now() },
  { id: 'lt-maternity', code: 'MATERNITY', nameAr: 'إجازة أمومة', nameEn: 'Maternity Leave', paid: true, deductsFromBalance: false, requiresApproval: true, maxDaysPerRequest: 70, sortOrder: 5, isActive: true, updatedAt: now() },
];

// ─── Public holidays seed ─────────────────────────────────────────────────────

const HOLIDAYS_SEED: HRPublicHolidayRecord[] = [
  { id: 'hol-founding', code: 'FOUNDING', nameAr: 'يوم التأسيس', nameEn: 'Founding Day', date: '02-22', recurring: true, sortOrder: 1, isActive: true, updatedAt: now() },
  { id: 'hol-national', code: 'NATIONAL', nameAr: 'اليوم الوطني', nameEn: 'National Day', date: '09-23', recurring: true, sortOrder: 2, isActive: true, updatedAt: now() },
  { id: 'hol-eid-fitr', code: 'EID_FITR', nameAr: 'إجازة عيد الفطر', nameEn: 'Eid Al-Fitr', date: '04-10', recurring: false, sortOrder: 3, isActive: true, updatedAt: now() },
  { id: 'hol-eid-adha', code: 'EID_ADHA', nameAr: 'إجازة عيد الأضحى', nameEn: 'Eid Al-Adha', date: '06-17', recurring: false, sortOrder: 4, isActive: true, updatedAt: now() },
  { id: 'hol-newyear', code: 'NEW_YEAR', nameAr: 'رأس السنة الهجرية', nameEn: 'Islamic New Year', date: '07-07', recurring: false, sortOrder: 5, isActive: true, updatedAt: now() },
];

// ─── Leave types store ────────────────────────────────────────────────────────

type LeaveTypesStore = {
  items: HRLeaveTypeRecord[];
  add: (draft: Omit<HRLeaveTypeRecord, 'id' | 'updatedAt'>) => void;
  update: (id: string, patch: Partial<Omit<HRLeaveTypeRecord, 'id'>>) => void;
  remove: (id: string) => void;
};

export const useLeaveTypesStore = create<LeaveTypesStore>()(
  persist(
    (set) => ({
      items: LEAVE_TYPES_SEED,
      add: (draft) =>
        set((s) => ({
          items: [...s.items, { ...draft, id: lid('lt'), updatedAt: now() }],
        })),
      update: (id, patch) =>
        set((s) => ({
          items: s.items.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x)),
        })),
      remove: (id) =>
        set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
    }),
    { name: 'hr_leave_types_v1', storage: createJSONStorage(() => localStorage) },
  ),
);

// ─── Public holidays store ────────────────────────────────────────────────────

type HolidaysStore = {
  items: HRPublicHolidayRecord[];
  add: (draft: Omit<HRPublicHolidayRecord, 'id' | 'updatedAt'>) => void;
  update: (id: string, patch: Partial<Omit<HRPublicHolidayRecord, 'id'>>) => void;
  remove: (id: string) => void;
};

export const useHolidaysStore = create<HolidaysStore>()(
  persist(
    (set) => ({
      items: HOLIDAYS_SEED,
      add: (draft) =>
        set((s) => ({
          items: [...s.items, { ...draft, id: lid('hol'), updatedAt: now() }],
        })),
      update: (id, patch) =>
        set((s) => ({
          items: s.items.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x)),
        })),
      remove: (id) =>
        set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
    }),
    { name: 'hr_public_holidays_v1', storage: createJSONStorage(() => localStorage) },
  ),
);
