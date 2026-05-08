'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetPageTitle } from '@/components/page-title-context';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { useJobTitleTemplatesStore, type JobTitleTemplateRecord } from '@/lib/directory/job-title-templates-store';
import { toast } from 'sonner';
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

  const templates = useJobTitleTemplatesStore((s) => s.templates);
  const addTemplate = useJobTitleTemplatesStore((s) => s.add);
  const updateTemplate = useJobTitleTemplatesStore((s) => s.update);
  const removeTemplate = useJobTitleTemplatesStore((s) => s.remove);

  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('table');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<JobTitleDraftForm>(JOB_TITLE_EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewRow, setViewRow] = React.useState<JobTitleTemplateRecord | null>(null);

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

  const handleSave = React.useCallback(() => {
    const titleAr = form.titleAr.trim();
    if (!titleAr) {
      setError('المسمى الوظيفي مطلوب');
      return;
    }
    const defaultDepartmentId = form.defaultDepartmentId || null;
    const descriptionAr = form.descriptionAr.trim() || undefined;

    if (editId) {
      const r = updateTemplate(editId, { titleAr, descriptionAr, defaultDepartmentId });
      if (!r.ok) {
        setError(r.error ?? 'تعذر الحفظ');
        return;
      }
    } else {
      const r = addTemplate({
        titleAr,
        descriptionAr,
        defaultDepartmentId,
      });
      if (!r.ok) {
        setError(r.error ?? 'تعذر الحفظ');
        return;
      }
    }
    setDrawerOpen(false);
    setError(null);
    toast.success(editId ? 'تم تحديث القالب' : 'تمت إضافة القالب');
  }, [addTemplate, editId, form, updateTemplate]);

  const handleDelete = React.useCallback(() => {
    if (!confirmId) return;
    removeTemplate(confirmId);
    setConfirmId(null);
    toast.success('تم حذف القالب');
  }, [confirmId, removeTemplate]);

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
