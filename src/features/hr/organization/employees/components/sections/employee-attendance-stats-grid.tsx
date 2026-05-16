'use client';

import { cn } from '@/shared/utils';
import { fmtAttendanceHours } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';

type Stat = {
  label: string;
  title: string;
  display: string;
  active: boolean;
  color: 'success' | 'warning' | 'destructive';
};

export function EmployeeAttendanceStatsGrid(p: {
  presentDays: number;
  lateHours: number;
  absentDays: number;
  earlyLeaveDays: number;
}) {
  const items: Stat[] = [
    { label: 'حاضر', title: 'عدد أيام الحضور (حالة حاضر)', display: String(p.presentDays), active: p.presentDays > 0, color: 'success' },
    { label: 'متأخر', title: 'إجمالي وقت التأخير بالساعات (مجموع الدقائق)', display: fmtAttendanceHours(p.lateHours), active: p.lateHours > 0, color: 'warning' },
    { label: 'غائب', title: 'عدد أيام الغياب', display: String(p.absentDays), active: p.absentDays > 0, color: 'destructive' },
    { label: 'خروج مبكر', title: 'عدد أيام الانصراف المبكر', display: String(p.earlyLeaveDays), active: p.earlyLeaveDays > 0, color: 'warning' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map((s) => (
        <div
          key={s.label}
          title={s.title}
          className={cn(
            'rounded-xl border p-3 bg-card',
            s.active
              ? s.color === 'success'
                ? 'border-success/40 bg-success/5'
                : s.color === 'warning'
                  ? 'border-warning/40 bg-warning/5'
                  : 'border-destructive/40 bg-destructive/5'
              : 'border-border/60',
          )}
        >
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{s.label}</div>
          <div
            className={cn(
              'font-arabic-display text-xl font-semibold tabular-nums number-ar',
              s.active
                ? s.color === 'success'
                  ? 'text-success'
                  : s.color === 'warning'
                    ? 'text-warning'
                    : 'text-destructive'
                : 'text-foreground',
            )}
          >
            {s.display}
          </div>
        </div>
      ))}
    </div>
  );
}
