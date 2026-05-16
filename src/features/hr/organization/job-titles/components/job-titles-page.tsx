'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HRSettingsFormDrawer, FormField, ConfirmationModal, EmptyState } from '@/features/hr/requests/components/shared-ui';
import { useJobTitlesDirectoryModel } from '@/features/hr/organization/job-titles/hooks/useJobTitlesDirectoryModel';
import { JobTitlesListViews } from '@/features/hr/organization/job-titles/components/job-titles-list-views';
import { JobTitleTemplateDetailDialog } from '@/features/hr/organization/job-titles/dialogs/job-title-template-detail-dialog';

export default function JobTitlesPage() {
  const model = useJobTitlesDirectoryModel();

  return (
    <div className="space-y-4">
      {model.loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">جاري التحميل…</div>
      ) : model.listError ? (
        <EmptyState title="تعذر تحميل المسميات" description={model.listError} />
      ) : (
        <JobTitlesListViews model={model} />
      )}

      <HRSettingsFormDrawer
        open={model.drawerOpen}
        onOpenChange={model.setDrawerOpen}
        title={model.editId ? 'تعديل القالب' : 'قالب مسمى جديد'}
        onSave={model.handleSave}
        error={model.error}
      >
        <FormField label="المسمى الوظيفي بالعربية" required>
          <Input
            value={model.form.titleAr}
            onChange={(e) => model.patch({ titleAr: e.target.value })}
            placeholder="مثال: مدير مبيعات إقليمي"
          />
        </FormField>
        <FormField label="القسم المقترح (اختياري)">
          <Select
            value={model.form.defaultDepartmentId || '_none'}
            onValueChange={(v) => model.patch({ defaultDepartmentId: v === '_none' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="بدون اقتراح قسم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">بدون اقتراح</SelectItem>
              {model.departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="وصف داخلي (اختياري)">
          <Textarea
            value={model.form.descriptionAr}
            onChange={(e) => model.patch({ descriptionAr: e.target.value })}
            placeholder="مسؤوليات مختصرة، مستوى، ملاحظات للموارد البشرية…"
            rows={3}
          />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!model.confirmId}
        onOpenChange={(v) => {
          if (!v) model.setConfirmId(null);
        }}
        title="حذف القالب"
        description="لن يؤثر ذلك على الموظفين الحاليين — فقط على القائمة عند إنشاء موظف جديد."
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={model.handleDelete}
      />

      <JobTitleTemplateDetailDialog
        row={model.viewRow}
        getDepartmentName={model.getDepartmentName}
        onOpenChange={(open) => {
          if (!open) model.setViewRow(null);
        }}
        onEdit={model.openEdit}
      />
    </div>
  );
}
