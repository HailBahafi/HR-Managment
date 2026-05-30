'use client';

import * as React from 'react';
import { parseISO } from 'date-fns';
import {
  Clock, LogIn, LogOut, Timer, AlertTriangle, CalendarDays,
  StickyNote, Plus, Coffee, Loader2,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DailyRegisterEventDialog } from '@/features/hr/attendance/daily/components/daily-register-event-dialog';
import { cn } from '@/shared/utils';
import type { AttendanceDaySummary } from '@/features/hr/attendance/lib/types';
import { attendanceEventsApi, type AttendanceEventResponseDto, type AttendanceEventType } from '@/features/hr/attendance/lib/api/attendance-events';
import { STATUS } from '@/features/hr/attendance/daily/constants/daily-attendance-status';
import { resolveVisualKey } from '@/features/hr/attendance/daily/utils/daily-attendance-status-resolve';
import { minutesToHHMM, fmtFull } from '@/features/hr/attendance/daily/utils/daily-attendance-format';

function fmtTime(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    const d = parseISO(iso);
    const h24 = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, '0');
    const period = h24 < 12 ? 'ص' : 'م';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${mm} ${period}`;
  } catch { return null; }
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

const EVENT_META: Record<AttendanceEventType, { labelAr: string; icon: React.ElementType; color: string }> = {
  check_in:    { labelAr: 'دخول',           icon: LogIn,   color: 'text-emerald-600' },
  check_out:   { labelAr: 'خروج',           icon: LogOut,  color: 'text-sky-600' },
  break_start: { labelAr: 'بداية استراحة',  icon: Coffee,  color: 'text-amber-600' },
  break_end:   { labelAr: 'نهاية استراحة',  icon: Coffee,  color: 'text-orange-600' },
};

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
  const [events, setEvents] = React.useState<AttendanceEventResponseDto[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Fetch events whenever the dialog opens for a specific employee+date
  React.useEffect(() => {
    if (!open || !summary || !companyId) return;
    setLoading(true);
    setEvents([]);
    void attendanceEventsApi.getAll({
      companyId,
      employeeId: summary.employeeId,
      workDateFrom: summary.date,
      workDateTo: summary.date,
      limit: 200,
    }).then((res) => {
      setEvents(res.items.filter((e) => !e.isVoided));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [open, summary?.employeeId, summary?.date, companyId]);

  if (!summary) return null;

  const vk = resolveVisualKey(summary.status);
  const cfg = STATUS[vk];
  const expectedStart = fmtTime(summary.expectedStartAt);
  const expectedEnd = fmtTime(summary.expectedEndAt);

  const sortedEvents = [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

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

            {/* Summary stats from day summary */}
            <div className="space-y-2">
              {expectedStart && (
                <StatRow icon={Clock} label="وقت الدوام المتوقع" value={expectedStart && expectedEnd ? `${expectedStart} — ${expectedEnd}` : expectedStart} color="text-muted-foreground" />
              )}
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

            {/* Events list fetched from API */}
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">أحداث التسجيل</p>

              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : sortedEvents.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-3">لا توجد أحداث مسجلة لهذا اليوم</p>
              ) : (
                <div className="space-y-1.5">
                  {sortedEvents.map((evt) => {
                    const meta = EVENT_META[evt.eventType];
                    const Icon = meta.icon;
                    return (
                      <div key={evt.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-2.5">
                        <Icon className={cn('h-3.5 w-3.5 shrink-0', meta.color)} />
                        <span className="flex-1 text-sm">{meta.labelAr}</span>
                        <span className="font-mono text-xs tabular-nums text-muted-foreground" dir="ltr">
                          {fmtTime(evt.occurredAt)}
                        </span>
                        {evt.source === 'manual_hr' && (
                          <span className="text-[10px] text-muted-foreground/60">يدوي</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
