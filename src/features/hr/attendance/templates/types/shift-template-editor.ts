import type { ShiftPeriod, WeekDayIndex } from '@/lib/attendance/types';

export type ShiftGroup = {
  id: string;
  days: WeekDayIndex[];
  periods: ShiftPeriod[];
};
