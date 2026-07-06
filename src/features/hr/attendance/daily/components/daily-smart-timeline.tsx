'use client';

import * as React from 'react';
import type { AttendanceDaySummary, AttendanceEvent } from '@/features/hr/attendance/lib/types';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import { Clock3 } from 'lucide-react';
import { DailyOneDayView } from '@/features/hr/attendance/daily/components/daily-one-day-view';
import { DailyGanttTimeline } from '@/features/hr/attendance/daily/components/daily-gantt-timeline';
import { DailyWeekGrid } from '@/features/hr/attendance/daily/components/daily-week-grid';
import { DailyMonthHeatmap } from '@/features/hr/attendance/daily/components/daily-month-heatmap';
import type { AttendanceViewMode } from '@/features/hr/attendance/daily/hooks/useDailyAttendanceModel';
import { DAILY_ATTENDANCE_NO_RECORDS } from '@/features/hr/attendance/daily/constants/daily-attendance-empty';
import {
  DirectoryPagedViews,
  PagedListViewport,
  PagedShell,
  type PaginationBarState,
} from '@/components/ui/paged-list';

// The sticky pagination bar (`DirectoryPagedViews`) renders as a sibling AFTER
// this viewport, so `useViewportFillHeight` (which only knows this element's own
// top offset) would otherwise size the scroll box to the full remaining height
// and let the pagination bar cover the last visible row. Reserve room for it.
const PAGINATION_BAR_GAP = 56;

function DailyTimelineScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <PagedListViewport className={className ?? 'min-h-0 flex-1'} bottomGap={PAGINATION_BAR_GAP}>
      <PagedShell>{children}</PagedShell>
    </PagedListViewport>
  );
}

type EmployeeRow = { id: string; name: string };

function filterByEmployees<T extends { employeeId: string }>(items: T[], pageEmployees: EmployeeRow[]) {
  const ids = new Set(pageEmployees.map((e) => e.id));
  return items.filter((item) => ids.has(item.employeeId));
}

function renderTimelineView({
  days,
  pageEmployees,
  pageSummaries,
  pageEvents,
  dates,
  viewMode,
  className,
}: {
  days: number;
  pageEmployees: EmployeeRow[];
  pageSummaries: AttendanceDaySummary[];
  pageEvents: AttendanceEvent[];
  dates: string[];
  viewMode: AttendanceViewMode;
  className?: string;
}) {
  if (days === 1) {
    return (
      <PagedListViewport className={className ?? 'min-h-0 flex-1'} bottomGap={PAGINATION_BAR_GAP}>
        <DailyOneDayView
          className="h-full min-h-0"
          summaries={pageSummaries}
          initialEvents={pageEvents}
          workDate={dates[0]!}
          allEmployees={pageEmployees}
        />
      </PagedListViewport>
    );
  }

  if (days <= 3) {
    return (
      <DailyTimelineScroll className={className}>
        <DailyGanttTimeline summaries={pageSummaries} events={pageEvents} dates={dates} />
      </DailyTimelineScroll>
    );
  }

  if (days <= 14) {
    return (
      <DailyTimelineScroll className={className}>
        <DailyWeekGrid summaries={pageSummaries} dates={dates} />
      </DailyTimelineScroll>
    );
  }

  return (
    <DailyTimelineScroll className={className}>
      <DailyMonthHeatmap summaries={pageSummaries} dates={dates} viewMode={viewMode} />
    </DailyTimelineScroll>
  );
}

export function DailySmartTimeline({
  summaries,
  events,
  dates,
  viewMode,
  allEmployees,
  className,
  serverPagination,
  loading = false,
}: {
  summaries: AttendanceDaySummary[];
  events: AttendanceEvent[];
  dates: string[];
  viewMode: AttendanceViewMode;
  allEmployees: { id: string; name: string }[];
  className?: string;
  serverPagination?: PaginationBarState;
  loading?: boolean;
}) {
  const days = dates.length;
  const employeeRows = React.useMemo(() => {
    const m = new Map<string, string>();
    if (days === 1 && !serverPagination) {
      for (const emp of allEmployees) m.set(emp.id, emp.name);
    }
    for (const s of summaries) m.set(s.employeeId, s.employeeName);
    for (const e of events) {
      if (!m.has(e.employeeId)) {
        m.set(e.employeeId, e.employeeName ?? allEmployees.find((x) => x.id === e.employeeId)?.name ?? e.employeeId);
      }
    }
    return [...m.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [summaries, events, allEmployees, days, serverPagination]);

  const paginationResetDeps = React.useMemo(
    () => [summaries, events, dates.join('|'), viewMode, allEmployees.length, serverPagination?.total],
    [summaries, events, dates, viewMode, allEmployees.length, serverPagination?.total],
  );

  if (days === 0) {
    return (
      <EmptyStateCard icon={Clock3} title="لا سجلات في النطاق المحدد" description="اختر نطاقاً زمنياً لعرض الجدول." />
    );
  }

  if (!loading && employeeRows.length === 0) {
    return <EmptyStateCard icon={Clock3} {...DAILY_ATTENDANCE_NO_RECORDS} />;
  }

  return (
    <DirectoryPagedViews
      items={employeeRows}
      resetDeps={paginationResetDeps}
      serverPagination={serverPagination}
      loading={loading}
      empty={<EmptyStateCard icon={Clock3} {...DAILY_ATTENDANCE_NO_RECORDS} />}
    >
      {(pageEmployees) =>
        renderTimelineView({
          days,
          pageEmployees,
          pageSummaries: filterByEmployees(summaries, pageEmployees),
          pageEvents: filterByEmployees(events, pageEmployees),
          dates,
          viewMode,
          className,
        })
      }
    </DirectoryPagedViews>
  );
}
