import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';

/** Minutes between two ISO timestamps (check-in → check-out). */
export function isoDurationMinutes(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
): number | null {
  if (!startAt || !endAt) return null;
  const startMs = new Date(startAt).getTime();
  const endMs = new Date(endAt).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return null;
  return Math.round((endMs - startMs) / 60000);
}

/**
 * Actual presence span from punch times — الدوام الفعلي خلال الفترة (الفارق بين الحضور والانصراف).
 */
export function computeActualPeriodMinutes(row: DaySummaryResponseDto): number | null {
  const fromPunches = isoDurationMinutes(row.actualCheckInAt, row.actualCheckOutAt);
  if (fromPunches != null) return fromPunches;

  if (row.workedMinutes > 0 && row.overtimeMinutes <= 0) {
    return row.workedMinutes;
  }

  if (row.workedMinutes > row.overtimeMinutes) {
    return row.workedMinutes - row.overtimeMinutes;
  }

  return row.workedMinutes > 0 ? row.workedMinutes : null;
}

/** Scheduled shift span from expected start/end (متوقع). */
export function computeExpectedMinutes(row: DaySummaryResponseDto): number | null {
  return isoDurationMinutes(row.expectedStartAt, row.expectedEndAt);
}

/** Total accounted work for the day — إجمالي مدة العمل من الخادم. */
export function computeTotalWorkedMinutes(row: DaySummaryResponseDto): number {
  return row.workedMinutes;
}
