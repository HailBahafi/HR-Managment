'use client';

import Link from 'next/link';
import { Calendar, CheckCircle2, CircleDot, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/shared/utils';
import { Empty } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import type { AttendanceEvent } from '@/features/hr/attendance/lib/types';

type Props = { employeeEvents: AttendanceEvent[] };

export function EmployeeAttendanceRecentEvents({ employeeEvents }: Props) {
  const srcLabel: Record<string, string> = { device: 'جهاز', manual: 'يدوي', gps: 'GPS' };
  const parseMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const durLabel = (from: string, to: string) => {
    const d = parseMins(to) - parseMins(from);
    if (d <= 0) return null;
    const h = Math.floor(d / 60);
    const m = d % 60;
    return h > 0 ? `${h}س${m > 0 ? ` ${m}د` : ''}` : `${m}د`;
  };

  const grouped = new Map<string, { checkIn?: AttendanceEvent; checkOut?: AttendanceEvent }>();
  for (const evt of [...employeeEvents].sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at))) {
    if (!grouped.has(evt.date)) grouped.set(evt.date, {});
    const g = grouped.get(evt.date)!;
    if (evt.type === 'check_in' && !g.checkIn) g.checkIn = evt;
    if (evt.type === 'check_out') g.checkOut = evt;
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
            const dur = g.checkIn && g.checkOut ? durLabel(g.checkIn.at, g.checkOut.at) : null;
            const hasIn = !!g.checkIn;
            const hasOut = !!g.checkOut;
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
                      {hasIn && !hasOut ? 'لم يتسجل خروج' : !hasIn && hasOut ? 'لم يتسجل دخول' : ''}
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
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                        <div className={cn('font-mono text-base font-bold tabular-nums leading-tight', event ? color : 'text-muted-foreground/30')}>
                          {event?.at ?? '——:——'}
                        </div>
                        {event?.source && (
                          <div className="text-[10px] text-muted-foreground/50">{srcLabel[event.source] ?? event.source}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
