import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HRContractKind = 'full_time' | 'part_time' | 'temporary';
export type HRContractLifecycleStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'archived';

export type HRContractAllowanceLine = {
  allowanceTypeId: string;
  amount: number;
};

export type HRContractRecord = {
  id: string;
  employeeId: string;
  contractNumber: string;
  contractType: HRContractKind;
  startDate: string;
  endDate: string;
  probationDays: number | null;
  baseSalary: number;
  currency: string;
  status: HRContractLifecycleStatus;
  templateId: string | null;
  allowanceLines: HRContractAllowanceLine[];
  allowancesNote: string;
  deductionsNote: string;
  amendsContractId: string | null;
  supersededByContractId: string | null;
  earlyTerminationReason: string | null;
  articleIds: string[];
  /** إجمالي أيام الإجازة السنوية في السنة (حسب العقد). */
  annualLeaveDays: number | null;
  updatedAt: string;
};

export type HRContractDraft = Omit<HRContractRecord, 'id' | 'updatedAt'>;
export type ActivateResult = { ok: true } | { ok: false; message: string };

const nowIso = () => new Date().toISOString();
function newId() { return `ctr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`; }

/** Fixed timestamps so SSR and client sort order match (avoid `nowIso()` in seed). */
const SEED_UPDATED_AT = [
  '2026-04-01T12:00:07.000Z', '2026-04-01T12:00:06.000Z', '2026-04-01T12:00:05.000Z',
  '2026-04-01T12:00:04.000Z', '2026-04-01T12:00:03.000Z', '2026-04-01T12:00:02.000Z',
  '2026-04-01T12:00:01.000Z',
] as const;

