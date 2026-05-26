'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';

export function useCurrentEmployee() {
  const userId = useAuthStore((s) => s.user?.id);
  const companyId = useAuthStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['current-employee', userId, companyId],
    queryFn: async () => {
      const result = await employeesApi.getAll({ userId, companyId: companyId ?? undefined, limit: 1 });
      return result.items[0] ?? null;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
}
