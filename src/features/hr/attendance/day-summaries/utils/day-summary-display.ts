import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { minutesToHHMM } from '@/features/hr/attendance/daily/utils/daily-attendance-format';

export type DaySummaryDailyMetricKey =
  | 'expected'
  | 'total'
  | 'late'
  | 'earlyLeave'
  | 'shortage'
  | 'overtime';

const MINUTES_FIELD: Record<
  DaySummaryDailyMetricKey,
  keyof Pick<
    DaySummaryResponseDto,
    | 'expectedMinutes'
    | 'workedMinutes'
    | 'lateMinutes'
    | 'earlyLeaveMinutes'
    | 'shortageMinutes'
    | 'overtimeMinutes'
  >
> = {
  expected: 'expectedMinutes',
  total: 'workedMinutes',
  late: 'lateMinutes',
  earlyLeave: 'earlyLeaveMinutes',
  shortage: 'shortageMinutes',
  overtime: 'overtimeMinutes',
};

/** Minutes for a daily total metric — prefers API `dailyTotals.minutes`, then top-level fields. */
export function getDaySummaryMetricMinutes(
  row: DaySummaryResponseDto,
  key: DaySummaryDailyMetricKey,
): number {
  const fromTotals = row.dailyTotals?.minutes?.[key];
  if (typeof fromTotals === 'number' && Number.isFinite(fromTotals)) {
    return fromTotals;
  }

  const field = MINUTES_FIELD[key];
  const value = row[field];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (key === 'shortage') {
    const expected = getDaySummaryMetricMinutes(row, 'expected');
    const total = getDaySummaryMetricMinutes(row, 'total');
    return Math.max(0, expected - total);
  }

  return 0;
}

/** HH:MM display — prefers API `dailyTotals.display` (matches تفاصيل اليوم). */
export function formatDaySummaryMetric(
  row: DaySummaryResponseDto,
  key: DaySummaryDailyMetricKey,
): string | null {
  const display = row.dailyTotals?.display?.[key];
  if (display?.trim()) return display.trim();

  const minutes = getDaySummaryMetricMinutes(row, key);
  if (minutes <= 0) return null;
  return minutesToHHMM(minutes);
}
