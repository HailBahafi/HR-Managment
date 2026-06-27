import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { minutesToHHMM } from '@/features/hr/attendance/daily/utils/daily-attendance-format';
import { computeInsidePeriodMinutes } from '@/features/hr/attendance/day-summaries/utils/day-summary-metrics';

export type DaySummaryDailyMetricKey =
  | 'expected'
  | 'total'
  | 'late'
  | 'earlyLeave'
  | 'overtime'
  | 'shortage';

const MINUTES_FIELD: Record<
  DaySummaryDailyMetricKey,
  keyof Pick<
    DaySummaryResponseDto,
    'expectedMinutes' | 'workedMinutes' | 'lateMinutes' | 'earlyLeaveMinutes' | 'overtimeMinutes' | 'shortageMinutes'
  >
> = {
  expected: 'expectedMinutes',
  total: 'workedMinutes',
  late: 'lateMinutes',
  earlyLeave: 'earlyLeaveMinutes',
  overtime: 'overtimeMinutes',
  shortage: 'shortageMinutes',
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
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
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

export function getInsidePeriodMinutes(row: DaySummaryResponseDto): number | null {
  return computeInsidePeriodMinutes(row);
}

export function formatInsidePeriod(row: DaySummaryResponseDto): string | null {
  const minutes = getInsidePeriodMinutes(row);
  if (minutes == null || minutes <= 0) return null;
  return minutesToHHMM(minutes);
}
