'use client';

import * as React from 'react';
import { useEmployeeProfileAttendance } from '@/features/hr/organization/employees/hooks/useEmployeeProfileAttendance';
import { violationRecordsApi, type ViolationRecordResponseDto } from '@/features/hr/discipline/lib/api/violation-records';
import { leaveRequestsApi, type LeaveRequestResponseDto } from '@/features/hr/leaves/lib/api/leave-requests';
import type { Employee } from '@/features/hr/organization/employees/types';
import type { AttendanceCheckInPoint, AttendanceCheckInPointLink } from '@/features/hr/attendance/lib/types';

export type { ViolationRecordResponseDto, LeaveRequestResponseDto };

export function useEmployeeProfileData(employee: Employee) {
  const [violations, setViolations] = React.useState<ViolationRecordResponseDto[]>([]);
  const [leaveRequests, setLeaveRequests] = React.useState<LeaveRequestResponseDto[]>([]);
  const [activityLogCount] = React.useState(0);
  const [roseFormsCount] = React.useState(0);

  React.useEffect(() => {
    if (!employee.id) return;
    void (async () => {
      try {
        const [vRes, lRes] = await Promise.all([
          violationRecordsApi.getAll({ employeeId: employee.id, limit: 100 }),
          leaveRequestsApi.getAll({ employeeId: employee.id, limit: 100 }),
        ]);
        setViolations(vRes.items);
        setLeaveRequests(lRes.items);
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

  const employeePayslipSeries: unknown[] = [];
  const employeeContracts: unknown[] = [];

  return {
    branch: undefined as undefined,
    department: undefined as undefined,
    manager: undefined as unknown as null,
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
