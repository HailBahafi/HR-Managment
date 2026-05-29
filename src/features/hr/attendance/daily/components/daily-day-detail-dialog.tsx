'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Clock, LogIn, LogOut, Timer, AlertTriangle, CalendarDays, StickyNote, Plus } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DailyRegisterEventDialog } from '@/features/hr/attendance/daily/components/daily-register-event-dialog';
import { cn } from '@/shared/utils';
import type { AttendanceDaySummary } from '@/features/hr/attendance/lib/types';
import { STATUS } from '@/features/hr/attendance/daily/constants/daily-attendance-status';
import { resolveVisualKey } from '@/features/hr/attendance/daily/utils/daily-attendance-status-resolve';
import { minutesToHHMM, fmtFull } from '@/features/hr/attendance/daily/utils/daily-attendance-format';

function fmtTime(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    return format(parseISO(iso), 'HH:mm', { locale: arSA });
  } catch {
    return null;
  }
}

function StatRow({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  color?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
      <Icon className={cn('h-4 w-4 shrink-0', color ?? 'text-muted-foreground')} />
      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-semibold tabular-nums', color ?? 'text-foreground')}>{value}</span>
    </div>
  );
}

export function DailyDayDetailDialog({
  summary,
  open,
  onOpenChange,
  companyId,
}: {
  summary: AttendanceDaySummary | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId?: string;
}) {
  const [registerOpen, setRegisterOpen] = React.useState(false);
  if (!summary) return null;

  const vk = resolveVisualKey(summary.status);
  const cfg = STATUS[vk];
  const checkIn = fmtTime(summary.actualCheckInAt);
  const checkOut = fmtTime(summary.actualCheckOutAt);
  const expectedStart = fmtTime(summary.expectedStartAt);
  const expectedEnd = fmtTime(summary.expectedEndAt);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            تفاصيل يوم الحضور
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee + date header */}
          <div className="rounded-xl border border-border bg-muted/10 px-4 py-3 space-y-1">
            <p className="text-base font-semibold">{summary.employeeName}</p>
            <p className="text-xs text-muted-foreground">{fmtFull(summary.date)}</p>
            <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold mt-1', cfg.color)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
              {cfg.label}
            </span>
          </div>

          {/* Time details */}
          <div className="space-y-2">
            {expectedStart && (
              <StatRow icon={Clock} label="وقت الدوام المتوقع" value={expectedStart && expectedEnd ? `${expectedStart} — ${expectedEnd}` : expectedStart} color="text-muted-foreground" />
            )}
            <StatRow icon={LogIn} label="وقت الحضور الفعلي" value={checkIn} color="text-success" />
            <StatRow icon={LogOut} label="وقت الانصراف الفعلي" value={checkOut} color="text-blue-600 dark:text-blue-400" />
            {summary.workedMinutes > 0 && (
              <StatRow icon={Timer} label="مدة العمل" value={minutesToHHMM(summary.workedMinutes)} color="text-foreground" />
            )}
            {summary.lateMinutes > 0 && (
              <StatRow icon={AlertTriangle} label="دقائق التأخير" value={minutesToHHMM(summary.lateMinutes)} color="text-warning" />
            )}
            {summary.earlyLeaveMinutes > 0 && (
              <StatRow icon={AlertTriangle} label="دقائق الانصراف المبكر" value={minutesToHHMM(summary.earlyLeaveMinutes)} color="text-warning" />
            )}
            {summary.overtimeMinutes > 0 && (
              <StatRow icon={Timer} label="دقائق العمل الإضافي" value={minutesToHHMM(summary.overtimeMinutes)} color="text-success" />
            )}
            {summary.notes && (
              <StatRow icon={StickyNote} label="ملاحظات" value={summary.notes} />
            )}
          </div>

          {/* Empty state for no time data */}
          {!checkIn && !checkOut && summary.workedMinutes === 0 && !summary.notes && (
            <p className="text-center text-sm text-muted-foreground py-2">لا توجد بيانات تسجيل لهذا اليوم</p>
          )}
        </div>

        {companyId && (
          <DialogFooter>
            <Button
              type="button"
              className="w-full gap-2"
              onClick={() => { onOpenChange(false); setRegisterOpen(true); }}
            >
              <Plus className="h-4 w-4" />
              تسجيل حدث في هذا اليوم
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>

    {companyId && (
      <DailyRegisterEventDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        employeeId={summary.employeeId}
        employeeName={summary.employeeName}
        workDate={summary.date}
        companyId={companyId}
      />
    )}
    </>
  );
}
