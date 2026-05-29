/** Visual keys for daily attendance UI (maps domain statuses). */
export const STATUS = {
  present: {
    label: 'حاضر',
    color: 'bg-success/10 text-success border-success/30',
    dot: 'bg-success',
    bar: 'bg-success',
  },
  late: {
    label: 'متأخر',
    color: 'bg-warning/10 text-warning border-warning/30',
    dot: 'bg-warning',
    bar: 'bg-warning',
  },
  absent: {
    label: 'غائب',
    color: 'bg-destructive/10 text-destructive border-destructive/30',
    dot: 'bg-destructive',
    bar: 'bg-destructive/60',
  },
  early_leave: {
    label: 'انصراف مبكر',
    color: 'bg-warning/15 text-warning border-warning/40',
    dot: 'bg-warning',
    bar: 'bg-warning/70',
  },
  holiday: {
    label: 'عطلة رسمية',
    color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800',
    dot: 'bg-purple-500',
    bar: 'bg-purple-400',
  },
  rest_day: {
    label: 'يوم راحة',
    color: 'bg-muted/50 text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
    bar: 'bg-muted-foreground/50',
  },
  unscheduled: {
    label: 'غير مجدول',
    color: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700',
    dot: 'bg-slate-400',
    bar: 'bg-slate-300',
  },
  on_leave: {
    label: 'إجازة',
    color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
    dot: 'bg-blue-500',
    bar: 'bg-blue-400',
  },
} as const;

export type StatusVisualKey = keyof typeof STATUS;

export const ATT_VISUAL_STATUS_ORDER: StatusVisualKey[] = [
  'present',
  'late',
  'absent',
  'early_leave',
  'on_leave',
  'holiday',
  'rest_day',
  'unscheduled',
];

export const DEFAULT_ABSENT_DAY_HOURS = 8;
