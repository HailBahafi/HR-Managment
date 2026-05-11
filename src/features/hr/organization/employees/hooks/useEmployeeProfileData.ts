'use client';

import * as React from 'react';
import { getEmployee, getBranch, getDepartment, data } from '@/lib/data';
import { withIds } from '@/lib/with-ids';
import { useAttendanceStore } from '@/lib/attendance/store';
import { useHRViolationCasesStore } from '@/lib/hr-discipline/violation-cases-store';
import { useHRContractsStore } from '@/lib/contracts/contracts-store';
import { useEmployeeRoseFormsStore } from '@/lib/employee-rose-forms/store';
import { useEmployeeAuditLogStore, EMPTY_EMPLOYEE_AUDIT_LOG } from '@/lib/employee-audit-log/store';
import { buildEmployeePayslipSeries } from '@/lib/payroll/employee-payslip-series';
import type { Employee } from '@/types';

export function useEmployeeProfileData(employee: Employee) {
  const branch = getBranch(employee.branchId);
  const department = getDepartment(employee.departmentId);
  const manager = employee.managerId ? getEmployee(employee.managerId) : null;

  const { events, daySummaries, checkpointLinks, checkpoints, assignments, shiftTemplates } = useAttendanceStore();
  const { cases: violationCases } = useHRViolationCasesStore();
  const { contracts } = useHRContractsStore();
  const hasHydrated = useEmployeeRoseFormsStore((s) => s.hasHydrated());
  const rawRoseFormsCount = useEmployeeRoseFormsStore((s) => s.totalCountFor(employee.id));
  // Avoid hydration mismatch by returning 0 until store is hydrated
  const roseFormsCount = hasHydrated ? rawRoseFormsCount : 0;
  const activityLogCount = useEmployeeAuditLogStore(
    (s) => (s.byEmployee[employee.id] ?? EMPTY_EMPLOYEE_AUDIT_LOG).length,
  );

  const allEmployeeEvents = events.filter((e) => e.employeeId === employee.id);
  const allEmployeeSummaries = daySummaries.filter((s) => s.employeeId === employee.id);
  const employeeCheckpoints = checkpointLinks.filter((c) => c.employeeId === employee.id);
  const employeeAssignments = assignments.filter((a) => a.targetType === 'employee' && a.targetId === employee.id);
  const employeeViolations = violationCases.filter((v) => v.employeeId === employee.id);
  const employeeContracts = contracts.filter((c) => c.employeeId === employee.id);
  const employeeRequests = withIds(data.requests).filter((r) => r.employeeId === employee.id);

  const employeePayslipSeries = React.useMemo(
    () => buildEmployeePayslipSeries(employee, data.payslips ?? []),
    [employee],
  );

  return {
    branch,
    department,
    manager,
    events,
    daySummaries,
    checkpointLinks,
    checkpoints,
    assignments,
    shiftTemplates,
    allEmployeeEvents,
    allEmployeeSummaries,
    employeeCheckpoints,
    employeeAssignments,
    employeeViolations,
    employeeContracts,
    employeeRequests,
    employeePayslipSeries,
    roseFormsCount,
    activityLogCount,
  };
}
