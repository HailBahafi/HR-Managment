import type {
  AttendanceEventResponseDto,
  DailyBreakdownPeriod,
  DailyBreakdownResponseDto,
} from '@/features/hr/attendance/types/api/attendance-events';
import type { CorrectionPeriodPunchesDto } from '@/features/hr/requests/types/api/correction-requests';
import {
  isoToTimePickerValue,
  timePickerToIso,
} from '@/features/hr/requests/attendance-corrections/lib/correction-period-time';

export type CorrectionFormPeriod = {
  periodId: string;
  labelAr: string;
  expectedRangeAr: string;
  recordedCheckIn: string;
  recordedCheckOut: string;
  correctedCheckIn: string;
  correctedCheckOut: string;
};

function trimShiftTime(value: string): string {
  const [h, m] = value.split(':');
  return `${h}:${m ?? '00'}`;
}

function punchAt(
  events: AttendanceEventResponseDto[],
  type: 'check_in' | 'check_out',
  last: boolean,
): string | null {
  const list = events
    .filter((e) => !e.isVoided && e.eventType === type)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  return (last ? list[list.length - 1] : list[0])?.occurredAt ?? null;
}

function resolvePeriodRecorded(
  period: DailyBreakdownPeriod,
  breakdown: DailyBreakdownResponseDto,
): { checkInAt: string | null; checkOutAt: string | null } {
  const singlePeriod = breakdown.periods.length === 1;
  let checkInAt = period.actual.checkInAt ?? punchAt(period.events, 'check_in', false);
  let checkOutAt = period.actual.checkOutAt ?? punchAt(period.events, 'check_out', true);

  if (singlePeriod) {
    if (!checkInAt) checkInAt = punchAt(breakdown.unmatchedEvents, 'check_in', false);
    if (!checkOutAt) checkOutAt = punchAt(breakdown.unmatchedEvents, 'check_out', true);
  }

  return { checkInAt, checkOutAt };
}

function defaultCorrectedIso(
  recorded: string | null,
  expected: string | null,
): string | null {
  return recorded ?? expected;
}

export function buildCorrectionFormPeriod(
  period: DailyBreakdownPeriod,
  breakdown: DailyBreakdownResponseDto,
  periodIndex: number,
): CorrectionFormPeriod {
  const offset = breakdown.timezoneOffsetMinutes;
  const multi = breakdown.periods.length > 1;
  const recorded = resolvePeriodRecorded(period, breakdown);
  const { expected } = period;

  const correctedInIso = defaultCorrectedIso(recorded.checkInAt, expected.startAt);
  const correctedOutIso = expected.checkOutNotRequired
    ? recorded.checkOutAt
    : defaultCorrectedIso(recorded.checkOutAt, expected.endAt);

  return {
    periodId: expected.periodId,
    labelAr: multi ? `وردية ${periodIndex + 1}` : 'الوردية',
    expectedRangeAr: `${trimShiftTime(expected.startTime)} — ${trimShiftTime(expected.endTime)}`,
    recordedCheckIn: isoToTimePickerValue(recorded.checkInAt, offset),
    recordedCheckOut: isoToTimePickerValue(recorded.checkOutAt, offset),
    correctedCheckIn: isoToTimePickerValue(correctedInIso, offset),
    correctedCheckOut: isoToTimePickerValue(correctedOutIso, offset),
  };
}

export function buildCorrectionFormPeriodsFromBreakdown(
  breakdown: DailyBreakdownResponseDto,
  onlyPeriodIndex?: number,
): CorrectionFormPeriod[] {
  const indices =
    onlyPeriodIndex != null
      ? [onlyPeriodIndex]
      : breakdown.periods.map((_, index) => index);

  return indices
    .filter((index) => breakdown.periods[index])
    .map((index) => buildCorrectionFormPeriod(breakdown.periods[index]!, breakdown, index));
}

export function formPeriodToApiPunches(
  workDate: string,
  timezoneOffsetMinutes: number,
  period: CorrectionFormPeriod,
): {
  periodId: string;
  recorded: CorrectionPeriodPunchesDto;
  corrected: CorrectionPeriodPunchesDto;
} {
  return {
    periodId: period.periodId,
    recorded: {
      checkInAt: timePickerToIso(workDate, period.recordedCheckIn, timezoneOffsetMinutes),
      checkOutAt: timePickerToIso(workDate, period.recordedCheckOut, timezoneOffsetMinutes),
    },
    corrected: {
      checkInAt: timePickerToIso(workDate, period.correctedCheckIn, timezoneOffsetMinutes),
      checkOutAt: timePickerToIso(workDate, period.correctedCheckOut, timezoneOffsetMinutes),
    },
  };
}
