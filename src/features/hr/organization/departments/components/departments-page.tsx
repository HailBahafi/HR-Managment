'use client';

import { Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  MinimalDropdown,
  ConfirmationModal,
  HRSettingsFormDrawer,
  FormField,
  EmptyState,
} from '@/features/hr/requests/components/shared-ui';
import { cn } from '@/shared/utils';
import { useDepartmentsDirectoryModel } from '@/features/hr/organization/departments/hooks/useDepartmentsDirectoryModel';
import { DepartmentsListGrid } from '@/features/hr/organization/departments/components/departments-list-grid';

export default function DepartmentsPage() {
  const model = useDepartmentsDirectoryModel();

  return (
    <div className="w-full min-w-0 space-y-4 pt-2">
      {model.loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">جاري التحميل…</div>
      ) : model.listError ? (
        <EmptyState icon={Building2} title="تعذر تحميل الأقسام" description={model.listError} />
      ) : model.filtered.length === 0 ? (
        <EmptyState icon={Building2} title="لا توجد أقسام" />
      ) : (
        <DepartmentsListGrid
          departments={model.departments}
          filtered={model.filtered}
          branchLabel={model.branchLabel}
          onEdit={model.openEdit}
          onDelete={model.confirmDelete}
        />
      )}

      <HRSettingsFormDrawer
        open={model.drawerOpen}
        onOpenChange={model.setDrawerOpen}
        title={model.editId ? 'تعديل القسم' : 'إضافة قسم جديد'}
        onSave={model.handleSave}
        error={model.formError}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="الاسم" required span2>
            <Input
              value={model.draft.nameAr}
              onChange={(e) => model.patch('nameAr', e.target.value)}
              placeholder="الموارد البشرية"
            />
          </FormField>
          <FormField label="القسم الأصل" span2>
            <MinimalDropdown
              value={model.draft.parentId}
              onChange={(v) => model.patch('parentId', v)}
              options={model.parentOptions}
              placeholder={model.parentPickerLoading ? 'جاري تحميل الأقسام…' : 'اختر القسم الأصل'}
              disabled={model.parentPickerLoading}
            />
          </FormField>
          <FormField label="الحالة">
            <label
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-all h-10',
                model.draft.isActive ? 'border-primary/30 bg-primary/5' : 'border-border',
              )}
            >
              <span className="text-sm font-medium">نشط</span>
              <Switch checked={model.draft.isActive} onCheckedChange={(v) => model.patch('isActive', v)} />
            </label>
          </FormField>
        </div>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!model.deleteId}
        onOpenChange={(v) => !v && model.setDeleteId(null)}
        title="حذف القسم"
        description={model.deleteWarning}
        onConfirm={model.handleDelete}
      />
    </div>
  );
}
