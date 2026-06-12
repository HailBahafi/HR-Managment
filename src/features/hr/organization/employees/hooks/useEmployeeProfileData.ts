'use client';

import * as React from 'react';
import { useEmployeeProfileAttendance } from '@/features/hr/organization/employees/hooks/useEmployeeProfileAttendance';
import { violationRecordsApi, type ViolationRecordResponseDto } from '@/features/hr/discipline/lib/api/violation-records';
import { leaveRequestsApi, type LeaveRequestResponseDto } from '@/features/hr/leaves/lib/api/leave-requests';
import { employeeContractsApi } from '@/features/hr/contracts/lib/contracts-api';
import { mapEmployeeContractFromApi, type HRContractRecord } from '@/features/hr/contracts/lib/contracts-store';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import type { Employee } from '@/features/hr/organization/employees/types';
import type { EmployeeProfileSectionId } from '@/features/hr/organization/employees/constants/EmployeeProfileSections';
import type { AttendanceCheckInPoint, AttendanceCheckInPointLink } from '@/features/hr/attendance/lib/types';
import { payslipsApi } from '@/features/hr/payroll/lib/api/payslips';
import type { Payslip } from '@/features/hr/payroll/types';
import { employeePayslipsApi } from '@/features/hr/organization/employees/lib/api/employee-payslips';
import {
  mapEmployeePayslipHistoryItem,
  mapPayslipListItem,
} from '@/features/hr/organization/employees/services/employee-payslips.service';

export type EmployeePayslipCounts = {
  totalPayslips: number;
  draft: number;
  approved: number;
  paid: number;
};

export type { ViolationRecordResponseDto, LeaveRequestResponseDto };

const EMPTY_PAGINATION = { page: 1, limit: 100, total: 0, totalPages: 0 };

export function useEmployeeProfileData(
  employee: Employee,
  activeSection: EmployeeProfileSectionId,
) {
  const companyId = useAuthStore((s) => s.activeCompanyId);
  const [violations, setViolations] = React.useState<ViolationRecordResponseDto[]>([]);
  const [requestLeaveRows, setRequestLeaveRows] = React.useState<LeaveRequestResponseDto[]>([]);
  const [employeeContracts, setEmployeeContracts] = React.useState<HRContractRecord[]>([]);
  const [employeePayslipSeries, setEmployeePayslipSeries] = React.useState<Payslip[]>([]);
  const [payslipCounts, setPayslipCounts] = React.useState<EmployeePayslipCounts | null>(null);
  const [activityLogCount] = React.useState(0);
  const [roseFormsCount] = React.useState(0);

  const attendance = useEmployeeProfileAttendance(
    employee,
    activeSection === 'attendance',
  );

  React.useEffect(() => {
    if (!employee.id || activeSection !== 'violations') return;
    let cancelled = false;
    void violationRecordsApi
      .getAll({ employeeId: employee.id, limit: 100 })
      .then((res) => {
        if (!cancelled) setViolations(res.items);
      })
      .catch(() => {
        if (!cancelled) setViolations([]);
      });
    return () => { cancelled = true; };
  }, [employee.id, activeSection]);

  React.useEffect(() => {
    if (!employee.id || activeSection !== 'requests') return;
    let cancelled = false;
    void leaveRequestsApi
      .getAll({ employeeId: employee.id, limit: 100 })
      .then((res) => {
        if (!cancelled) setRequestLeaveRows(res.items);
      })
      .catch(() => {
        if (!cancelled) setRequestLeaveRows([]);
      });
    return () => { cancelled = true; };
  }, [employee.id, activeSection]);

  React.useEffect(() => {
    if (!employee.id || activeSection !== 'contracts' || !companyId) return;
    let cancelled = false;
    void employeeContractsApi
      .list({ companyId, employeeId: employee.id, limit: 100 })
      .then((res) => {
        if (!cancelled) {
          setEmployeeContracts(res.items.map(mapEmployeeContractFromApi));
        }
      })
      .catch(() => {
        if (!cancelled) setEmployeeContracts([]);
      });
    return () => { cancelled = true; };
  }, [employee.id, activeSection, companyId]);

  React.useEffect(() => {
    if (!employee.id || activeSection !== 'salary' || !companyId) return;
    let cancelled = false;

    void (async () => {
      try {
        const history = await employeePayslipsApi.getHistory(employee.id, { companyId });
        if (cancelled) return;
        setEmployeePayslipSeries(
          history.payslipsHistory.map((item) => mapEmployeePayslipHistoryItem(item, employee.id)),
        );
        setPayslipCounts(history.counts);
      } catch {
        if (cancelled) return;
        try {
          const psRes = await payslipsApi.list({ companyId, employeeId: employee.id, limit: 200 });
          if (cancelled) return;
          const items = psRes.items.map(mapPayslipListItem);
          setEmployeePayslipSeries(items);
          setPayslipCounts({
            totalPayslips: items.length,
            draft: items.filter((p) => p.status === 'draft').length,
            approved: items.filter((p) => p.status === 'approved').length,
            paid: items.filter((p) => p.status === 'paid').length,
          });
        } catch {
          if (!cancelled) {
            setEmployeePayslipSeries([]);
            setPayslipCounts(null);
          }
        }
      }
    })();

    return () => { cancelled = true; };
  }, [employee.id, activeSection, companyId]);

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
      requestLeaveRows.map((r) => ({
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
    [requestLeaveRows],
  );

  return {
    branch: null as { id: string; name: string } | null,
    department: null as { id: string; name: string } | null,
    manager: null as { id: string; name: string } | null,
    ...attendance,
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
    payslipCounts,
    roseFormsCount,
    activityLogCount,
  };
}
