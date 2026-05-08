'use client';

import Link from 'next/link';
import { Check, Layers, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { permissionLabelAr } from '@/lib/employee-access-role';
import { Empty } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import { hrPermissionsHref } from '@/features/hr/permissions/constants/routes';
import {
  coercePermissionRoleColorToken,
  permissionRoleCssColor,
  permissionRoleSurface,
} from '@/features/hr/permissions/constants/role-colors';

export function EmployeePermissionsSection({ model }: { model: EmployeeProfileModel }) {
  const {
    employee,
    systemRoles,
    permissionRoleDraft,
    setPermissionRoleDraft,
    selectedSystemRole,
    resolvedPermissions,
    permissionDirty,
    handleSaveEmployeeRole,
  } = model;

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
        <div className="pointer-events-none absolute inset-0 dotted-bg opacity-30" aria-hidden />
        <div className="relative flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-inner-soft"
                style={(() => {
                  if (!selectedSystemRole?.color) return undefined;
                  const token = coercePermissionRoleColorToken(String(selectedSystemRole.color));
                  return {
                    borderColor: permissionRoleSurface(token, 0.35),
                    backgroundColor: permissionRoleSurface(token, 0.14),
                    color: permissionRoleCssColor(token),
                  };
                })()}
              >
                <Shield className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">صلاحيات الموظف</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-xl">
                  اربط الموظف بدور من أدوار النظام؛ تُعرض هنا الصلاحيات المعرّفة لهذا الدور كما في{' '}
                  <Link href={hrPermissionsHref()} className="font-medium text-primary underline-offset-4 hover:underline">
                    إدارة الصلاحيات
                  </Link>
                  .
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              className="shrink-0 gap-1.5"
              disabled={!permissionDirty}
              onClick={handleSaveEmployeeRole}
            >
              <Check className="h-3.5 w-3.5" />
              حفظ الدور
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employee-system-role" className="text-xs font-medium text-muted-foreground">
                الدور المعيّن
              </Label>
              <Select value={permissionRoleDraft} onValueChange={setPermissionRoleDraft}>
                <SelectTrigger id="employee-system-role" className="h-11 w-full rounded-xl border-border bg-background/90">
                  <SelectValue placeholder="اختر الدور…" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {systemRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: permissionRoleCssColor(
                              coercePermissionRoleColorToken(String(r.color)),
                            ),
                          }}
                          aria-hidden
                        />
                        {r.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSystemRole ? (
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                  {selectedSystemRole.description}
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                ملخص سريع
              </p>
              <p className="text-sm text-foreground">
                {resolvedPermissions.includes('all')
                  ? 'هذا الدور يمتلك صلاحيات كاملة على النظام.'
                  : `عدد قواعد الصلاحية لهذا الدور: ${resolvedPermissions.length}`}
              </p>
              {!employee.assignedRoleId ? (
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-2 leading-relaxed">
                  لم يُحفظ دور مخصص بعد؛ يُعرض افتراضياً وفق نوع الوظيفة الحالي حتى تضغط «حفظ الدور».
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft">
        <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary shrink-0" />
          الصلاحيات المرتبطة بالدور المختار
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          القائمة تتغيّر تلقائياً عند تغيير الدور في القائمة أعلاه.
        </p>
        {resolvedPermissions.length > 0 ? (
          <ul className="space-y-2 max-h-[min(52vh,520px)] overflow-y-auto overscroll-contain pr-1">
            {resolvedPermissions.map((key) => (
              <li
                key={key}
                className="flex flex-col gap-0.5 rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <span className="text-sm text-foreground leading-snug">{permissionLabelAr(key)}</span>
                <code className="text-[10px] text-muted-foreground font-mono text-left sm:max-w-[40%] sm:truncate" dir="ltr">
                  {key}
                </code>
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={Shield} text="لا توجد صلاحيات معرّفة لهذا الدور." />
        )}
      </div>
    </section>
  );
}
