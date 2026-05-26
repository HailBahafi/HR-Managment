'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { rolesApi } from '@/features/hr/permissions/lib/api/roles';

export function useRoles() {
  const companyId = useAuthStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['roles', companyId],
    queryFn: () => rolesApi.getAll({ companyId: companyId ?? undefined, limit: 200 }),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
