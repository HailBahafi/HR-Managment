'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getConfiguredRecruitmentTenantId,
  RECRUITMENT_DEMO_TENANT_ID,
  RECRUITMENT_DEMO_TENANT_SLUG,
} from '@/features/hr/recruitment/lib/api/recruitment-constants';
import { recruitmentTenantsApi } from '@/features/hr/recruitment/lib/api/recruitment';
import { recruitmentKeys } from '@/features/hr/recruitment/hooks/recruitment-query-keys';

/**
 * Resolves recruitment `tenantId` for API calls:
 * 1. NEXT_PUBLIC_RECRUITMENT_TENANT_ID
 * 2. GET /recruitment/tenants/by-slug/demo-recruitment
 * 3. hardcoded demo seed id
 */
export function useRecruitmentTenantId(): string | null {
  const configured = getConfiguredRecruitmentTenantId();

  const { data: resolved } = useQuery({
    queryKey: recruitmentKeys.tenantId(),
    queryFn: async () => {
      try {
        const tenant = await recruitmentTenantsApi.getBySlug(RECRUITMENT_DEMO_TENANT_SLUG);
        return tenant.id;
      } catch {
        return RECRUITMENT_DEMO_TENANT_ID;
      }
    },
    enabled: !configured,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return configured ?? resolved ?? null;
}