const SEED: HRContractRecord[] = [
  {
    id: 'ctr-seed-1', employeeId: 'e1', contractNumber: 'CL-2024-001',
    contractType: 'full_time', startDate: '2024-01-01', endDate: '2026-12-31',
    probationDays: 90, baseSalary: 12000, currency: 'SAR', status: 'active',
    templateId: 'hct-exec',
    allowanceLines: [{ allowanceTypeId: 'halt-housing', amount: 3000 }, { allowanceTypeId: 'halt-transport', amount: 800 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2', 'art-seed-3'], annualLeaveDays: 30,
    updatedAt: SEED_UPDATED_AT[0],
  },
  {
    id: 'ctr-seed-2', employeeId: 'e2', contractNumber: 'CL-2024-002',
    contractType: 'full_time', startDate: '2024-03-01', endDate: '2026-02-28',
    probationDays: 60, baseSalary: 9000, currency: 'SAR', status: 'active',
    templateId: 'hct-standard',
    allowanceLines: [{ allowanceTypeId: 'halt-transport', amount: 800 }, { allowanceTypeId: 'halt-phone', amount: 200 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2'], annualLeaveDays: 21,
    updatedAt: SEED_UPDATED_AT[1],
  },
  {
    id: 'ctr-seed-3', employeeId: 'e3', contractNumber: 'CL-2024-003',
    contractType: 'full_time', startDate: '2024-06-01', endDate: '2026-05-31',
    probationDays: 60, baseSalary: 7500, currency: 'SAR', status: 'active',
    templateId: 'hct-field',
    allowanceLines: [{ allowanceTypeId: 'halt-field', amount: 1200 }, { allowanceTypeId: 'halt-transport', amount: 600 }, { allowanceTypeId: 'halt-gas', amount: 400 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2', 'art-seed-4'], annualLeaveDays: 21,
    updatedAt: SEED_UPDATED_AT[2],
  },
  {
    id: 'ctr-seed-4', employeeId: 'e4', contractNumber: 'CL-2025-DRAFT-01',
    contractType: 'part_time', startDate: '2025-06-01', endDate: '2025-12-31',
    probationDays: 30, baseSalary: 5000, currency: 'SAR', status: 'draft',
    templateId: 'hct-part',
    allowanceLines: [{ allowanceTypeId: 'halt-transport', amount: 500 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-4'], annualLeaveDays: 15,
    updatedAt: SEED_UPDATED_AT[3],
  },
  {
    id: 'ctr-seed-5', employeeId: 'e5', contractNumber: 'CL-2025-DRAFT-02',
    contractType: 'temporary', startDate: '2025-05-01', endDate: '2025-10-31',
    probationDays: null, baseSalary: 4000, currency: 'SAR', status: 'draft',
    templateId: 'hct-temp',
    allowanceLines: [{ allowanceTypeId: 'halt-food', amount: 500 }, { allowanceTypeId: 'halt-transport', amount: 400 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1'], annualLeaveDays: 14,
    updatedAt: SEED_UPDATED_AT[4],
  },
  {
    id: 'ctr-seed-6', employeeId: 'e3', contractNumber: 'CL-2022-LEG',
    contractType: 'temporary', startDate: '2022-01-01', endDate: '2023-12-31',
    probationDays: null, baseSalary: 3500, currency: 'SAR', status: 'archived',
    templateId: null, allowanceLines: [], allowancesNote: '', deductionsNote: '',
    amendsContractId: null, supersededByContractId: 'ctr-seed-3', earlyTerminationReason: null,
    articleIds: [], annualLeaveDays: null,
    updatedAt: SEED_UPDATED_AT[5],
  },
  {
    id: 'ctr-seed-7', employeeId: 'e2', contractNumber: 'CL-2023-EXP',
    contractType: 'full_time', startDate: '2023-01-01', endDate: '2024-01-31',
    probationDays: 60, baseSalary: 8000, currency: 'SAR', status: 'expired',
    templateId: 'hct-standard', allowanceLines: [{ allowanceTypeId: 'halt-transport', amount: 700 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: 'ctr-seed-2',
    earlyTerminationReason: 'انتهاء تلقائي', articleIds: ['art-seed-1', 'art-seed-2'], annualLeaveDays: 21,
    updatedAt: SEED_UPDATED_AT[6],
  },
];

interface HRContractsState {
  contracts: HRContractRecord[];
  add: (data: HRContractDraft) => string;
  update: (id: string, patch: Partial<HRContractDraft>) => boolean;
  remove: (id: string) => boolean;
  activate: (id: string) => ActivateResult;
  terminate: (id: string, reason: string) => ActivateResult;
  archive: (id: string) => ActivateResult;
  createAmendmentDraft: (activeContractId: string) => { ok: true; id: string } | { ok: false; message: string };
  syncExpiredByEndDate: () => void;
}

export const useHRContractsStore = create<HRContractsState>()(
  persist(
    (set, get) => ({
      contracts: SEED.map(c => ({ ...c })),

      add: (data) => {
        const id = newId();
        set(s => ({ contracts: [{ ...data, id, updatedAt: nowIso() }, ...s.contracts] }));
        return id;
      },

      update: (id, patch) => {
        const row = get().contracts.find(c => c.id === id);
        if (!row || row.status !== 'draft') return false;
        set(s => ({ contracts: s.contracts.map(c => c.id === id ? { ...c, ...patch, updatedAt: nowIso() } : c) }));
        return true;
      },

      remove: (id) => {
        const row = get().contracts.find(c => c.id === id);
        if (!row || row.status !== 'draft') return false;
        set(s => ({ contracts: s.contracts.filter(c => c.id !== id) }));
        return true;
      },

      activate: (id) => {
        const c = get().contracts.find(x => x.id === id);
        if (!c || c.status !== 'draft') return { ok: false, message: 'يمكن تفعيل المسودات فقط.' };
        const blocking = get().contracts.filter(x =>
          x.employeeId === c.employeeId && x.status === 'active' &&
          !(c.amendsContractId && x.id === c.amendsContractId)
        );
        if (blocking.length > 0) return { ok: false, message: 'يوجد عقد نشط آخر لنفس الموظف.' };
        set(s => ({
          contracts: s.contracts.map(row => {
            if (row.id === c.amendsContractId) return { ...row, status: 'expired' as const, supersededByContractId: id, updatedAt: nowIso() };
            if (row.id === id) return { ...row, status: 'active' as const, updatedAt: nowIso() };
            return row;
          }),
        }));
        return { ok: true };
      },

      terminate: (id, reason) => {
        const c = get().contracts.find(x => x.id === id);
        if (!c || c.status !== 'active') return { ok: false, message: 'يمكن إنهاء العقود النشطة فقط.' };
        set(s => ({ contracts: s.contracts.map(row => row.id === id ? { ...row, status: 'terminated' as const, earlyTerminationReason: reason.trim() || 'إنهاء مبكر', updatedAt: nowIso() } : row) }));
        return { ok: true };
      },

      archive: (id) => {
        const c = get().contracts.find(x => x.id === id);
        if (!c || (c.status !== 'expired' && c.status !== 'terminated')) return { ok: false, message: 'يمكن أرشفة العقود المنتهية أو المُنهية فقط.' };
        set(s => ({ contracts: s.contracts.map(row => row.id === id ? { ...row, status: 'archived' as const, updatedAt: nowIso() } : row) }));
        return { ok: true };
      },

      createAmendmentDraft: (activeContractId) => {
        const parent = get().contracts.find(x => x.id === activeContractId);
        if (!parent || parent.status !== 'active') return { ok: false, message: 'اختر عقداً نشطاً.' };
        const id = newId();
        const draft: HRContractRecord = {
          ...parent, id,
          contractNumber: `${parent.contractNumber}-AMD-${Date.now().toString(36).toUpperCase()}`,
          status: 'draft', amendsContractId: parent.id, supersededByContractId: null,
          earlyTerminationReason: null, updatedAt: nowIso(),
        };
        set(s => ({ contracts: [draft, ...s.contracts] }));
        return { ok: true, id };
      },

      syncExpiredByEndDate: () => {
        const today = new Date().toISOString().slice(0, 10);
        set(s => ({
          contracts: s.contracts.map(row =>
            row.status === 'active' && row.endDate && row.endDate < today
              ? { ...row, status: 'expired' as const, earlyTerminationReason: row.earlyTerminationReason ?? 'انتهاء تلقائي', updatedAt: nowIso() }
              : row,
          ),
        }));
      },
    }),
    {
      name: 'hr_contracts_v1',
      version: 3,
      skipHydration: true,
      partialize: s => ({ contracts: s.contracts }),
      migrate: (p: unknown) => {
        const ps = p as { contracts?: HRContractRecord[] };
        return {
          contracts: (ps?.contracts ?? []).map(c => {
            const row = c as HRContractRecord & { annualLeaveDays?: number | null };
            return {
              ...c,
              templateId: c.templateId ?? null,
              allowanceLines: Array.isArray(c.allowanceLines) ? c.allowanceLines : [],
              articleIds: Array.isArray(c.articleIds) ? c.articleIds : [],
              annualLeaveDays: typeof row.annualLeaveDays === 'number' ? row.annualLeaveDays : null,
            };
          }),
        };
      },
    },
  ),
);

export const CONTRACT_KIND_LABELS: Record<HRContractKind, string> = {
  full_time: 'دوام كامل',
  part_time: 'دوام جزئي',
  temporary: 'مؤقت / موسمي',
};

export const CONTRACT_STATUS_LABELS: Record<HRContractLifecycleStatus, string> = {
  draft: 'مسودة',
  active: 'نشط',
  expired: 'منتهي',
  terminated: 'مُنهى مبكراً',
  archived: 'مؤرشف',
};

export const CONTRACT_STATUS_COLORS: Record<HRContractLifecycleStatus, string> = {
  draft: 'text-muted-foreground border-border bg-muted/40',
  active: 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30',
  expired: 'text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/30',
  terminated: 'text-red-700 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950/30',
  archived: 'text-muted-foreground border-border bg-muted/30',
};
