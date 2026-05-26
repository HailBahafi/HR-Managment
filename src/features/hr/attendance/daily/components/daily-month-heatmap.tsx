'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';
import type { AttendanceDaySummary } from '@/features/hr/attendance/lib/types';
import { todayIso } from '@/features/hr/attendance/lib/utils';
import { cfgFor, resolveVisualKey } from '@/features/hr/attendance/daily/utils/daily-attendance-status-resolve';
import { STATUS } from '@/features/hr/attendance/daily/constants/daily-attendance-status';
import { fmtDay, fmtDayShort, fmtDecimalHours, minutesToHHMM } from '@/features/hr/attendance/daily/utils/daily-attendance-format';
import { Clock3, TrendingUp } from 'lucide-react';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import { DAILY_ATTENDANCE_NO_RECORDS } from '@/features/hr/attendance/daily/constants/daily-attendance-empty';

// ─── per-employee summary row ─────────────────────────────────────────────────

type EmpRow = {
  id: string;
  name: string;
  byDate: Map<string, AttendanceDaySummary>;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  earlyDays: number;
  workedMinutes: number;
  lateMinutes: number;
  attendanceRate: number;
};

function buildRows(summaries: AttendanceDaySummary[], dates: string[]): EmpRow[] {
  const m = new Map<string, EmpRow>();

  for (const s of summaries) {
    if (!m.has(s.employeeId)) {
      m.set(s.employeeId, {
        id: s.employeeId,
        name: s.employeeName,
        byDate: new Map(),
        presentDays: 0, lateDays: 0, absentDays: 0, earlyDays: 0,
        workedMinutes: 0, lateMinutes: 0, attendanceRate: 0,
      });
    }
    const row = m.get(s.employeeId)!;
    row.byDate.set(s.date, s);
    const vk = resolveVisualKey(s.status);
    if (vk === 'present') row.presentDays++;
    else if (vk === 'late') { row.lateDays++; row.lateMinutes += s.lateMinutes; }
    else if (vk === 'absent') row.absentDays++;
    else if (vk === 'early_leave') row.earlyDays++;
    row.workedMinutes += s.workedMinutes;
  }

  const workingDays = dates.length;
  for (const row of m.values()) {
    const total = row.presentDays + row.lateDays + row.earlyDays;
    row.attendanceRate = workingDays > 0 ? Math.round((total / workingDays) * 100) : 0;
  }

  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
}

// ─── attendance rate ring ─────────────────────────────────────────────────────

function RateRing({ rate }: { rate: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;
  const color = rate >= 90 ? '#22c55e' : rate >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0 -rotate-90">
      <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="3"
        className="text-border" />
      <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      <text x="18" y="18" dominantBaseline="middle" textAnchor="middle"
        className="rotate-90 fill-foreground"
        style={{ fontSize: 8, fontWeight: 700, transform: 'rotate(90deg)', transformOrigin: '18px 18px' }}>
        {rate}%
      </text>
    </svg>
  );
}

// ─── stat chip ────────────────────────────────────────────────────────────────

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  if (value === 0) return null;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums', color)}>
      {value} {label}
    </span>
  );
}

// ─── day cell ─────────────────────────────────────────────────────────────────

