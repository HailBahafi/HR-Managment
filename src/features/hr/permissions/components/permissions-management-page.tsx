'use client';

import * as React from 'react';
import {
  Shield, Plus, Edit2, Trash2, AlertTriangle, Check,
} from 'lucide-react';
import { useSetPageTitle } from '@/components/page-title-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SlidePanel, SlidePanelContent } from '@/components/ui/slide-panel';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { data } from '@/lib/data';
import { cn } from '@/lib/utils';
import { PERMISSION_RESOURCES, PERMISSION_ACTIONS, PERMISSION_MATRIX_TOTAL } from '@/features/hr/permissions/constants/permission-matrix';
import {
  PERMISSION_ROLE_COLOR_TOKENS,
  coercePermissionRoleColorToken,
  permissionRoleCssColor,
  permissionRoleSurface,
} from '@/features/hr/permissions/constants/role-colors';
import type { PermissionRole } from '@/features/hr/permissions/types';
import {
  hasPermission,
  countGrantedPermissions,
  expandAllPermissionKeys,
} from '@/features/hr/permissions/utils/permission-matrix';

const BLANK: Omit<PermissionRole, 'id'> = {
  name: '',
  description: '',
  usersCount: 0,
  permissions: [],
  color: 'primary',
};

export function PermissionsManagementPage() {
  useSetPageTitle({ titleAr: 'إدارة الصلاحيات', descriptionAr: 'الأدوار والصلاحيات', iconName: 'Shield' });

  const [roles, setRoles] = React.useState<PermissionRole[]>(() =>
    (data.roles as unknown as PermissionRole[]).map((r) => ({
      ...r,
      color: coercePermissionRoleColorToken(String(r.color)),
    })),
  );
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<PermissionRole | null>(null);
  const [form, setForm] = React.useState<Omit<PermissionRole, 'id'>>(BLANK);
  const [deleteTarget, setDeleteTarget] = React.useState<PermissionRole | null>(null);

  function openCreate() {
    setEditingRole(null);
    setForm(BLANK);
    setPanelOpen(true);
  }

  function openEdit(role: PermissionRole) {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description,
      usersCount: role.usersCount,
      permissions: [...role.permissions],
      color: role.color,
    });
    setPanelOpen(true);
  }

  function togglePerm(resource: string, action: string) {
    const key = `${resource}.${action}`;
    setForm((prev) => {
      const perms = prev.permissions.includes('all')
        ? expandAllPermissionKeys()
        : [...prev.permissions];
      return {
        ...prev,
        permissions: perms.includes(key) ? perms.filter((p) => p !== key) : [...perms, key],
      };
    });
  }

  function toggleResource(resource: string) {
    const allGranted = PERMISSION_ACTIONS.every((a) =>
      hasPermission(form.permissions, resource, a.id),
    );
    setForm((prev) => {
      let perms = prev.permissions.includes('all')
        ? expandAllPermissionKeys()
        : [...prev.permissions];
      if (allGranted) {
        perms = perms.filter((p) => !p.startsWith(`${resource}.`));
      } else {
        PERMISSION_ACTIONS.forEach((a) => {
          const k = `${resource}.${a.id}`;
          if (!perms.includes(k)) perms.push(k);
        });
      }
      return { ...prev, permissions: perms };
    });
  }

  function toggleSuperAdmin() {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes('all') ? [] : ['all'],
    }));
  }

  function saveRole() {
    if (!form.name.trim()) return;
    if (editingRole) {
      setRoles((prev) => prev.map((r) => (r.id === editingRole.id ? { ...r, ...form } : r)));
    } else {
      setRoles((prev) => [...prev, { ...form, id: `r${Date.now()}` }]);
    }
    setPanelOpen(false);
  }

  function confirmDelete(id: string) {
    setRoles((prev) => prev.filter((r) => r.id !== id));
    setDeleteTarget(null);
  }

  const isAllPerms = form.permissions.includes('all');
  const activePerms = isAllPerms ? PERMISSION_MATRIX_TOTAL : countGrantedPermissions(form.permissions);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">إدارة الصلاحيات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            أنشئ الأدوار وحدد الصلاحيات على كل مورد من موارد النظام
          </p>
        </div>
        <Button variant="luxe" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> إضافة دور
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const pct = Math.round(
            (countGrantedPermissions(role.permissions) / PERMISSION_MATRIX_TOTAL) * 100,
          );
          const accent = permissionRoleCssColor(role.color);
          const accentSoft = permissionRoleSurface(role.color, 0.08);
          const accentIconBg = permissionRoleSurface(role.color, 0.12);
          return (
            <div
              key={role.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-shadow hover:shadow-md"
              style={{ borderTop: `3px solid ${accent}` }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  background: `linear-gradient(135deg, ${accentSoft} 0%, transparent 55%)`,
                }}
              />
              <div className="relative p-5">
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: accentIconBg, color: accent }}
                  >
                    <Shield className="h-5 w-5" />
                  </div>
                  <Badge variant="subtle" className="number-ar text-[10px]">
                    {role.usersCount} مستخدم
                  </Badge>
                </div>

                <h3 className="mt-3 font-display text-base font-bold">{role.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {role.description}
                </p>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>الصلاحيات المفعّلة</span>
                    <span className="number-ar font-semibold" style={{ color: accent }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: accent }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2 border-t border-border pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => openEdit(role)}
                  >
                    <Edit2 className="h-3 w-3" /> تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(role)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={openCreate}
          className="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/50 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">
            إضافة دور جديد
          </span>
        </button>
      </div>

      <SlidePanel open={panelOpen} onOpenChange={setPanelOpen}>
        <SlidePanelContent
          size="xl"
          title={editingRole ? `تعديل: ${editingRole.name}` : 'دور جديد'}
          description="حدد اسم الدور ومستويات الوصول على موارد النظام"
          footer={
            <div className="flex gap-2">
              <Button variant="luxe" className="flex-1" onClick={saveRole} disabled={!form.name.trim()}>
                <Check className="h-4 w-4" /> حفظ التغييرات
              </Button>
              <Button variant="outline" onClick={() => setPanelOpen(false)}>إلغاء</Button>
            </div>
          }
        >
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
                      onClick={() => setForm((p) => ({ ...p, color: token }))}
                      className="h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                      style={{
                        background: c,
                        boxShadow: selected ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${c}` : undefined,
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ background: permissionRoleCssColor(form.color) }}
                />
                <span className="text-xs text-muted-foreground">اللون المختار</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>مصفوفة الصلاحيات</Label>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-muted-foreground">مدير النظام (كل الصلاحيات)</span>
                  <Switch checked={isAllPerms} onCheckedChange={toggleSuperAdmin} />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <div className="min-w-[480px]">
                  <div
                    className="grid border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                    style={{ gridTemplateColumns: '1fr repeat(5, 52px) 56px' }}
                  >
                    <div className="px-4 py-2.5">المورد</div>
                    {PERMISSION_ACTIONS.map((a) => (
                      <div key={a.id} className="py-2.5 text-center">{a.label}</div>
                    ))}
                    <div className="py-2.5 text-center">الكل</div>
                  </div>

                  {PERMISSION_RESOURCES.map((res, i) => {
                    const resAllGranted = PERMISSION_ACTIONS.every((a) =>
                      hasPermission(form.permissions, res.id, a.id),
                    );
                    return (
                      <div
                        key={res.id}
                        className={cn(
                          'grid items-center transition-colors',
                          i !== PERMISSION_RESOURCES.length - 1 && 'border-b border-border/60',
                          resAllGranted ? 'bg-success/5' : 'hover:bg-muted/20',
                        )}
                        style={{ gridTemplateColumns: '1fr repeat(5, 52px) 56px' }}
                      >
                        <div className="flex items-center gap-2 px-4 py-3">
                          <res.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{res.label}</span>
                        </div>

                        {PERMISSION_ACTIONS.map((action) => {
                          const granted = hasPermission(form.permissions, res.id, action.id);
                          return (
                            <div key={action.id} className="flex justify-center py-3">
                              <button
                                type="button"
                                title={action.label}
                                onClick={() => togglePerm(res.id, action.id)}
                                className={cn(
                                  'h-5 w-5 rounded-md border-2 transition-all duration-150 flex items-center justify-center',
                                  granted
                                    ? 'border-primary bg-primary'
                                    : 'border-border/60 bg-background hover:border-primary/50',
                                )}
                              >
                                {granted && (
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                )}
                              </button>
                            </div>
                          );
                        })}

                        <div className="flex justify-center py-3">
                          <Switch
                            checked={resAllGranted}
                            onCheckedChange={() => toggleResource(res.id)}
                            className="scale-75 origin-center"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                <span className="text-muted-foreground">الصلاحيات المفعّلة</span>
                <div className="flex items-center gap-1.5">
                  <span className="number-ar font-bold text-foreground">{activePerms}</span>
                  <span className="text-muted-foreground">من</span>
                  <span className="number-ar text-muted-foreground">{PERMISSION_MATRIX_TOTAL}</span>
                  <div className="mr-2 h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.round((activePerms / PERMISSION_MATRIX_TOTAL) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SlidePanelContent>
      </SlidePanel>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> حذف الدور
            </DialogTitle>
            <DialogDescription className="pt-1 leading-relaxed">
              هل أنت متأكد من حذف دور{' '}
              <span className="font-semibold text-foreground">&quot;{deleteTarget?.name}&quot;</span>؟ سيفقد{' '}
              <span className="number-ar font-semibold text-foreground">
                {deleteTarget?.usersCount}
              </span>{' '}
              مستخدم صلاحياتهم. لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && confirmDelete(deleteTarget.id)}
            >
              <Trash2 className="h-4 w-4" /> حذف الدور
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
