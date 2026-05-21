'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
} from '@/features/hr/requests/components/shared-ui';
import {
  useContactsDirectoryModel,
  USER_TYPE_OPTIONS,
} from '@/features/hr/organization/contacts/hooks/useContactsDirectoryModel';
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
        title={model.editId ? 'تعديل مستخدم' : 'مستخدم جديد'}
        onSave={model.handleSave}
        saveDisabled={model.saving}
        error={model.error}
      >
        <FormField label="البريد الإلكتروني" required>
          <Input
            dir="ltr"
            type="email"
            value={model.form.email}
            onChange={(e) => model.patch({ email: e.target.value })}
            placeholder="user@example.com"
          />
        </FormField>

        {!model.editId && (
          <FormField label="كلمة المرور" required>
            <Input
              dir="ltr"
              type="password"
              value={model.form.password}
              onChange={(e) => model.patch({ password: e.target.value })}
              placeholder="••••••••"
            />
          </FormField>
        )}

        <FormField label="الاسم بالعربية">
          <Input
            value={model.form.fullNameAr}
            onChange={(e) => model.patch({ fullNameAr: e.target.value })}
            placeholder="أحمد محمد"
          />
        </FormField>

        <FormField label="الاسم بالإنجليزية">
          <Input
            dir="ltr"
            value={model.form.fullNameEn}
            onChange={(e) => model.patch({ fullNameEn: e.target.value })}
            placeholder="Ahmed Mohammed"
          />
        </FormField>

        <FormField label="رقم الجوال">
          <Input
            dir="ltr"
            value={model.form.phone}
            onChange={(e) => model.patch({ phone: e.target.value })}
            placeholder="+966 …"
          />
        </FormField>

        <FormField label="نوع المستخدم">
          <Select
            value={model.form.userType}
            onValueChange={(v) => model.patch({ userType: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع المستخدم" />
            </SelectTrigger>
            <SelectContent>
              {USER_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="ملاحظات">
          <Textarea
            value={model.form.notes}
            onChange={(e) => model.patch({ notes: e.target.value })}
            placeholder="ملاحظات داخلية…"
            rows={3}
          />
        </FormField>

        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <span className="text-sm">نشط</span>
          <Switch
            checked={model.form.isActive}
            onCheckedChange={(v) => model.patch({ isActive: v })}
          />
        </div>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!model.confirmId}
        onOpenChange={(v) => {
          if (!v) model.setConfirmId(null);
        }}
        title="حذف المستخدم"
        description="هل أنت متأكد من حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء."
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
