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
import { companiesApi, type CompanyResponseDto } from '@/features/hr/organization/lib/api/companies';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  createBranch,
  deleteBranch,
  loadBranchesDirectory,
  updateBranch,
} from '@/features/hr/organization/branches/services/branches.service';
import { generateEntityCode } from '@/features/hr/requests/lib/types';
import {
  BRANCH_EMPTY_FORM,
  branchRowToDraftForm,
  draftFormToCreatePayload,
  draftFormToUpdatePayload,
  type BranchDraftForm,
  type BranchRow,
} from '@/features/hr/organization/branches/constants/branches-directory';

export function useBranchesDirectoryModel() {
  useSetPageTitle({ titleAr: 'الفروع', descriptionAr: 'إدارة فروع الشركة وتوزيع الموظفين.', iconName: 'Building2' });

  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('grid');
  const [branches, setBranches] = React.useState<BranchRow[]>([]);
  const [companies, setCompanies] = React.useState<CompanyResponseDto[]>([]);
  const [companyFilter, setCompanyFilter] = React.useState('');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<BranchDraftForm>(BRANCH_EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [listError, setListError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewBranch, setViewBranch] = React.useState<BranchRow | null>(null);

  const companySelectOptions = React.useMemo(
    () =>
      companies.map((c) => ({
        value: c.id,
        label: c.nameAr ?? c.nameEn ?? c.code ?? c.id.slice(0, 8),
      })),
    [companies],
  );

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
        const { displayMessage } = handleApiError(err, 'branches.companies.load');
        setListError(displayMessage);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadBranches = React.useCallback(async (companyId: string) => {
    if (!companyId) return;
    setLoading(true);
    setListError(null);
    try {
      const data = await loadBranchesDirectory(companyId);
      setBranches(data.branches);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'branches.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!companyFilter) return;
    void loadBranches(companyFilter);
  }, [companyFilter, loadBranches]);

  const filtered = branches;

  const patch = React.useCallback((p: Partial<BranchDraftForm>) => {
    setForm((f) => ({ ...f, ...p }));
  }, []);

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setForm(BRANCH_EMPTY_FORM);
    setError(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = React.useCallback((b: BranchRow) => {
    setEditId(b.id);
    setForm(branchRowToDraftForm(b));
    setError(null);
    setDrawerOpen(true);
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!form.name.trim()) {
      setError('اسم الفرع مطلوب');
      return;
    }
    if (!form.city.trim()) {
      setError('المدينة مطلوبة');
      return;
    }
    if (!companyFilter) {
      setError('اختر الشركة من القائمة أعلاه');
      return;
    }

    setError(null);
    try {
      if (editId) {
        await updateBranch(editId, draftFormToUpdatePayload(form));
      } else {
        await createBranch(draftFormToCreatePayload(form, companyFilter, generateEntityCode(form.name.trim(), 'branch')));
      }
      await loadBranches(companyFilter);
      setDrawerOpen(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'branches.save');
      setError(displayMessage);
    }
  }, [companyFilter, editId, form, loadBranches]);

  const handleDelete = React.useCallback(async () => {
    if (!confirmId || !companyFilter) return;
    setError(null);
    try {
      await deleteBranch(confirmId);
      await loadBranches(companyFilter);
      setConfirmId(null);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'branches.delete');
      setError(displayMessage);
    }
  }, [companyFilter, confirmId, loadBranches]);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton />
        <PermissionGate permission="hr.employees.create">
          <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> فرع جديد
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
              if (v && v !== 'all') setCompanyFilter(v);
            },
            placeholder: 'الشركة',
            options: companySelectOptions,
            className: 'w-[11rem] max-w-[11rem]',
          },
        ]}
        dataView={{
          value: layoutView,
          onChange: (v) => setLayoutView(v as 'grid' | 'table'),
          options: [
            { value: 'table', label: 'جدول', icon: 'list' },
            { value: 'grid', label: 'شبكة', icon: 'layout-grid' },
          ],
        }}
      />
    ),
    [companyFilter, companySelectOptions, layoutView],
  );

  return {
    layoutView,
    branches,
    filtered,
    loading,
    listError,
    drawerOpen,
    setDrawerOpen,
    editId,
    form,
    patch,
    error,
    confirmId,
    setConfirmId,
    viewBranch,
    setViewBranch,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
    companyFilter,
    companies,
  };
}

export type BranchesDirectoryModel = ReturnType<typeof useBranchesDirectoryModel>;
