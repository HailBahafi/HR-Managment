import {
  departmentsApi,
  type CreateDepartmentDto,
  type DepartmentResponseDto,
  type UpdateDepartmentDto,
} from '@/features/hr/organization/lib/api/departments';
import type { OrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { mapDepartmentResponse, type DepartmentRecord } from '@/features/hr/organization/departments/constants/departments-directory';

export type DepartmentsDirectoryData = {
  departments: DepartmentRecord[];
  scope: OrganizationScope;
};

export async function loadDepartmentsDirectory(filters: {
  companyId: string;
  isActive?: boolean;
  /** Pass `null` to load all branches for the company. */
  branchId?: string | null;
}): Promise<DepartmentsDirectoryData> {
  const branchId = filters.branchId ?? undefined;
  const query: Parameters<typeof departmentsApi.getAll>[0] = {
    companyId: filters.companyId,
    branchId,
  };
  if (filters.isActive !== undefined) query.isActive = filters.isActive;

  const res = await departmentsApi.getAll(query);

  return {
    departments: res.items.map(mapDepartmentResponse),
    scope: {
      companyId: filters.companyId,
      branchId: branchId ?? res.items[0]?.branchId ?? null,
    },
  };
}

export async function createDepartment(
  payload: CreateDepartmentDto,
): Promise<DepartmentResponseDto> {
  return departmentsApi.create(payload);
}

export async function updateDepartment(
  id: string,
  payload: UpdateDepartmentDto,
): Promise<DepartmentResponseDto> {
  return departmentsApi.update(id, payload);
}

export async function deleteDepartment(id: string): Promise<void> {
  return departmentsApi.remove(id);
}