function DayCell({ date, summary }: { date: string; summary: AttendanceDaySummary | undefined }) {
  const today = date === todayIso();
  if (!summary) {
    return (
      <div title={date} className={cn(
        'flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-medium transition-colors',
        today ? 'ring-2 ring-primary ring-offset-1' : '',
        'bg-muted/20 text-muted-foreground/30',
      )}>
        {fmtDay(date)}
      </div>
    );
  }
  const cfg = cfgFor(summary.status);
  const tip = [
    fmtDayShort(date),
    cfg.label,
    summary.lateMinutes > 0 ? `تأخير ${minutesToHHMM(summary.lateMinutes)}` : null,
    summary.workedMinutes > 0 ? `عمل ${minutesToHHMM(summary.workedMinutes)}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div
      title={tip}
      className={cn(
        'relative flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-semibold transition-all hover:scale-110 cursor-default',
        cfg.color,
        today ? 'ring-2 ring-primary ring-offset-1' : '',
      )}
    >
      {fmtDay(date)}
      {summary.lateMinutes > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-warning" />
      )}
    </div>
  );
}

// ─── employee card ────────────────────────────────────────────────────────────

function EmployeeCard({ row, dates }: { row: EmpRow; dates: string[] }) {
  const [expanded, setExpanded] = React.useState(false);

  // group dates into weeks (rows of 7)
  const weeks = React.useMemo(() => {
    const chunks: string[][] = [];
    for (let i = 0; i < dates.length; i += 7) chunks.push(dates.slice(i, i + 7));
    return chunks;
  }, [dates]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden transition-all hover:shadow-elevated">
      {/* Card header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-right hover:bg-muted/20 transition-colors"
      >
        {/* Avatar */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white"
          style={{ background: `hsl(${(row.name.charCodeAt(0) * 37) % 360} 55% 45%)` }}
        >
          {row.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
        </div>

        {/* Name + chips */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{row.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Chip label="حاضر"  value={row.presentDays} color={STATUS.present.color} />
            <Chip label="متأخر" value={row.lateDays}    color={STATUS.late.color} />
            <Chip label="غائب"  value={row.absentDays}  color={STATUS.absent.color} />
            <Chip label="مبكر"  value={row.earlyDays}   color={STATUS.early_leave.color} />
          </div>
        </div>

        {/* Rate ring */}
        <RateRing rate={row.attendanceRate} />

        {/* Hours */}
        <div className="hidden sm:flex flex-col items-end shrink-0 min-w-[56px]">
          <span className="text-xs font-bold tabular-nums text-foreground">
            {fmtDecimalHours(row.workedMinutes / 60)}
            <span className="text-[10px] font-normal text-muted-foreground ms-0.5">س</span>
          </span>
          {row.lateMinutes > 0 && (
            <span className="text-[10px] tabular-nums text-warning">
              +{minutesToHHMM(row.lateMinutes)} تأخير
            </span>
          )}
        </div>

        {/* Expand chevron */}
        <span className={cn('ms-1 text-muted-foreground/40 transition-transform text-xs shrink-0', expanded ? 'rotate-180' : '')}>
          ▼
        </span>
      </button>

      {/* Calendar grid — expanded */}
      {expanded && (
        <div className="border-t border-border/60 bg-muted/10 px-4 py-4 space-y-3">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'].map((d, i) => (
              <div key={i} className="flex h-5 items-center justify-center text-[9px] font-semibold text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, di) => {
                const date = week[di];
                if (!date) return <div key={di} className="h-7 w-7" />;
                return <DayCell key={date} date={date} summary={row.byDate.get(date)} />;
              })}
            </div>
          ))}

          {/* Footer stats */}
          <div className="flex flex-wrap gap-3 border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              إجمالي العمل: <strong className="text-foreground ms-0.5 tabular-nums">{minutesToHHMM(row.workedMinutes)}</strong>
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              نسبة الحضور: <strong className="text-foreground ms-0.5 tabular-nums">{row.attendanceRate}%</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {Object.entries(STATUS).map(([key, cfg]) => (
        <span key={key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn('h-2.5 w-2.5 rounded-full', cfg.dot)} />
          {cfg.label}
        </span>
      ))}
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="relative h-2.5 w-2.5 rounded-full bg-warning">
          <span className="absolute -top-px -right-px h-1.5 w-1.5 rounded-full bg-warning" />
        </span>
        تأخير
      </span>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DailyMonthHeatmap({
  summaries,
  dates,
}: {
  summaries: AttendanceDaySummary[];
  dates: string[];
}) {
  const rows = React.useMemo(() => buildRows(summaries, dates), [summaries, dates]);

  if (rows.length === 0) {
    return <EmptyStateCard icon={Clock3} {...DAILY_ATTENDANCE_NO_RECORDS} />;
  }

  // summary stats across all employees
  const totalPresent = rows.reduce((a, r) => a + r.presentDays, 0);
  const totalLate    = rows.reduce((a, r) => a + r.lateDays, 0);
  const totalAbsent  = rows.reduce((a, r) => a + r.absentDays, 0);
  const avgRate      = Math.round(rows.reduce((a, r) => a + r.attendanceRate, 0) / rows.length);

  return (
    <div className="space-y-4">
      {/* ── Top summary strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'إجمالي الحضور', value: totalPresent, color: 'text-success', bg: 'bg-success/10 border-success/20' },
          { label: 'أيام التأخير',  value: totalLate,    color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
          { label: 'أيام الغياب',   value: totalAbsent,  color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
          { label: 'متوسط الالتزام', value: `${avgRate}%`, color: avgRate >= 90 ? 'text-success' : avgRate >= 70 ? 'text-warning' : 'text-destructive', bg: 'bg-muted border-border' },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-xl border px-4 py-3', s.bg)}>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
            <p className={cn('mt-0.5 text-xl font-bold tabular-nums', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{rows.length}</span> موظف ·{' '}
          <span className="tabular-nums">{dates.length}</span> يوم · انقر على بطاقة لعرض التفاصيل
        </p>
        <Legend />
      </div>

      {/* ── Employee cards ── */}
      <div className="space-y-2">
        {rows.map((row) => (
          <EmployeeCard key={row.id} row={row} dates={dates} />
        ))}
      </div>
    </div>
  );
}
