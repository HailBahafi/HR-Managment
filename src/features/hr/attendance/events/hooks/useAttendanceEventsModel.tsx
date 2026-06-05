'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  attendanceEventsApi,
  type AttendanceEventResponseDto,
  type AttendanceEventType,
  type AttendanceEventListQuery,
} from '@/features/hr/attendance/lib/api/attendance-events';
import { employeesApi, type EmployeeResponseDto } from '@/features/hr/organization/employees/lib/api/employees';
import { checkInPointsApi } from '@/features/hr/attendance/lib/api/check-in-points';
import { mapCheckInPointResponse } from '@/features/hr/attendance/checkpoints/services/check-in-points.service';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { todayYMD } from '@/features/hr/discipline/lib/discipline-date-filter';
import type { AttendanceCheckInPoint } from '@/features/hr/attendance/lib/types';

export type EventsFilterState = {
  from: string;
  to: string;
  employeeId: string;
  eventType: string;
  includeVoided: boolean;
};

export function useAttendanceEventsModel() {
  useSetPageTitle({
    titleAr: 'الأحداث',
    descriptionAr: 'سجلات الحضور والانصراف والاستراحات لجميع الموظفين.',
    iconName: 'Activity',
  });

  const companyId = useAuthStore((s) => s.activeCompanyId) ?? '';

  const [events, setEvents] = React.useState<AttendanceEventResponseDto[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeResponseDto[]>([]);
  const [checkpoints, setCheckpoints] = React.useState<AttendanceCheckInPoint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  // Filters
  const [dateBounds, setDateBounds] = React.useState(() => ({ from: todayYMD(), to: todayYMD() }));
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [eventTypeFilter, setEventTypeFilter] = React.useState('all');
  const [includeVoided, setIncludeVoided] = React.useState(false);

  // Create dialog
  const [createOpen, setCreateOpen] = React.useState(false);

  // Void dialog
  const [voidTarget, setVoidTarget] = React.useState<AttendanceEventResponseDto | null>(null);

  // Detail dialog
  const [detailTarget, setDetailTarget] = React.useState<AttendanceEventResponseDto | null>(null);

  // Load reference data once
  React.useEffect(() => {
    if (!companyId) return;
    void Promise.allSettled([
      employeesApi.getAll({ limit: 500 }),
      checkInPointsApi.getAll({ limit: 200, companyId }),
    ]).then(([empRes, cpRes]) => {
      if (empRes.status === 'fulfilled') setEmployees(empRes.value.items);
      if (cpRes.status === 'fulfilled') setCheckpoints(cpRes.value.items.map(mapCheckInPointResponse));
    });
  }, [companyId]);

  const from = dateBounds.from || todayYMD();
  const to   = dateBounds.to   || todayYMD();

  const reload = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const query: AttendanceEventListQuery = {
        limit: 500,
        workDateFrom: from,
        workDateTo: to,
        includeVoided: includeVoided || undefined,
      };
      if (companyId) query.companyId = companyId;
      if (selectedEmpIds.size === 1) query.employeeId = [...selectedEmpIds][0];
      if (eventTypeFilter !== 'all') query.eventType = eventTypeFilter as AttendanceEventType;
      const res = await attendanceEventsApi.getAll(query);
      setEvents(res.items);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'attendance-events.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, [companyId, from, to, selectedEmpIds, eventTypeFilter, includeVoided]);

  React.useEffect(() => { void reload(); }, [reload]);

  const handleVoid = React.useCallback(async (id: string, reason: string) => {
    try {
      await attendanceEventsApi.void(id, reason);
      toast.success('تم إلغاء الحدث');
      setVoidTarget(null);
      await reload();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'attendance-events.void');
      toast.error(displayMessage);
    }
  }, [reload]);

  const handleCreate = React.useCallback(async (payload: Parameters<typeof attendanceEventsApi.create>[0]) => {
    try {
      await attendanceEventsApi.create(payload);
      toast.success('تم تسجيل الحدث');
      setCreateOpen(false);
      await reload();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'attendance-events.create');
      toast.error(displayMessage);
      throw err;
    }
  }, [reload]);

  const allEmployeesForPicker = React.useMemo(
    () => employees.map((e) => ({ id: e.id, name: e.nameAr })),
    [employees],
  );

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        defaultDateFilterTab="today"
        empPickerEmployees={allEmployeesForPicker}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        showStatusSection={false}
        onDateBoundsChange={(b) => setDateBounds({ from: b.from || todayYMD(), to: b.to || todayYMD() })}
        inlineSelects={[
          {
            id: 'eventType',
            value: eventTypeFilter,
            onChange: setEventTypeFilter,
            placeholder: 'نوع الحدث',
            options: [
              { value: 'all', label: 'كل الأنواع' },
              { value: 'check_in', label: 'دخول' },
              { value: 'check_out', label: 'خروج' },
              { value: 'break_start', label: 'بداية استراحة' },
              { value: 'break_end', label: 'نهاية استراحة' },
            ],
          },
        ]}
      />
    ),
    [selectedEmpKey, eventTypeFilter, dateBounds.from, dateBounds.to],
  );

  usePageHeaderActions(
    () => (
      <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={() => setCreateOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> تسجيل حدث
      </Button>
    ),
    [setCreateOpen],
  );

  return {
    events,
    employees,
    checkpoints,
    loading,
    listError,
    from,
    to,
    companyId,
    createOpen,
    setCreateOpen,
    voidTarget,
    setVoidTarget,
    detailTarget,
    setDetailTarget,
    includeVoided,
    setIncludeVoided,
    handleVoid,
    handleCreate,
    reload,
  };
}

export type AttendanceEventsModel = ReturnType<typeof useAttendanceEventsModel>;
