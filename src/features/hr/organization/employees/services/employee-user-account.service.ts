import {
  employeesApi,
  type CreateEmployeeUserAccountDto,
  type EmployeeResponseDto,
} from '@/features/hr/organization/employees/lib/api/employees';

export async function createEmployeeUserAccount(
  payload: CreateEmployeeUserAccountDto,
): Promise<EmployeeResponseDto> {
  return employeesApi.createUserAccount(payload);
}

export function resolveCreatedUserId(response: EmployeeResponseDto): string | null {
  return response.userId ?? response.user?.id ?? null;
}
