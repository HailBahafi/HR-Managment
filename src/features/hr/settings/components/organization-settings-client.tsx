'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { ORGANIZATION_USER_NOTIFICATION_ITEMS } from '@/features/hr/settings/constants/notification-groups';
import { SettingsNav } from '@/features/hr/settings/components/settings-nav';
import { useOrganizationCompanySettings } from '@/features/hr/settings/hooks/useOrganizationSettings';
import type { UpdateOrganizationCompanySettingsDto } from '@/features/hr/settings/lib/api/types';

type OrgFormState = {
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  notifyUserCreated: boolean;
  notifyUserAssignedToCompany: boolean;
  notifyUserAssignedToBranch: boolean;
};

import type { OrganizationCompanySettings } from '@/features/hr/settings/lib/api/types';

function toFormState(data: OrganizationCompanySettings): OrgFormState {
  return {
    emailEnabled: data.emailEnabled,
    smtpHost: data.smtpHost ?? '',
    smtpPort: data.smtpPort != null ? String(data.smtpPort) : '',
    smtpSecure: data.smtpSecure,
    smtpUsername: data.smtpUsername ?? '',
    smtpPassword: '',
    smtpFromEmail: data.smtpFromEmail ?? '',
    smtpFromName: data.smtpFromName ?? '',
    notifyUserCreated: data.notifyUserCreated,
    notifyUserAssignedToCompany: data.notifyUserAssignedToCompany,
    notifyUserAssignedToBranch: data.notifyUserAssignedToBranch,
  };
}

export function OrganizationSettingsClient() {
  const { data: company } = useActiveCompany();
  const { data: settings, isLoading, isError, error, update, companyId } = useOrganizationCompanySettings();
  const [form, setForm] = React.useState<OrgFormState | null>(null);

  React.useEffect(() => {
    if (settings) setForm(toFormState(settings));
  }, [settings]);

  const patch = (partial: Partial<OrgFormState>) => {
    setForm((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const handleSave = async () => {
    if (!form) return;
    const dto: UpdateOrganizationCompanySettingsDto = {
      emailEnabled: form.emailEnabled,
      smtpHost: form.smtpHost.trim() || null,
      smtpPort: form.smtpPort.trim() ? Number(form.smtpPort) : null,
      smtpSecure: form.smtpSecure,
      smtpUsername: form.smtpUsername.trim() || null,
      smtpFromEmail: form.smtpFromEmail.trim() || null,
      smtpFromName: form.smtpFromName.trim() || null,
      notifyUserCreated: form.notifyUserCreated,
      notifyUserAssignedToCompany: form.notifyUserAssignedToCompany,
      notifyUserAssignedToBranch: form.notifyUserAssignedToBranch,
    };
    if (form.smtpPassword.trim()) {
      dto.smtpPassword = form.smtpPassword;
    }

    try {
      await update.mutateAsync(dto);
      toast.success('تم حفظ إعدادات المنظمة');
      setForm((prev) => (prev ? { ...prev, smtpPassword: '' } : prev));
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'settings.organization.update');
      toast.error(displayMessage);
    }
  };

  if (!companyId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          لا توجد شركة افتراضية — سجّل الدخول أو اختر شركة.
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !form) {
    return <div className="py-12 text-center text-sm text-muted-foreground">جاري التحميل…</div>;
  }

  if (isError || !settings) {
    const { displayMessage } = handleApiError(error, 'settings.organization.get');
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-destructive">{displayMessage}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsNav />

      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
        <p className="font-medium">{company?.nameAr ?? 'الشركة الحالية'}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          إعدادات البريد (SMTP) وإشعارات المستخدمين على مستوى المنظمة.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">البريد الإلكتروني (SMTP)</CardTitle>
          <CardDescription className="text-xs">
            إعدادات إرسال البريد من النظام. اترك كلمة المرور فارغة للإبقاء على القيمة الحالية.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
            <div>
              <p className="text-sm font-medium">تفعيل البريد</p>
              <p className="text-xs text-muted-foreground">إرسال الإشعارات عبر SMTP</p>
            </div>
            <Switch checked={form.emailEnabled} onCheckedChange={(v) => patch({ emailEnabled: v })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>خادم SMTP</Label>
              <Input
                dir="ltr"
                value={form.smtpHost}
                onChange={(e) => patch({ smtpHost: e.target.value })}
                placeholder="smtp.example.com"
                disabled={!form.emailEnabled}
              />
            </div>
            <div className="space-y-2">
              <Label>المنفذ</Label>
              <Input
                dir="ltr"
                type="number"
                value={form.smtpPort}
                onChange={(e) => patch({ smtpPort: e.target.value })}
                placeholder="587"
                disabled={!form.emailEnabled}
              />
            </div>
            <div className="space-y-2">
              <Label>اسم المستخدم</Label>
              <Input
                dir="ltr"
                value={form.smtpUsername}
                onChange={(e) => patch({ smtpUsername: e.target.value })}
                disabled={!form.emailEnabled}
              />
            </div>
            <div className="space-y-2">
              <Label>كلمة المرور</Label>
              <Input
                dir="ltr"
                type="password"
                value={form.smtpPassword}
                onChange={(e) => patch({ smtpPassword: e.target.value })}
                placeholder={settings.smtpPasswordConfigured ? 'مُعَدّة — اتركها فارغة للإبقاء' : 'كلمة مرور SMTP'}
                disabled={!form.emailEnabled}
              />
            </div>
            <div className="space-y-2">
              <Label>البريد المرسل (From)</Label>
              <Input
                dir="ltr"
                type="email"
                value={form.smtpFromEmail}
                onChange={(e) => patch({ smtpFromEmail: e.target.value })}
                disabled={!form.emailEnabled}
              />
            </div>
            <div className="space-y-2">
              <Label>اسم المرسل</Label>
              <Input
                value={form.smtpFromName}
                onChange={(e) => patch({ smtpFromName: e.target.value })}
                disabled={!form.emailEnabled}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
            <div>
              <p className="text-sm font-medium">اتصال آمن (TLS/SSL)</p>
            </div>
            <Switch
              checked={form.smtpSecure}
              onCheckedChange={(v) => patch({ smtpSecure: v })}
              disabled={!form.emailEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">إشعارات المستخدمين</CardTitle>
          <CardDescription className="text-xs">إشعارات متعلقة بإنشاء المستخدمين وإسنادهم</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {ORGANIZATION_USER_NOTIFICATION_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/10 px-4 py-3"
            >
              <p className="text-sm font-medium">{item.label}</p>
              <Switch
                checked={form[item.key]}
                disabled={!form.emailEnabled}
                onCheckedChange={(v) => patch({ [item.key]: v })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="luxe" onClick={() => void handleSave()} disabled={update.isPending}>
          {update.isPending ? 'جاري الحفظ…' : 'حفظ الإعدادات'}
        </Button>
      </div>
    </div>
  );
}
