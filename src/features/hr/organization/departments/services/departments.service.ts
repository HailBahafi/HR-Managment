import {
  departmentsApi,
  type CreateDepartmentDto,
  type DepartmentResponseDto,
  type UpdateDepartmentDto,
} from '@/features/hr/organization/lib/api/departments';
import { resolveOrganizationScope, type OrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { mapDepartmentResponse, type DepartmentRecord } from '@/features/hr/organization/departments/constants/departments-directory';

export type DepartmentsDirectoryData = {
  departments: DepartmentRecord[];
  scope: OrganizationScope;
};

export async function loadDepartmentsDirectory(filters?: { isActive?: boolean }): Promise<DepartmentsDirectoryData> {
  const query: Parameters<typeof departmentsApi.getAll>[0] = {};
  if (filters?.isActive !== undefined) query.isActive = filters.isActive;

  const res = await departmentsApi.getAll(query);
  const scope = await resolveOrganizationScope({
    companyId: res.items[0]?.companyId,
    branchId: res.items[0]?.branchId,
  });

  return {
    departments: res.items.map(mapDepartmentResponse),
    scope: {
      companyId: scope.companyId ?? res.items[0]?.companyId ?? null,
      branchId: scope.branchId ?? res.items[0]?.branchId ?? null,
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
