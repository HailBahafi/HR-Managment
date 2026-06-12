'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import { attendanceDaySummariesApi, type DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { attendanceEventsApi, type AttendanceEventResponseDto } from '@/features/hr/attendance/lib/api/attendance-events';
import { shiftTemplatesApi, type ShiftTemplateResponseDto } from '@/features/hr/attendance/lib/api/shift-templates';
import { shiftAssignmentsApi, type ShiftAssignmentResponseDto } from '@/features/hr/attendance/lib/api/shift-assignments';

export type { DaySummaryResponseDto, AttendanceEventResponseDto, ShiftTemplateResponseDto, ShiftAssignmentResponseDto };

export function useEmployeeProfileAttendance(employee: Employee, enabled = true) {
  const [daySummaries, setDaySummaries] = React.useState<DaySummaryResponseDto[]>([]);
  const [events, setEvents] = React.useState<AttendanceEventResponseDto[]>([]);
  const [shiftTemplates, setShiftTemplates] = React.useState<ShiftTemplateResponseDto[]>([]);
  const [shiftAssignments, setShiftAssignments] = React.useState<ShiftAssignmentResponseDto[]>([]);

  const [attFrom, setAttFrom] = React.useState('');
  const [attTo, setAttTo] = React.useState('');

  React.useEffect(() => {
    if (!employee.id || !enabled) return;
    void (async () => {
      try {
        const [summRes, evtRes, tmplRes, assignRes] = await Promise.all([
          attendanceDaySummariesApi.getAll({ employeeId: employee.id, limit: 500, ...(attFrom ? { from: attFrom } : {}), ...(attTo ? { to: attTo } : {}) }),
          attendanceEventsApi.getAll({ employeeId: employee.id, limit: 500, ...(attFrom ? { workDateFrom: attFrom } : {}), ...(attTo ? { workDateTo: attTo } : {}) }),
          shiftTemplatesApi.getAll({ limit: 100 }),
          shiftAssignmentsApi.getAll({ employeeId: employee.id, limit: 50 }),
        ]);
        setDaySummaries(summRes.items);
        setEvents(evtRes.items);
        setShiftTemplates(tmplRes.items);
        setShiftAssignments(assignRes.items);
      } catch {
        // silently ignore
      }
    })();
  }, [employee.id, attFrom, attTo, enabled]);

  const employeeSummaries = React.useMemo(
    () => daySummaries.filter(
      (s) => (!attFrom || s.workDate >= attFrom) && (!attTo || s.workDate <= attTo),
    ),
    [daySummaries, attFrom, attTo],
  );

  const employeeEvents = React.useMemo(
    () => events.filter(
      (e) => (!attFrom || e.workDate >= attFrom) && (!attTo || e.workDate <= attTo),
    ),
    [events, attFrom, attTo],
  );

  const attendanceStats = React.useMemo(() => {
    const lateMinutes = employeeSummaries.reduce((a, s) => a + s.lateMinutes, 0);
    return {
      presentDays: employeeSummaries.filter((s) => s.status === 'present').length,
      absentDays: employeeSummaries.filter((s) => s.status === 'absent').length,
      earlyLeaveDays: employeeSummaries.filter((s) => s.earlyLeaveMinutes > 0).length,
      lateHours: lateMinutes / 60,
    };
  }, [employeeSummaries]);

  const [cpOpen, setCpOpen] = React.useState(false);
  const [cpDate, setCpDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [cpSel, setCpSel] = React.useState<Set<string>>(new Set());
  const [cpQuery, setCpQuery] = React.useState('');
  const [cpUnlinkTarget, setCpUnlinkTarget] = React.useState<string | null>(null);

  const openCpDialog = () => {
    setCpDate(new Date().toISOString().slice(0, 10));
    setCpSel(new Set());
    setCpQuery('');
    setCpOpen(true);
  };

  const submitCpLink = () => setCpOpen(false);

  const [shiftOpen, setShiftOpen] = React.useState(false);
  const [shiftMode, setShiftMode] = React.useState<'template' | 'open'>('template');
  const [shiftTemplateId, setShiftTemplateId] = React.useState('');
  const [shiftDate, setShiftDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [shiftHours, setShiftHours] = React.useState('8');
  const [shiftUnlinkTarget, setShiftUnlinkTarget] = React.useState<string | null>(null);

  const openShiftDialog = () => {
    const active = shiftTemplates.filter((t) => t.isActive);
    setShiftMode('template');
    setShiftTemplateId(active[0]?.id ?? '');
    setShiftDate(new Date().toISOString().slice(0, 10));
    setShiftHours('8');
    setShiftOpen(true);
  };

  const submitShift = async () => {
    if (shiftMode === 'template' && !shiftTemplateId) return;
    try {
      await shiftAssignmentsApi.create({
        companyId: '',
        shiftTemplateId,
        employeeId: employee.id,
        effectiveFrom: shiftDate,
        openShiftHours: shiftMode === 'open' ? Number(shiftHours) : null,
        isActive: true,
      });
      const res = await shiftAssignmentsApi.getAll({ employeeId: employee.id, limit: 50 });
      setShiftAssignments(res.items);
    } catch {
      // silently ignore
    }
    setShiftOpen(false);
  };

  const removeAssignment = async (id: string) => {
    try {
      await shiftAssignmentsApi.remove(id);
      setShiftAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // silently ignore
    }
  };

  const removeCheckpointLink = (_id: string) => {
    // checkpoint links managed separately
  };

  return {
    attFrom,
    setAttFrom,
    attTo,
    setAttTo,
    daySummaries,
    events,
    shiftTemplates,
    shiftAssignments,
    employeeSummaries,
    employeeEvents,
    attendanceStats,
    cpOpen,
    setCpOpen,
    cpDate,
    setCpDate,
    cpSel,
    setCpSel,
    cpQuery,
    setCpQuery,
    cpUnlinkTarget,
    setCpUnlinkTarget,
    openCpDialog,
    submitCpLink,
    shiftOpen,
    setShiftOpen,
    shiftMode,
    setShiftMode,
    shiftTemplateId,
    setShiftTemplateId,
    shiftDate,
    setShiftDate,
    shiftHours,
    setShiftHours,
    shiftUnlinkTarget,
    setShiftUnlinkTarget,
    openShiftDialog,
    submitShift,
    removeCheckpointLink,
    removeAssignment,
  };
}
