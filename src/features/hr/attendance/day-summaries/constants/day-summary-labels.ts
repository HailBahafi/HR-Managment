import type { AttendanceDayStatus } from '@/features/hr/attendance/lib/api/attendance-day-summaries';

export const DAY_SUMMARY_STATUS_LABELS: Record<AttendanceDayStatus, string> = {
  present: 'حاضر',
  late: 'متأخر',
  absent: 'غائب',
  rest_day: 'يوم راحة',
  unscheduled: 'غير مجدول',
  holiday: 'عطلة رسمية',
  on_leave: 'إجازة',
};

export const DAY_SUMMARY_STATUS_ORDER: AttendanceDayStatus[] = [
  'present',
  'late',
  'absent',
  'on_leave',
  'holiday',
  'rest_day',
  'unscheduled',
];

export const DAY_SUMMARY_STATUS_BADGE: Record<AttendanceDayStatus, string> = {
  present: 'bg-success/10 text-success border-success/30',
  late: 'bg-warning/10 text-warning border-warning/30',
  absent: 'bg-destructive/10 text-destructive border-destructive/30',
  rest_day: 'bg-muted/50 text-muted-foreground border-border',
  unscheduled: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400',
  holiday: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300',
  on_leave: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300',
};

export const AR_MONTH_NAMES = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;
