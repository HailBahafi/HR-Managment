import type { DaySummaryStatus } from '@/features/hr/attendance/lib/types';
import { STATUS, type StatusVisualKey } from '@/features/hr/attendance/daily/constants/daily-attendance-status';

export function resolveVisualKey(s: DaySummaryStatus): StatusVisualKey {
  if (s === 'holiday') return 'holiday';
  if (s === 'overtime') return 'present';
  if (s === 'incomplete') return 'absent';
  if (s === 'present' || s === 'late' || s === 'absent' || s === 'early_leave') return s;
  return 'present';
}

export function cfgFor(s: DaySummaryStatus) {
  return STATUS[resolveVisualKey(s)];
}
