'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PermissionGate } from '@/components/shared/permission-gate';
import { HRSettingsFormDrawer, FormField, ConfirmationModal, EmptyState } from '@/features/hr/requests/components/shared-ui';
import { useBranchesDirectoryModel } from '@/features/hr/organization/branches/hooks/useBranchesDirectoryModel';
import { BranchesListViews } from '@/features/hr/organization/branches/components/branches-list-views';
import { BranchDetailDialog } from '@/features/hr/organization/branches/dialogs/branch-detail-dialog';

export default function BranchesPage() {
  const model = useBranchesDirectoryModel();

  return (
    <div className="space-y-4">
      {model.loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">جاري التحميل…</div>
      ) : model.listError ? (
        <EmptyState title="تعذر تحميل الفروع" description={model.listError} />
      ) : (
        <BranchesListViews model={model} />
      )}

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
        <FormField label="الاسم بالإنجليزية">
          <Input dir="ltr" value={model.form.nameEn} onChange={(e) => model.patch({ nameEn: e.target.value })} />
        </FormField>
        <FormField label="المدينة" required>
          <Input value={model.form.city} onChange={(e) => model.patch({ city: e.target.value })} placeholder="الرياض" />
        </FormField>
        <FormField label="الحي">
          <Input value={model.form.district} onChange={(e) => model.patch({ district: e.target.value })} />
        </FormField>
        <FormField label="العنوان">
          <Input value={model.form.address} onChange={(e) => model.patch({ address: e.target.value })} />
        </FormField>
        <FormField label="الرمز البريدي">
          <Input dir="ltr" value={model.form.postalCode} onChange={(e) => model.patch({ postalCode: e.target.value })} />
        </FormField>
        <FormField label="مدير الفرع">
          <Input value={model.form.managerName} onChange={(e) => model.patch({ managerName: e.target.value })} />
        </FormField>
        <FormField label="البريد الإلكتروني">
          <Input dir="ltr" type="email" value={model.form.email} onChange={(e) => model.patch({ email: e.target.value })} />
        </FormField>
        <FormField label="الهاتف">
          <Input dir="ltr" value={model.form.phone} onChange={(e) => model.patch({ phone: e.target.value })} />
        </FormField>
        <FormField label="الجوال">
          <Input dir="ltr" value={model.form.mobile} onChange={(e) => model.patch({ mobile: e.target.value })} />
        </FormField>
        <FormField label="ملاحظات">
          <Textarea value={model.form.notes} onChange={(e) => model.patch({ notes: e.target.value })} rows={2} />
        </FormField>
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <span className="text-sm">المقر الرئيسي</span>
          <Switch checked={model.form.isHeadquarters} onCheckedChange={(v) => model.patch({ isHeadquarters: v })} />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <span className="text-sm">نشط</span>
          <Switch checked={model.form.isActive} onCheckedChange={(v) => model.patch({ isActive: v })} />
        </div>
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
