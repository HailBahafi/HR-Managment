import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { disciplineApprovalTemplatesApi } from './api/discipline-approval-templates';
import type { DisciplineApprovalTemplateResponseDto, ApprovalTemplateStage } from './api/discipline-approval-templates';
import type { HRApprovalAssignmentTemplate } from '@/features/hr/requests/lib/types';

function mapApi(r: DisciplineApprovalTemplateResponseDto): HRApprovalAssignmentTemplate {
  return {
    id: r.id,
    nameAr: r.nameAr,
    description: r.description ?? '',
    assignmentLinkKind: 'violation',
    assignmentLinkedIds: r.linkedViolationTypeIds,
    violationTypeId: r.linkedViolationTypeIds[0] ?? null,
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    stages: r.stages.map((s) => ({
      id: s.id,
      sortOrder: s.sortOrder,
      mode: s.mode as 'sequential' | 'any_one',
      approvers: s.approvers,
    })),
  };
}

/** معرفات أنواع المخالفات المرتبطة بالإسناد */
export function disciplineApprovalLinkedIds(t: HRApprovalAssignmentTemplate): string[] {
  const raw = t.assignmentLinkedIds?.filter(Boolean) ?? [];
  if (raw.length > 0) return raw;
  if (t.violationTypeId) return [t.violationTypeId];
  return [];
}

interface AAState {
  templates: HRApprovalAssignmentTemplate[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (draft: Omit<HRApprovalAssignmentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ ok: boolean; error?: string }>;
  update: (id: string, patch: Partial<Omit<HRApprovalAssignmentTemplate, 'id' | 'createdAt'>>) => Promise<{ ok: boolean; error?: string }>;
  remove: (id: string) => Promise<void>;
}

export const useHRDisciplineApprovalAssignmentTemplatesStore = create<AAState>()((set) => ({
  templates: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = useAuthStore.getState().activeCompanyId;
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await disciplineApprovalTemplatesApi.getAll({ companyId, limit: 200 });
      set({ templates: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  add: async (draft) => {
    try {
      const companyId = useAuthStore.getState().activeCompanyId ?? '';
      const created = await disciplineApprovalTemplatesApi.create({
        companyId,
        nameAr: draft.nameAr,
        description: draft.description,
        isActive: draft.isActive,
        stages: draft.stages as ApprovalTemplateStage[],
        linkedViolationTypeIds: draft.assignmentLinkedIds ?? [],
      });
      set((s) => ({ templates: [...s.templates, mapApi(created)] }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },

  update: async (id, patch) => {
    try {
      const updated = await disciplineApprovalTemplatesApi.update(id, {
        nameAr: patch.nameAr,
        description: patch.description,
        isActive: patch.isActive,
        stages: patch.stages as ApprovalTemplateStage[] | undefined,
        linkedViolationTypeIds: patch.assignmentLinkedIds,
      });
      set((s) => ({ templates: s.templates.map((t) => (t.id === id ? mapApi(updated) : t)) }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },

  remove: async (id) => {
    await disciplineApprovalTemplatesApi.remove(id);
    set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
  },
}));
