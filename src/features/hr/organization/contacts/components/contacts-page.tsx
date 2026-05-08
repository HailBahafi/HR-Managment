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
import {
  HRSettingsFormDrawer,
  FormField,
  ConfirmationModal,
} from '@/components/hr-requests/shared-ui';
import {
  EXTERNAL_PARTY_KIND_LABELS,
  type ExternalPartyKind,
} from '@/lib/directory/external-contacts-store';
import { useContactsDirectoryModel } from '@/features/hr/organization/contacts/hooks/useContactsDirectoryModel';
import { ContactsListViews } from '@/features/hr/organization/contacts/components/contacts-list-views';
import { ExternalContactDetailDialog } from '@/features/hr/organization/contacts/dialogs/external-contact-detail-dialog';

export default function ContactsPage() {
  const model = useContactsDirectoryModel();

  return (
    <div className="space-y-4">
      <ContactsListViews model={model} />

      <HRSettingsFormDrawer
        open={model.drawerOpen}
        onOpenChange={model.setDrawerOpen}
        title={model.editId ? 'تعديل جهة' : 'جهة جديدة'}
        onSave={model.handleSave}
        error={model.error}
      >
        <FormField label="نوع الجهة" required>
          <Select value={model.form.kind} onValueChange={(v) => model.patch({ kind: v as ExternalPartyKind })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(EXTERNAL_PARTY_KIND_LABELS) as [ExternalPartyKind, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="الاسم" required>
          <Input
            value={model.form.nameAr}
            onChange={(e) => model.patch({ nameAr: e.target.value })}
            placeholder="اسم الشخص أو الجهة"
          />
        </FormField>
        <FormField label="الشركة / الجهة التابعة">
          <Input
            value={model.form.organizationAr}
            onChange={(e) => model.patch({ organizationAr: e.target.value })}
            placeholder="اختياري"
          />
        </FormField>
        <FormField label="رقم الجوال">
          <Input dir="ltr" value={model.form.phone} onChange={(e) => model.patch({ phone: e.target.value })} placeholder="+966 …" />
        </FormField>
        <FormField label="البريد الإلكتروني">
          <Input
            dir="ltr"
            type="email"
            value={model.form.email}
            onChange={(e) => model.patch({ email: e.target.value })}
            placeholder="name@example.com"
          />
        </FormField>
        <FormField label="ملاحظات">
          <Textarea
            value={model.form.notes}
            onChange={(e) => model.patch({ notes: e.target.value })}
            placeholder="متابعة، مصدر التواصل، اهتمامات…"
            rows={3}
          />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!model.confirmId}
        onOpenChange={(v) => {
          if (!v) model.setConfirmId(null);
        }}
        title="حذف الجهة"
        description="هل أنت متأكد من حذف هذا السجل؟"
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={model.handleDelete}
      />

      <ExternalContactDetailDialog
        row={model.viewRow}
        onOpenChange={(open) => {
          if (!open) model.setViewRow(null);
        }}
        onEdit={model.openEdit}
      />
    </div>
  );
}
