'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useApplicationId } from '@/features/hr/permissions/hooks/useApplicationId';
import {
  createRoleWithPermissions,
  updateRoleWithPermissions,
  deleteRoleById,
} from '@/features/hr/permissions/services/roles.service';

export type SaveRoleInput = {
  name: string;
  description: string;
  permissionIds: string[];
};

export type UpdateRoleInput = SaveRoleInput & { roleId: string };

export function useRolesMutations() {
  const queryClient = useQueryClient();
  const companyId = useAuthStore((s) => s.activeCompanyId) ?? '';
  const applicationId = useApplicationId();

  function invalidateRoles() {
    void queryClient.invalidateQueries({ queryKey: ['roles'] });
  }

  const create = useMutation({
    mutationFn: ({ name, description, permissionIds }: SaveRoleInput) =>
      createRoleWithPermissions({ name, description, permissionIds, companyId, applicationId }),
    onSuccess: invalidateRoles,
    onError: (err) => { handleApiError(err, 'roles.create'); },
  });

  const update = useMutation({
    mutationFn: ({ roleId, name, description, permissionIds }: UpdateRoleInput) =>
      updateRoleWithPermissions(roleId, { name, description, permissionIds }),
    onSuccess: invalidateRoles,
    onError: (err) => { handleApiError(err, 'roles.update'); },
  });

  const remove = useMutation({
    mutationFn: (roleId: string) => deleteRoleById(roleId),
    onSuccess: invalidateRoles,
    onError: (err) => { handleApiError(err, 'roles.delete'); },
  });

  return { create, update, remove };
}
