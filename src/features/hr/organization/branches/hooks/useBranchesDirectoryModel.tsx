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
import type { CreateBranchDto, UpdateBranchDto } from '@/features/hr/organization/lib/api/branches';
import {
  createBranch,
  deleteBranch,
  loadBranchesDirectory,
  updateBranch,
} from '@/features/hr/organization/branches/services/branches.service';
import { slugify } from '@/features/hr/requests/lib/types';
import {
  BRANCH_EMPTY_FORM,
  type BranchDraftForm,
  type BranchRow,
} from '@/features/hr/organization/branches/constants/branches-directory';

export function useBranchesDirectoryModel() {
  useSetPageTitle({ titleAr: 'الفروع', descriptionAr: 'إدارة فروع الشركة وتوزيع الموظفين.', iconName: 'Building2' });

  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('grid');
  const [branches, setBranches] = React.useState<BranchRow[]>([]);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<BranchDraftForm>(BRANCH_EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [listError, setListError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [defaultCompanyId, setDefaultCompanyId] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewBranch, setViewBranch] = React.useState<BranchRow | null>(null);

  const loadBranches = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const data = await loadBranchesDirectory();
      setBranches(data.branches);
      setDefaultCompanyId(data.scope.companyId);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'branches.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

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
    setForm({ name: b.name, city: b.city });
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
    if (!defaultCompanyId) {
      setError('تعذر تحديد الشركة لهذا الفرع');
      return;
    }

    setError(null);
    try {
      if (editId) {
        const payload: UpdateBranchDto = {
          nameAr: form.name.trim(),
          city: form.city.trim(),
        };
        await updateBranch(editId, payload);
      } else {
        const payload: CreateBranchDto = {
          companyId: defaultCompanyId,
          code: slugify(form.name),
          nameAr: form.name.trim(),
          city: form.city.trim(),
        };
        await createBranch(payload);
      }
      await loadBranches();
      setDrawerOpen(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'branches.save');
      setError(displayMessage);
    }
  }, [defaultCompanyId, editId, form.city, form.name, loadBranches]);

  const handleDelete = React.useCallback(async () => {
    if (!confirmId) return;
    setError(null);
    try {
      await deleteBranch(confirmId);
      await loadBranches();
      setConfirmId(null);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'branches.delete');
      setError(displayMessage);
    }
  }, [confirmId, loadBranches]);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton />
        <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> فرع جديد
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
    [layoutView],
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
  };
}

export type BranchesDirectoryModel = ReturnType<typeof useBranchesDirectoryModel>;
