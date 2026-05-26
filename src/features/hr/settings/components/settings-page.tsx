'use client';

import { Shield, Users, Building2, Clock, Plus, Edit, Trash2, Check } from 'lucide-react';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRoles } from '@/features/hr/permissions/hooks/useRoles';
import { cn } from '@/shared/utils';
import {
  coercePermissionRoleColorToken,
  permissionRoleCssColor,
  permissionRoleSurface,
} from '@/features/hr/permissions/constants/role-colors';

const resources = [
  { id: 'employees', label: 'الموظفين', icon: Users },
  { id: 'attendance', label: 'الحضور', icon: Clock },
  { id: 'requests', label: 'الطلبات', icon: Shield },
  { id: 'payroll', label: 'الرواتب', icon: Building2 },
  { id: 'settings', label: 'الإعدادات', icon: Shield },
];

const actions = ['view', 'create', 'edit', 'delete', 'approve'] as const;
const actionLabels: Record<string, string> = { view: 'عرض', create: 'إنشاء', edit: 'تعديل', delete: 'حذف', approve: 'موافقة' };

export function SettingsPage() {
  useSetPageTitle({ titleAr: 'إعدادات النظام', descriptionAr: 'الأدوار والصلاحيات', iconName: 'Settings' });

  const { data: rolesResult } = useRoles();
  const roles = rolesResult?.items ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">الأدوار والصلاحيات</h1>
        <p className="mt-1 text-sm text-muted-foreground">إدارة أدوار المستخدمين ومصفوفة الصلاحيات على الموارد</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="number-ar font-semibold text-foreground">{roles.length}</span> أدوار مُعرّفة
        </p>
        <Button variant="luxe" className="gap-2">
          <Plus className="h-4 w-4" />
          دور جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const colorToken = coercePermissionRoleColorToken('primary');
          const accent = permissionRoleCssColor(colorToken);
          const accentGlow = permissionRoleSurface(colorToken, 0.18);
          const accentIconBg = permissionRoleSurface(colorToken, 0.14);
          return (
          <div
            key={role.id}
            className="relative overflow-hidden rounded-lg border border-border bg-card p-5 shadow-soft"
            style={{ borderTop: `4px solid ${accent}` }}
          >
            <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full blur-3xl" style={{ background: accentGlow }} />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-md" style={{ background: accentIconBg, color: accent }}>
                  <Shield className="h-5 w-5" />
                </div>
                <Badge variant="subtle" className="text-[10px] number-ar">دور</Badge>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{role.name}</h3>
              <p className="mt-1 min-h-[40px] text-xs leading-relaxed text-muted-foreground">{role.description}</p>
              <div className="mt-4 flex flex-wrap gap-1">
                {role.description ? (
                  <p className="text-xs text-muted-foreground line-clamp-2">{role.description}</p>
                ) : null}
              </div>
              <div className="mt-4 flex gap-2 border-t border-border pt-3">
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <Edit className="h-3 w-3" /> تعديل
                </Button>
                <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-card shadow-soft">
        <div className="border-b border-border p-5">
          <h3 className="font-display text-lg font-bold">مصفوفة الصلاحيات</h3>
          <p className="text-xs text-muted-foreground">صلاحيات كل دور على الموارد المختلفة</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 text-right">المورد</th>
                {roles.map((r) => (
                  <th key={r.id} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ background: permissionRoleCssColor(coercePermissionRoleColorToken('primary')) }}
                      />
                      <span>{r.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map((res, resIdx) => (
                <tr key={res.id} className="border-b border-border/60 last:border-b-0">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <res.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{res.label}</span>
                    </div>
                  </td>
                  {roles.map((role, roleIdx) => {
                    const intensity = Math.max(0, 5 - Math.abs(resIdx - roleIdx)) / 5;
                    const hasAll = false;
                    return (
                      <td key={role.id} className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          {actions.map((action) => {
                            const granted = hasAll || (intensity > 0.3 && Math.random() > 0.3);
                            return (
                              <div
                                key={action}
                                title={actionLabels[action]}
                                className={cn(
                                  'h-5 w-5 rounded transition-all',
                                  granted ? 'bg-success/80' : 'bg-muted'
                                )}
                              >
                                {granted && <Check className="m-0.5 h-3 w-3 text-white" />}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-border bg-muted/20 p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-success/80" />
            <span>ممنوح</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-muted" />
            <span>غير ممنوح</span>
          </div>
          <span className="mr-auto">الأعمدة من اليمين: عرض · إنشاء · تعديل · حذف · موافقة</span>
        </div>
      </div>
    </div>
  );
}
