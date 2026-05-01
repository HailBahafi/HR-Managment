import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRApprovalAssignmentTemplate } from '@/lib/hr-requests/types';
import { templateStagesToCore, validateApprovalStages } from '@/lib/hr-requests/types';

function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function now() { return new Date().toISOString(); }

const SEED: HRApprovalAssignmentTemplate[] = [
  {
    id: 'daat-standard', nameAr: 'سلسلة الموافقة القياسية للانضباط', description: 'مدير مباشر ثم مدير الموارد البشرية',
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    stages: [
      { id: 'dats-1', sortOrder: 1, mode: 'sequential', approvers: [{ employeeId: 'e1', mandatory: true }] },
      { id: 'dats-2', sortOrder: 2, mode: 'sequential', approvers: [{ employeeId: 'e2', mandatory: true }] },
    ],
  },
  {
    id: 'daat-fast', nameAr: 'موافقة سريعة للانضباط', description: 'معتمد واحد من فريق الإدارة',
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    stages: [
      { id: 'dats-3', sortOrder: 1, mode: 'any_one', approvers: [{ employeeId: 'e1', mandatory: false }, { employeeId: 'e3', mandatory: false }] },
    ],
  },
];

interface AAState {
  templates: HRApprovalAssignmentTemplate[];
  add: (draft: Omit<HRApprovalAssignmentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => { ok: boolean; error?: string };
  update: (id: string, patch: Partial<Omit<HRApprovalAssignmentTemplate, 'id' | 'createdAt'>>) => { ok: boolean; error?: string };
  remove: (id: string) => void;
}

export const useHRDisciplineApprovalAssignmentTemplatesStore = create<AAState>()(
  persist(
    (set, get) => ({
      templates: SEED,

      add: (draft) => {
        const coreStages = templateStagesToCore(draft.stages);
        const err = validateApprovalStages(coreStages);
        if (err) return { ok: false, error: err };
        const tpl: HRApprovalAssignmentTemplate = { ...draft, id: `daat-${uid()}`, createdAt: now(), updatedAt: now() };
        set((s) => ({ templates: [...s.templates, tpl] }));
        return { ok: true };
      },

      update: (id, patch) => {
        if (patch.stages) {
          const err = validateApprovalStages(templateStagesToCore(patch.stages));
          if (err) return { ok: false, error: err };
        }
        set((s) => ({
          templates: s.templates.map(t => t.id === id ? { ...t, ...patch, updatedAt: now() } : t),
        }));
        return { ok: true };
      },

      remove: (id) => set((s) => ({ templates: s.templates.filter(t => t.id !== id) })),
    }),
    {
      name: 'hr_discipline_approval_assignment_templates_v1',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const s = persisted as AAState;
        if (version < 2) return { ...s, templates: (s.templates ?? SEED).map(t => ({ ...t, description: t.description ?? '', isActive: t.isActive ?? true })) };
        return s;
      },
    },
  ),
);
