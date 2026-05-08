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
    label: 'عطلة',
    color: 'bg-muted/50 text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
    bar: 'bg-muted-foreground/50',
  },
} as const;

export type StatusVisualKey = keyof typeof STATUS;

export const ATT_VISUAL_STATUS_ORDER: StatusVisualKey[] = [
  'present',
  'late',
  'absent',
  'early_leave',
  'holiday',
];

export const DEFAULT_ABSENT_DAY_HOURS = 8;
