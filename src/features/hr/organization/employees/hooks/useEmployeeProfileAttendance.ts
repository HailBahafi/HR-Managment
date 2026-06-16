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
import { employeeAssignmentsApi } from '@/features/hr/organization/employees/lib/api/employee-assignments';
import { resolvePrimaryAssignment } from '@/features/hr/organization/employees/services/employee-assignments.service';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { randomUUID } from '@/shared/utils';

export type { DaySummaryResponseDto, AttendanceEventResponseDto, ShiftTemplateResponseDto, ShiftAssignmentResponseDto };

export function useEmployeeProfileAttendance(
  employee: Employee,
  companyIdProp: string | null | undefined,
  enabled = true,
) {
  const defaultCompanyId = useDefaultCompanyId();
  const [resolvedCompanyId, setResolvedCompanyId] = React.useState<string | null>(null);
  const [linksLoadError, setLinksLoadError] = React.useState<string | null>(null);

  const companyId = resolvedCompanyId ?? companyIdProp ?? defaultCompanyId;

  React.useEffect(() => {
    if (!employee.id || !enabled) return;
    let cancelled = false;
    void employeeAssignmentsApi
      .getAll(employee.id)
      .then((rows) => {
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        const primary = resolvePrimaryAssignment(list);
        setResolvedCompanyId(primary?.companyId ?? companyIdProp ?? defaultCompanyId);
      })
      .catch(() => {
        if (!cancelled) setResolvedCompanyId(companyIdProp ?? defaultCompanyId);
      });
    return () => { cancelled = true; };
  }, [employee.id, enabled, companyIdProp, defaultCompanyId]);

  const [daySummaries, setDaySummaries] = React.useState<DaySummaryResponseDto[]>([]);
  const [events, setEvents] = React.useState<AttendanceEventResponseDto[]>([]);
  const [shiftTemplates, setShiftTemplates] = React.useState<ShiftTemplateResponseDto[]>([]);
  const [shiftAssignments, setShiftAssignments] = React.useState<ShiftAssignmentResponseDto[]>([]);
  const [checkpoints, setCheckpoints] = React.useState<AttendanceCheckInPoint[]>([]);
  const [checkpointLinks, setCheckpointLinks] = React.useState<AttendanceCheckInPointLink[]>([]);

  const [attFrom, setAttFrom] = React.useState('');
  const [attTo, setAttTo] = React.useState('');

  const reloadAttendanceLinks = React.useCallback(async () => {
    if (!employee.id) return;
    setLinksLoadError(null);

    const scopedQuery = companyId ? { companyId } : {};

    const [assignRes, linksRes] = await Promise.all([
      shiftAssignmentsApi.getAll({ ...scopedQuery, employeeId: employee.id, limit: 50 }),
      checkInPointLinksApi.getAll({ ...scopedQuery, employeeId: employee.id, limit: 50 }),
    ]);

    const catalogCompanyId =
      companyId
      ?? assignRes.items[0]?.companyId
      ?? linksRes.items[0]?.companyId
      ?? null;

    const catalogScope = catalogCompanyId ? { companyId: catalogCompanyId } : {};

    const tmplRes = await shiftTemplatesApi.getAll({ ...catalogScope, limit: 100 });

    const linkPointIds = [...new Set(linksRes.items.map((l) => l.checkInPointId))];
    let checkpointItems: AttendanceCheckInPoint[] = [];

    if (linkPointIds.length > 0) {
      const pointsRes = catalogCompanyId
        ? await checkInPointsApi.getAll({ companyId: catalogCompanyId, limit: 200 })
        : { items: [] as Awaited<ReturnType<typeof checkInPointsApi.getAll>>['items'] };
      const byId = new Map(pointsRes.items.map((p) => [p.id, mapCheckInPointResponse(p)]));

      const resolved = await Promise.all(
        linkPointIds.map(async (id) => {
          const cached = byId.get(id);
          if (cached) return cached;
          try {
            return mapCheckInPointResponse(await checkInPointsApi.getById(id));
          } catch {
            return null;
          }
        }),
      );
      checkpointItems = resolved.filter((p): p is AttendanceCheckInPoint => p != null);
    } else if (catalogCompanyId) {
      const pointsRes = await checkInPointsApi.getAll({ companyId: catalogCompanyId, limit: 200 });
      checkpointItems = pointsRes.items.map(mapCheckInPointResponse);
    }

    setShiftTemplates(tmplRes.items);
    setShiftAssignments(assignRes.items);
    setCheckpoints(checkpointItems);
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
    if (!employee.id || !enabled) return;
    void reloadAttendanceLinks().catch((err) => {
      const { displayMessage } = handleApiError(err, 'employee-profile.attendance-links');
      setLinksLoadError(displayMessage);
      setShiftTemplates([]);
      setShiftAssignments([]);
      setCheckpoints([]);
      setCheckpointLinks([]);
    });
  }, [employee.id, enabled, reloadAttendanceLinks]);

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
    linksLoadError,
    companyId,
  };
}
