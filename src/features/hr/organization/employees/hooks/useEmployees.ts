'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';

export function useEmployees() {
  const companyId = useAuthStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['employees', companyId],
    queryFn: () => employeesApi.getAll({ companyId: companyId ?? undefined, limit: 500 }),

    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
