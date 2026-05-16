'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';
import type { AttendanceDaySummary } from '@/features/hr/attendance/lib/types';
import { todayIso } from '@/features/hr/attendance/lib/utils';
import { cfgFor } from '@/features/hr/attendance/daily/utils/daily-attendance-status-resolve';
import { fmtDay, fmtDayFull, fmtDayShort, fmtDecimalHours } from '@/features/hr/attendance/daily/utils/daily-attendance-format';
import { Clock3 } from 'lucide-react';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import { DAILY_ATTENDANCE_NO_RECORDS } from '@/features/hr/attendance/daily/constants/daily-attendance-empty';
import { DailyAttendanceLegend } from '@/features/hr/attendance/daily/components/daily-attendance-legend';

const DAY_W = 36;

export function DailyMonthHeatmap({ summaries, dates }: { summaries: AttendanceDaySummary[]; dates: string[] }) {
  const byEmployee = React.useMemo(() => {
    const m = new Map<string, { name: string; id: string; byDate: Map<string, AttendanceDaySummary> }>();
    for (const s of summaries) {
      if (!m.has(s.employeeId)) m.set(s.employeeId, { name: s.employeeName, id: s.employeeId, byDate: new Map() });
      m.get(s.employeeId)!.byDate.set(s.date, s);
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [summaries]);

  if (byEmployee.length === 0) {
    return <EmptyStateCard icon={Clock3} {...DAILY_ATTENDANCE_NO_RECORDS} />;
  }

  const totalDaysWidth = dates.length * DAY_W;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-5 py-2.5">
        <span className="text-xs text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{dates.length}</span> يوم في النطاق — مرّر أفقياً
          لعرض كل الأيام
        </span>
        <DailyAttendanceLegend inline />
      </div>

      <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
        <div style={{ minWidth: `${totalDaysWidth + 160}px` }}>
          <table className="w-full table-fixed text-sm" style={{ minWidth: `${totalDaysWidth + 160}px` }}>
            <colgroup>
              <col style={{ width: 160 }} />
              {dates.map((d) => (
                <col key={d} style={{ width: DAY_W }} />
              ))}
              <col style={{ width: 72 }} />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                <th className="sticky right-0 z-10 bg-muted/40 px-4 py-3 text-right">الموظف</th>
                {dates.map((d) => (
                  <th key={d} className="px-0 pb-1 pt-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className="whitespace-nowrap text-[10px] font-medium text-muted-foreground"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', lineHeight: 1 }}
                      >
                        {fmtDayShort(d)}
                      </span>
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                          d === todayIso() ? 'bg-primary text-primary-foreground' : 'text-foreground',
                        )}
                      >
                        {fmtDay(d)}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-2 py-3 text-center text-[10px]">ملخص</th>
              </tr>
            </thead>
            <tbody>
              {byEmployee.map(({ name, id, byDate }) => {
                const allRows = [...byDate.values()];
                const workedM = allRows.reduce((a, s) => a + s.workedMinutes, 0);
                const lateM = allRows.reduce((a, s) => a + s.lateMinutes, 0);
                const absentDays = allRows.filter((s) => s.status === 'absent').length;

                return (
                  <tr key={id} className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/20">
                    <td className="sticky right-0 z-10 bg-card px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {name.charAt(0)}
                        </div>
                        <span className="whitespace-nowrap text-xs font-medium">{name}</span>
                      </div>
                    </td>
                    {dates.map((d) => {
                      const s = byDate.get(d);
                      if (!s) {
                        return (
                          <td key={d} className="px-0.5 py-2.5">
                            <div className="mx-auto h-7 rounded-md bg-muted/20" style={{ width: DAY_W - 4 }} />
                          </td>
                        );
                      }
                      const cfg = cfgFor(s.status);
                      return (
                        <td key={d} className="px-0.5 py-2.5">
                          <div
                            title={`${name} · ${fmtDayFull(d)} · ${cfg.label}${s.lateMinutes > 0 ? ` · تأخير ${s.lateMinutes}د` : ''}`}
                            className={cn(
                              'mx-auto flex h-7 cursor-default items-center justify-center rounded-md border transition-transform hover:scale-110',
                              cfg.color,
                            )}
                            style={{ width: DAY_W - 4 }}
                          >
                            <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-2 py-2.5">
                      <div className="flex flex-col items-center gap-0.5 text-center tabular-nums">
                        <span className="text-[9px] font-semibold text-success">{fmtDecimalHours(workedM / 60)}س</span>
                        {lateM > 0 && (
                          <span className="text-[9px] text-warning">{fmtDecimalHours(lateM / 60)}س⏱</span>
                        )}
                        {absentDays > 0 && <span className="text-[9px] text-destructive">{absentDays}غ</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
