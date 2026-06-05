'use client';

import type { AttendanceDaySummary, AttendanceEvent } from '@/features/hr/attendance/lib/types';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import { Clock3 } from 'lucide-react';
import { DailyOneDayView } from '@/features/hr/attendance/daily/components/daily-one-day-view';
import { DailyGanttTimeline } from '@/features/hr/attendance/daily/components/daily-gantt-timeline';
import { DailyWeekGrid } from '@/features/hr/attendance/daily/components/daily-week-grid';
import { DailyMonthHeatmap } from '@/features/hr/attendance/daily/components/daily-month-heatmap';
import type { AttendanceViewMode } from '@/features/hr/attendance/daily/hooks/useDailyAttendanceModel';

export function DailySmartTimeline({
  summaries,
  events,
  dates,
  viewMode,
  allEmployees,
}: {
  summaries: AttendanceDaySummary[];
  events: AttendanceEvent[];
  dates: string[];
  viewMode: AttendanceViewMode;
  allEmployees: { id: string; name: string }[];
}) {
  const days = dates.length;
  if (days === 0) {
    return (
      <EmptyStateCard icon={Clock3} title="لا سجلات في النطاق المحدد" description="اختر نطاقاً زمنياً لعرض الجدول." />
    );
  }

  if (days === 1) {
    return (
      <DailyOneDayView
        summaries={summaries}
        initialEvents={events}
        workDate={dates[0]!}
        allEmployees={allEmployees}
      />
    );
  }

  if (days <= 3) return <DailyGanttTimeline summaries={summaries} events={events} dates={dates} />;
  if (days <= 14) return <DailyWeekGrid summaries={summaries} dates={dates} />;
  return <DailyMonthHeatmap summaries={summaries} dates={dates} viewMode={viewMode} />;
}
