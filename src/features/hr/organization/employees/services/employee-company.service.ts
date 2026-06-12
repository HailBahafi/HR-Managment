import { employeeAssignmentsApi } from '@/features/hr/organization/employees/lib/api/employee-assignments';

/** Company id from the employee's primary/active HR assignment. */
export async function resolveEmployeeCompanyId(employeeId: string): Promise<string> {
  const assignments = await employeeAssignmentsApi.getAll(employeeId);
  const list = Array.isArray(assignments) ? assignments : [];
  const primary =
    list.find((a) => a.isPrimary && a.status === 'active') ??
    list.find((a) => a.status === 'active') ??
    list[0];

  if (!primary?.companyId) {
    throw new Error('لا يوجد تعيين شركة نشط لهذا الموظف — أضف تعييناً قبل إدارة الصلاحيات');
  }

  return primary.companyId;
}
