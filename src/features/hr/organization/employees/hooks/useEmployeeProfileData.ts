'use client';

import * as React from 'react';
import { useEmployeeProfileAttendance } from '@/features/hr/organization/employees/hooks/useEmployeeProfileAttendance';
import { violationRecordsApi, type ViolationRecordResponseDto } from '@/features/hr/discipline/lib/api/violation-records';
import { leaveRequestsApi, type LeaveRequestResponseDto } from '@/features/hr/leaves/lib/api/leave-requests';
import { employeeContractsApi } from '@/features/hr/contracts/lib/contracts-api';
import type { HRContractRecord } from '@/features/hr/contracts/lib/contracts-store';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import type { Employee } from '@/features/hr/organization/employees/types';
import type { AttendanceCheckInPoint, AttendanceCheckInPointLink } from '@/features/hr/attendance/lib/types';
import { payslipsApi } from '@/features/hr/payroll/lib/api/payslips';
import type { Payslip } from '@/features/hr/payroll/types';
import { PAYSLIP_MONTHS_AR } from '@/features/hr/payroll/lib/employee-payslip-series';

export type { ViolationRecordResponseDto, LeaveRequestResponseDto };

export function useEmployeeProfileData(employee: Employee) {
  const [violations, setViolations] = React.useState<ViolationRecordResponseDto[]>([]);
  const [leaveRequests, setLeaveRequests] = React.useState<LeaveRequestResponseDto[]>([]);
  const [employeeContracts, setEmployeeContracts] = React.useState<HRContractRecord[]>([]);
  const [employeePayslipSeries, setEmployeePayslipSeries] = React.useState<Payslip[]>([]);
  const [activityLogCount] = React.useState(0);
  const [roseFormsCount] = React.useState(0);

  React.useEffect(() => {
    if (!employee.id) return;
    const companyId = useAuthStore.getState().activeCompanyId;
    void (async () => {
      try {
        const [vRes, lRes, cRes, psRes] = await Promise.all([
          violationRecordsApi.getAll({ employeeId: employee.id, limit: 100 }),
          leaveRequestsApi.getAll({ employeeId: employee.id, limit: 100 }),
          companyId
            ? employeeContractsApi.list({ companyId, employeeId: employee.id, limit: 100 })
            : Promise.resolve({ items: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
          companyId
            ? payslipsApi.list({ companyId, employeeId: employee.id, limit: 200 })
            : Promise.resolve({ items: [], total: 0, page: 1, limit: 200 }),
        ]);
        setViolations(vRes.items);
        setLeaveRequests(lRes.items);
        setEmployeePayslipSeries(psRes.items.map(p => ({
          id: p.id,
          employeeId: p.employeeId,
          month: p.periodMonth != null ? PAYSLIP_MONTHS_AR[(p.periodMonth - 1) % 12] ?? '' : '',
          year: p.periodYear ?? 0,
          baseSalary: parseFloat(p.baseSalary) || 0,
          housing: 0,
          transport: 0,
          otherAllowances: parseFloat(p.allowancesTotal) || 0,
          overtime: parseFloat(p.additionsTotal) || 0,
          gosi: parseFloat(p.gosi) || 0,
          absenceDeduction: 0,
          latenessDeduction: 0,
          loanDeduction: 0,
          otherDeductions: parseFloat(p.deductionsTotal) || 0,
          gross: parseFloat(p.gross) || 0,
          net: parseFloat(p.net) || 0,
          workingDays: p.workingDays ?? 0,
          presentDays: p.presentDays ?? 0,
          absentDays: p.absentDays ?? 0,
          lateDays: p.lateDays ?? 0,
        })));
        setEmployeeContracts(cRes.items.map(c => ({
          id: c.id,
          employeeId: c.employeeId,
          employeeNameAr: c.employeeNameAr ?? '',
          branchNameAr: c.branchNameAr ?? '',
          contractNumber: c.contractNumber,
          contractType: c.contractNature as HRContractRecord['contractType'],
          workArrangement: c.workArrangement as HRContractRecord['workArrangement'],
          startDate: c.startDate,
          endDate: c.endDate ?? '',
          probationDays: c.probationDays ?? null,
          baseSalary: Number(c.baseSalary) || 0,
          currency: c.currency,
          status: c.status as HRContractRecord['status'],
          templateId: c.contractTemplateId ?? null,
          allowanceLines: (c.allowanceLines ?? []).map(l => ({
            allowanceTypeId: l.allowanceTypeId,
            amount: Number(l.amount) || 0,
          })),
          allowancesNote: c.allowancesNote ?? '',
          deductionsNote: c.deductionsNote ?? '',
          amendsContractId: c.amendsContractId ?? null,
          supersededByContractId: c.supersededByContractId ?? null,
          earlyTerminationReason: c.earlyTerminationReason ?? null,
          articleIds: (c.articles ?? []).map(a => a.contractArticleId),
          annualLeaveDays: c.annualLeaveDays ?? null,
          updatedAt: c.updatedAt,
        })));
      } catch {
        // silently ignore — sections show empty state
      }
    })();
  }, [employee.id]);

  const attendance = useEmployeeProfileAttendance(employee);

  // Map real ShiftAssignmentResponseDto → shape the attendance section UI expects
  const employeeAssignments = React.useMemo(
    () =>
      attendance.shiftAssignments.map((a) => ({
        id: a.id,
        templateId: a.shiftTemplateId,
        openShiftHours: a.openShiftHours ?? undefined,
        targetType: 'employee' as const,
        targetId: a.employeeId,
        targetLabel: employee.name,
        effectiveFrom: a.effectiveFrom,
        batchId: a.batchId ?? undefined,
      })),
    [attendance.shiftAssignments, employee.name],
  );

  // Map real ShiftTemplateResponseDto → shape the attendance dialogs expect
  const shiftTemplates = React.useMemo(
    () =>
      attendance.shiftTemplates.map((t) => ({
        id: t.id,
        nameAr: t.nameAr,
        nameEn: t.nameEn ?? '',
        colorHex: t.colorHex,
        effectiveFrom: t.effectiveFrom,
        isActive: t.isActive,
        weekDays: t.weekDays,
      })),
    [attendance.shiftTemplates],
  );

  // Map real DaySummaryResponseDto → shape the daily view expects
  const allEmployeeSummaries = React.useMemo(
    () =>
      attendance.daySummaries.map((s) => ({
        id: s.id,
        employeeId: s.employeeId,
        employeeName: s.employeeNameAr,
        date: s.workDate,
        templateId: s.shiftAssignmentId,
        status: s.status,
        lateMinutes: s.lateMinutes,
        earlyLeaveMinutes: s.earlyLeaveMinutes,
        overtimeMinutes: s.overtimeMinutes,
        workedMinutes: s.workedMinutes,
        notes: s.notes ?? undefined,
      })),
    [attendance.daySummaries],
  );

  // Map real AttendanceEventResponseDto → shape the UI expects
  const allEmployeeEvents = React.useMemo(
    () =>
      attendance.events.map((e) => ({
        id: e.id,
        employeeId: e.employeeId,
        employeeName: e.employeeNameAr,
        date: e.workDate,
        type: e.eventType as 'check_in' | 'check_out',
        at: e.occurredAt,
        source: (e.source ?? 'manual') as 'device' | 'manual' | 'gps',
      })),
    [attendance.events],
  );

  const employeeViolations = React.useMemo(
    () =>
      violations.map((v) => ({
        id: v.id,
        employeeId: v.employeeId,
        typeNameAr: v.violationTypeId,
        date: v.violationDate,
        description: v.description,
        status: v.status,
        notes: v.notes,
        typeHasDeduction: false,
        typeDeductionValue: 0,
        typeDeductionKind: 'amount' as const,
      })),
    [violations],
  );

  const employeeRequests = React.useMemo(
    () =>
      leaveRequests.map((r) => ({
        id: r.id,
        employeeId: r.employeeId,
        type: 'leave' as const,
        title: r.noteAr ?? 'طلب إجازة',
        status: r.status,
        submittedAt: r.createdAt,
        fromDate: r.startDate ?? undefined,
        toDate: r.endDate ?? undefined,
        requestNumber: undefined as string | undefined,
      })),
    [leaveRequests],
  );

  return {
    branch: null as { id: string; name: string } | null,
    department: null as { id: string; name: string } | null,
    manager: null as { id: string; name: string } | null,
    // attendance spread (still needed for dialog handlers)
    ...attendance,
    // overridden with mapped shapes
    allEmployeeEvents,
    allEmployeeSummaries,
    employeeAssignments,
    shiftTemplates,
    employeeSummaries: allEmployeeSummaries,
    employeeEvents: allEmployeeEvents,
    employeeCheckpoints: [] as AttendanceCheckInPointLink[],
    checkpoints: [] as AttendanceCheckInPoint[],
    violations,
    employeeViolations,
    employeeContracts,
    employeeRequests,
    employeePayslipSeries,
    roseFormsCount,
    activityLogCount,
  };
}
