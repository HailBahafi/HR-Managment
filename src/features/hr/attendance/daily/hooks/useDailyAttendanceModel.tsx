'use client';

import * as React from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';
import { AttendanceRegisterPrintHtml } from '@/components/pdf/print/attendance-register-print-html';
import { hasDateRangeFilter, thisCalendarMonthYMD } from '@/lib/hr-discipline/discipline-date-filter';
import { useAttendanceStore } from '@/lib/attendance/store';
import type { AttendanceDaySummary } from '@/lib/attendance/types';
import { enumerateDates } from '@/lib/attendance/utils';
import { data } from '@/lib/data';
import { downloadXlsxFromAoA, type XlsxCell } from '@/lib/export/download-xlsx';
import {
  ATT_VISUAL_STATUS_ORDER,
  DEFAULT_ABSENT_DAY_HOURS,
  STATUS,
} from '@/features/hr/attendance/daily/constants/daily-attendance-status';
import { densifySummaries } from '@/features/hr/attendance/daily/utils/daily-attendance-densify';
import { resolveVisualKey } from '@/features/hr/attendance/daily/utils/daily-attendance-status-resolve';
import { minutesToHHMM } from '@/features/hr/attendance/daily/utils/daily-attendance-format';

export function useDailyAttendanceModel() {
  const daySummaries = useAttendanceStore((s) => s.daySummaries);
  const events = useAttendanceStore((s) => s.events);

  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [dateBounds, setDateBounds] = React.useState(() => thisCalendarMonthYMD());
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [pdfOpen, setPdfOpen] = React.useState(false);

  const spanFromStore = React.useMemo(() => {
    let lo = '';
    let hi = '';
    for (const s of daySummaries) {
      if (!lo || s.date < lo) lo = s.date;
      if (!hi || s.date > hi) hi = s.date;
    }
    if (!lo) return thisCalendarMonthYMD();
    return { from: lo, to: hi };
  }, [daySummaries]);

  const { from, to } = React.useMemo(() => {
    if (hasDateRangeFilter(dateBounds.from, dateBounds.to)) return dateBounds;
    return spanFromStore;
  }, [dateBounds, spanFromStore]);

  const dates = React.useMemo(() => enumerateDates(from, to), [from, to]);

  const allEmployees = React.useMemo(() => data.employees.map((e) => ({ id: e.id, name: e.name })), []);

  const roster = React.useMemo(() => {
    let emps = allEmployees;
    if (selectedEmpIds.size > 0) emps = emps.filter((e) => selectedEmpIds.has(e.id));
    return emps;
  }, [allEmployees, selectedEmpIds]);

  const filtered = React.useMemo(
    () =>
      daySummaries.filter(
        (s) =>
          s.date >= from &&
          s.date <= to &&
          (selectedEmpIds.size === 0 || selectedEmpIds.has(s.employeeId)),
      ),
    [daySummaries, from, to, selectedEmpIds],
  );

  const eventsFiltered = React.useMemo(
    () =>
      events.filter(
        (e) =>
          e != null &&
          typeof e.id === 'string' &&
          e.date >= from &&
          e.date <= to &&
          (selectedEmpIds.size === 0 || selectedEmpIds.has(e.employeeId)),
      ),
    [events, from, to, selectedEmpIds],
  );

  const denseSummaries = React.useMemo(() => densifySummaries(filtered, dates, roster), [filtered, dates, roster]);

  const attendanceStatusLabels = React.useMemo(
    () => Object.fromEntries(ATT_VISUAL_STATUS_ORDER.map((k) => [k, STATUS[k].label])) as Record<string, string>,
    [],
  );

  const attendanceStatusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: denseSummaries.length };
    for (const k of ATT_VISUAL_STATUS_ORDER) counts[k] = 0;
    for (const s of denseSummaries) {
      counts[resolveVisualKey(s.status)] += 1;
    }
    return counts;
  }, [denseSummaries]);

  const denseForView = React.useMemo(() => {
    if (statusFilter === 'all') return denseSummaries;
    return denseSummaries.filter((s) => resolveVisualKey(s.status) === statusFilter);
  }, [denseSummaries, statusFilter]);

  const eventsForView = React.useMemo(() => {
    const keys = new Set(denseForView.map((s) => `${s.employeeId}|${s.date}`));
    return eventsFiltered.filter((e) => keys.has(`${e.employeeId}|${e.date}`));
  }, [eventsFiltered, denseForView]);

  const attendancePdfRows = React.useMemo(
    () =>
      denseForView.map((s: AttendanceDaySummary) => ({
        employeeName: s.employeeName,
        date: s.date,
        statusLabel: STATUS[resolveVisualKey(s.status)].label,
        worked: minutesToHHMM(s.workedMinutes),
        late: minutesToHHMM(s.lateMinutes),
      })),
    [denseForView],
  );

  const attendancePrintable = React.useMemo(
    () =>
      attendancePdfRows.length === 0 ? null : (
        <AttendanceRegisterPrintHtml
          companyNameAr={data.company.name}
          companyNameEn={data.company.nameEn}
          titleAr="تقرير الحضور اليومي"
          periodDateFrom={from}
          periodDateTo={to}
          employeesFilterAll={selectedEmpIds.size === 0}
          employeesSelectedCount={selectedEmpIds.size}
          statusFilterLabelAr={
            statusFilter === 'all' ? 'الكل' : attendanceStatusLabels[statusFilter] ?? statusFilter
          }
          rows={attendancePdfRows}
        />
      ),
    [attendancePdfRows, from, to, selectedEmpIds.size, statusFilter, attendanceStatusLabels],
  );

  const attendancePdfFileName = `attendance-${from}-${to}.pdf`;

  const handleExportAttendanceExcel = React.useCallback(async () => {
    if (denseForView.length === 0) {
      toast.error('لا توجد سجلات للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    const rows: XlsxCell[][] = [
      ['الموظف', 'معرف الموظف', 'اليوم', 'الحالة', 'دقائق العمل', 'دقائق التأخير'],
    ];
    for (const s of denseForView) {
      rows.push([
        s.employeeName,
        s.employeeId,
        s.date,
        STATUS[resolveVisualKey(s.status)].label,
        s.workedMinutes,
        s.lateMinutes,
      ]);
    }
    await downloadXlsxFromAoA(`attendance-${from}-${to}.xlsx`, 'الحضور', rows);
    toast.success('تم تنزيل ملف Excel.');
  }, [denseForView, from, to]);

  const stats = React.useMemo(() => {
    const workedM = denseForView.reduce((a, s) => a + s.workedMinutes, 0);
    const lateM = denseForView.reduce((a, s) => a + s.lateMinutes, 0);
    const absentDays = denseForView.filter((s) => resolveVisualKey(s.status) === 'absent').length;
    const denom = denseForView.length || 1;
    return {
      workHours: workedM / 60,
      lateHours: lateM / 60,
      absentHours: absentDays * DEFAULT_ABSENT_DAY_HOURS,
      avgWorkHours: workedM / 60 / denom,
    };
  }, [denseForView]);

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        defaultDateFilterTab="month"
        empPickerEmployees={allEmployees}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOrder={ATT_VISUAL_STATUS_ORDER}
        statusLabels={attendanceStatusLabels}
        statusCounts={attendanceStatusCounts}
        onDateBoundsChange={setDateBounds}
        trailingActions={(
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                if (attendancePdfRows.length === 0) {
                  toast.error('لا توجد سجلات للتصدير ضمن الفلاتر الحالية.');
                  return;
                }
                setPdfOpen(true);
              }}
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => void handleExportAttendanceExcel()}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </Button>
          </>
        )}
      />
    ),
    [
      statusFilter,
      selectedEmpKey,
      dateBounds.from,
      dateBounds.to,
      from,
      to,
      attendanceStatusCounts.all,
      attendanceStatusCounts.present,
      attendanceStatusCounts.late,
      attendanceStatusCounts.absent,
      attendanceStatusCounts.early_leave,
      attendanceStatusCounts.holiday,
      attendanceStatusLabels,
      attendancePdfRows.length,
      handleExportAttendanceExcel,
      allEmployees,
    ],
  );

  return {
    from,
    to,
    dates,
    denseForView,
    eventsForView,
    stats,
    attendancePrintable,
    attendancePdfFileName,
    pdfOpen,
    setPdfOpen,
  };
}
