import {
  branchesApi,
  type BranchResponseDto,
  type CreateBranchDto,
  type UpdateBranchDto,
} from '@/features/hr/organization/lib/api/branches';
import { resolveOrganizationScope, type OrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { mapBranchResponse, type BranchRow } from '@/features/hr/organization/branches/constants/branches-directory';

export type BranchesDirectoryData = {
  branches: BranchRow[];
  scope: OrganizationScope;
};

export async function loadBranchesDirectory(): Promise<BranchesDirectoryData> {
  const scope = await resolveOrganizationScope();
  const res = await branchesApi.getAll(scope.companyId ? { companyId: scope.companyId } : undefined);
  return {
    branches: res.items.map(mapBranchResponse),
    scope: {
      companyId: scope.companyId ?? res.items[0]?.companyId ?? null,
      branchId: scope.branchId,
    },
  };
}

export async function createBranch(payload: CreateBranchDto) {
  return branchesApi.create(payload);
}

export async function updateBranch(id: string, payload: UpdateBranchDto) {
  return branchesApi.update(id, payload);
}

export async function deleteBranch(id: string) {
  return branchesApi.remove(id);
}
