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
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  companiesApi,
  type CreateCompanyDto,
  type UpdateCompanyDto,
} from '@/features/hr/organization/lib/api/companies';
import { slugify } from '@/features/hr/requests/lib/types';
import {
  COMPANY_EMPTY_FORM,
  companyToDraftForm,
  type CompanyDraftForm,
  type CompanyRow,
} from '@/features/hr/organization/companies/constants/companies-directory';

export function useCompaniesDirectoryModel() {
  useSetPageTitle({
    titleAr: 'الشركات',
    descriptionAr: 'إدارة الشركات (جذور المستأجرين) وبياناتها التعريفية.',
    iconName: 'Building2',
  });

  const [companies, setCompanies] = React.useState<CompanyRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('table');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<CompanyDraftForm>(COMPANY_EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewRow, setViewRow] = React.useState<CompanyRow | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await companiesApi.getAll({ limit: 200 });
      setCompanies(res.items);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'companies.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const patch = React.useCallback((p: Partial<CompanyDraftForm>) => {
    setForm((f) => ({ ...f, ...p }));
  }, []);

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setForm(COMPANY_EMPTY_FORM);
    setError(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = React.useCallback((row: CompanyRow) => {
    setEditId(row.id);
    setForm(companyToDraftForm(row));
    setError(null);
    setDrawerOpen(true);
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!form.nameAr.trim()) { setError('اسم الشركة مطلوب'); return; }
    const code = form.code.trim() || slugify(form.nameAr);

    setSaving(true);
    setError(null);
    try {
      const base = {
        code,
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        mobile: form.mobile.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        commercialRegistrationNo: form.commercialRegistrationNo.trim() || null,
        taxNumber: form.taxNumber.trim() || null,
        website: form.website.trim() || null,
        address: form.address.trim() || null,
        district: form.district.trim() || null,
        postalCode: form.postalCode.trim() || null,
        timezone: form.timezone.trim() || 'Asia/Riyadh',
        currencyCode: form.currencyCode.trim() || 'SAR',
        languageCode: form.languageCode.trim() || 'ar',
        isActive: form.isActive,
        notes: form.notes.trim() || null,
      };
      if (editId) {
        await companiesApi.update(editId, base as UpdateCompanyDto);
        toast.success('تم تحديث الشركة');
      } else {
        await companiesApi.create(base as CreateCompanyDto);
        toast.success('تم إنشاء الشركة');
      }
      await loadData();
      setDrawerOpen(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'companies.save');
      setError(displayMessage);
    } finally {
      setSaving(false);
    }
  }, [editId, form, loadData]);

  const handleDelete = React.useCallback(async () => {
    if (!confirmId) return;
    try {
      await companiesApi.remove(confirmId);
      await loadData();
      setConfirmId(null);
      toast.success('تم حذف الشركة');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'companies.delete');
      toast.error(displayMessage);
      setConfirmId(null);
    }
  }, [confirmId, loadData]);

  const formatDate = React.useCallback(
    (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar-SA') : '—'),
    [],
  );

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton />
        <PermissionGate permission="hr.employees.create">
          <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> شركة جديدة
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
    companies,
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
    formatDate,
  };
}

export type CompaniesDirectoryModel = ReturnType<typeof useCompaniesDirectoryModel>;
