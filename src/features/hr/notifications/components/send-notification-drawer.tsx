'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { EmployeePicker } from '@/components/ui/employee-picker';
import { FormField, HRSettingsFormDrawer, MinimalDropdown } from '@/features/hr/requests/components/shared-ui';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  NOTIFICATION_AUDIENCE_LABELS,
  NOTIFICATION_CATEGORY_FILTER_ORDER,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_SEVERITY_LABELS,
} from '@/features/hr/notifications/admin/constants/notification-labels';
import {
  notificationsApi,
  type NotificationAudienceKind,
  type NotificationCategory,
  type NotificationSeverity,
  type SendNotificationDto,
} from '@/features/hr/notifications/lib/api/notifications';

type SendForm = {
  titleAr: string;
  bodyAr: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  audienceKind: NotificationAudienceKind;
  employeeIds: Set<string>;
  branchIds: Set<string>;
  departmentIds: Set<string>;
  requiresAcknowledgment: boolean;
  actionUrl: string;
  actionLabelAr: string;
};

export type SendNotificationDrawerDefaults = {
  category?: NotificationCategory;
  severity?: NotificationSeverity;
  titleAr?: string;
  bodyAr?: string;
  requiresAcknowledgment?: boolean;
  actionUrl?: string;
  actionLabelAr?: string;
  sourceKind?: string;
  sourceTable?: string;
  sourceId?: string;
};

const BASE_FORM: SendForm = {
  titleAr: '',
  bodyAr: '',
  category: 'announcement',
  severity: 'info',
  audienceKind: 'company',
  employeeIds: new Set(),
  branchIds: new Set(),
  departmentIds: new Set(),
  requiresAcknowledgment: false,
  actionUrl: '',
  actionLabelAr: 'عرض التفاصيل',
};

function IdCheckboxList({
  options,
  selected,
  onSelectedChange,
}: {
  options: { id: string; label: string }[];
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
}) {
  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectedChange(next);
  };
  return (
    <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border border-border bg-muted/15 p-3">
      {options.map((o) => (
        <label key={o.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
          <Checkbox
            checked={selected.has(o.id)}
            onCheckedChange={(v) => toggle(o.id, v === true)}
          />
          <span className="leading-snug">{o.label}</span>
        </label>
      ))}
    </div>
  );
}

