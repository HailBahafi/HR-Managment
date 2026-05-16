import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { companiesApi } from '@/features/hr/organization/lib/api/companies';
import { departmentsApi } from '@/features/hr/organization/lib/api/departments';
import type { BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import type { CompanyResponseDto } from '@/features/hr/organization/lib/api/companies';
import type { DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';

export type OrganizationChartData = {
  companies: CompanyResponseDto[];
  branches: BranchResponseDto[];
  departments: DepartmentResponseDto[];
};

export async function loadOrganizationChartData(): Promise<OrganizationChartData> {
  const [companiesRes, branchesRes, departmentsRes] = await Promise.all([
    companiesApi.getAll(),
    branchesApi.getAll(),
    departmentsApi.getAll(),
  ]);
  return {
    companies: companiesRes.items,
    branches: branchesRes.items,
    departments: departmentsRes.items,
  };
}
