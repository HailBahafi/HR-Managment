'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { companiesApi } from '@/features/hr/organization/lib/api/companies';

export function useActiveCompany() {
  const companyId = useAuthStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companiesApi.getById(companyId!),
    enabled: !!companyId,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