export function SendNotificationDrawer({
  open,
  onOpenChange,
  companyId,
  employeeOptions,
  branchOptions = [],
  departmentOptions = [],
  initialEmployeeIds,
  lockAudienceToEmployees = false,
  defaults,
  title = 'إرسال إشعار جديد',
  description = 'يُوزَّع الإشعار على المستلمين حسب النطاق المحدد.',
  createdBy,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null | undefined;
  employeeOptions: { id: string; name: string }[];
  branchOptions?: { value: string; label: string }[];
  departmentOptions?: { value: string; label: string }[];
  initialEmployeeIds?: Set<string>;
  lockAudienceToEmployees?: boolean;
  defaults?: SendNotificationDrawerDefaults;
  title?: string;
  description?: string;
  createdBy?: string | null;
  onSent?: () => void | Promise<void>;
}) {
  const [form, setForm] = React.useState<SendForm>(BASE_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setForm({
      ...BASE_FORM,
      category: defaults?.category ?? 'announcement',
      severity: defaults?.severity ?? 'info',
      titleAr: defaults?.titleAr ?? '',
      bodyAr: defaults?.bodyAr ?? '',
      audienceKind: lockAudienceToEmployees ? 'employee' : 'company',
      employeeIds: new Set(initialEmployeeIds ?? []),
      branchIds: new Set(),
      departmentIds: new Set(),
      requiresAcknowledgment: defaults?.requiresAcknowledgment ?? false,
      actionUrl: defaults?.actionUrl ?? '',
      actionLabelAr: defaults?.actionLabelAr ?? 'عرض التفاصيل',
    });
    setFormError(null);
  }, [open, defaults, initialEmployeeIds, lockAudienceToEmployees]);

  const submitSend = async () => {
    if (!companyId) {
      setFormError('تعذر تحديد الشركة');
      return;
    }
    if (!form.titleAr.trim()) {
      setFormError('العنوان مطلوب');
      return;
    }
    if (form.audienceKind === 'employee' && form.employeeIds.size === 0) {
      setFormError('اختر موظفاً واحداً على الأقل');
      return;
    }
    if (form.audienceKind === 'branch' && form.branchIds.size === 0) {
      setFormError('اختر فرعاً واحداً على الأقل');
      return;
    }
    if (form.audienceKind === 'department' && form.departmentIds.size === 0) {
      setFormError('اختر قسماً واحداً على الأقل');
      return;
    }

    const dto: SendNotificationDto = {
      companyId,
      category: form.category,
      severity: form.severity,
      titleAr: form.titleAr.trim(),
      bodyAr: form.bodyAr.trim() || null,
      audienceKind: form.audienceKind,
      employeeIds: form.audienceKind === 'employee' ? [...form.employeeIds] : undefined,
      branchIds: form.audienceKind === 'branch' ? [...form.branchIds] : undefined,
      departmentIds: form.audienceKind === 'department' ? [...form.departmentIds] : undefined,
      deliveryChannel: 'in_app',
      sourceKind: defaults?.sourceKind ?? 'manual',
      sourceTable: defaults?.sourceTable,
      sourceId: defaults?.sourceId,
      requiresAcknowledgment: form.requiresAcknowledgment,
      actionUrl: form.actionUrl.trim() || undefined,
      actionLabelAr: form.actionLabelAr.trim() || undefined,
      createdBy: createdBy ?? undefined,
    };

    setSaving(true);
    setFormError(null);
    try {
      await notificationsApi.send(dto);
      toast.success('تم إرسال الإشعار');
      onOpenChange(false);
      await onSent?.();
    } catch (e) {
      setFormError(handleApiError(e).displayMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <HRSettingsFormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      onSave={submitSend}
      saveDisabled={saving}
      saveLabel="إرسال"
      error={formError}
    >
      <FormField label="العنوان *">
        <Input
          value={form.titleAr}
          onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))}
          placeholder="مثال: إعلان عام للموظفين"
        />
      </FormField>
      <FormField label="المحتوى">
        <textarea
          value={form.bodyAr}
          onChange={(e) => setForm((f) => ({ ...f, bodyAr: e.target.value }))}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="نص الإشعار..."
        />
      </FormField>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="التصنيف">
          <MinimalDropdown
            value={form.category}
            options={NOTIFICATION_CATEGORY_FILTER_ORDER.map((c) => ({
              value: c,
              label: NOTIFICATION_CATEGORY_LABELS[c],
            }))}
            onChange={(v) => setForm((f) => ({ ...f, category: v as NotificationCategory }))}
          />
        </FormField>
        <FormField label="الأولوية">
          <MinimalDropdown
            value={form.severity}
            options={(
              Object.entries(NOTIFICATION_SEVERITY_LABELS) as [NotificationSeverity, string][]
            ).map(([value, label]) => ({ value, label }))}
            onChange={(v) => setForm((f) => ({ ...f, severity: v as NotificationSeverity }))}
          />
        </FormField>
      </div>
      {!lockAudienceToEmployees && (
        <FormField label="نطاق المستلمين">
          <MinimalDropdown
            value={form.audienceKind}
            options={(
              Object.entries(NOTIFICATION_AUDIENCE_LABELS) as [NotificationAudienceKind, string][]
            ).map(([value, label]) => ({ value, label }))}
            onChange={(v) =>
              setForm((f) => ({ ...f, audienceKind: v as NotificationAudienceKind }))
            }
          />
        </FormField>
      )}
      {(lockAudienceToEmployees || form.audienceKind === 'employee') && (
        <FormField label={lockAudienceToEmployees ? `الموظفون (${form.employeeIds.size})` : 'الموظفون'}>
          <EmployeePicker
            employees={employeeOptions}
            selected={form.employeeIds}
            onChange={(employeeIds) => setForm((f) => ({ ...f, employeeIds }))}
          />
        </FormField>
      )}
      {!lockAudienceToEmployees && form.audienceKind === 'branch' && (
        <FormField label="الفروع">
          <IdCheckboxList
            options={branchOptions.map((b) => ({ id: b.value, label: b.label }))}
            selected={form.branchIds}
            onSelectedChange={(branchIds) => setForm((f) => ({ ...f, branchIds }))}
          />
        </FormField>
      )}
      {!lockAudienceToEmployees && form.audienceKind === 'department' && (
        <FormField label="الأقسام">
          <IdCheckboxList
            options={departmentOptions.map((d) => ({ id: d.value, label: d.label }))}
            selected={form.departmentIds}
            onSelectedChange={(departmentIds) => setForm((f) => ({ ...f, departmentIds }))}
          />
        </FormField>
      )}
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={form.requiresAcknowledgment}
          onCheckedChange={(v) =>
            setForm((f) => ({ ...f, requiresAcknowledgment: v === true }))
          }
        />
        يتطلب إقراراً من المستلم
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="رابط الإجراء (اختياري)">
          <Input
            value={form.actionUrl}
            onChange={(e) => setForm((f) => ({ ...f, actionUrl: e.target.value }))}
            placeholder="/hr/dashboard"
            dir="ltr"
          />
        </FormField>
        <FormField label="نص الزر">
          <Input
            value={form.actionLabelAr}
            onChange={(e) => setForm((f) => ({ ...f, actionLabelAr: e.target.value }))}
          />
        </FormField>
      </div>
    </HRSettingsFormDrawer>
  );
}
