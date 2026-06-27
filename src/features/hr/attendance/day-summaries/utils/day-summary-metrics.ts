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

/** Raw punch span — الفارق بين أول حضور وآخر انصراف (يشمل ما خارج الفترة). */
export function computePunchSpanMinutes(row: DaySummaryResponseDto): number | null {
  return isoDurationMinutes(row.actualCheckInAt, row.actualCheckOutAt);
}

/**
 * Work credited inside scheduled shift period(s) — الدوام الفعلي داخل الفترات.
 * من الحقول المحسوبة: مدة العمل (إجمالي) − إضافي
 */
export function computeActualPeriodMinutes(row: DaySummaryResponseDto): number | null {
  const total = row.workedMinutes;
  if (total <= 0) return null;

  const insidePeriod = Math.max(0, total - row.overtimeMinutes);
  return insidePeriod > 0 ? insidePeriod : null;
}

/** Scheduled shift span from expected start/end (متوقع). */
export function computeExpectedMinutes(row: DaySummaryResponseDto): number | null {
  return isoDurationMinutes(row.expectedStartAt, row.expectedEndAt);
}

/** Total accounted work for the day — إجمالي مدة العمل من الخادم. */
export function computeTotalWorkedMinutes(row: DaySummaryResponseDto): number {
  return row.workedMinutes;
}
