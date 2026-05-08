'use client';

import { Input } from '@/components/ui/input';
import { HRSettingsFormDrawer, FormField, ConfirmationModal } from '@/components/hr-requests/shared-ui';
import { useBranchesDirectoryModel } from '@/features/hr/organization/branches/hooks/useBranchesDirectoryModel';
import { BranchesListViews } from '@/features/hr/organization/branches/components/branches-list-views';
import { BranchDetailDialog } from '@/features/hr/organization/branches/dialogs/branch-detail-dialog';

export default function BranchesPage() {
  const model = useBranchesDirectoryModel();

  return (
    <div className="space-y-4">
      <BranchesListViews model={model} />

      <HRSettingsFormDrawer
        open={model.drawerOpen}
        onOpenChange={model.setDrawerOpen}
        title={model.editId ? 'تعديل الفرع' : 'فرع جديد'}
        onSave={model.handleSave}
        error={model.error}
      >
        <FormField label="اسم الفرع" required>
          <Input value={model.form.name} onChange={(e) => model.patch({ name: e.target.value })} placeholder="مثال: فرع الرياض" />
        </FormField>
        <FormField label="المدينة" required>
          <Input value={model.form.city} onChange={(e) => model.patch({ city: e.target.value })} placeholder="الرياض" />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!model.confirmId}
        onOpenChange={(v) => {
          if (!v) model.setConfirmId(null);
        }}
        title="حذف الفرع"
        description="هل أنت متأكد من حذف هذا الفرع؟"
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={model.handleDelete}
      />

      <BranchDetailDialog
        branch={model.viewBranch}
        onOpenChange={(open) => {
          if (!open) model.setViewBranch(null);
        }}
        onEdit={model.openEdit}
      />
    </div>
  );
}
