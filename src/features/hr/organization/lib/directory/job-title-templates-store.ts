import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { data } from '@/features/hr/lib/data';

export interface JobTitleTemplateRecord {
  id: string;
  titleAr: string;
  descriptionAr?: string;
  /** عند اختيار القالب عند إنشاء موظف يُقترح هذا القسم */
  defaultDepartmentId?: string | null;
  sortOrder: number;
  updatedAt: string;
}

function uid() {
  return `jt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function now() {
  return new Date().toISOString();
}

function seedFromEmployees(): JobTitleTemplateRecord[] {
  const seen = new Set<string>();
  const out: JobTitleTemplateRecord[] = [];
  let order = 0;
  for (const e of data.employees) {
    const t = (e.position ?? '').trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push({
      id: `jt-seed-${order}`,
      titleAr: t,
      descriptionAr: '',
      defaultDepartmentId: e.departmentId ?? null,
      sortOrder: order++,
      updatedAt: '2026-01-01T00:00:00Z',
    });
  }
  return out.sort((a, b) => a.titleAr.localeCompare(b.titleAr, 'ar'));
}

const SEED = seedFromEmployees();

export type JobTitleTemplateDraft = Pick<JobTitleTemplateRecord, 'titleAr'> &
  Partial<Pick<JobTitleTemplateRecord, 'descriptionAr' | 'defaultDepartmentId'>>;

interface State {
  templates: JobTitleTemplateRecord[];
  add: (d: JobTitleTemplateDraft) => { ok: boolean; error?: string };
  update: (id: string, d: Partial<Omit<JobTitleTemplateRecord, 'id'>>) => { ok: boolean; error?: string };
  remove: (id: string) => void;
}

export const useJobTitleTemplatesStore = create<State>()(
  persist(
    (set, get) => ({
      templates: SEED,
      add: (d) => {
        const titleAr = d.titleAr.trim();
        if (!titleAr) return { ok: false, error: 'المسمى بالعربية مطلوب' };
        if (get().templates.some((t) => t.titleAr === titleAr)) {
          return { ok: false, error: 'هذا المسمى موجود مسبقاً' };
        }
        const sortOrder =
          get().templates.reduce((m, t) => Math.max(m, t.sortOrder), 0) + 1;
        const row: JobTitleTemplateRecord = {
          titleAr,
          descriptionAr: d.descriptionAr,
          defaultDepartmentId: d.defaultDepartmentId ?? null,
          id: uid(),
          sortOrder,
          updatedAt: now(),
        };
        set((s) => ({
          templates: [...s.templates, row].sort((a, b) =>
            a.titleAr.localeCompare(b.titleAr, 'ar'),
          ),
        }));
        return { ok: true };
      },
      update: (id, d) => {
        const titleAr = d.titleAr?.trim();
        if (titleAr !== undefined && !titleAr) return { ok: false, error: 'المسمى بالعربية مطلوب' };
        if (
          titleAr &&
          get().templates.some((t) => t.titleAr === titleAr && t.id !== id)
        ) {
          return { ok: false, error: 'هذا المسمى مستخدم لقالب آخر' };
        }
        set((s) => ({
          templates: s.templates
            .map((t) =>
              t.id === id
                ? {
                    ...t,
                    ...d,
                    ...(titleAr !== undefined ? { titleAr } : {}),
                    updatedAt: now(),
                  }
                : t,
            )
            .sort((a, b) => a.titleAr.localeCompare(b.titleAr, 'ar')),
        }));
        return { ok: true };
      },
      remove: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),
    }),
    { name: 'hr_job_title_templates_v1', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
