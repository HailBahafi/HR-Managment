'use client';

import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import {
  computeInsidePeriodMinutes,
  computeTotalWorkedMinutes,
} from '@/features/hr/attendance/day-summaries/utils/day-summary-metrics';
import { SummaryMinutesCell } from '@/features/hr/attendance/day-summaries/components/summary-minutes-cell';

/** داخل الفترات — تقاطع البصمة مع الفترة المتوقعة. */
export function InsidePeriodMinutesCell({ row }: { row: DaySummaryResponseDto }) {
  return <SummaryMinutesCell minutes={computeInsidePeriodMinutes(row)} />;
}

/** مدة العمل الإجمالية — العمل الفعلي المحسوب لليوم. */
export function TotalWorkedMinutesCell({ row }: { row: DaySummaryResponseDto }) {
  const total = computeTotalWorkedMinutes(row);
  if (total <= 0) {
    return <SummaryMinutesCell minutes={null} />;
  }
  return <SummaryMinutesCell minutes={total} />;
}
