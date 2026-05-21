'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { CreateJobTitleDto, UpdateJobTitleDto } from '@/features/hr/organization/lib/api/jobTitles';
import type { DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import {
  createJobTitle,
  deleteJobTitle,
  loadJobTitlesDirectory,
  updateJobTitle,
} from '@/features/hr/organization/job-titles/services/job-titles.service';
import { slugify } from '@/features/hr/requests/lib/types';
import type { JobTitleTemplateRecord } from '@/features/hr/organization/job-titles/services/job-titles.service';
import {
  JOB_TITLE_EMPTY_FORM,
  type JobTitleDraftForm,
} from '@/features/hr/organization/job-titles/constants/job-titles-directory';

export function useJobTitlesDirectoryModel() {
  useSetPageTitle({
    titleAr: 'المسميات الوظيفية',
    descriptionAr: 'قوالب المسميات الاستخدام عند إنشاء موظف جديد — يمكن ربط قسم افتراضي اقتراحياً.',
    iconName: 'Briefcase',
  });

  const [templates, setTemplates] = React.useState<JobTitleTemplateRecord[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentResponseDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [defaultCompanyId, setDefaultCompanyId] = React.useState<string | null>(null);

  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('table');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<JobTitleDraftForm>(JOB_TITLE_EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewRow, setViewRow] = React.useState<JobTitleTemplateRecord | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const data = await loadJobTitlesDirectory();
      setTemplates(data.templates);
      setDepartments(data.departments);
      setDefaultCompanyId(data.scope.companyId);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'job-titles.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const patch = React.useCallback((p: Partial<JobTitleDraftForm>) => {
    setForm((f) => ({ ...f, ...p }));
  }, []);

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setForm(JOB_TITLE_EMPTY_FORM);
    setError(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = React.useCallback((row: JobTitleTemplateRecord) => {
    setEditId(row.id);
    setForm({
      titleAr: row.titleAr,
      descriptionAr: row.descriptionAr ?? '',
      defaultDepartmentId: row.defaultDepartmentId ?? '',
    });
    setError(null);
    setDrawerOpen(true);
  }, []);

  const handleSave = React.useCallback(async () => {
    const titleAr = form.titleAr.trim();
    if (!titleAr) {
      setError('المسمى الوظيفي مطلوب');
      return;
    }
    if (!defaultCompanyId) {
      setError('تعذر تحديد الشركة لهذا المسمى');
      return;
    }
    const descriptionAr = form.descriptionAr.trim() || undefined;

    try {
      if (editId) {
        const payload: UpdateJobTitleDto = {
          code: slugify(titleAr),
          nameAr: titleAr,
          description: descriptionAr ?? null,
        };
        await updateJobTitle(editId, payload);
      } else {
        const payload: CreateJobTitleDto = {
          companyId: defaultCompanyId,
          code: slugify(titleAr),
          nameAr: titleAr,
          description: descriptionAr ?? null,
        };
        await createJobTitle(payload);
      }
      await loadData();
      setDrawerOpen(false);
      setError(null);
      toast.success(editId ? 'تم تحديث القالب' : 'تمت إضافة القالب');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'job-titles.save');
      setError(displayMessage);
    }
  }, [defaultCompanyId, editId, form.descriptionAr, form.titleAr, loadData]);

  const handleDelete = React.useCallback(async () => {
    if (!confirmId) return;
    try {
      await deleteJobTitle(confirmId);
      await loadData();
      setConfirmId(null);
      toast.success('تم حذف القالب');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'job-titles.delete');
      setError(displayMessage);
    }
  }, [confirmId, loadData]);

  const getDepartmentName = React.useCallback(
    (id?: string | null) => departments.find((d) => d.id === id)?.nameAr,
    [departments],
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
        trailingActions={(
          <Button onClick={openCreate} size="sm" className="h-8 gap-1.5">
            <Plus className="h-4 w-4" />
            قالب جديد
          </Button>
        )}
      />
    ),
    [layoutView, openCreate],
  );

  return {
    templates,
    departments,
    getDepartmentName,
    loading,
    listError,
    layoutView,
    drawerOpen,
    setDrawerOpen,
    editId,
    form,
    patch,
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

export type JobTitlesDirectoryModel = ReturnType<typeof useJobTitlesDirectoryModel>;
