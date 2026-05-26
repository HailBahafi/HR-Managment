'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useRoles } from '@/features/hr/permissions/hooks/useRoles';
import {
  effectiveAssignedRoleId,
  inferAssignedRoleId,
  permissionsForRole,
  type SystemRoleRecord,
} from '@/features/hr/organization/employees/lib/employee-access-role';
import { appendEmployeeAudit } from '@/features/hr/organization/employees/lib/employee-audit-log/append';
import type { Employee } from '@/features/hr/organization/employees/types';

export function useEmployeeProfilePermissions(employee: Employee) {
  const { data: rolesResult } = useRoles();
  const systemRoles = React.useMemo(
    () => (rolesResult?.items ?? []) as unknown as SystemRoleRecord[],
    [rolesResult],
  );
  const [permissionRoleDraft, setPermissionRoleDraft] = React.useState<string>(() =>
    effectiveAssignedRoleId(employee),
  );
  React.useEffect(() => {
    setPermissionRoleDraft(effectiveAssignedRoleId(employee));
  }, [employee.id, employee.assignedRoleId, employee.role]);

  const selectedSystemRole = React.useMemo(
    () => systemRoles.find((r) => r.id === permissionRoleDraft),
    [systemRoles, permissionRoleDraft],
  );
  const resolvedPermissions = React.useMemo(
    () => permissionsForRole(permissionRoleDraft, systemRoles),
    [permissionRoleDraft, systemRoles],
  );

  const savedRoleId = employee.assignedRoleId ?? inferAssignedRoleId(employee.role);
  const permissionDirty = permissionRoleDraft !== savedRoleId;

  const handleSaveEmployeeRole = React.useCallback(() => {
    const prevSaved = employee.assignedRoleId ?? inferAssignedRoleId(employee.role);
    const oldId = prevSaved;
    const newId = permissionRoleDraft;
    const oldName = systemRoles.find((r) => r.id === oldId)?.name ?? oldId;
    const newName = systemRoles.find((r) => r.id === newId)?.name ?? newId;
    if (oldId !== newId) {
      appendEmployeeAudit(employee.id, [
        {
          action: 'update',
          scope: 'permissions',
          fieldKey: 'assignedRoleId',
          labelAr: 'الدور المعيّن في النظام',
          oldValue: oldName,
          newValue: newName,
        },
      ]);
    }
    toast.success('تم حفظ دور الموظف والصلاحيات المرتبطة به');
  }, [employee, permissionRoleDraft, systemRoles]);

  return {
    systemRoles,
    permissionRoleDraft,
    setPermissionRoleDraft,
    selectedSystemRole,
    resolvedPermissions,
    permissionDirty,
    handleSaveEmployeeRole,
  };
}
