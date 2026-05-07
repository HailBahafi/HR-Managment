import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRApprovalAssignmentTemplate, HRDisciplineApprovalAssignmentLinkKind } from '@/lib/hr-requests/types';
import { templateStagesToCore, validateApprovalStages } from '@/lib/hr-requests/types';

function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function now() { return new Date().toISOString(); }

function singleStageFromTemplate(t: HRApprovalAssignmentTemplate): HRApprovalAssignmentTemplate {
  if (t.stages.length <= 1) return t;
  const sorted = [...t.stages].sort((a, b) => a.sortOrder - b.sortOrder);
  const first = sorted[0]!;
  return { ...t, stages: [{ ...first, sortOrder: 1 }], updatedAt: now() };
}

/** معرفات أنواع المخالفات المرتبطة بالإسناد */
export function disciplineApprovalLinkedIds(t: HRApprovalAssignmentTemplate): string[] {
  const raw = t.assignmentLinkedIds?.filter(Boolean) ?? [];
  if (raw.length > 0) return raw;
  if (t.violationTypeId) return [t.violationTypeId];
  return [];
}

function templateUsesViolationLinkedId(
  templates: HRApprovalAssignmentTemplate[],
  linkedId: string,
  excludeTemplateId: string | null,
): boolean {
  return templates.some((tpl) => {
    if (tpl.id === excludeTemplateId) return false;
    return disciplineApprovalLinkedIds(tpl).includes(linkedId);
  });
}

const SEED: HRApprovalAssignmentTemplate[] = [
  {
    id: 'daat-standard',
    nameAr: 'التأخر عن العمل',
    description: '',
    assignmentLinkKind: 'violation',
    assignmentLinkedIds: ['vt-1'],
    violationTypeId: 'vt-1',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    stages: [
      {
        id: 'dats-1',
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
    id: 'daat-fast',
    nameAr: 'مخالفة الزي الرسمي',
    description: '',
    assignmentLinkKind: 'violation',
    assignmentLinkedIds: ['vt-2'],
    violationTypeId: 'vt-2',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
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
        const linked = [...new Set((draft.assignmentLinkedIds ?? []).filter(Boolean))];
        if (linked.length === 0) return { ok: false, error: 'اختر نوعاً واحداً على الأقل' };
        if (draft.stages.length > 1) return { ok: false, error: 'يُسمح بمرحلة اعتماد واحدة فقط' };
        const coreStages = templateStagesToCore(draft.stages);
        const err = validateApprovalStages(coreStages);
        if (err) return { ok: false, error: err };

        for (const lid of linked) {
          if (templateUsesViolationLinkedId(get().templates, lid, null)) {
            return { ok: false, error: 'أحد الأنواع المحددة مرتبط بإسناد آخر' };
          }
        }

        const tpl: HRApprovalAssignmentTemplate = {
          ...draft,
          assignmentLinkKind: 'violation',
          assignmentLinkedIds: linked,
          violationTypeId: linked[0] ?? null,
          hrRequestAssignmentLinkedIds: undefined,
          description: draft.description ?? '',
          id: `daat-${uid()}`,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ templates: [...s.templates, tpl] }));
        return { ok: true };
      },

      update: (id, patch) => {
        const current = get().templates.find((t) => t.id === id);
        if (!current) return { ok: false, error: 'القالب غير موجود' };

        if (patch.stages) {
          if (patch.stages.length > 1) return { ok: false, error: 'يُسمح بمرحلة اعتماد واحدة فقط' };
          const e = validateApprovalStages(templateStagesToCore(patch.stages));
          if (e) return { ok: false, error: e };
        }

        if (patch.assignmentLinkedIds !== undefined) {
          const nextLinked = [...new Set(patch.assignmentLinkedIds.filter(Boolean))];
          if (nextLinked.length === 0) return { ok: false, error: 'اختر نوعاً واحداً على الأقل' };
          for (const lid of nextLinked) {
            if (templateUsesViolationLinkedId(get().templates, lid, id)) {
              return { ok: false, error: 'أحد الأنواع المحددة مرتبط بإسناد آخر' };
            }
          }
        }

        if (patch.violationTypeId !== undefined && patch.assignmentLinkedIds === undefined) {
          const nextVid = patch.violationTypeId?.trim() ?? '';
          if (nextVid && templateUsesViolationLinkedId(get().templates, nextVid, id)) {
            return { ok: false, error: 'يوجد بالفعل قالب إسناد مرتبط بهذا النوع' };
          }
        }

        const normalizedPatch: Partial<HRApprovalAssignmentTemplate> = { ...patch, assignmentLinkKind: 'violation' };
        if (patch.assignmentLinkedIds !== undefined) {
          const nl = [...new Set(patch.assignmentLinkedIds.filter(Boolean))];
          normalizedPatch.assignmentLinkedIds = nl;
          normalizedPatch.violationTypeId = nl[0] ?? null;
        }

        set((s) => ({
          templates: s.templates.map((t) =>
            t.id === id ? { ...t, ...normalizedPatch, updatedAt: now() } : t,
          ),
        }));
        return { ok: true };
      },

      remove: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),
    }),
    {
      name: 'hr_discipline_approval_assignment_templates_v1',
      storage: createJSONStorage(() => localStorage),
      version: 6,
      migrate: (persisted: unknown, version: number) => {
        const s = persisted as { templates?: HRApprovalAssignmentTemplate[] };
        let templates = s.templates ?? SEED;
        if (version < 2) {
          templates = templates.map((t) => ({ ...t, description: t.description ?? '', isActive: t.isActive ?? true }));
        }
        if (version < 3) {
          const fallbackIds = ['vt-1', 'vt-2', 'vt-3', 'vt-4', 'vt-5'];
          const used = new Set<string>();
          templates = templates.map((t, idx) => {
            let violationTypeId = t.violationTypeId ?? null;
            if (!violationTypeId) {
              violationTypeId = fallbackIds.find((fid) => !used.has(fid)) ?? fallbackIds[idx % fallbackIds.length] ?? 'vt-1';
            }
            used.add(violationTypeId);
            return {
              ...t,
              violationTypeId,
              description: '',
            };
          });
        }
        if (version < 4) {
          templates = templates.map((t) => singleStageFromTemplate(t));
        }
        if (version < 5) {
          templates = templates.map((t) => {
            const vid = t.violationTypeId ?? null;
            const linked = (t.assignmentLinkedIds?.length ? t.assignmentLinkedIds : vid ? [vid] : []).filter(Boolean);
            const kind: HRDisciplineApprovalAssignmentLinkKind =
              t.assignmentLinkKind === 'request' ? 'request' : 'violation';
            return {
              ...t,
              assignmentLinkKind: kind,
              assignmentLinkedIds: linked.length ? linked : vid ? [vid] : [],
              violationTypeId: t.assignmentLinkKind === 'request' ? null : vid,
            };
          });
        }
        if (version < 6) {
          templates = templates
            .filter((t) => t.assignmentLinkKind !== 'request')
            .map((t) => ({
              ...t,
              assignmentLinkKind: 'violation' as const,
              hrRequestAssignmentLinkedIds: undefined,
            }));
        }
        return { ...s, templates };
      },
    },
  ),
);
