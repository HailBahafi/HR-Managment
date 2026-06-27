import type {
  DaySummaryResponseDto,
  SettleDaySummaryDto,
} from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { getDaySummaryMetricMinutes } from '@/features/hr/attendance/day-summaries/utils/day-summary-display';

/** Both shortage and overtime must be positive to settle one against the other. */
export function canSettleDaySummary(row: DaySummaryResponseDto): boolean {
  const shortage = getDaySummaryMetricMinutes(row, 'shortage');
  const overtime = getDaySummaryMetricMinutes(row, 'overtime');
  return shortage > 0 && overtime > 0;
}

export function buildSettleDaySummaryPayload(row: DaySummaryResponseDto): SettleDaySummaryDto {
  const notes = row.notes?.trim();
  return notes ? { notes } : {};
}
