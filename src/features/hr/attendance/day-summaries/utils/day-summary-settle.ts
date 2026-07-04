import type {
  DaySummaryResponseDto,
  SettleDaySummaryDto,
} from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { getDaySummaryMetricMinutes } from '@/features/hr/attendance/day-summaries/utils/day-summary-display';

export type DaySummarySettlePlan = {
  shortageMinutes: number;
  outsidePeriodMinutes: number;
  overtimeMinutes: number;
  transferMinutes: number;
  after: {
    shortageMinutes: number;
    outsidePeriodMinutes: number;
    overtimeMinutes: number;
  };
};

export function getDaySummaryShortageMinutes(row: DaySummaryResponseDto): number {
  return getDaySummaryMetricMinutes(row, 'shortage');
}

export function getDaySummaryOutsidePeriodMinutes(row: DaySummaryResponseDto): number {
  return getDaySummaryMetricMinutes(row, 'outsidePeriods');
}

/** Net shortage against outside-period work: min(shortage, outsidePeriods). */
export function computeDaySummarySettlePlan(row: DaySummaryResponseDto): DaySummarySettlePlan {
  const shortageMinutes = getDaySummaryShortageMinutes(row);
  const outsidePeriodMinutes = getDaySummaryOutsidePeriodMinutes(row);
  const overtimeMinutes = getDaySummaryMetricMinutes(row, 'overtime');

  const transferMinutes = Math.min(shortageMinutes, outsidePeriodMinutes);

  return {
    shortageMinutes,
    outsidePeriodMinutes,
    overtimeMinutes,
    transferMinutes,
    after: {
      shortageMinutes: shortageMinutes - transferMinutes,
      outsidePeriodMinutes: outsidePeriodMinutes - transferMinutes,
      overtimeMinutes: Math.max(0, overtimeMinutes - transferMinutes),
    },
  };
}

export function canSettleDaySummary(row: DaySummaryResponseDto): boolean {
  if (typeof row.canSettle === 'boolean') {
    return row.canSettle;
  }
  const plan = computeDaySummarySettlePlan(row);
  return (
    plan.transferMinutes > 0 &&
    plan.shortageMinutes > 0 &&
    plan.outsidePeriodMinutes > 0 &&
    !row.isSettled &&
    !row.isFinalized
  );
}

export function buildSettleDaySummaryPayload(
  updatedBy?: string | null,
): SettleDaySummaryDto {
  return updatedBy ? { updatedBy } : {};
}
