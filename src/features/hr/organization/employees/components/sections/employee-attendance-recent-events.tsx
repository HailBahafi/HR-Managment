'use client';

import Link from 'next/link';
import { Calendar, CheckCircle2, CircleDot, Clock, Coffee, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/shared/utils';
import { Empty } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import type { AttendanceEventResponseDto } from '@/features/hr/attendance/lib/api/attendance-events';

type Props = { employeeEvents: AttendanceEventResponseDto[] };

const SRC_LABEL: Record<string, string> = {
  mobile_app: 'تطبيق', web_portal: 'بوابة', kiosk: 'كشك',
  manual_hr: 'يدوي', biometric: 'بصمة', system: 'نظام',
};

/** ISO timestamp → "h:mm ص/م" in local time. Events arrive as full ISO (e.g. 2026-05-11T05:20:00.000Z). */
function fmtTime(iso?: string | null): string {
  if (!iso) return '——:——';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h < 12 ? 'ص' : 'م';
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${m} ${period}`;
}

function durLabel(fromIso?: string | null, toIso?: string | null): string | null {
  if (!fromIso || !toIso) return null;
  const mins = (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000;
  if (!Number.isFinite(mins) || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}س${m > 0 ? ` ${m}د` : ''}` : `${m}د`;
}

type DayGroup = {
  checkIn?: AttendanceEventResponseDto;
  checkOut?: AttendanceEventResponseDto;
  breakStart?: AttendanceEventResponseDto;
  breakEnd?: AttendanceEventResponseDto;
};

export function EmployeeAttendanceRecentEvents({ employeeEvents }: Props) {
  const grouped = new Map<string, DayGroup>();
  for (const evt of [...employeeEvents]
    .filter((e) => !e.isVoided)
    .sort((a, b) => b.workDate.localeCompare(a.workDate) || a.occurredAt.localeCompare(b.occurredAt))) {
    if (!grouped.has(evt.workDate)) grouped.set(evt.workDate, {});
    const g = grouped.get(evt.workDate)!;
    if (evt.eventType === 'check_in' && !g.checkIn) g.checkIn = evt;
    if (evt.eventType === 'check_out') g.checkOut = evt;
    if (evt.eventType === 'break_start' && !g.breakStart) g.breakStart = evt;
    if (evt.eventType === 'break_end') g.breakEnd = evt;
  }
  const days = [...grouped.entries()];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground/70">آخر حركات الحضور</h3>
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-[11px] px-2" asChild>
          <Link href="/hr/attendance/daily"><ExternalLink className="h-3 w-3" /> الكل</Link>
        </Button>
      </div>

      {days.length > 0 ? (
        <div className="space-y-2">
          {days.map(([date, g]) => {
            const dur = durLabel(g.checkIn?.occurredAt, g.checkOut?.occurredAt);
            const brk = durLabel(g.breakStart?.occurredAt, g.breakEnd?.occurredAt);
            const hasIn = !!g.checkIn;
            const hasOut = !!g.checkOut;
            const location = g.checkIn?.checkInPointNameAr ?? g.checkOut?.checkInPointNameAr ?? null;
            return (
              <div key={date} className="overflow-hidden rounded-xl border bg-card">
                <div className="flex items-center gap-2 border-b border-border/40 bg-muted/20 px-4 py-2">
                  <Calendar className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                  <span className="text-[11px] font-medium text-muted-foreground">{formatDate(date)}</span>
                  {dur ? (
                    <span className="mr-auto flex items-center gap-1 font-mono text-[11px] text-primary/70">
                      <Clock className="h-3 w-3" />
                      {dur}
                    </span>
                  ) : !hasIn && !hasOut ? null : (
                    <span className="mr-auto text-[10px] text-muted-foreground/50">
                      {hasIn && !hasOut ? 'لم يُسجّل خروج' : !hasIn && hasOut ? 'لم يُسجّل دخول' : ''}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 divide-x divide-x-reverse divide-border/30">
                  {([
                    { key: 'in', event: g.checkIn, label: 'دخول', Icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
                    { key: 'out', event: g.checkOut, label: 'خروج', Icon: CircleDot, color: 'text-warning', bg: 'bg-warning/10' },
                  ] as const).map(({ key, event, label, Icon, color, bg }) => (
                    <div key={key} className={cn('flex items-center gap-3 px-4 py-3 transition-colors', !event && 'opacity-35')}>
                      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', bg, color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                        <div className={cn('font-mono text-base font-bold tabular-nums leading-tight', event ? color : 'text-muted-foreground/30')}>
                          {fmtTime(event?.occurredAt)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-1.5 text-[10px] text-muted-foreground/50">
                          {event?.source && <span>{SRC_LABEL[event.source] ?? event.source}</span>}
                          {event?.notes && <span className="truncate" title={event.notes}>· {event.notes}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {(location || brk) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/30 px-4 py-1.5 text-[10px] text-muted-foreground/70">
                    {location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {location}
                      </span>
                    )}
                    {brk && (
                      <span className="inline-flex items-center gap-1">
                        <Coffee className="h-3 w-3" /> استراحة {brk}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon={Clock} text="لا توجد حركات حضور حتى الآن" />
      )}
    </div>
  );
}
