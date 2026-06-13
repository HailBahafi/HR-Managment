'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { PermissionGate } from '@/components/shared/permission-gate';
import { branchesApi, type BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import { companiesApi, type CompanyResponseDto } from '@/features/hr/organization/lib/api/companies';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { CreateDepartmentDto, UpdateDepartmentDto } from '@/features/hr/organization/lib/api/departments';
import { buildDepartmentForest, flattenDepartmentsTree, getDescendantDepartmentIds } from '@/features/hr/requests/lib/hierarchy-utils';
import type { HRDepartmentEntity } from '@/features/hr/requests/lib/types';
import { generateEntityCode } from '@/features/hr/requests/lib/types';
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
  const [companies, setCompanies] = React.useState<CompanyResponseDto[]>([]);
  const [companyFilter, setCompanyFilter] = React.useState('');
  const [defaultBranchId, setDefaultBranchId] = React.useState<string | null>(null);
  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  const [branchFilter, setBranchFilter] = React.useState('all');

  const branchLabelFor = React.useCallback(
    (branchId: string) => {
      const branch = branches.find((b) => b.id === branchId);
      return branch?.nameAr ?? branch?.nameEn ?? branch?.code ?? undefined;
    },
    [branches],
  );

  const branchSelectOptions = React.useMemo(
    () => [
      { value: 'all', label: 'كل الفروع' },
      ...branches.map((b) => ({
        value: b.id,
        label: b.nameAr ?? b.nameEn ?? b.code ?? b.id.slice(0, 8),
      })),
    ],
    [branches],
  );

  const companySelectOptions = React.useMemo(
    () =>
      companies.map((c) => ({
        value: c.id,
        label: c.nameAr ?? c.nameEn ?? c.code ?? c.id.slice(0, 8),
      })),
    [companies],
  );

  const handleCompanyChange = React.useCallback((companyId: string) => {
    setCompanyFilter(companyId);
    setBranchFilter('all');
  }, []);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [activeMode, setActiveMode] = React.useState<'all' | 'active'>('all');
  const filterActive = activeMode === 'active';
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DepartmentDraftForm>(DEPARTMENT_EMPTY_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleteWarning, setDeleteWarning] = React.useState('');
  const [parentPickerDepartments, setParentPickerDepartments] = React.useState<DepartmentRecord[]>([]);
  const [parentPickerLoading, setParentPickerLoading] = React.useState(false);

  const reload = React.useCallback(async (companyId: string, isActiveFilter?: boolean, branchOverride?: string) => {
    if (!companyId) return;
    setLoading(true);
    setListError(null);
    try {
      const data = await loadDepartmentsDirectory({
        companyId,
        ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
        branchId: branchOverride === 'all' || !branchOverride ? null : branchOverride,
      });
      setDepartments(data.departments);
      let resolvedBranchId =
        branchOverride && branchOverride !== 'all'
          ? branchOverride
          : data.scope.branchId;
      const branchRes = await branchesApi.getAll({ companyId, limit: 200 });
      setBranches(branchRes.items);
      if (!resolvedBranchId) {
        resolvedBranchId = branchRes.items[0]?.id ?? null;
      }
      setDefaultBranchId(resolvedBranchId);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'departments.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void companiesApi
      .getAll({ limit: 200 })
      .then((res) => {
        if (cancelled) return;
        setCompanies(res.items);
        if (res.items.length > 0) {
          setCompanyFilter((prev) => prev || res.items[0].id);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const { displayMessage } = handleApiError(err, 'departments.companies.load');
        setListError(displayMessage);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!companyFilter) return;
    void reload(companyFilter, filterActive ? true : undefined, branchFilter);
  }, [reload, filterActive, branchFilter, companyFilter]);

  const targetBranchId = React.useMemo(() => {
    if (branchFilter !== 'all') return branchFilter;
    if (editId) {
      return departments.find((d) => d.id === editId)?.branchId ?? defaultBranchId;
    }
    return defaultBranchId;
  }, [branchFilter, defaultBranchId, departments, editId]);

  const loadParentPickerDepartments = React.useCallback(async () => {
    if (!companyFilter) {
      setParentPickerDepartments([]);
      return;
    }
    setParentPickerLoading(true);
    try {
      const data = await loadDepartmentsDirectory({ companyId: companyFilter, branchId: null });
      const scoped = targetBranchId
        ? data.departments.filter((d) => d.branchId === targetBranchId)
        : data.departments;
      setParentPickerDepartments(scoped);
    } catch {
      setParentPickerDepartments(departments);
    } finally {
      setParentPickerLoading(false);
    }
  }, [companyFilter, departments, targetBranchId]);

  React.useEffect(() => {
    if (!drawerOpen) return;
    void loadParentPickerDepartments();
  }, [drawerOpen, loadParentPickerDepartments]);

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
    if (!companyFilter || !targetBranchId) {
      setFormError('اختر الشركة والفرع من القائمة أعلاه');
      return;
    }

    setFormError(null);
    try {
      if (editId) {
        const payload: UpdateDepartmentDto = {
          nameAr: draft.nameAr.trim(),
          parentDepartmentId: draft.parentId ? draft.parentId : null,
          isActive: draft.isActive,
        };
        await updateDepartment(editId, payload);
      } else {
        const payload: CreateDepartmentDto = {
          companyId: companyFilter,
          branchId: targetBranchId,
          code: generateEntityCode(draft.nameAr.trim(), 'dept'),
          nameAr: draft.nameAr.trim(),
          parentDepartmentId: draft.parentId ? draft.parentId : null,
          isActive: draft.isActive,
        };
        await createDepartment(payload);
      }
      await reload(companyFilter, filterActive ? true : undefined, branchFilter);
      setDrawerOpen(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'departments.save');
      setFormError(displayMessage);
    }
  }, [branchFilter, companyFilter, draft, editId, filterActive, reload, targetBranchId]);

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
      await reload(companyFilter, filterActive ? true : undefined, branchFilter);
      setDeleteId(null);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'departments.delete');
      setFormError(displayMessage);
    }
  }, [branchFilter, companyFilter, deleteId, filterActive, reload]);

  const excludeIds = editId
    ? new Set([editId, ...getDescendantDepartmentIds(departments, editId)])
    : new Set<string>();

  const parentOptions = React.useMemo(() => {
    const source = parentPickerDepartments.length > 0 ? parentPickerDepartments : departments;
    const scoped = targetBranchId
      ? source.filter((d) => d.branchId === targetBranchId)
      : source;
    const ordered = flattenDepartmentsTree(buildDepartmentForest(scoped));
    return [
      { value: '', label: '— بدون أصل (قسم رئيسي) —' },
      ...ordered
        .filter(({ dept }) => !excludeIds.has(dept.id))
        .map(({ dept, depth }) => ({
          value: dept.id,
          label: `${'　'.repeat(depth)}${dept.nameAr}`,
        })),
    ];
  }, [departments, excludeIds, parentPickerDepartments, targetBranchId]);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton />
        <PermissionGate permission="hr.employees.create">
          <Button variant="luxe" size="sm" className="h-8 shrink-0 gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> قسم جديد
          </Button>
        </PermissionGate>
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
            id: 'company',
            value: companyFilter,
            onChange: (v) => {
              if (v && v !== 'all') handleCompanyChange(v);
            },
            placeholder: 'الشركة',
            options: companySelectOptions,
            className: 'w-[11rem] max-w-[11rem]',
          },
          {
            id: 'branch',
            value: branchFilter,
            onChange: setBranchFilter,
            placeholder: 'الفرع',
            options: branchSelectOptions,
          },
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
          <PermissionGate permission="hr.employees.create">
            <Button variant="luxe" size="sm" className="h-8 shrink-0 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> قسم جديد
            </Button>
          </PermissionGate>
        )}
      />
    ),
    [activeMode, branchFilter, branchSelectOptions, companyFilter, companySelectOptions, handleCompanyChange, openCreate],
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
    parentPickerLoading,
    openCreate,
    openEdit,
    handleSave,
    confirmDelete,
    handleDelete,
    branchLabel: branchLabelFor,
    companyFilter,
    companies,
  };
}

export type DepartmentsDirectoryModel = ReturnType<typeof useDepartmentsDirectoryModel>;
