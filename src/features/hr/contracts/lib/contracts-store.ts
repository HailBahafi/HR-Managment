import { create } from 'zustand';
import { STATUS_PILL } from '@/shared/status-pill-classes';
import { employeeContractsApi, type ApiEmployeeContract } from './contracts-api';
import { useAuthStore } from '@/features/auth/lib/auth-store';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HRContractNature =
  | 'fixed_term'
  | 'indefinite'
  | 'project_based'
  | 'task_based'
  | 'temporary'
  | 'seasonal';

/** مطابق لـ backend WorkArrangement (+ flexible للسجلات القديمة) */
export type HRWorkArrangement = 'full_time' | 'part_time' | 'remote' | 'hybrid' | 'flexible';

export type HRContractLifecycleStatus = 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated' | 'superseded' | 'cancelled';

export type HRContractAllowanceLine = {
  allowanceTypeId: string;
  allowanceTypeNameAr: string;
  allowanceTypeCode: string;
  amount: number;
  sortOrder: number;
};

export type HRContractRecord = {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  branchNameAr: string;
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
  annualLeaveDays: number | null;
  employeeSigned: boolean;
  rejectionReason: string | null;
  signedAt: string | null;
  updatedAt: string;
};

export type HRContractDraft = Omit<HRContractRecord, 'id' | 'updatedAt'>;
export type ActivateResult = { ok: true } | { ok: false; message: string };

// ─── Mapping ──────────────────────────────────────────────────────────────────

