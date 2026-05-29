import * as React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SlidePanel, SlidePanelContent } from '@/components/ui/slide-panel';
import { cn } from '@/shared/utils';
import {
  PERMISSION_ROLE_COLOR_TOKENS,
  coercePermissionRoleColorToken,
  permissionRoleCssColor,
  type PermissionRoleColorToken,
} from '@/features/hr/permissions/constants/role-colors';
import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';

export type RoleFormValues = {
  name: string;
  description: string;
  /** Permission IDs selected for this role */
  permissionIds: string[];
  color: PermissionRoleColorToken;
};

const BLANK: RoleFormValues = { name: '', description: '', permissionIds: [], color: 'primary' };

const ACTION_AR: Record<string, string> = {
  read: 'عرض',
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  approve: 'موافقة',
  export: 'تصدير',
};

const RESOURCE_AR: Record<string, string> = {
  employees: 'الموظفين',
  attendance: 'الحضور',
  requests: 'الطلبات',
  payroll: 'الرواتب',
  hr: 'الموارد البشرية',
  reports: 'التقارير',
  settings: 'الإعدادات',
  leaves: 'الإجازات',
  contracts: 'العقود',
  organization: 'المنظمة',
  branches: 'الفروع',
  departments: 'الأقسام',
  companies: 'الشركات',
};

type Props = {
  open: boolean;
  isLoading: boolean;
  isSaving: boolean;
  editingTitle: string | null;
  initialValues: RoleFormValues | null;
  /** Permissions scoped to the role's application — passed by the parent */
  availablePermissions: PermissionResponseDto[];
  onOpenChange: (open: boolean) => void;
  onSave: (values: RoleFormValues) => void;
};

