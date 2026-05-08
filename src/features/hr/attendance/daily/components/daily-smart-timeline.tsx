'use client';

import type { AttendanceDaySummary, AttendanceEvent } from '@/lib/attendance/types';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import { Clock3 } from 'lucide-react';
import { DailyGanttTimeline } from '@/features/hr/attendance/daily/components/daily-gantt-timeline';
import { DailyWeekGrid } from '@/features/hr/attendance/daily/components/daily-week-grid';
import { DailyMonthHeatmap } from '@/features/hr/attendance/daily/components/daily-month-heatmap';

export function DailySmartTimeline({
  summaries,
  events,
  dates,
}: {
  summaries: AttendanceDaySummary[];
  events: AttendanceEvent[];
  dates: string[];
}) {
  const days = dates.length;
  if (days === 0) {
    return (
      <EmptyStateCard icon={Clock3} title="لا سجلات في النطاق المحدد" description="اختر نطاقاً زمنياً لعرض الجدول." />
    );
  }

  if (days <= 3) return <DailyGanttTimeline summaries={summaries} events={events} dates={dates} />;
  if (days <= 14) return <DailyWeekGrid summaries={summaries} dates={dates} />;
  return <DailyMonthHeatmap summaries={summaries} dates={dates} />;
}
