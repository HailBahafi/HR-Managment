'use client';

import * as React from 'react';
import { toast } from 'sonner';
import type { Employee } from '@/features/hr/organization/employees/types';
import { attendanceDaySummariesApi, type DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { attendanceEventsApi, type AttendanceEventResponseDto } from '@/features/hr/attendance/lib/api/attendance-events';
import { shiftTemplatesApi, type ShiftTemplateResponseDto } from '@/features/hr/attendance/lib/api/shift-templates';
import { shiftAssignmentsApi, type ShiftAssignmentResponseDto } from '@/features/hr/attendance/lib/api/shift-assignments';
import { checkInPointLinksApi } from '@/features/hr/attendance/lib/api/check-in-point-links';
import { checkInPointsApi } from '@/features/hr/attendance/lib/api/check-in-points';
import { mapCheckInPointLinkResponse } from '@/features/hr/attendance/checkpoint-links/services/check-in-point-links.service';
import { mapCheckInPointResponse } from '@/features/hr/attendance/checkpoints/services/check-in-points.service';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { AttendanceCheckInPoint, AttendanceCheckInPointLink } from '@/features/hr/attendance/lib/types';
import { randomUUID } from '@/shared/utils';

export type { DaySummaryResponseDto, AttendanceEventResponseDto, ShiftTemplateResponseDto, ShiftAssignmentResponseDto };

export function useEmployeeProfileAttendance(
  employee: Employee,
  companyId: string | null | undefined,
  enabled = true,
) {
  const [daySummaries, setDaySummaries] = React.useState<DaySummaryResponseDto[]>([]);
  const [events, setEvents] = React.useState<AttendanceEventResponseDto[]>([]);
  const [shiftTemplates, setShiftTemplates] = React.useState<ShiftTemplateResponseDto[]>([]);
  const [shiftAssignments, setShiftAssignments] = React.useState<ShiftAssignmentResponseDto[]>([]);
  const [checkpoints, setCheckpoints] = React.useState<AttendanceCheckInPoint[]>([]);
  const [checkpointLinks, setCheckpointLinks] = React.useState<AttendanceCheckInPointLink[]>([]);

  const [attFrom, setAttFrom] = React.useState('');
  const [attTo, setAttTo] = React.useState('');

  const reloadAttendanceLinks = React.useCallback(async () => {
    if (!employee.id || !companyId) return;
    const [tmplRes, assignRes, pointsRes, linksRes] = await Promise.all([
      shiftTemplatesApi.getAll({ companyId, limit: 100 }),
      shiftAssignmentsApi.getAll({ companyId, employeeId: employee.id, limit: 50 }),
      checkInPointsApi.getAll({ companyId, limit: 200 }),
      checkInPointLinksApi.getAll({ companyId, employeeId: employee.id, limit: 50 }),
    ]);
    setShiftTemplates(tmplRes.items);
    setShiftAssignments(assignRes.items);
    setCheckpoints(pointsRes.items.map(mapCheckInPointResponse));
    setCheckpointLinks(linksRes.items.map(mapCheckInPointLinkResponse));
  }, [employee.id, companyId]);

  React.useEffect(() => {
    if (!employee.id || !enabled) return;
    void (async () => {
      try {
        const [summRes, evtRes] = await Promise.all([
          attendanceDaySummariesApi.getAll({
            employeeId: employee.id,
            limit: 500,
            ...(companyId ? { companyId } : {}),
            ...(attFrom ? { from: attFrom } : {}),
            ...(attTo ? { to: attTo } : {}),
          }),
          attendanceEventsApi.getAll({
            employeeId: employee.id,
            limit: 500,
            ...(companyId ? { companyId } : {}),
            ...(attFrom ? { workDateFrom: attFrom } : {}),
            ...(attTo ? { workDateTo: attTo } : {}),
          }),
        ]);
        setDaySummaries(summRes.items);
        setEvents(evtRes.items);
      } catch {
        // silently ignore summary/event load errors
      }
    })();
  }, [employee.id, attFrom, attTo, enabled, companyId]);

  React.useEffect(() => {
    if (!employee.id || !enabled || !companyId) return;
    void reloadAttendanceLinks().catch(() => {
      setShiftTemplates([]);
      setShiftAssignments([]);
      setCheckpoints([]);
      setCheckpointLinks([]);
    });
  }, [employee.id, enabled, companyId, reloadAttendanceLinks]);

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

  const submitCpLink = async () => {
    if (!companyId) {
      toast.error('تعذر تحديد الشركة');
      return;
    }
    if (cpSel.size === 0) return;

    const pairs = [...cpSel].map((checkInPointId) => ({
      employeeId: employee.id,
      checkInPointId,
    }));

    try {
      const res = await checkInPointLinksApi.createBulk({
        companyId,
        links: pairs,
        batchId: randomUUID(),
        effectiveFrom: cpDate,
        linkActive: true,
      });
      setCheckpointLinks((prev) => [
        ...prev,
        ...res.items.map(mapCheckInPointLinkResponse),
      ]);
      toast.success('تم ربط نقاط التسجيل');
      setCpOpen(false);
      setCpSel(new Set());
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'check-in-point-links.create');
      toast.error(displayMessage);
    }
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

  const submitShift = async () => {
    if (!companyId) {
      toast.error('تعذر تحديد الشركة');
      return;
    }
    if (shiftMode === 'template' && !shiftTemplateId) return;
    if (shiftMode === 'open' && !shiftTemplateId) {
      toast.error('اختر شيفت أساسي للدوام المفتوح');
      return;
    }

    try {
      await shiftAssignmentsApi.create({
        companyId,
        shiftTemplateId,
        employeeId: employee.id,
        effectiveFrom: shiftDate,
        openShiftHours: shiftMode === 'open' ? Number(shiftHours) : null,
        isActive: true,
      });
      await reloadAttendanceLinks();
      toast.success('تم ربط الشيفت');
      setShiftOpen(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'shift-assignments.create');
      toast.error(displayMessage);
    }
  };

  const removeAssignment = async (id: string) => {
    try {
      await shiftAssignmentsApi.remove(id);
      setShiftAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success('تم فك ربط الشيفت');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'shift-assignments.delete');
      toast.error(displayMessage);
    }
  };

  const removeCheckpointLink = async (id: string) => {
    try {
      await checkInPointLinksApi.remove(id);
      setCheckpointLinks((prev) => prev.filter((l) => l.id !== id));
      toast.success('تم فك ربط النقطة');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'check-in-point-links.delete');
      toast.error(displayMessage);
    }
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
    checkpoints,
    checkpointLinks,
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
