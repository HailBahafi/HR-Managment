import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ExternalPartyKind =
  | 'customer'
  | 'visitor'
  | 'supplier'
  | 'partner'
  | 'sales_lead'
  | 'other';

export const EXTERNAL_PARTY_KIND_LABELS: Record<ExternalPartyKind, string> = {
  customer: 'عميل',
  visitor: 'زائر',
  supplier: 'مورّد',
  partner: 'شريك',
  sales_lead: 'عميل محتمل',
  other: 'أخرى',
};

export interface ExternalPartyRecord {
  id: string;
  kind: ExternalPartyKind;
  nameAr: string;
  phone?: string;
  email?: string;
  organizationAr?: string;
  notes?: string;
  updatedAt: string;
}

function uid() {
  return `xp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function now() {
  return new Date().toISOString();
}

const SEED: ExternalPartyRecord[] = [
  {
    id: 'xp-seed-1',
    kind: 'customer',
    nameAr: 'فهد العتيبي',
    phone: '+966 50 900 1122',
    email: 'fahad.client@example.com',
    organizationAr: 'شركة النور للتجارة',
    notes: 'عميل فرع الرياض — مهتم بتوسعة الاشتراك',
    updatedAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'xp-seed-2',
    kind: 'visitor',
    nameAr: 'نورة السبيعي',
    phone: '+966 55 200 3344',
    organizationAr: 'زيارة تعريفية — قسم المبيعات',
    updatedAt: '2026-04-10T14:30:00Z',
  },
  {
    id: 'xp-seed-3',
    kind: 'sales_lead',
    nameAr: 'مؤسسة حدائق الخليج',
    phone: '+966 11 445 6677',
    email: 'procurement@hadaiq.example',
    organizationAr: 'طلب عرض سعر — ٥٠ مقعد',
    updatedAt: '2026-04-18T09:15:00Z',
  },
];

interface State {
  parties: ExternalPartyRecord[];
  add: (d: Omit<ExternalPartyRecord, 'id' | 'updatedAt'>) => { ok: boolean; error?: string };
  update: (id: string, d: Partial<Omit<ExternalPartyRecord, 'id'>>) => { ok: boolean; error?: string };
  remove: (id: string) => void;
}

export const useExternalContactsStore = create<State>()(
  persist(
    (set, get) => ({
      parties: SEED,
      add: (d) => {
        if (!d.nameAr.trim()) return { ok: false, error: 'الاسم مطلوب' };
        const row: ExternalPartyRecord = {
          ...d,
          nameAr: d.nameAr.trim(),
          id: uid(),
          updatedAt: now(),
        };
        set((s) => ({ parties: [row, ...s.parties] }));
        return { ok: true };
      },
      update: (id, d) => {
        if (d.nameAr !== undefined && !d.nameAr.trim()) return { ok: false, error: 'الاسم مطلوب' };
        set((s) => ({
          parties: s.parties.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...d,
                  ...(d.nameAr !== undefined ? { nameAr: d.nameAr.trim() } : {}),
                  updatedAt: now(),
                }
              : p,
          ),
        }));
        return { ok: true };
      },
      remove: (id) => set((s) => ({ parties: s.parties.filter((p) => p.id !== id) })),
    }),
    { name: 'hr_external_contacts_v1', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
