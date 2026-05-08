'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetPageTitle } from '@/components/page-title-context';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { data } from '@/lib/data';
import {
  BRANCH_EMPTY_FORM,
  newBranchId,
  type BranchDraftForm,
  type BranchRow,
} from '@/features/hr/organization/branches/constants/branches-directory';

export function useBranchesDirectoryModel() {
  useSetPageTitle({ titleAr: 'الفروع', descriptionAr: 'إدارة فروع الشركة وتوزيع الموظفين.', iconName: 'Building2' });

  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('grid');
  const [branches, setBranches] = React.useState<BranchRow[]>(() =>
    data.branches.map((b) => ({
      id: b.id,
      name: b.name,
      city: b.city,
      manager: b.manager,
      employeesCount: b.employeesCount,
    })),
  );
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<BranchDraftForm>(BRANCH_EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewBranch, setViewBranch] = React.useState<BranchRow | null>(null);

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

  const handleSave = React.useCallback(() => {
    if (!form.name.trim()) {
      setError('اسم الفرع مطلوب');
      return;
    }
    if (!form.city.trim()) {
      setError('المدينة مطلوبة');
      return;
    }
    const existing = editId ? branches.find((b) => b.id === editId) : undefined;
    const payload: Omit<BranchRow, 'id'> = {
      name: form.name.trim(),
      city: form.city.trim(),
      manager: existing?.manager ?? '',
      employeesCount: existing?.employeesCount ?? 0,
    };
    if (editId) {
      setBranches((list) => list.map((b) => (b.id === editId ? { ...b, ...payload } : b)));
    } else {
      setBranches((list) => [{ id: newBranchId(), ...payload }, ...list]);
    }
    setDrawerOpen(false);
  }, [branches, editId, form.city, form.name]);

  const handleDelete = React.useCallback(() => {
    if (!confirmId) return;
    setBranches((list) => list.filter((b) => b.id !== confirmId));
    setConfirmId(null);
  }, [confirmId]);

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
        trailingActions={(
          <Button onClick={openCreate} size="sm" className="h-8 gap-1.5">
            <Plus className="h-4 w-4" />
            فرع جديد
          </Button>
        )}
      />
    ),
    [layoutView, openCreate],
  );

  return {
    layoutView,
    branches,
    filtered,
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