export function RoleFormPanel({
  open, isLoading, isSaving, editingTitle, initialValues,
  availablePermissions, onOpenChange, onSave,
}: Props) {
  const [form, setForm] = React.useState<RoleFormValues>(BLANK);

  React.useEffect(() => {
    if (open) setForm(initialValues ?? BLANK);
  }, [open, initialValues]);

  // Build matrix structure from actual permissions
  const { resources, actionIds, matrix } = React.useMemo(() => {
    const actionNodes = availablePermissions.filter((p) => p.nodeType === 'ACTION');

    const resourceSet = new Set<string>();
    const actionSet = new Set<string>();
    for (const p of actionNodes) {
      if (p.resource) resourceSet.add(p.resource);
      if (p.action) actionSet.add(p.action);
    }

    // Stable action order
    const ORDER = ['read', 'create', 'update', 'delete', 'approve', 'export'];
    const actionIds = [...actionSet].sort(
      (a, b) => (ORDER.indexOf(a) === -1 ? 99 : ORDER.indexOf(a)) - (ORDER.indexOf(b) === -1 ? 99 : ORDER.indexOf(b)),
    );

    // matrix[resource][action] = permissionId | null
    const matrix: Record<string, Record<string, string>> = {};
    for (const res of resourceSet) {
      matrix[res] = {};
      for (const act of actionIds) {
        const p = actionNodes.find((n) => n.resource === res && n.action === act);
        if (p) matrix[res][act] = p.id;
      }
    }

    return { resources: [...resourceSet].sort(), actionIds, matrix };
  }, [availablePermissions]);

  const selectedSet = new Set(form.permissionIds);
  const allIds = availablePermissions.filter((p) => p.nodeType === 'ACTION').map((p) => p.id);
  const isAllPerms = allIds.length > 0 && allIds.every((id) => selectedSet.has(id));

  function togglePerm(permId: string) {
    setForm((prev) => {
      const s = new Set(prev.permissionIds);
      if (s.has(permId)) s.delete(permId); else s.add(permId);
      return { ...prev, permissionIds: [...s] };
    });
  }

  function toggleResource(resource: string) {
    const resourceIds = Object.values(matrix[resource] ?? {});
    const allGranted = resourceIds.every((id) => selectedSet.has(id));
    setForm((prev) => {
      const s = new Set(prev.permissionIds);
      if (allGranted) { resourceIds.forEach((id) => s.delete(id)); }
      else { resourceIds.forEach((id) => s.add(id)); }
      return { ...prev, permissionIds: [...s] };
    });
  }

  function toggleAll() {
    setForm((prev) => ({
      ...prev,
      permissionIds: isAllPerms ? [] : allIds,
    }));
  }

  return (
    <SlidePanel open={open} onOpenChange={onOpenChange}>
      <SlidePanelContent
        size="xl"
        title={editingTitle ? `تعديل: ${editingTitle}` : 'دور جديد'}
        description="حدد اسم الدور ومستويات الوصول على موارد النظام"
        footer={
          <div className="flex gap-2">
            <Button
              variant="luxe"
              className="flex-1"
              disabled={!form.name.trim() || isSaving || isLoading}
              onClick={() => onSave(form)}
            >
              {isSaving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ…</>
                : <><Check className="h-4 w-4" /> حفظ التغييرات</>}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              إلغاء
            </Button>
          </div>
        }
      >
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <Label>اسم الدور</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="مثال: مشرف الفرع"
              />
            </div>

            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف مختصر لصلاحيات هذا الدور..."
              />
            </div>

            <div className="space-y-2">
              <Label>لون الدور</Label>
              <div className="flex flex-wrap gap-2">
                {PERMISSION_ROLE_COLOR_TOKENS.map((token) => {
                  const c = permissionRoleCssColor(token);
                  const selected = form.color === token;
                  return (
                    <button
                      key={token}
                      type="button"
                      title={token}
                      onClick={() => setForm((p) => ({ ...p, color: coercePermissionRoleColorToken(token) }))}
                      className="h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                      style={{
                        background: c,
                        boxShadow: selected
                          ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${c}`
                          : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Dynamic permissions matrix */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>مصفوفة الصلاحيات</Label>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-muted-foreground">تفعيل الكل</span>
                  <Switch checked={isAllPerms} onCheckedChange={toggleAll} />
                </div>
              </div>

              {availablePermissions.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                  لا توجد صلاحيات متاحة لهذا التطبيق
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <div className="min-w-[480px]">
                    {/* Header */}
                    <div
                      className="grid border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                      style={{ gridTemplateColumns: `1fr repeat(${actionIds.length}, 52px) 56px` }}
                    >
                      <div className="px-4 py-2.5">المورد</div>
                      {actionIds.map((a) => (
                        <div key={a} className="py-2.5 text-center">{ACTION_AR[a] ?? a}</div>
                      ))}
                      <div className="py-2.5 text-center">الكل</div>
                    </div>

                    {/* Rows */}
                    {resources.map((res, i) => {
                      const resourceIds = Object.values(matrix[res] ?? {});
                      const resAllGranted = resourceIds.length > 0 && resourceIds.every((id) => selectedSet.has(id));
                      return (
                        <div
                          key={res}
                          className={cn(
                            'grid items-center transition-colors',
                            i !== resources.length - 1 && 'border-b border-border/60',
                            resAllGranted ? 'bg-success/5' : 'hover:bg-muted/20',
                          )}
                          style={{ gridTemplateColumns: `1fr repeat(${actionIds.length}, 52px) 56px` }}
                        >
                          <div className="px-4 py-3">
                            <span className="text-sm font-medium">
                              {RESOURCE_AR[res] ?? res}
                            </span>
                            <code className="mr-2 text-[10px] text-muted-foreground font-mono">{res}</code>
                          </div>
                          {actionIds.map((action) => {
                            const permId = matrix[res]?.[action];
                            const granted = !!permId && selectedSet.has(permId);
                            return (
                              <div key={action} className="flex justify-center py-3">
                                {permId ? (
                                  <button
                                    type="button"
                                    title={ACTION_AR[action] ?? action}
                                    onClick={() => togglePerm(permId)}
                                    className={cn(
                                      'flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-150',
                                      granted
                                        ? 'border-primary bg-primary'
                                        : 'border-border/60 bg-background hover:border-primary/50',
                                    )}
                                  >
                                    {granted && <Check className="h-3 w-3 text-primary-foreground" />}
                                  </button>
                                ) : (
                                  <span className="h-5 w-5 rounded-md border border-dashed border-border/30" />
                                )}
                              </div>
                            );
                          })}
                          <div className="flex justify-center py-3">
                            <Switch
                              checked={resAllGranted}
                              onCheckedChange={() => toggleResource(res)}
                              className="origin-center scale-75"
                              disabled={resourceIds.length === 0}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                <span className="text-muted-foreground">الصلاحيات المفعّلة</span>
                <div className="flex items-center gap-1.5">
                  <span className="number-ar font-bold text-foreground">{form.permissionIds.length}</span>
                  <span className="text-muted-foreground">من</span>
                  <span className="number-ar text-muted-foreground">{allIds.length}</span>
                  <div className="mr-2 h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: allIds.length ? `${Math.round((form.permissionIds.length / allIds.length) * 100)}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlidePanelContent>
    </SlidePanel>
  );
}
