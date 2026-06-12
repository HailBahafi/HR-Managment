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
import { companiesApi } from '@/features/hr/organization/lib/api/companies';
import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  usersApi,
  type UserResponseDto,
  type CreateUserDto,
  type UpdateUserDto,
} from '@/features/hr/organization/lib/api/users';
import type { CompanyResponseDto } from '@/features/hr/organization/lib/api/companies';
import type { BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import {
  EMPTY_USER_FORM,
  userToDraftForm,
  formatUserDate,
  companyLinkLabel,
  branchLinkLabel,
  type UserDraftForm,
} from '@/features/hr/organization/contacts/constants/users-directory';

export type UserRecord = UserResponseDto;

export {
  USER_TYPE_LABELS,
  USER_TYPE_OPTIONS,
  USER_STATUS_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from '@/features/hr/organization/contacts/constants/users-directory';

export function useContactsDirectoryModel() {
  useSetPageTitle({
    titleAr: 'المستخدمين',
    descriptionAr: 'حسابات مستخدمي النظام — ربط الشركات والفروع والصلاحيات.',
    iconName: 'UserCircle',
  });

  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [companies, setCompanies] = React.useState<CompanyResponseDto[]>([]);
  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('table');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<UserDraftForm>(EMPTY_USER_FORM);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewRow, setViewRow] = React.useState<UserRecord | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const [res, companiesRes, branchesRes] = await Promise.all([
        usersApi.getAll({ limit: 200 }),
        companiesApi.getAll({ limit: 200 }),
        branchesApi.getAll({ limit: 200 }),
      ]);
      setUsers(res.items);
      setCompanies(companiesRes.items);
      setBranches(branchesRes.items);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'users.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const patchUserInList = React.useCallback((updated: UserResponseDto) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setViewRow((prev) => (prev?.id === updated.id ? updated : prev));
  }, []);

  const patch = React.useCallback((p: Partial<UserDraftForm>) => {
    setForm((f) => ({ ...f, ...p }));
  }, []);

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setForm(EMPTY_USER_FORM);
    setError(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = React.useCallback((row: UserRecord) => {
    setEditId(row.id);
    setForm(userToDraftForm(row));
    setError(null);
    setDrawerOpen(true);
  }, []);

  const branchesForDefault = React.useMemo(() => {
    if (!form.defaultCompanyId) return branches;
    return branches.filter((b) => b.companyId === form.defaultCompanyId);
  }, [branches, form.defaultCompanyId]);

  const buildPayloadBase = () => ({
    email: form.email.trim(),
    fullNameAr: form.fullNameAr.trim() || null,
    fullNameEn: form.fullNameEn.trim() || null,
    phone: form.phone.trim() || null,
    avatarUrl: form.avatarUrl.trim() || null,
    userType: form.userType || null,
    defaultCompanyId: form.defaultCompanyId || null,
    defaultBranchId: form.defaultBranchId || null,
    employeeId: form.employeeId.trim() || null,
    languageCode: form.languageCode || null,
    timezone: form.timezone || null,
    status: form.status || null,
    notes: form.notes.trim() || null,
    isActive: form.isActive,
    isVerified: form.isVerified,
  });

  const handleSave = React.useCallback(async () => {
    if (!form.email.trim()) { setError('البريد الإلكتروني مطلوب'); return; }
    if (!editId && !form.password.trim()) { setError('كلمة المرور مطلوبة'); return; }

    setSaving(true);
    setError(null);
    try {
      if (editId) {
        const payload: UpdateUserDto = {
          ...buildPayloadBase(),
          ...(form.password.trim() ? { password: form.password } : {}),
        };
        await usersApi.update(editId, payload);
        toast.success('تم تحديث المستخدم');
      } else {
        const payload: CreateUserDto = {
          ...buildPayloadBase(),
          password: form.password,
        };
        await usersApi.create(payload);
        toast.success('تم إنشاء المستخدم');
      }
      await loadData();
      setDrawerOpen(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'users.save');
      setError(displayMessage);
    } finally {
      setSaving(false);
    }
  }, [editId, form, loadData]);

  const handleDelete = React.useCallback(async () => {
    if (!confirmId) return;
    try {
      await usersApi.remove(confirmId);
      await loadData();
      setConfirmId(null);
      if (viewRow?.id === confirmId) setViewRow(null);
      toast.success('تم حذف المستخدم');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'users.delete');
      toast.error(displayMessage);
      setConfirmId(null);
    }
  }, [confirmId, loadData, viewRow?.id]);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton />
        <PermissionGate permission="hr.employees.create">
          <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> مستخدم جديد
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
    users,
    companies,
    branches,
    branchesForDefault,
    loading,
    listError,
    layoutView,
    drawerOpen,
    setDrawerOpen,
    editId,
    form,
    patch,
    saving,
    error,
    confirmId,
    setConfirmId,
    viewRow,
    setViewRow,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
    patchUserInList,
    companyLinkLabel,
    branchLinkLabel,
    formatDate: formatUserDate,
  };
}

export type ContactsDirectoryModel = ReturnType<typeof useContactsDirectoryModel>;
