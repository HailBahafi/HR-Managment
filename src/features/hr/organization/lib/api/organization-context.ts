import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { companiesApi } from '@/features/hr/organization/lib/api/companies';

export type OrganizationScope = {
  companyId: string | null;
  branchId: string | null;
};

/** Resolves company/branch ids for create flows (not only from existing rows). */
export async function resolveOrganizationScope(
  hints?: Partial<OrganizationScope>,
): Promise<OrganizationScope> {
  const companyId = hints?.companyId ?? null;
  const branchId = hints?.branchId ?? null;

  if (companyId && branchId) {
    return { companyId, branchId };
  }

  const companies = await companiesApi.getAll({ limit: 50 });
  const resolvedCompanyId = companyId ?? companies.items[0]?.id ?? null;
  if (!resolvedCompanyId) {
    return { companyId: null, branchId: null };
  }

  if (branchId) {
    return { companyId: resolvedCompanyId, branchId };
  }

  const branches = await branchesApi.getAll({ companyId: resolvedCompanyId, limit: 50 });
  return {
    companyId: resolvedCompanyId,
    branchId: branches.items[0]?.id ?? null,
  };
}
