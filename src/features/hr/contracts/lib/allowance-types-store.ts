import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HRAllowanceTypeRecord = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  typicalAmount: number;
  currency: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

type Draft = Omit<HRAllowanceTypeRecord, 'id' | 'updatedAt'>;

const nowIso = () => new Date().toISOString();
function newId() { return `halt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`; }

const SEED: HRAllowanceTypeRecord[] = [
  { id: 'halt-housing', code: 'HOUSING', nameAr: 'بدل سكن', nameEn: 'Housing allowance', typicalAmount: 2500, currency: 'SAR', sortOrder: 10, isActive: true, updatedAt: nowIso() },
  { id: 'halt-transport', code: 'TRANSPORT', nameAr: 'بدل انتقال / مواصلات', nameEn: 'Transport allowance', typicalAmount: 800, currency: 'SAR', sortOrder: 20, isActive: true, updatedAt: nowIso() },
  { id: 'halt-phone', code: 'PHONE', nameAr: 'بدل اتصالات', nameEn: 'Phone / communications', typicalAmount: 200, currency: 'SAR', sortOrder: 30, isActive: true, updatedAt: nowIso() },
  { id: 'halt-food', code: 'FOOD', nameAr: 'بدل طعام', nameEn: 'Food allowance', typicalAmount: 500, currency: 'SAR', sortOrder: 40, isActive: true, updatedAt: nowIso() },
  { id: 'halt-field', code: 'FIELD', nameAr: 'بدل ميداني / طبيعة عمل', nameEn: 'Field work allowance', typicalAmount: 1200, currency: 'SAR', sortOrder: 50, isActive: true, updatedAt: nowIso() },
  { id: 'halt-gas', code: 'FUEL', nameAr: 'بدل وقود / مركبة عمل', nameEn: 'Fuel / company vehicle', typicalAmount: 600, currency: 'SAR', sortOrder: 60, isActive: true, updatedAt: nowIso() },
  { id: 'halt-risk', code: 'RISK', nameAr: 'بدل خطورة / عمل ليلي', nameEn: 'Risk / night shift', typicalAmount: 400, currency: 'SAR', sortOrder: 70, isActive: true, updatedAt: nowIso() },
];

interface State {
  items: HRAllowanceTypeRecord[];
  add: (data: Draft) => string;
  update: (id: string, patch: Partial<Draft>) => void;
  remove: (id: string) => void;
}

export const useHRAllowanceTypesStore = create<State>()(
  persist(
    (set) => ({
      items: SEED.map(x => ({ ...x })),
      add: (data) => {
        const id = newId();
        set(s => ({ items: [...s.items, { ...data, id, updatedAt: nowIso() }] }));
        return id;
      },
      update: (id, patch) => set(s => ({
        items: s.items.map(row => row.id === id ? { ...row, ...patch, updatedAt: nowIso() } : row),
      })),
      remove: (id) => set(s => ({ items: s.items.filter(row => row.id !== id) })),
    }),
    { name: 'hr_allowance_types_v1', version: 1, partialize: s => ({ items: s.items }) },
  ),
);
