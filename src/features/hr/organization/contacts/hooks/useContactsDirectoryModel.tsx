'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  usersApi,
  type UserResponseDto,
  type CreateUserDto,
  type UpdateUserDto,
} from '@/features/hr/organization/lib/api/users';

export type UserRecord = UserResponseDto;

export type UserDraftForm = {
  email: string;
  password: string;
  fullNameAr: string;
  fullNameEn: string;
  phone: string;
  userType: string;
  notes: string;
  isActive: boolean;
};

const EMPTY_FORM: UserDraftForm = {
  email: '',
  password: '',
  fullNameAr: '',
  fullNameEn: '',
  phone: '',
  userType: 'internal_employee',
  notes: '',
  isActive: true,
};

export const USER_TYPE_LABELS: Record<string, string> = {
  internal_employee: 'موظف داخلي',
  external: 'مستخدم خارجي',
  admin: 'مدير النظام',
  supervisor: 'مشرف',
  viewer: 'مستعرض',
};

export const USER_TYPE_OPTIONS = Object.entries(USER_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export function useContactsDirectoryModel() {
  useSetPageTitle({
    titleAr: 'المستخدمين',
    descriptionAr: 'حسابات مستخدمي النظام — يمكن ربطهم بموظف وإعطاؤهم صلاحيات.',
    iconName: 'UserCircle',
  });

  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('table');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<UserDraftForm>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewRow, setViewRow] = React.useState<UserRecord | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await usersApi.getAll({ limit: 200 });
      setUsers(res.items);
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

  const patch = React.useCallback((p: Partial<UserDraftForm>) => {
    setForm((f) => ({ ...f, ...p }));
  }, []);

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = React.useCallback((row: UserRecord) => {
    setEditId(row.id);
    setForm({
      email: row.email ?? '',
      password: '',
      fullNameAr: row.fullNameAr ?? '',
      fullNameEn: row.fullNameEn ?? '',
      phone: row.phone ?? '',
      userType: row.userType ?? 'internal_employee',
      notes: row.notes ?? '',
      isActive: row.isActive,
    });
    setError(null);
    setDrawerOpen(true);
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!form.email.trim()) { setError('البريد الإلكتروني مطلوب'); return; }
    if (!editId && !form.password.trim()) { setError('كلمة المرور مطلوبة'); return; }

    setSaving(true);
    setError(null);
    try {
      if (editId) {
        const payload: UpdateUserDto = {
          email: form.email.trim(),
          fullNameAr: form.fullNameAr.trim() || null,
          fullNameEn: form.fullNameEn.trim() || null,
          phone: form.phone.trim() || null,
          userType: form.userType || null,
          notes: form.notes.trim() || null,
          isActive: form.isActive,
        };
        await usersApi.update(editId, payload);
        toast.success('تم تحديث المستخدم');
      } else {
        const payload: CreateUserDto = {
          email: form.email.trim(),
          password: form.password,
          fullNameAr: form.fullNameAr.trim() || null,
          fullNameEn: form.fullNameEn.trim() || null,
          phone: form.phone.trim() || null,
          userType: form.userType || null,
          notes: form.notes.trim() || null,
          isActive: form.isActive,
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
      toast.success('تم حذف المستخدم');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'users.delete');
      toast.error(displayMessage);
      setConfirmId(null);
    }
  }, [confirmId, loadData]);

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
            مستخدم جديد
          </Button>
        )}
      />
    ),
    [layoutView, openCreate],
  );

  return {
    users,
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
  };
}

export type ContactsDirectoryModel = ReturnType<typeof useContactsDirectoryModel>;
