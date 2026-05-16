'use client';

import * as React from 'react';
import { useAttendanceStore } from '@/features/hr/attendance/lib/store';
import type { AttendanceDaySummary, AttendanceEvent } from '@/features/hr/attendance/lib/types';
import type { Employee } from '@/features/hr/organization/employees/types';

export function useEmployeeProfileAttendance(
  employee: Employee,
  allEmployeeEvents: AttendanceEvent[],
  allEmployeeSummaries: AttendanceDaySummary[],
) {
  const { shiftTemplates, addCheckpointLinkBatch, removeCheckpointLink, addAssignmentBatch, removeAssignment } =
    useAttendanceStore();

  const [attFrom, setAttFrom] = React.useState('');
  const [attTo, setAttTo] = React.useState('');

  const employeeSummaries = React.useMemo(
    () =>
      allEmployeeSummaries.filter(
        (s) => (!attFrom || s.date >= attFrom) && (!attTo || s.date <= attTo),
      ),
    [allEmployeeSummaries, attFrom, attTo],
  );

  const employeeEvents = React.useMemo(
    () =>
      allEmployeeEvents.filter(
        (e) => (!attFrom || e.date >= attFrom) && (!attTo || e.date <= attTo),
      ),
    [allEmployeeEvents, attFrom, attTo],
  );

  const attendanceStats = React.useMemo(() => {
    const lateMinutes = employeeSummaries.reduce((a, s) => a + s.lateMinutes, 0);
    return {
      presentDays: employeeSummaries.filter((s) => s.status === 'present').length,
      absentDays: employeeSummaries.filter((s) => s.status === 'absent').length,
      earlyLeaveDays: employeeSummaries.filter((s) => s.status === 'early_leave').length,
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

  const submitCpLink = () => {
    if (cpSel.size === 0) return;
    addCheckpointLinkBatch({
      effectiveFrom: cpDate,
      pairs: [...cpSel].map((checkInPointId) => ({ employeeId: employee.id, checkInPointId })),
    });
    setCpOpen(false);
  };

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

  const submitShift = () => {
    if (shiftMode === 'template' && !shiftTemplateId) return;
    addAssignmentBatch({
      templateId: shiftMode === 'open' ? '__open__' : shiftTemplateId,
      effectiveFrom: shiftDate,
      openShiftHours: shiftMode === 'open' ? Number(shiftHours) : undefined,
      items: [{ targetType: 'employee', targetId: employee.id, targetLabel: employee.name }],
    });
    setShiftOpen(false);
  };

  return {
    attFrom,
    setAttFrom,
    attTo,
    setAttTo,
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
