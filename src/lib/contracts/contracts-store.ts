import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** تصنيف العقد (قانوني/إداري) */
export type HRContractNature =
  | 'fixed_term' /** محدد المدة */
  | 'indefinite' /** غير محدد المدة */
  | 'task_based' /** عقد إنجاز مهام */
  | 'temporary' /** مؤقت */
  | 'seasonal'; /** موسمي */

/** نمط الدوام */
export type HRWorkArrangement = 'flexible' | 'full_time' | 'part_time';

export type HRContractLifecycleStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'archived';

export type HRContractAllowanceLine = {
  allowanceTypeId: string;
  amount: number;
};

export type HRContractRecord = {
  id: string;
  employeeId: string;
  contractNumber: string;
  contractType: HRContractNature;
  workArrangement: HRWorkArrangement;
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

const NATURE_KEYS: HRContractNature[] = ['fixed_term', 'indefinite', 'task_based', 'temporary', 'seasonal'];
const WORK_KEYS: HRWorkArrangement[] = ['flexible', 'full_time', 'part_time'];

/** يضمن حقول العقد بعد التخزين أو الهجرة من الإصدارات القديمة (نوع العقد + نوع الدوام) */
export function normalizeContractRow(raw: Record<string, unknown>): HRContractRecord {
  const r = raw as Partial<HRContractRecord> & { contractType?: unknown; workArrangement?: unknown };
  const ct = r.contractType as string | undefined;
  const wa = r.workArrangement as string | undefined;
  const workOk = WORK_KEYS.includes(wa as HRWorkArrangement);
  let contractType: HRContractNature = 'fixed_term';
  let workArrangement: HRWorkArrangement = 'full_time';

  if (workOk) {
    workArrangement = wa as HRWorkArrangement;
    contractType = NATURE_KEYS.includes(ct as HRContractNature) ? (ct as HRContractNature) : 'fixed_term';
  } else if (ct === 'full_time') {
    contractType = 'fixed_term';
    workArrangement = 'full_time';
  } else if (ct === 'part_time') {
    contractType = 'fixed_term';
    workArrangement = 'part_time';
  } else if (ct === 'temporary') {
    contractType = 'temporary';
    workArrangement = 'full_time';
  } else if (NATURE_KEYS.includes(ct as HRContractNature)) {
    contractType = ct as HRContractNature;
    workArrangement = 'full_time';
  }

  return { ...r, contractType, workArrangement } as HRContractRecord;
}

/** Fixed timestamps so SSR and client sort order match (avoid `nowIso()` in seed). */
const SEED_UPDATED_AT = [
  '2026-04-01T12:00:12.000Z', '2026-04-01T12:00:11.000Z', '2026-04-01T12:00:10.000Z',
  '2026-04-01T12:00:09.000Z', '2026-04-01T12:00:08.000Z', '2026-04-01T12:00:07.000Z',
  '2026-04-01T12:00:06.000Z', '2026-04-01T12:00:05.000Z', '2026-04-01T12:00:04.000Z',
  '2026-04-01T12:00:03.000Z', '2026-04-01T12:00:02.000Z', '2026-04-01T12:00:01.000Z',
] as const;

const SEED: HRContractRecord[] = [
  // e1 — عبدالرحمن المالكي — 6 contracts (2021–2026)
  {
    id: 'ctr-e1-1', employeeId: 'e1', contractNumber: 'CL-2021-001',
    contractType: 'fixed_term', workArrangement: 'full_time', startDate: '2021-01-01', endDate: '2021-12-31',
    probationDays: 90, baseSalary: 7500, currency: 'SAR', status: 'archived',
    templateId: null,
    allowanceLines: [{ allowanceTypeId: 'halt-transport', amount: 500 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: 'ctr-e1-2',
    earlyTerminationReason: null, articleIds: ['art-seed-1'], annualLeaveDays: 21,
    updatedAt: SEED_UPDATED_AT[0],
  },
  {
    id: 'ctr-e1-2', employeeId: 'e1', contractNumber: 'CL-2022-001',
    contractType: 'fixed_term', workArrangement: 'full_time', startDate: '2022-01-01', endDate: '2022-12-31',
    probationDays: null, baseSalary: 8500, currency: 'SAR', status: 'archived',
    templateId: null,
    allowanceLines: [{ allowanceTypeId: 'halt-transport', amount: 600 }, { allowanceTypeId: 'halt-phone', amount: 200 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: 'ctr-e1-3',
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2'], annualLeaveDays: 21,
    updatedAt: SEED_UPDATED_AT[0],
  },
  {
    id: 'ctr-e1-3', employeeId: 'e1', contractNumber: 'CL-2023-001',
    contractType: 'fixed_term', workArrangement: 'full_time', startDate: '2023-01-01', endDate: '2023-12-31',
    probationDays: null, baseSalary: 9500, currency: 'SAR', status: 'expired',
    templateId: 'hct-standard',
    allowanceLines: [{ allowanceTypeId: 'halt-housing', amount: 2000 }, { allowanceTypeId: 'halt-transport', amount: 700 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: 'ctr-e1-4',
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2'], annualLeaveDays: 21,
    updatedAt: SEED_UPDATED_AT[0],
  },
  {
    id: 'ctr-e1-4', employeeId: 'e1', contractNumber: 'CL-2024-001',
    contractType: 'fixed_term', workArrangement: 'full_time', startDate: '2024-01-01', endDate: '2024-12-31',
    probationDays: null, baseSalary: 10500, currency: 'SAR', status: 'expired',
    templateId: 'hct-exec',
    allowanceLines: [{ allowanceTypeId: 'halt-housing', amount: 2500 }, { allowanceTypeId: 'halt-transport', amount: 800 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: 'ctr-e1-5',
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2', 'art-seed-3'], annualLeaveDays: 30,
    updatedAt: SEED_UPDATED_AT[0],
  },
  {
    id: 'ctr-e1-5', employeeId: 'e1', contractNumber: 'CL-2025-001',
    contractType: 'fixed_term', workArrangement: 'full_time', startDate: '2025-01-01', endDate: '2025-12-31',
    probationDays: null, baseSalary: 11500, currency: 'SAR', status: 'expired',
    templateId: 'hct-exec',
    allowanceLines: [{ allowanceTypeId: 'halt-housing', amount: 2800 }, { allowanceTypeId: 'halt-transport', amount: 800 }, { allowanceTypeId: 'halt-phone', amount: 300 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: 'ctr-e1-6',
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2', 'art-seed-3'], annualLeaveDays: 30,
    updatedAt: SEED_UPDATED_AT[0],
  },
  {
    id: 'ctr-e1-6', employeeId: 'e1', contractNumber: 'CL-2026-001',
    contractType: 'fixed_term', workArrangement: 'full_time', startDate: '2026-01-01', endDate: '2026-12-31',
    probationDays: null, baseSalary: 12000, currency: 'SAR', status: 'active',
    templateId: 'hct-exec',
    allowanceLines: [{ allowanceTypeId: 'halt-housing', amount: 3000 }, { allowanceTypeId: 'halt-transport', amount: 800 }, { allowanceTypeId: 'halt-phone', amount: 300 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2', 'art-seed-3'], annualLeaveDays: 30,
    updatedAt: SEED_UPDATED_AT[0],
  },
  {
    id: 'ctr-seed-1', employeeId: 'e1-old', contractNumber: 'CL-2024-OLD',
    contractType: 'fixed_term', workArrangement: 'full_time', startDate: '2024-01-01', endDate: '2026-12-31',
    probationDays: 90, baseSalary: 12000, currency: 'SAR', status: 'archived',
    templateId: 'hct-exec',
    allowanceLines: [{ allowanceTypeId: 'halt-housing', amount: 3000 }, { allowanceTypeId: 'halt-transport', amount: 800 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2', 'art-seed-3'], annualLeaveDays: 30,
    updatedAt: SEED_UPDATED_AT[0],
  },
  {
    id: 'ctr-seed-2', employeeId: 'e2', contractNumber: 'CL-2024-002',
    contractType: 'fixed_term', workArrangement: 'full_time', startDate: '2024-03-01', endDate: '2026-02-28',
    probationDays: 60, baseSalary: 9000, currency: 'SAR', status: 'active',
    templateId: 'hct-standard',
    allowanceLines: [{ allowanceTypeId: 'halt-transport', amount: 800 }, { allowanceTypeId: 'halt-phone', amount: 200 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2'], annualLeaveDays: 21,
    updatedAt: SEED_UPDATED_AT[1],
  },
  {
    id: 'ctr-seed-3', employeeId: 'e3', contractNumber: 'CL-2024-003',
    contractType: 'fixed_term', workArrangement: 'full_time', startDate: '2024-06-01', endDate: '2026-05-31',
    probationDays: 60, baseSalary: 7500, currency: 'SAR', status: 'active',
    templateId: 'hct-field',
    allowanceLines: [{ allowanceTypeId: 'halt-field', amount: 1200 }, { allowanceTypeId: 'halt-transport', amount: 600 }, { allowanceTypeId: 'halt-gas', amount: 400 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2', 'art-seed-4'], annualLeaveDays: 21,
    updatedAt: SEED_UPDATED_AT[2],
  },
  {
    id: 'ctr-seed-4', employeeId: 'e4', contractNumber: 'CL-2025-DRAFT-01',
    contractType: 'fixed_term', workArrangement: 'part_time', startDate: '2025-06-01', endDate: '2025-12-31',
    probationDays: 30, baseSalary: 5000, currency: 'SAR', status: 'draft',
    templateId: 'hct-part',
    allowanceLines: [{ allowanceTypeId: 'halt-transport', amount: 500 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-4'], annualLeaveDays: 15,
    updatedAt: SEED_UPDATED_AT[3],
  },
  {
    id: 'ctr-seed-5', employeeId: 'e5', contractNumber: 'CL-2025-DRAFT-02',
    contractType: 'temporary', workArrangement: 'full_time', startDate: '2025-05-01', endDate: '2025-10-31',
    probationDays: null, baseSalary: 4000, currency: 'SAR', status: 'draft',
    templateId: 'hct-temp',
    allowanceLines: [{ allowanceTypeId: 'halt-food', amount: 500 }, { allowanceTypeId: 'halt-transport', amount: 400 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1'], annualLeaveDays: 14,
    updatedAt: SEED_UPDATED_AT[4],
  },
  {
    id: 'ctr-seed-6', employeeId: 'e3', contractNumber: 'CL-2022-LEG',
    contractType: 'temporary', workArrangement: 'full_time', startDate: '2022-01-01', endDate: '2023-12-31',
    probationDays: null, baseSalary: 3500, currency: 'SAR', status: 'archived',
    templateId: null, allowanceLines: [], allowancesNote: '', deductionsNote: '',
    amendsContractId: null, supersededByContractId: 'ctr-seed-3', earlyTerminationReason: null,
    articleIds: [], annualLeaveDays: null,
    updatedAt: SEED_UPDATED_AT[5],
  },
  {
    id: 'ctr-seed-7', employeeId: 'e2', contractNumber: 'CL-2023-EXP',
    contractType: 'fixed_term', workArrangement: 'full_time', startDate: '2023-01-01', endDate: '2024-01-31',
    probationDays: 60, baseSalary: 8000, currency: 'SAR', status: 'expired',
    templateId: 'hct-standard', allowanceLines: [{ allowanceTypeId: 'halt-transport', amount: 700 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: 'ctr-seed-2',
    earlyTerminationReason: 'انتهاء تلقائي', articleIds: ['art-seed-1', 'art-seed-2'], annualLeaveDays: 21,
    updatedAt: SEED_UPDATED_AT[6],
  },
  {
    id: 'ctr-seed-8', employeeId: 'e4', contractNumber: 'CL-2025-004',
    contractType: 'fixed_term', workArrangement: 'part_time', startDate: '2025-01-01', endDate: '2026-12-31',
    probationDays: 30, baseSalary: 5500, currency: 'SAR', status: 'active',
    templateId: 'hct-part',
    allowanceLines: [{ allowanceTypeId: 'halt-transport', amount: 600 }, { allowanceTypeId: 'halt-phone', amount: 200 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2', 'art-seed-4'], annualLeaveDays: 15,
    updatedAt: SEED_UPDATED_AT[7],
  },
  {
    id: 'ctr-seed-9', employeeId: 'e5', contractNumber: 'CL-2025-005',
    contractType: 'fixed_term', workArrangement: 'full_time', startDate: '2025-01-01', endDate: '2026-12-31',
    probationDays: null, baseSalary: 6500, currency: 'SAR', status: 'active',
    templateId: 'hct-standard',
    allowanceLines: [{ allowanceTypeId: 'halt-food', amount: 600 }, { allowanceTypeId: 'halt-transport', amount: 500 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2'], annualLeaveDays: 21,
    updatedAt: SEED_UPDATED_AT[8],
  },
  {
    id: 'ctr-seed-10', employeeId: 'e6', contractNumber: 'CL-2025-006',
    contractType: 'fixed_term', workArrangement: 'full_time', startDate: '2025-02-01', endDate: '2027-01-31',
    probationDays: 60, baseSalary: 8500, currency: 'SAR', status: 'active',
    templateId: 'hct-standard',
    allowanceLines: [{ allowanceTypeId: 'halt-housing', amount: 2000 }, { allowanceTypeId: 'halt-transport', amount: 800 }, { allowanceTypeId: 'halt-phone', amount: 200 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2', 'art-seed-3'], annualLeaveDays: 21,
    updatedAt: SEED_UPDATED_AT[9],
  },
  {
    id: 'ctr-seed-11', employeeId: 'e7', contractNumber: 'CL-2025-007',
    contractType: 'fixed_term', workArrangement: 'full_time', startDate: '2025-03-01', endDate: '2027-02-28',
    probationDays: 60, baseSalary: 7200, currency: 'SAR', status: 'active',
    templateId: 'hct-standard',
    allowanceLines: [{ allowanceTypeId: 'halt-transport', amount: 700 }, { allowanceTypeId: 'halt-phone', amount: 200 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2'], annualLeaveDays: 21,
    updatedAt: SEED_UPDATED_AT[10],
  },
  {
    id: 'ctr-seed-12', employeeId: 'e8', contractNumber: 'CL-2025-008',
    contractType: 'fixed_term', workArrangement: 'full_time', startDate: '2025-01-15', endDate: '2027-01-14',
    probationDays: 60, baseSalary: 6800, currency: 'SAR', status: 'active',
    templateId: 'hct-field',
    allowanceLines: [{ allowanceTypeId: 'halt-field', amount: 1000 }, { allowanceTypeId: 'halt-transport', amount: 600 }, { allowanceTypeId: 'halt-risk', amount: 400 }],
    allowancesNote: '', deductionsNote: '', amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: ['art-seed-1', 'art-seed-2', 'art-seed-3', 'art-seed-4'], annualLeaveDays: 21,
    updatedAt: SEED_UPDATED_AT[11],
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
      version: 6,
      skipHydration: true,
      partialize: s => ({ contracts: s.contracts }),
      migrate: (_p: unknown, _fromVersion: number) => {
        const ps = _p as { contracts?: Record<string, unknown>[] };
        const raw = Array.isArray(ps?.contracts) ? ps.contracts : SEED.map(c => ({ ...c } as unknown as Record<string, unknown>));
        return { contracts: raw.map(row => normalizeContractRow(row)) };
      },
    },
  ),
);

export const CONTRACT_NATURE_LABELS: Record<HRContractNature, string> = {
  fixed_term: 'محدد المدة',
  indefinite: 'غير محدد المدة',
  task_based: 'عقد إنجاز مهام',
  temporary: 'مؤقت',
  seasonal: 'موسمي',
};

export const WORK_ARRANGEMENT_LABELS: Record<HRWorkArrangement, string> = {
  flexible: 'دوام مرن',
  full_time: 'دوام كامل',
  part_time: 'دوام جزئي',
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
