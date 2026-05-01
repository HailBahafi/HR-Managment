import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRApprovalAssignmentTemplate } from './types';
import { templateStagesToCore, validateApprovalStages } from './types';

function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function now() { return new Date().toISOString(); }

const SEED: HRApprovalAssignmentTemplate[] = [
  {
    id: 'aat-standard', nameAr: 'سلسلة الموافقة القياسية', description: 'مدير مباشر ثم مدير الموارد البشرية',
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    stages: [
      { id: 'ats-1', sortOrder: 1, mode: 'sequential', approvers: [{ employeeId: 'e1', mandatory: true }] },
      { id: 'ats-2', sortOrder: 2, mode: 'sequential', approvers: [{ employeeId: 'e2', mandatory: true }] },
    ],
  },
  {
    id: 'aat-fast', nameAr: 'موافقة سريعة', description: 'معتمد واحد من فريق الإدارة',
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    stages: [
      { id: 'ats-3', sortOrder: 1, mode: 'any_one', approvers: [{ employeeId: 'e1', mandatory: false }, { employeeId: 'e3', mandatory: false }] },
    ],
  },
  {
    id: 'aat-double-same', nameAr: 'موافقتان متتابعتان (نفس المعتمد)', description: 'مرحلتان تتابعيتان لنفس المعتمد — للتجربة والتدقيق المزدوج',
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    stages: [
      { id: 'ats-d1', sortOrder: 1, mode: 'sequential', approvers: [{ employeeId: 'e1', mandatory: true }] },
      { id: 'ats-d2', sortOrder: 2, mode: 'sequential', approvers: [{ employeeId: 'e1', mandatory: true }] },
    ],
  },
];

interface AAState {
  templates: HRApprovalAssignmentTemplate[];
  add: (draft: Omit<HRApprovalAssignmentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => { ok: boolean; error?: string };
  update: (id: string, patch: Partial<Omit<HRApprovalAssignmentTemplate, 'id' | 'createdAt'>>) => { ok: boolean; error?: string };
  remove: (id: string) => void;
}

export const useHRApprovalAssignmentTemplatesStore = create<AAState>()(
  persist(
    (set, get) => ({
      templates: SEED,

      add: (draft) => {
        const coreStages = templateStagesToCore(draft.stages);
        const err = validateApprovalStages(coreStages);
        if (err) return { ok: false, error: err };
        const tpl: HRApprovalAssignmentTemplate = { ...draft, id: `aat-${uid()}`, createdAt: now(), updatedAt: now() };
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
      name: 'hr-approval-assignment-templates-v1',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const s = persisted as AAState;
        let templates = (s.templates ?? SEED).map(t => ({ ...t, description: t.description ?? '', isActive: t.isActive ?? true }));
        if (version < 3) {
          const byId = new Map(templates.map(t => [t.id, t]));
          for (const t of SEED) {
            if (!byId.has(t.id)) {
              byId.set(t.id, { ...t, description: t.description ?? '', isActive: t.isActive ?? true });
            }
          }
          templates = [...byId.values()];
        }
        return { ...s, templates };
      },
    },
  ),
);
