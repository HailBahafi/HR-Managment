import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  HRDepartmentEntity, HRRequestTemplateEntity, HRRequestTypeEntity,
  HRRequestFieldDefinition, HRApprovalStage,
} from './types';
import { HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID, slugify } from './types';

function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function now() { return new Date().toISOString(); }

function getDescendantIds(depts: HRDepartmentEntity[], id: string): string[] {
  const children = depts.filter(d => d.parentId === id).map(d => d.id);
  return [...children, ...children.flatMap(cid => getDescendantIds(depts, cid))];
}

// ─── Seeds ────────────────────────────────────────────────────────────────────

const DEPT_SEED: HRDepartmentEntity[] = [
  { id: 'd1', nameAr: 'الموارد البشرية', nameEn: 'Human Resources', slug: 'human-resources', sortOrder: 1, isActive: true },
  { id: 'd2', nameAr: 'تقنية المعلومات', nameEn: 'Information Technology', slug: 'information-technology', sortOrder: 2, isActive: true },
  { id: 'd3', nameAr: 'المالية والمحاسبة', nameEn: 'Finance & Accounting', slug: 'finance-accounting', sortOrder: 3, isActive: true },
  { id: 'd4', nameAr: 'التسويق', nameEn: 'Marketing', slug: 'marketing', sortOrder: 4, isActive: true },
  { id: 'd5', nameAr: 'المبيعات', nameEn: 'Sales', slug: 'sales', sortOrder: 5, isActive: true },
  { id: 'd6', nameAr: 'العمليات', nameEn: 'Operations', slug: 'operations', sortOrder: 6, isActive: true },
  { id: 'd7', nameAr: 'خدمة العملاء', nameEn: 'Customer Service', slug: 'customer-service', sortOrder: 7, isActive: true },
  { id: 'd8', nameAr: 'الجودة', nameEn: 'Quality', slug: 'quality', sortOrder: 8, isActive: true },
  { id: 'd9', nameAr: 'اللوجستيات', nameEn: 'Logistics', slug: 'logistics', sortOrder: 9, isActive: true },
  { id: 'd10', nameAr: 'الاستثمار', nameEn: 'Investment', slug: 'investment', sortOrder: 10, isActive: true },
];

const FIELDS_SEED: HRRequestFieldDefinition[] = [
  { id: 'f-reason', labelAr: 'سبب الطلب', labelEn: 'Reason', kind: 'textarea', required: true, sortOrder: 1 },
  { id: 'f-start', labelAr: 'تاريخ البداية', labelEn: 'Start Date', kind: 'date', required: true, sortOrder: 2 },
  { id: 'f-end', labelAr: 'تاريخ النهاية', labelEn: 'End Date', kind: 'date', required: false, sortOrder: 3 },
  { id: 'f-urgent', labelAr: 'هل الطلب عاجل؟', labelEn: 'Urgent?', kind: 'checkbox', required: false, sortOrder: 4 },
];

const TEMPLATE_SEED: HRRequestTemplateEntity[] = [
  {
    id: 'tpl-general', nameAr: 'القالب العام', nameEn: 'General Template',
    slug: 'general-template', sortOrder: 1, isActive: true, isUniversalDefault: true,
    formFields: FIELDS_SEED,
  },
  {
    id: 'tpl-it', nameAr: 'طلب دعم تقني', nameEn: 'IT Support Request',
    slug: 'it-support-request', sortOrder: 2, isActive: true,
    formFields: [
      { id: 'f-issue', labelAr: 'وصف المشكلة', labelEn: 'Issue Description', kind: 'textarea', required: true, sortOrder: 1 },
      { id: 'f-priority', labelAr: 'الأولوية', kind: 'radio_group', required: true, sortOrder: 2, options: [{ id: 'high', labelAr: 'عالية' }, { id: 'medium', labelAr: 'متوسطة' }, { id: 'low', labelAr: 'منخفضة' }] },
      { id: 'f-device', labelAr: 'اسم الجهاز / الرقم التسلسلي', kind: 'text', required: false, sortOrder: 3 },
    ],
  },
];

