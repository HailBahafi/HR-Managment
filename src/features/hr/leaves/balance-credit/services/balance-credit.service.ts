import {
  balanceCreditsApi,
  type BalanceCreditRequestResponseDto,
  type BalanceCreditStatus,
  type CreateBalanceCreditRequestDto,
} from '@/features/hr/leaves/balance-credit/lib/api/balance-credits';
import { employeeLeaveBalancesApi } from '@/features/hr/leaves/balance-credit/lib/api/employee-leave-balances';
import { leaveTypesApi } from '@/features/hr/leaves/leave-types/lib/api/leave-types';
import type {
  BalanceCreditEmployeeOption,
  BalanceCreditFilterOption,
  LeaveBalanceCreditRequest,
} from '@/features/hr/leaves/balance-credit/types';
import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { departmentsApi } from '@/features/hr/organization/lib/api/departments';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { toIso } from '@/features/hr/lib/map-dto';

export type LoadBalanceCreditParams = {
  employeeId?: string;
  status?: BalanceCreditStatus;
};

function mapBalanceCreditResponse(
  dto: BalanceCreditRequestResponseDto,
  employeeNames: Map<string, string>,
): LeaveBalanceCreditRequest {
  return {
    id: dto.id,
    employeeId: dto.employeeId,
    employeeNameAr: employeeNames.get(dto.employeeId) ?? dto.employeeId,
    daysAdded: dto.daysAdded,
    reasonAr: dto.reasonAr ?? '',
    status: dto.status,
    createdAt: toIso(dto.createdAt),
    decidedAt: dto.decidedAt ? toIso(dto.decidedAt) : undefined,
  };
}

export async function loadBalanceCreditDirectory(params?: LoadBalanceCreditParams) {
  const scope = await resolveOrganizationScope();
  const companyId = scope.companyId;

  const listQuery = companyId ? { companyId, limit: 500 } : { limit: 500 };

  const [creditsRes, typesRes, balancesRes, employeesRes, branchesRes, departmentsRes] =
    await Promise.all([
      balanceCreditsApi.getAll({ ...(companyId ? { companyId } : {}), limit: 200, ...(params?.employeeId ? { employeeId: params.employeeId } : {}), ...(params?.status ? { status: params.status } : {}) }),
      leaveTypesApi.getAll(companyId ? { companyId, limit: 50 } : { limit: 50 }),
      employeeLeaveBalancesApi.getAll(listQuery),
      employeesApi.getAll(listQuery),
      companyId ? branchesApi.getAll({ companyId, limit: 100 }) : branchesApi.getAll({ limit: 100 }),
      companyId ? departmentsApi.getAll({ companyId, limit: 200 }) : departmentsApi.getAll({ limit: 200 }),
    ]);

  const credits = ensurePaginatedResult(creditsRes);
  const types = ensurePaginatedResult(typesRes);
  const balances = ensurePaginatedResult(balancesRes);
  const employees = ensurePaginatedResult(employeesRes);
  const branches = ensurePaginatedResult(branchesRes);
  const departments = ensurePaginatedResult(departmentsRes);

  const employeeNames = new Map(
    employees.items.map((e) => [e.id, e.nameAr] as const),
  );

  const employeeOptions: BalanceCreditEmployeeOption[] = employees.items.map((e) => ({
    id: e.id,
    name: e.nameAr,
  }));

  const branchOptions: BalanceCreditFilterOption[] = [
    { value: 'all', label: 'جميع الفروع' },
    ...branches.items.map((b) => ({ value: b.id, label: b.nameAr })),
  ];

  const departmentOptions: BalanceCreditFilterOption[] = [
    { value: 'all', label: 'جميع الأقسام' },
    ...departments.items.map((d) => ({ value: d.id, label: d.nameAr })),
  ];

  const leaveTypes = types.items;
  const defaultLeaveTypeId =
    leaveTypes.find((t) => t.code === 'annual' && t.isActive)?.id ?? leaveTypes.find((t) => t.isActive)?.id ?? null;

  const balancesByEmployee: Record<string, { used: number; total: number }> = {};
  for (const row of balances.items) {
    const annualType = leaveTypes.find((t) => t.id === row.leaveTypeId && t.code === 'annual');
    const targetTypeId = annualType?.id ?? defaultLeaveTypeId;
    if (targetTypeId && row.leaveTypeId === targetTypeId) {
      balancesByEmployee[row.employeeId] = { used: row.usedDays, total: row.totalDays };
    }
  }

  return {
    companyId,
    leaveTypes,
    defaultLeaveTypeId,
    creditRequests: credits.items.map((row) => mapBalanceCreditResponse(row, employeeNames)),
    balancesByEmployee,
    employeeOptions,
    branchOptions,
    departmentOptions,
    employeeById: new Map(employeeOptions.map((e) => [e.id, e])),
  };
}

export async function createBalanceCreditRequest(payload: CreateBalanceCreditRequestDto) {
  return balanceCreditsApi.create(payload);
}

export async function approveBalanceCreditRequest(id: string) {
  return balanceCreditsApi.update(id, { status: 'approved' });
}

export async function rejectBalanceCreditRequest(id: string) {
  return balanceCreditsApi.update(id, { status: 'rejected' });
}

