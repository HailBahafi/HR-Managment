import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { disciplineInvestigationsApi } from './api/discipline-investigations';
import type { DisciplineInvestigationResponseDto } from './api/discipline-investigations';
import type { HRDisciplineInvestigationRecord, HRInvestigationRecommendation } from './types';

function mapApi(r: DisciplineInvestigationResponseDto): HRDisciplineInvestigationRecord {
  const recommendationType = (r.recommendation ?? null) as HRInvestigationRecommendation | null;
  return {
    id: r.id,
    caseId: r.violationRecordId,
    caseNumber: r.linkedViolationRecordNumber,
    employeeId: r.subjectEmployeeId,
    employeeNameAr: '',
    investigatorName: r.investigatorEmployeeId,
    date: r.investigationDate,
    employeeStatement: r.employeeStatement ?? '',
    witnessStatement: r.witnessStatement ?? '',
    result: r.result,
    recommendation: r.recommendation ?? '',
    recommendationType,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

interface InvestigationsState {
  investigations: HRDisciplineInvestigationRecord[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (d: Omit<HRDisciplineInvestigationRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  update: (id: string, patch: Partial<HRDisciplineInvestigationRecord>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useHRDisciplineInvestigationsStore = create<InvestigationsState>()((set) => ({
  investigations: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = useAuthStore.getState().activeCompanyId;
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await disciplineInvestigationsApi.getAll({ companyId, limit: 200 });
      set({ investigations: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  add: async (d) => {
    const companyId = useAuthStore.getState().activeCompanyId ?? '';
    const created = await disciplineInvestigationsApi.create({
      companyId,
      violationRecordId: d.caseId || undefined,
      investigatorEmployeeId: d.investigatorName,
      investigationDate: d.date,
      employeeStatement: d.employeeStatement || null,
      witnessStatement: d.witnessStatement || null,
      result: d.result,
      recommendation: d.recommendationType ?? null,
    });
    set((s) => ({ investigations: [...s.investigations, mapApi(created)] }));
  },

  update: async (id, patch) => {
    const updated = await disciplineInvestigationsApi.update(id, {
      ...(patch.investigatorName != null ? { investigatorEmployeeId: patch.investigatorName } : {}),
      ...(patch.date != null ? { investigationDate: patch.date } : {}),
      ...(patch.employeeStatement != null ? { employeeStatement: patch.employeeStatement } : {}),
      ...(patch.witnessStatement != null ? { witnessStatement: patch.witnessStatement } : {}),
      ...(patch.result != null ? { result: patch.result } : {}),
      ...(patch.recommendationType !== undefined ? { recommendation: patch.recommendationType } : {}),
    });
    set((s) => ({ investigations: s.investigations.map((i) => (i.id === id ? mapApi(updated) : i)) }));
  },

  remove: async (id) => {
    await disciplineInvestigationsApi.remove(id);
    set((s) => ({ investigations: s.investigations.filter((i) => i.id !== id) }));
  },
}));