export function mapEmployeeContractFromApi(c: ApiEmployeeContract): HRContractRecord {
  return {
    id: c.id,
    employeeId: c.employeeId,
    employeeNameAr: c.employeeNameAr ?? '',
    branchNameAr: c.branchNameAr ?? '',
    contractNumber: c.contractNumber,
    contractType: c.contractNature as HRContractNature,
    workArrangement: c.workArrangement as HRWorkArrangement,
    startDate: c.startDate,
    endDate: c.endDate ?? '',
    probationDays: c.probationDays ?? null,
    baseSalary: Number(c.baseSalary) || 0,
    currency: c.currency,
    status: c.status as HRContractLifecycleStatus,
    templateId: c.contractTemplateId ?? null,
    allowanceLines: (c.allowanceLines ?? []).map((l, i) => ({
      allowanceTypeId: l.allowanceTypeId,
      allowanceTypeNameAr: l.allowanceTypeNameAr ?? '',
      allowanceTypeCode: l.allowanceTypeCode ?? '',
      amount: Number(l.amount) || 0,
      sortOrder: l.sortOrder ?? i,
    })),
    allowancesNote: c.allowancesNote ?? '',
    deductionsNote: c.deductionsNote ?? '',
    amendsContractId: c.amendsContractId ?? null,
    supersededByContractId: c.supersededByContractId ?? null,
    earlyTerminationReason: c.earlyTerminationReason ?? null,
    articleIds: (c.articles ?? []).map(a => a.contractArticleId),
    annualLeaveDays: c.annualLeaveDays ?? null,
    employeeSigned: c.employeeSigned ?? false,
    rejectionReason: c.rejectionReason ?? null,
    signedAt: c.signedAt ?? null,
    updatedAt: c.updatedAt,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface HRContractsState {
  contracts: HRContractRecord[];
  isLoading: boolean;
  error: string | null;
  fetch: (params?: { employeeId?: string }) => Promise<void>;
  add: (data: HRContractDraft) => Promise<string>;
  update: (id: string, patch: Partial<HRContractDraft>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  activate: (id: string) => Promise<ActivateResult>;
  terminate: (id: string, reason: string) => Promise<ActivateResult>;
  archive: (id: string) => Promise<ActivateResult>;
  createAmendmentDraft: (activeContractId: string) => Promise<{ ok: true; id: string } | { ok: false; message: string }>;
  syncExpiredByEndDate: () => void;
}

export const useHRContractsStore = create<HRContractsState>()((set, get) => ({
  contracts: [],
  isLoading: false,
  error: null,

  fetch: async (params) => {
    const companyId = useAuthStore.getState().activeCompanyId;
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await employeeContractsApi.list({ companyId, limit: 500, ...params });
      set({ contracts: result.items.map(mapEmployeeContractFromApi), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  add: async (data) => {
    const companyId = useAuthStore.getState().activeCompanyId ?? '';
    const created = await employeeContractsApi.create({
      companyId,
      employeeId: data.employeeId,
      contractNumber: data.contractNumber,
      contractNature: data.contractType,
      workArrangement: data.workArrangement,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      probationDays: data.probationDays ?? undefined,
      annualLeaveDays: data.annualLeaveDays ?? undefined,
      baseSalary: data.baseSalary,
      currency: data.currency,
      status: data.status,
      allowancesNote: data.allowancesNote || undefined,
      deductionsNote: data.deductionsNote || undefined,
      amendsContractId: data.amendsContractId ?? undefined,
      contractTemplateId: data.templateId ?? undefined,
      applyTemplateDefaults: data.templateId ? true : undefined,
      articleIds: data.articleIds.length > 0 ? data.articleIds : undefined,
      allowanceLines: data.allowanceLines
        .filter(l => l.allowanceTypeId)
        .map((l, i) => ({ allowanceTypeId: l.allowanceTypeId, amount: l.amount, sortOrder: i })),
    });
    const row = mapEmployeeContractFromApi(created);
    set(s => ({ contracts: [row, ...s.contracts] }));
    return created.id;
  },

  update: async (id, patch) => {
    const current = get().contracts.find(c => c.id === id);
    if (!current || current.status !== 'draft') return false;
    try {
      const updated = await employeeContractsApi.update(id, {
        contractNature: patch.contractType,
        workArrangement: patch.workArrangement,
        startDate: patch.startDate,
        endDate: patch.endDate,
        probationDays: patch.probationDays ?? undefined,
        annualLeaveDays: patch.annualLeaveDays ?? undefined,
        baseSalary: patch.baseSalary,
        currency: patch.currency,
        allowancesNote: patch.allowancesNote,
        deductionsNote: patch.deductionsNote,
        articleIds: patch.articleIds,
        allowanceLines: patch.allowanceLines
          ?.filter(l => l.allowanceTypeId)
          .map((l, i) => ({ allowanceTypeId: l.allowanceTypeId, amount: l.amount, sortOrder: i })),
      });
      const row = mapEmployeeContractFromApi(updated);
      set(s => ({ contracts: s.contracts.map(c => c.id === id ? row : c) }));
      return true;
    } catch {
      return false;
    }
  },

  remove: async (id) => {
    try {
      await employeeContractsApi.delete(id);
      set(s => ({ contracts: s.contracts.filter(c => c.id !== id) }));
      return true;
    } catch {
      return false;
    }
  },

  activate: async (id) => {
    const c = get().contracts.find(x => x.id === id);
    if (!c || c.status !== 'draft') return { ok: false, message: 'يمكن تفعيل المسودات فقط.' };
    try {
      const updated = await employeeContractsApi.update(id, { status: 'active' });
      const row = mapEmployeeContractFromApi(updated);
      set(s => ({ contracts: s.contracts.map(x => x.id === id ? row : x) }));
      return { ok: true };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },

  terminate: async (id, reason) => {
    const c = get().contracts.find(x => x.id === id);
    if (!c || c.status !== 'active') return { ok: false, message: 'يمكن إنهاء العقود النشطة فقط.' };
    try {
      const updated = await employeeContractsApi.update(id, {
        status: 'terminated',
        earlyTerminationReason: reason.trim() || 'إنهاء مبكر',
      });
      const row = mapEmployeeContractFromApi(updated);
      set(s => ({ contracts: s.contracts.map(x => x.id === id ? row : x) }));
      return { ok: true };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },

  archive: async (id) => {
    const c = get().contracts.find(x => x.id === id);
    if (!c || (c.status !== 'expired' && c.status !== 'terminated'))
      return { ok: false, message: 'يمكن إلغاء العقود المنتهية أو المُنهية فقط.' };
    try {
      const updated = await employeeContractsApi.update(id, { status: 'cancelled' });
      const row = mapEmployeeContractFromApi(updated);
      set(s => ({ contracts: s.contracts.map(x => x.id === id ? row : x) }));
      return { ok: true };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },

  createAmendmentDraft: async (activeContractId) => {
    const parent = get().contracts.find(x => x.id === activeContractId);
    if (!parent || parent.status !== 'active') return { ok: false, message: 'اختر عقداً نشطاً.' };
    const companyId = useAuthStore.getState().activeCompanyId ?? '';
    try {
      const created = await employeeContractsApi.create({
        companyId,
        employeeId: parent.employeeId,
        contractNumber: `${parent.contractNumber}-AMD-${Date.now().toString(36).toUpperCase()}`,
        contractNature: parent.contractType,
        workArrangement: parent.workArrangement,
        startDate: parent.startDate,
        endDate: parent.endDate || undefined,
        probationDays: parent.probationDays ?? undefined,
        annualLeaveDays: parent.annualLeaveDays ?? undefined,
        baseSalary: parent.baseSalary,
        currency: parent.currency,
        status: 'draft',
        amendsContractId: parent.id,
        contractTemplateId: parent.templateId ?? undefined,
        articleIds: parent.articleIds.length > 0 ? parent.articleIds : undefined,
        allowanceLines: parent.allowanceLines
          .filter(l => l.allowanceTypeId)
          .map((l, i) => ({ allowanceTypeId: l.allowanceTypeId, amount: l.amount, sortOrder: i })),
        allowancesNote: parent.allowancesNote || undefined,
        deductionsNote: parent.deductionsNote || undefined,
      });
      const row = mapEmployeeContractFromApi(created);
      set(s => ({ contracts: [row, ...s.contracts] }));
      return { ok: true, id: created.id };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },

  syncExpiredByEndDate: () => {
    // Status expiration is managed server-side; this is a no-op client hint.
  },
}));

// ─── Labels & colors ──────────────────────────────────────────────────────────

export const CONTRACT_NATURE_LABELS: Record<HRContractNature, string> = {
  fixed_term: 'محدد المدة',
  indefinite: 'غير محدد المدة',
  project_based: 'عقد إنجاز / مشروع',
  task_based: 'عقد إنجاز مهام',
  temporary: 'مؤقت',
  seasonal: 'موسمي',
};

export const WORK_ARRANGEMENT_LABELS: Record<HRWorkArrangement, string> = {
  full_time: 'دوام كامل',
  part_time: 'دوام جزئي',
  remote: 'عن بُعد',
  hybrid: 'هجين (مختلط)',
  flexible: 'دوام مرن',
};

export const CONTRACT_STATUS_LABELS: Record<HRContractLifecycleStatus, string> = {
  draft: 'مسودة',
  pending_signature: 'بانتظار التوقيع',
  active: 'نشط',
  expired: 'منتهي',
  terminated: 'مُنهى مبكراً',
  superseded: 'مستبدل',
  cancelled: 'ملغى',
};

export const CONTRACT_STATUS_COLORS: Record<HRContractLifecycleStatus, string> = {
  draft: STATUS_PILL.muted,
  pending_signature: STATUS_PILL.info,
  active: STATUS_PILL.approved,
  expired: STATUS_PILL.warning,
  terminated: STATUS_PILL.rejected,
  superseded: STATUS_PILL.calculated,
  cancelled: STATUS_PILL.cancelled,
};

export function formatEmployeeSignedLabel(signed: boolean): string {
  return signed ? 'نعم' : 'لا';
}

export function normalizeContractRow(raw: Record<string, unknown>): HRContractRecord {
  return raw as HRContractRecord;
}
