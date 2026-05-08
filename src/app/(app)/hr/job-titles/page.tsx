'use client';

import * as React from 'react';
import { Briefcase, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useSetPageTitle } from '@/components/page-title-context';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import {
  EmptyState, HRSettingsFormDrawer, FormField, ConfirmationModal,
} from '@/components/hr-requests/shared-ui';
import { useJobTitleTemplatesStore, type JobTitleTemplateRecord } from '@/lib/directory/job-title-templates-store';
import { data, getDepartment } from '@/lib/data';
import { toast } from 'sonner';

type DraftForm = {
  titleAr: string;
  descriptionAr: string;
  defaultDepartmentId: string;
};

const EMPTY_FORM: DraftForm = {
  titleAr: '',
  descriptionAr: '',
  defaultDepartmentId: '',
};

export default function JobTitlesPage() {
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
  const [form, setForm] = React.useState<DraftForm>(EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewRow, setViewRow] = React.useState<JobTitleTemplateRecord | null>(null);

  const patch = (p: Partial<DraftForm>) => setForm((f) => ({ ...f, ...p }));

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setDrawerOpen(true);
  };

  const openEdit = (row: JobTitleTemplateRecord) => {
    setEditId(row.id);
    setForm({
      titleAr: row.titleAr,
      descriptionAr: row.descriptionAr ?? '',
      defaultDepartmentId: row.defaultDepartmentId ?? '',
    });
    setError(null);
    setDrawerOpen(true);
  };

  const handleSave = () => {
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
  };

  const handleDelete = () => {
    if (!confirmId) return;
    removeTemplate(confirmId);
    setConfirmId(null);
    toast.success('تم حذف القالب');
  };

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
    [layoutView],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{templates.length} قالب مسمى</p>

      {templates.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="لا توجد قوالب"
          description="أضف مسميات وظيفية شائعة في شركتك لاستخدامها عند إضافة موظف."
        />
      ) : layoutView === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((row) => {
            const dept = row.defaultDepartmentId
              ? getDepartment(row.defaultDepartmentId)
              : undefined;
            return (
              <div
                key={row.id}
                className="flex cursor-pointer flex-col space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft transition-colors hover:bg-muted/30"
                onClick={() => setViewRow(row)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 font-semibold leading-snug">{row.titleAr}</p>
                  <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                {dept && (
                  <p className="text-xs text-muted-foreground">قسم مقترح: {dept.name}</p>
                )}
                <div
                  className="mt-auto flex items-center justify-end gap-1 border-t border-border pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setConfirmId(row.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3 text-right">المسمى الوظيفي</th>
                  <th className="px-4 py-3 text-right">القسم المقترج</th>
                  <th className="px-4 py-3 text-right">وصف</th>
                  <th className="w-28 px-4 py-3 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((row) => {
                  const dept = row.defaultDepartmentId
                    ? getDepartment(row.defaultDepartmentId)
                    : undefined;
                  return (
                    <tr
                      key={row.id}
                      className="cursor-pointer border-b border-border/60 hover:bg-muted/25"
                      onClick={() => setViewRow(row)}
                    >
                      <td className="px-4 py-3 font-medium">{row.titleAr}</td>
                      <td className="px-4 py-3 text-muted-foreground">{dept?.name ?? '—'}</td>
                      <td className="max-w-[240px] truncate px-4 py-3 text-muted-foreground">
                        {row.descriptionAr ?? '—'}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)} aria-label="تعديل">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setConfirmId(row.id)}
                            aria-label="حذف"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <HRSettingsFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل القالب' : 'قالب مسمى جديد'}
        onSave={handleSave}
        error={error}
      >
        <FormField label="المسمى الوظيفي بالعربية" required>
          <Input
            value={form.titleAr}
            onChange={(e) => patch({ titleAr: e.target.value })}
            placeholder="مثال: مدير مبيعات إقليمي"
          />
        </FormField>
        <FormField label="القسم المقترج (اختياري)">
          <Select
            value={form.defaultDepartmentId || '_none'}
            onValueChange={(v) => patch({ defaultDepartmentId: v === '_none' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="بدون اقتراح قسم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">بدون اقتراح</SelectItem>
              {data.departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="وصف داخلي (اختياري)">
          <Textarea
            value={form.descriptionAr}
            onChange={(e) => patch({ descriptionAr: e.target.value })}
            placeholder="مسؤوليات مختصرة، مستوى، ملاحظات للموارد البشرية…"
            rows={3}
          />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!confirmId}
        onOpenChange={(v) => {
          if (!v) setConfirmId(null);
        }}
        title="حذف القالب"
        description="لن يؤثر ذلك على الموظفين الحاليين — فقط على القائمة عند إنشاء موظف جديد."
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={handleDelete}
      />

      <Dialog open={!!viewRow} onOpenChange={(v) => !v && setViewRow(null)}>
        <DialogContent className="border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              {viewRow?.titleAr}
            </DialogTitle>
          </DialogHeader>
          {viewRow && (
            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">القسم المقترج</span>
                <span className="font-medium">
                  {viewRow.defaultDepartmentId
                    ? getDepartment(viewRow.defaultDepartmentId)?.name ?? '—'
                    : '—'}
                </span>
              </div>
              {viewRow.descriptionAr && (
                <div className="border-t border-border pt-3">
                  <p className="text-muted-foreground">الوصف</p>
                  <p className="mt-1 leading-relaxed">{viewRow.descriptionAr}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewRow(null)}>
              إغلاق
            </Button>
            <Button
              onClick={() => {
                if (viewRow) {
                  const r = viewRow;
                  setViewRow(null);
                  openEdit(r);
                }
              }}
              className="gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              تعديل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
