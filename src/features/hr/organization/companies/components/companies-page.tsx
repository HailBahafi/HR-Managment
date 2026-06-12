'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  HRSettingsFormDrawer,
  FormField,
  ConfirmationModal,
  EmptyState,
} from '@/features/hr/requests/components/shared-ui';
import { useCompaniesDirectoryModel } from '@/features/hr/organization/companies/hooks/useCompaniesDirectoryModel';
import { CompaniesListViews } from '@/features/hr/organization/companies/components/companies-list-views';
import { CompanyDetailDialog } from '@/features/hr/organization/companies/dialogs/company-detail-dialog';

export default function CompaniesPage() {
  const model = useCompaniesDirectoryModel();

  return (
    <div className="space-y-4">
      {model.loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">جاري التحميل…</div>
      ) : model.listError ? (
        <EmptyState title="تعذر تحميل الشركات" description={model.listError} />
      ) : (
        <CompaniesListViews model={model} />
      )}

      <HRSettingsFormDrawer
        open={model.drawerOpen}
        onOpenChange={model.setDrawerOpen}
        title={model.editId ? 'تعديل الشركة' : 'شركة جديدة'}
        onSave={model.handleSave}
        saveDisabled={model.saving}
        error={model.error}
      >
        <FormField label="اسم الشركة (عربي)" required>
          <Input value={model.form.nameAr} onChange={(e) => model.patch({ nameAr: e.target.value })} />
        </FormField>
        <FormField label="اسم الشركة (EN)">
          <Input dir="ltr" value={model.form.nameEn} onChange={(e) => model.patch({ nameEn: e.target.value })} />
        </FormField>
        <FormField label="الرمز">
          <Input dir="ltr" value={model.form.code} onChange={(e) => model.patch({ code: e.target.value })} placeholder="يُولَّد تلقائياً من الاسم إن تُرك فارغاً" />
        </FormField>
        <FormField label="السجل التجاري">
          <Input dir="ltr" value={model.form.commercialRegistrationNo} onChange={(e) => model.patch({ commercialRegistrationNo: e.target.value })} />
        </FormField>
        <FormField label="الرقم الضريبي">
          <Input dir="ltr" value={model.form.taxNumber} onChange={(e) => model.patch({ taxNumber: e.target.value })} />
        </FormField>
        <FormField label="البريد">
          <Input dir="ltr" type="email" value={model.form.email} onChange={(e) => model.patch({ email: e.target.value })} />
        </FormField>
        <FormField label="الهاتف">
          <Input dir="ltr" value={model.form.phone} onChange={(e) => model.patch({ phone: e.target.value })} />
        </FormField>
        <FormField label="الجوال">
          <Input dir="ltr" value={model.form.mobile} onChange={(e) => model.patch({ mobile: e.target.value })} />
        </FormField>
        <FormField label="الموقع">
          <Input dir="ltr" value={model.form.website} onChange={(e) => model.patch({ website: e.target.value })} />
        </FormField>
        <FormField label="المدينة">
          <Input value={model.form.city} onChange={(e) => model.patch({ city: e.target.value })} />
        </FormField>
        <FormField label="الحي">
          <Input value={model.form.district} onChange={(e) => model.patch({ district: e.target.value })} />
        </FormField>
        <FormField label="العنوان">
          <Input value={model.form.address} onChange={(e) => model.patch({ address: e.target.value })} />
        </FormField>
        <FormField label="ملاحظات">
          <Textarea value={model.form.notes} onChange={(e) => model.patch({ notes: e.target.value })} rows={2} />
        </FormField>
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <span className="text-sm">نشط</span>
          <Switch checked={model.form.isActive} onCheckedChange={(v) => model.patch({ isActive: v })} />
        </div>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!model.confirmId}
        onOpenChange={(v) => { if (!v) model.setConfirmId(null); }}
        title="حذف الشركة"
        description="سيتم حذف الشركة وجميع الفروع والأقسام المرتبطة. هل أنت متأكد؟"
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={model.handleDelete}
      />

      <CompanyDetailDialog
        row={model.viewRow}
        formatDate={model.formatDate}
        onOpenChange={(open) => { if (!open) model.setViewRow(null); }}
        onEdit={model.openEdit}
      />
    </div>
  );
}
