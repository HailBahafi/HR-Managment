'use client';

import * as React from 'react';
import { useEmployeeProfileAttendance } from '@/features/hr/organization/employees/hooks/useEmployeeProfileAttendance';
import { violationRecordsApi, type ViolationRecordResponseDto } from '@/features/hr/discipline/lib/api/violation-records';
import { leaveRequestsApi, type LeaveRequestResponseDto } from '@/features/hr/leaves/lib/api/leave-requests';
import { employeeContractsApi } from '@/features/hr/contracts/lib/contracts-api';
import { mapEmployeeContractFromApi, type HRContractRecord } from '@/features/hr/contracts/lib/contracts-store';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import type { Employee } from '@/features/hr/organization/employees/types';
import type { AttendanceCheckInPoint, AttendanceCheckInPointLink } from '@/features/hr/attendance/lib/types';
import { payslipsApi } from '@/features/hr/payroll/lib/api/payslips';
import type { Payslip } from '@/features/hr/payroll/types';
const PAYSLIP_MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] as const;

export type { ViolationRecordResponseDto, LeaveRequestResponseDto };

const EMPTY_PAGINATION = { page: 1, limit: 100, total: 0, totalPages: 0 };

export function useEmployeeProfileData(employee: Employee) {
  const companyId = useAuthStore(s => s.activeCompanyId);
  const [violations, setViolations] = React.useState<ViolationRecordResponseDto[]>([]);
  const [leaveRequests, setLeaveRequests] = React.useState<LeaveRequestResponseDto[]>([]);
  const [employeeContracts, setEmployeeContracts] = React.useState<HRContractRecord[]>([]);
  const [employeePayslipSeries, setEmployeePayslipSeries] = React.useState<Payslip[]>([]);
  const [activityLogCount] = React.useState(0);
  const [roseFormsCount] = React.useState(0);

  React.useEffect(() => {
    if (!employee.id) return;
    let cancelled = false;

    void (async () => {
      const [vRes, lRes, cRes, psRes] = await Promise.allSettled([
        violationRecordsApi.getAll({ employeeId: employee.id, limit: 100 }),
        leaveRequestsApi.getAll({ employeeId: employee.id, limit: 100 }),
        companyId
          ? employeeContractsApi.list({ companyId, employeeId: employee.id, limit: 100 })
          : Promise.resolve({ items: [], pagination: EMPTY_PAGINATION }),
        companyId
          ? payslipsApi.list({ companyId, employeeId: employee.id, limit: 200 })
          : Promise.resolve({ items: [], pagination: { ...EMPTY_PAGINATION, limit: 200 } }),
      ]);

      if (cancelled) return;

      if (vRes.status === 'fulfilled') {
        setViolations(vRes.value.items);
      }
      if (lRes.status === 'fulfilled') {
        setLeaveRequests(lRes.value.items);
      }
      if (cRes.status === 'fulfilled') {
        setEmployeeContracts(cRes.value.items.map(mapEmployeeContractFromApi));
      } else {
        setEmployeeContracts([]);
      }
      if (psRes.status === 'fulfilled') {
        setEmployeePayslipSeries(psRes.value.items.map(p => ({
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
      } else {
        setEmployeePayslipSeries([]);
      }
    })();

    return () => { cancelled = true; };
  }, [employee.id, companyId]);

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

  const allEmployeeEvents = attendance.events;

  const employeeViolations = React.useMemo(
    () =>
      violations.map((v) => {
        const vt = v.violationType;
        const normKind = (k: string | null | undefined): 'amount' | 'hours' | 'day' =>
          k === 'amount' ? 'amount' : k === 'days' || k === 'day' ? 'day' : 'hours';
        return {
          id: v.id,
          employeeId: v.employeeId,
          recordNumber: v.recordNumber,
          typeNameAr: vt?.nameAr || v.description || 'مخالفة',
          typeCode: vt?.code ?? '',
          date: v.violationDate,
          description: v.description,
          status: v.status ?? 'pending',
          notes: v.notes ?? '',
          attachmentsNote: v.attachmentsNote ?? '',
          typeHasDeduction: vt?.hasDeduction ?? false,
          typeDeductionValue: vt?.deductionValue ? Number(vt.deductionValue) : 0,
          typeDeductionKind: normKind(vt?.deductionKind),
          needsInvestigation: vt?.needsInvestigation ?? v.violationTypeNeedsInvestigation ?? false,
          investigations: (v.investigations ?? []).map((inv) => ({
            id: inv.id,
            investigationDate: inv.investigationDate,
            employeeStatement: inv.employeeStatement ?? '',
            witnessStatement: inv.witnessStatement ?? '',
            result: inv.result,
            recommendation: inv.recommendation,
            deductionKind: normKind(inv.deductionType),
            deductionValue: inv.deductionValue ? Number(inv.deductionValue) : 0,
          })),
        };
      }),
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
