import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  employeesApi,
  type CreateEmployeeUserAccountDto,
  type EmployeeResponseDto,
} from '@/features/hr/organization/employees/lib/api/employees';
import { resolveEmployeeCompanyId } from '@/features/hr/organization/employees/services/employee-company.service';
import {
  linkedCompanyIdSet,
  pickLinkedCompanyId,
} from '@/features/hr/organization/employees/utils/resolve-linked-company-id';

export async function resolveEmployeeUserAccountCompanyId(employeeId: string): Promise<string> {
  const { activeCompanyId, accessProfile } = useAuthStore.getState();
  const linked = linkedCompanyIdSet(accessProfile?.companies.map((c) => c.companyId) ?? []);

  let assignmentCompanyId: string | null = null;
  try {
    assignmentCompanyId = await resolveEmployeeCompanyId(employeeId);
  } catch {
    assignmentCompanyId = null;
  }

  if (assignmentCompanyId && !linked.has(assignmentCompanyId)) {
    throw new Error(
      'الموظف معيّن لشركة لا يمكنك إدارتها — غيّر الشركة النشطة من القائمة العلوية',
    );
  }

  const resolved = pickLinkedCompanyId(
    [
      assignmentCompanyId,
      activeCompanyId,
      accessProfile?.defaultCompanyId,
      accessProfile?.companies[0]?.companyId,
    ],
    linked,
  );

  if (!resolved) {
    throw new Error(
      'لا توجد شركة مرتبطة بحسابك — سجّل الخروج وأعد الدخول أو راجع صلاحياتك مع المسؤول',
    );
  }

  return resolved;
}

export async function createEmployeeUserAccount(
  payload: CreateEmployeeUserAccountDto,
): Promise<EmployeeResponseDto> {
  return employeesApi.createUserAccount(payload);
}

export function resolveCreatedUserId(response: EmployeeResponseDto): string | null {
  return response.userId ?? response.user?.id ?? null;
}
