import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';

/** Minutes between two ISO timestamps (start → end). */
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

/** Overlap of actual presence with scheduled period bounds (both ISO instants). */
export function overlapIntervalMinutes(
  actualStartAt: string,
  actualEndAt: string,
  periodStartAt: string,
  periodEndAt: string,
): number {
  const actualStartMs = new Date(actualStartAt).getTime();
  const actualEndMs = new Date(actualEndAt).getTime();
  const periodStartMs = new Date(periodStartAt).getTime();
  const periodEndMs = new Date(periodEndAt).getTime();

  if (
    !Number.isFinite(actualStartMs) ||
    !Number.isFinite(actualEndMs) ||
    !Number.isFinite(periodStartMs) ||
    !Number.isFinite(periodEndMs)
  ) {
    return 0;
  }

  const startMs = Math.max(actualStartMs, periodStartMs);
  const endMs = Math.min(actualEndMs, periodEndMs);
  if (endMs <= startMs) return 0;

  return Math.round((endMs - startMs) / 60000);
}

/** Raw punch span — الفارق بين أول حضور وآخر انصراف. */
export function computePunchSpanMinutes(row: DaySummaryResponseDto): number | null {
  return isoDurationMinutes(row.actualCheckInAt, row.actualCheckOutAt);
}

/** Scheduled shift span from expected start/end (متوقع). */
export function computeExpectedMinutes(row: DaySummaryResponseDto): number | null {
  return isoDurationMinutes(row.expectedStartAt, row.expectedEndAt);
}

/** Total accounted work for the day — فعلي / إجمالي من الخادم. */
export function computeTotalWorkedMinutes(row: DaySummaryResponseDto): number {
  return row.workedMinutes;
}

export function canComputePeriodOverlap(row: DaySummaryResponseDto): boolean {
  return Boolean(
    row.actualCheckInAt &&
      row.actualCheckOutAt &&
      row.expectedStartAt &&
      row.expectedEndAt,
  );
}

/**
 * Work inside scheduled period(s) — تقاطع التسجيل الفعلي مع [بداية متوقعة، نهاية متوقعة].
 * مثال: دوام 2:00 م–10:00 م، خروج 4:03 م → داخل الفترات = 2:03.
 */
export function computeInsidePeriodMinutes(row: DaySummaryResponseDto): number | null {
  if (canComputePeriodOverlap(row)) {
    const overlap = overlapIntervalMinutes(
      row.actualCheckInAt!,
      row.actualCheckOutAt!,
      row.expectedStartAt!,
      row.expectedEndAt!,
    );
    return overlap > 0 ? overlap : null;
  }

  const total = row.workedMinutes;
  if (total <= 0) return null;

  const inside = Math.max(0, total - row.overtimeMinutes);
  return inside > 0 ? inside : null;
}

/** Whether الإجمالي differs from داخل الفترات. */
export function hasWorkedOutsidePeriod(row: DaySummaryResponseDto): boolean {
  const inside = computeInsidePeriodMinutes(row);
  if (inside == null) return false;
  return row.workedMinutes > 0 && inside !== row.workedMinutes;
}

/** @deprecated Use hasWorkedOutsidePeriod */
export function hasOvertimeSplit(row: DaySummaryResponseDto): boolean {
  return row.overtimeMinutes > 0 || hasWorkedOutsidePeriod(row);
}
