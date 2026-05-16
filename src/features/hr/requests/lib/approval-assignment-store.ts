import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRApprovalAssignmentTemplate } from './types';
import { templateStagesToCore, validateApprovalStages } from './types';

function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function now() { return new Date().toISOString(); }

function collapseToSingleStage(t: HRApprovalAssignmentTemplate): HRApprovalAssignmentTemplate {
  if (t.stages.length <= 1) return t;
  const sorted = [...t.stages].sort((a, b) => a.sortOrder - b.sortOrder);
  const first = sorted[0]!;
  return { ...t, stages: [{ ...first, sortOrder: 1 }], updatedAt: now() };
}

function requestLinkedIds(t: HRApprovalAssignmentTemplate): string[] {
  return t.hrRequestAssignmentLinkedIds?.filter(Boolean) ?? [];
}

function templateUsesRequestTypeId(
  templates: HRApprovalAssignmentTemplate[],
  requestTypeId: string,
  excludeTemplateId: string | null,
): boolean {
  return templates.some((tpl) => {
    if (tpl.id === excludeTemplateId) return false;
    return requestLinkedIds(tpl).includes(requestTypeId);
  });
}

/** ترحيل: ربط القوالب المعروفة بأنواع الطلبات عند غياب الحقل في البيانات القديمة */
const DEFAULT_LINKS_BY_TEMPLATE_ID: Record<string, string[]> = {
  'aat-standard': ['rt-leave', 'rt-certificate', 'rt-equipment'],
  'aat-fast': ['rt-sick', 'rt-travel'],
  'aat-double-same': [],
};

const SEED: HRApprovalAssignmentTemplate[] = [
  {
    id: 'aat-standard',
    nameAr: 'طلب إجازة · طلب شهادة راتب · طلب معدات',
    description: '',
    hrRequestAssignmentLinkedIds: ['rt-leave', 'rt-certificate', 'rt-equipment'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    stages: [
      {
        id: 'ats-1',
        sortOrder: 1,
        mode: 'sequential',
        approvers: [
          { employeeId: 'e1', mandatory: true },
          { employeeId: 'e2', mandatory: true },
        ],
      },
    ],
  },
  {
    id: 'aat-fast',
    nameAr: 'إجازة مرضية · طلب سفر',
    description: '',
    hrRequestAssignmentLinkedIds: ['rt-sick', 'rt-travel'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    stages: [
      { id: 'ats-3', sortOrder: 1, mode: 'any_one', approvers: [{ employeeId: 'e1', mandatory: false }, { employeeId: 'e3', mandatory: false }] },
    ],
  },
  {
    id: 'aat-double-same',
    nameAr: 'موافقتان متتابعتان (تجربة)',
    description: '',
    hrRequestAssignmentLinkedIds: [],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    stages: [
      { id: 'ats-d1', sortOrder: 1, mode: 'sequential', approvers: [{ employeeId: 'e1', mandatory: true }] },
    ],
  },
];

interface AAState {
  templates: HRApprovalAssignmentTemplate[];
  add: (draft: Omit<HRApprovalAssignmentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => { ok: boolean; error?: string; id?: string };
  update: (id: string, patch: Partial<Omit<HRApprovalAssignmentTemplate, 'id' | 'createdAt'>>) => { ok: boolean; error?: string };
  remove: (id: string) => void;
}

export const useHRApprovalAssignmentTemplatesStore = create<AAState>()(
  persist(
    (set, get) => ({
      templates: SEED,

      add: (draft) => {
        const linked = [...new Set((draft.hrRequestAssignmentLinkedIds ?? []).filter(Boolean))];
        if (linked.length === 0) return { ok: false, error: 'اختر نوع طلب واحداً على الأقل' };
        if (draft.stages.length > 1) return { ok: false, error: 'يُسمح بمرحلة اعتماد واحدة فقط' };
        const coreStages = templateStagesToCore(draft.stages);
        const err = validateApprovalStages(coreStages);
        if (err) return { ok: false, error: err };
        for (const rid of linked) {
          if (templateUsesRequestTypeId(get().templates, rid, null)) {
            return { ok: false, error: 'أحد أنواع الطلبات المحددة مرتبطة بقالب آخر' };
          }
        }
        const id = `aat-${uid()}`;
        const tpl: HRApprovalAssignmentTemplate = {
          ...draft,
          hrRequestAssignmentLinkedIds: linked,
          description: draft.description ?? '',
          id,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ templates: [...s.templates, tpl] }));
        return { ok: true, id };
      },

      update: (id, patch) => {
        const current = get().templates.find((t) => t.id === id);
        if (!current) return { ok: false, error: 'القالب غير موجود' };

        if (patch.stages) {
          if (patch.stages.length > 1) return { ok: false, error: 'يُسمح بمرحلة اعتماد واحدة فقط' };
          const e = validateApprovalStages(templateStagesToCore(patch.stages));
          if (e) return { ok: false, error: e };
        }

        if (patch.hrRequestAssignmentLinkedIds !== undefined) {
          const nextLinked = [...new Set(patch.hrRequestAssignmentLinkedIds.filter(Boolean))];
          if (nextLinked.length === 0) return { ok: false, error: 'اختر نوع طلب واحداً على الأقل' };
          for (const rid of nextLinked) {
            if (templateUsesRequestTypeId(get().templates, rid, id)) {
              return { ok: false, error: 'أحد أنواع الطلبات المحددة مرتبطة بقالب آخر' };
            }
          }
        }

        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: now() } : t)),
        }));
        return { ok: true };
      },

      remove: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),
    }),
    {
      name: 'hr-approval-assignment-templates-v1',
      storage: createJSONStorage(() => localStorage),
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        const s = persisted as { templates?: HRApprovalAssignmentTemplate[] };
        let templates = (s.templates ?? SEED).map((t) => ({
          ...collapseToSingleStage(t),
          description: t.description ?? '',
          isActive: t.isActive ?? true,
          hrRequestAssignmentLinkedIds: t.hrRequestAssignmentLinkedIds ?? [],
        }));
        if (version < 3) {
          const byId = new Map(templates.map((t) => [t.id, t]));
          for (const t of SEED) {
            if (!byId.has(t.id)) {
              byId.set(t.id, {
                ...t,
                description: t.description ?? '',
                isActive: t.isActive ?? true,
                hrRequestAssignmentLinkedIds: t.hrRequestAssignmentLinkedIds ?? [],
              });
            }
          }
          templates = [...byId.values()];
        }
        if (version < 4) {
          templates = templates.map((t) => {
            const collapsed = collapseToSingleStage(t);
            const existing = t.hrRequestAssignmentLinkedIds?.filter(Boolean) ?? [];
            const linked = existing.length > 0 ? existing : (DEFAULT_LINKS_BY_TEMPLATE_ID[t.id] ?? []);
            return {
              ...collapsed,
              description: collapsed.description ?? '',
              hrRequestAssignmentLinkedIds: linked,
            };
          });
        }
        return { templates };
      },
    },
  ),
);

export { requestLinkedIds };