const RT_SEED: HRRequestTypeEntity[] = [
  {
    id: 'rt-leave', departmentId: HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID,
    nameAr: 'طلب إجازة', nameEn: 'Leave Request',
    slug: 'leave-request', sortOrder: 1, isActive: true,
    subtypes: [], templateId: 'tpl-general', approvalStages: [],
  },
  {
    id: 'rt-equipment', departmentId: 'd2',
    nameAr: 'طلب معدات', nameEn: 'Equipment Request',
    slug: 'equipment-request', sortOrder: 2, isActive: true,
    subtypes: [
      { id: 'rst-laptop', nameAr: 'لابتوب', nameEn: 'Laptop', slug: 'laptop', sortOrder: 1, isActive: true },
      { id: 'rst-monitor', nameAr: 'شاشة', nameEn: 'Monitor', slug: 'monitor', sortOrder: 2, isActive: true },
    ],
    templateId: 'tpl-it', approvalStages: [],
  },
  {
    id: 'rt-travel', departmentId: 'd5',
    nameAr: 'طلب سفر', nameEn: 'Travel Request',
    slug: 'travel-request', sortOrder: 3, isActive: true,
    subtypes: [], templateId: 'tpl-general', approvalStages: [],
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface HRConfigState {
  departments: HRDepartmentEntity[];
  templates: HRRequestTemplateEntity[];
  requestTypes: HRRequestTypeEntity[];

  // Templates
  addTemplate: (draft: Omit<HRRequestTemplateEntity, 'id' | 'slug'>) => void;
  updateTemplate: (id: string, patch: Partial<Omit<HRRequestTemplateEntity, 'id'>>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string | null | undefined) => HRRequestTemplateEntity | undefined;

  // Request types
  addRequestType: (draft: Omit<HRRequestTypeEntity, 'id' | 'slug'>) => void;
  updateRequestType: (id: string, patch: Partial<Omit<HRRequestTypeEntity, 'id'>>) => void;
  deleteRequestType: (id: string) => void;
  getRequestTypeBySlugs: (deptSlug: string, typeSlug: string) => { dept: HRDepartmentEntity | null; type: HRRequestTypeEntity } | null;

  // Departments CRUD
  addDepartment: (draft: Omit<HRDepartmentEntity, 'id' | 'slug'>) => { ok: boolean; error?: string };
  updateDepartment: (id: string, patch: Partial<Omit<HRDepartmentEntity, 'id'>>) => { ok: boolean; error?: string };
  deleteDepartment: (id: string) => { ok: boolean; error?: string; affectedRequestTypes?: number };
}

export const useHRConfigurationStore = create<HRConfigState>()(
  persist(
    (set, get) => ({
      departments: DEPT_SEED,
      templates: TEMPLATE_SEED,
      requestTypes: RT_SEED,

      addTemplate: (draft) => {
        const isFirst = get().templates.filter(t => t.isUniversalDefault).length === 0;
        const tpl: HRRequestTemplateEntity = {
          ...draft,
          id: `tpl-${uid()}`,
          slug: slugify(draft.nameAr),
          isUniversalDefault: draft.isUniversalDefault || isFirst,
        };
        set((s) => {
          let templates = [...s.templates, tpl];
          if (tpl.isUniversalDefault) {
            templates = templates.map(t => t.id === tpl.id ? t : { ...t, isUniversalDefault: false });
          }
          return { templates };
        });
      },

      updateTemplate: (id, patch) => {
        set((s) => {
          let templates = s.templates.map(t =>
            t.id === id ? { ...t, ...patch, slug: patch.nameAr ? slugify(patch.nameAr) : t.slug } : t
          );
          if (patch.isUniversalDefault) {
            templates = templates.map(t => t.id === id ? t : { ...t, isUniversalDefault: false });
          }
          return { templates };
        });
      },

      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter(t => t.id !== id) })),

      getTemplateById: (id) => {
        if (!id) return undefined;
        return get().templates.find(t => t.id === id);
      },

      addRequestType: (draft) => {
        const rt: HRRequestTypeEntity = { ...draft, id: `rt-${uid()}`, slug: slugify(draft.nameAr) };
        set((s) => ({ requestTypes: [...s.requestTypes, rt] }));
      },

      updateRequestType: (id, patch) => {
        set((s) => ({
          requestTypes: s.requestTypes.map(r =>
            r.id === id ? { ...r, ...patch, slug: patch.nameAr ? slugify(patch.nameAr) : r.slug } : r
          ),
        }));
      },

      deleteRequestType: (id) => set((s) => ({ requestTypes: s.requestTypes.filter(r => r.id !== id) })),

      addDepartment: (draft) => {
        const { departments } = get();
        const slug = slugify(draft.nameAr);
        if (departments.some(d => d.slug === slug)) return { ok: false, error: 'يوجد قسم بنفس الاسم / الرمز' };
        const dept: HRDepartmentEntity = { ...draft, id: `dept-${uid()}`, slug };
        set(s => ({ departments: [...s.departments, dept] }));
        return { ok: true };
      },

      updateDepartment: (id, patch) => {
        const { departments } = get();
        if (patch.nameAr) {
          const newSlug = slugify(patch.nameAr);
          if (departments.some(d => d.slug === newSlug && d.id !== id)) return { ok: false, error: 'يوجد قسم بنفس الاسم / الرمز' };
        }
        set(s => ({
          departments: s.departments.map(d =>
            d.id === id ? { ...d, ...patch, slug: patch.nameAr ? slugify(patch.nameAr) : d.slug } : d
          ),
        }));
        return { ok: true };
      },

      deleteDepartment: (id) => {
        const { departments, requestTypes } = get();
        const descendants = getDescendantIds(departments, id);
        const toDelete = new Set([id, ...descendants]);
        const affected = requestTypes.filter(rt => toDelete.has(rt.departmentId)).length;
        set(s => ({
          departments: s.departments.filter(d => !toDelete.has(d.id)),
          requestTypes: s.requestTypes.filter(rt => !toDelete.has(rt.departmentId)),
        }));
        return { ok: true, affectedRequestTypes: affected };
      },

      getRequestTypeBySlugs: (deptSlug, typeSlug) => {
        const { departments, requestTypes } = get();
        const rt = requestTypes.find(r => r.slug === typeSlug);
        if (!rt) return null;
        const dept = rt.departmentId === HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID
          ? null
          : departments.find(d => d.slug === deptSlug) ?? null;
        return { dept, type: rt };
      },
    }),
    { name: 'hr-configuration-storage', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
