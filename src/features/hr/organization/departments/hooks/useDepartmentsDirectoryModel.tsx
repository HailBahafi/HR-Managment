'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { CreateDepartmentDto, UpdateDepartmentDto } from '@/features/hr/organization/lib/api/departments';
import { buildDepartmentForest, flattenDepartmentsTree, getDescendantDepartmentIds } from '@/features/hr/requests/lib/hierarchy-utils';
import type { HRDepartmentEntity } from '@/features/hr/requests/lib/types';
import { slugify } from '@/features/hr/requests/lib/types';
import {
  DEPARTMENT_EMPTY_FORM,
  type DepartmentDraftForm,
  type DepartmentRecord,
} from '@/features/hr/organization/departments/constants/departments-directory';
import {
  createDepartment,
  deleteDepartment,
  loadDepartmentsDirectory,
  updateDepartment,
} from '@/features/hr/organization/departments/services/departments.service';

export function useDepartmentsDirectoryModel() {
  useSetPageTitle({ titleAr: 'الأقسام', descriptionAr: 'الهيكل التنظيمي وإدارة الأقسام', iconName: 'Building2' });

  const [departments, setDepartments] = React.useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [defaultCompanyId, setDefaultCompanyId] = React.useState<string | null>(null);
  const [defaultBranchId, setDefaultBranchId] = React.useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [activeMode, setActiveMode] = React.useState<'all' | 'active'>('all');
  const filterActive = activeMode === 'active';
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DepartmentDraftForm>(DEPARTMENT_EMPTY_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleteWarning, setDeleteWarning] = React.useState('');

  const reload = React.useCallback(async (isActiveFilter?: boolean) => {
    setLoading(true);
    setListError(null);
    try {
      const data = await loadDepartmentsDirectory(
        isActiveFilter !== undefined ? { isActive: isActiveFilter } : undefined,
      );
      setDepartments(data.departments);
      setDefaultCompanyId(data.scope.companyId);
      setDefaultBranchId(data.scope.branchId);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'departments.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload(filterActive ? true : undefined);
  }, [reload, filterActive]);

  const forest = React.useMemo(() => buildDepartmentForest(departments), [departments]);
  const flat = React.useMemo(() => flattenDepartmentsTree(forest), [forest]);

  const filtered = flat;

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setDraft({ ...DEPARTMENT_EMPTY_FORM, sortOrder: departments.length + 1 });
    setFormError(null);
    setDrawerOpen(true);
  }, [departments.length]);

  const openEdit = React.useCallback((dept: HRDepartmentEntity) => {
    setEditId(dept.id);
    setDraft({
      nameAr: dept.nameAr,
      parentId: dept.parentId ?? '',
      sortOrder: dept.sortOrder,
      isActive: dept.isActive,
    });
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const patch = React.useCallback(<K extends keyof DepartmentDraftForm>(k: K, v: DepartmentDraftForm[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!draft.nameAr.trim()) {
      setFormError('اسم القسم مطلوب');
      return;
    }
    if (!defaultCompanyId || !defaultBranchId) {
      setFormError('تعذر تحديد الفرع لهذا القسم');
      return;
    }

    setFormError(null);
    try {
      if (editId) {
        const payload: UpdateDepartmentDto = {
          code: slugify(draft.nameAr),
          nameAr: draft.nameAr.trim(),
          parentDepartmentId: draft.parentId ? draft.parentId : null,
          isActive: draft.isActive,
        };
        await updateDepartment(editId, payload);
      } else {
        const payload: CreateDepartmentDto = {
          companyId: defaultCompanyId,
          branchId: defaultBranchId,
          code: slugify(draft.nameAr),
          nameAr: draft.nameAr.trim(),
          parentDepartmentId: draft.parentId ? draft.parentId : null,
          isActive: draft.isActive,
        };
        await createDepartment(payload);
      }
      await reload();
      setDrawerOpen(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'departments.save');
      setFormError(displayMessage);
    }
  }, [defaultBranchId, defaultCompanyId, draft, editId, reload]);

  const confirmDelete = React.useCallback(
    (id: string) => {
      const descendants = getDescendantDepartmentIds(departments, id).length;
      setDeleteWarning(
        descendants > 0
          ? `سيتم حذف ${descendants} قسم فرعي أيضاً وجميع أنواع الطلبات المرتبطة.`
          : 'سيتم حذف القسم وجميع أنواع الطلبات المرتبطة به.',
      );
      setDeleteId(id);
    },
    [departments],
  );

  const handleDelete = React.useCallback(async () => {
    if (!deleteId) return;
    setFormError(null);
    try {
      await deleteDepartment(deleteId);
      await reload();
      setDeleteId(null);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'departments.delete');
      setFormError(displayMessage);
    }
  }, [deleteId, reload]);

  const excludeIds = editId
    ? new Set([editId, ...getDescendantDepartmentIds(departments, editId)])
    : new Set<string>();

  const parentOptions = React.useMemo(
    () => [
      { value: '', label: '— بدون أصل (قسم رئيسي) —' },
      ...departments
        .filter((d) => !excludeIds.has(d.id))
        .map((d) => ({ value: d.id, label: `${'　'.repeat(d.parentId ? 1 : 0)}${d.nameAr}` })),
    ],
    [departments, excludeIds],
  );

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton />
        <Button variant="luxe" size="sm" className="h-8 shrink-0 gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> قسم جديد
        </Button>
      </div>
    ),
    [openCreate],
  );

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        onDateBoundsChange={() => {}}
        inlineSelects={[
          {
            id: 'active',
            value: activeMode,
            onChange: (v) => setActiveMode(v as 'all' | 'active'),
            placeholder: 'العرض',
            options: [
              { value: 'all', label: 'كل الأقسام' },
              { value: 'active', label: 'نشط فقط' },
            ],
          },
        ]}
        trailingActions={(
          <Button variant="luxe" size="sm" className="h-8 shrink-0 gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> قسم جديد
          </Button>
        )}
      />
    ),
    [activeMode, openCreate],
  );

  return {
    departments,
    loading,
    listError,
    filtered,
    drawerOpen,
    setDrawerOpen,
    editId,
    draft,
    patch,
    formError,
    deleteId,
    setDeleteId,
    deleteWarning,
    parentOptions,
    openCreate,
    openEdit,
    handleSave,
    confirmDelete,
    handleDelete,
  };
}

export type DepartmentsDirectoryModel = ReturnType<typeof useDepartmentsDirectoryModel>;
