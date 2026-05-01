'use client';

import * as React from 'react';
import { format, subDays, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { arSA } from 'date-fns/locale';
import {
  LayoutList, Clock3,
  TrendingUp, Users, Timer, CalendarDays, Calendar,
} from 'lucide-react';
import { EmployeePicker } from '@/components/ui/employee-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePageFilters } from '@/components/filter-panel-context';
import { useAttendanceStore } from '@/lib/attendance/store';
import type { AttendanceDaySummary, AttendanceEvent, DaySummaryStatus } from '@/lib/attendance/types';
import { enumerateDates, minutesFromMidnight, todayIso } from '@/lib/attendance/utils';
import { cn } from '@/lib/utils';

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS: Record<DaySummaryStatus, { label: string; color: string; dot: string; bar: string }> = {
  present:     { label: 'حاضر',         color: 'bg-success/10 text-success border-success/30',             dot: 'bg-success',            bar: 'bg-success' },
  late:        { label: 'متأخر',        color: 'bg-warning/10 text-warning border-warning/30',             dot: 'bg-warning',            bar: 'bg-warning' },
  absent:      { label: 'غائب',         color: 'bg-destructive/10 text-destructive border-destructive/30', dot: 'bg-destructive',        bar: 'bg-destructive/60' },
  early_leave: { label: 'انصراف مبكر', color: 'bg-warning/10 text-warning border-warning/30',             dot: 'bg-warning/70',         bar: 'bg-warning/60' },
  incomplete:  { label: 'غير مكتمل',  color: 'bg-muted text-muted-foreground border-border',              dot: 'bg-muted-foreground',   bar: 'bg-muted-foreground/40' },
  overtime:    { label: 'تمديد',        color: 'bg-primary/10 text-primary border-primary/30',             dot: 'bg-primary',            bar: 'bg-primary' },
};

type ViewMode = 'grid' | 'timeline';
type Preset   = 'day' | 'week' | 'month' | 'custom';

// Full Arabic day name
function fmtDayFull(iso: string) {
  return format(parseISO(iso + 'T12:00:00'), 'EEEE', { locale: arSA });
}
// Full readable Arabic day name for compact columns (rotated vertically in month view)
const DAY_NAMES_AR: Record<number, string> = { 0:'الاثنين', 1:'الثلاثاء', 2:'الأربعاء', 3:'الخميس', 4:'الجمعة', 5:'السبت', 6:'الأحد' };
function fmtDayShort(iso: string) {
  const dow = parseISO(iso + 'T12:00:00').getDay();
  return DAY_NAMES_AR[dow] ?? '';
}
function fmtDay(iso: string) { return format(parseISO(iso), 'd', { locale: arSA }); }
function fmtFull(iso: string) { return format(parseISO(iso + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: arSA }); }
function fmtMonthYear(iso: string) { return format(parseISO(iso + 'T12:00:00'), 'MMMM yyyy', { locale: arSA }); }

function minutesToHHMM(m: number) {
  const h = Math.floor(m / 60) % 24;
  const mn = m % 60;
  return `${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}`;
}

const DEFAULT_ABSENT_DAY_HOURS = 8;

function fmtDecimalHours(hours: number): string {
  if (!Number.isFinite(hours) || hours === 0) return '0';
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

// ─── Main component ──────────────────────────────────────────────────────────

export function DailyAttendancePanel() {
  const daySummaries = useAttendanceStore((s) => s.daySummaries);
  const events       = useAttendanceStore((s) => s.events);

  const [preset, setPreset] = React.useState<Preset>('week');
  const [view, setView] = React.useState<ViewMode>('timeline');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [customFrom, setCustomFrom] = React.useState('');
  const [customTo, setCustomTo]   = React.useState('');

  const defaultFrom = format(subDays(new Date(), 6), 'yyyy-MM-dd');
  const defaultTo   = todayIso();

  const { values, setValue } = usePageFilters([
    { key: 'date', label: 'نطاق التاريخ', type: 'daterange' },
    { key: 'q',    label: 'بحث الموظف',  type: 'text', placeholder: 'اسم الموظف…' },
  ]);

  const from = (values.date_from as string) || defaultFrom;
  const to   = (values.date_to   as string) || defaultTo;
  const q    = (values.q as string) ?? '';

  React.useEffect(() => {
    setValue('date_from', defaultFrom);
    setValue('date_to',   defaultTo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    const t = todayIso();
    if (p === 'day')   { setValue('date_from', t); setValue('date_to', t); }
    if (p === 'week')  { setValue('date_from', format(subDays(new Date(), 6),  'yyyy-MM-dd')); setValue('date_to', t); }
    if (p === 'month') {
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end   = format(endOfMonth(new Date()),   'yyyy-MM-dd');
      setValue('date_from', start); setValue('date_to', end);
    }
    if (p === 'custom') {
      setCustomFrom(from);
      setCustomTo(to);
    }
  };

  const applyCustomRange = () => {
    if (customFrom && customTo && customFrom <= customTo) {
      setValue('date_from', customFrom);
      setValue('date_to',   customTo);
    }
  };

  const dates = React.useMemo(() => enumerateDates(from, to), [from, to]);

  const allEmployees = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const s of daySummaries) {
      if (s.date >= from && s.date <= to) map.set(s.employeeId, s.employeeName);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [daySummaries, from, to]);

  const filtered = React.useMemo(() =>
    daySummaries.filter((s) =>
      s.date >= from && s.date <= to &&
      (!q.trim() || s.employeeName.includes(q) || s.employeeId.includes(q)) &&
      (selectedEmpIds.size === 0 || selectedEmpIds.has(s.employeeId)),
    ), [daySummaries, from, to, q, selectedEmpIds]);

  const eventsFiltered = React.useMemo(() =>
    events.filter((e) =>
      e.date >= from && e.date <= to &&
      (!q.trim() || e.employeeName.includes(q)) &&
      (selectedEmpIds.size === 0 || selectedEmpIds.has(e.employeeId)),
    ), [events, from, to, q, selectedEmpIds]);

  const stats = React.useMemo(() => {
    const workedM   = filtered.reduce((a, s) => a + s.workedMinutes, 0);
    const lateM     = filtered.reduce((a, s) => a + s.lateMinutes, 0);
    const absentDays = filtered.filter((s) => s.status === 'absent').length;
    return {
      workHours:    workedM / 60,
      lateHours:    lateM / 60,
      absentHours:  absentDays * DEFAULT_ABSENT_DAY_HOURS,
      avgWorkHours: filtered.length ? workedM / 60 / filtered.length : 0,
    };
  }, [filtered]);

  const PRESET_LABELS: Record<Preset, string> = {
    day: 'اليوم', week: 'أسبوع', month: 'شهر', custom: 'مخصص',
  };

  return (
    <div className="space-y-4">
      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي ساعات العمل',           value: `${fmtDecimalHours(stats.workHours)} س`,    cls: 'text-success',      bg: 'bg-success/10',      Icon: Users },
          { label: 'إجمالي ساعات التأخير',          value: `${fmtDecimalHours(stats.lateHours)} س`,    cls: 'text-warning',      bg: 'bg-warning/10',      Icon: Clock3 },
          { label: `ساعات الغياب (${DEFAULT_ABSENT_DAY_HOURS}س/يوم)`, value: `${fmtDecimalHours(stats.absentHours)} س`, cls: 'text-destructive', bg: 'bg-destructive/10', Icon: TrendingUp },
          { label: 'متوسط ساعات العمل / سجل',      value: `${fmtDecimalHours(stats.avgWorkHours)} س`, cls: 'text-primary',      bg: 'bg-primary/10',      Icon: Timer },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-soft">
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', s.bg)}>
              <s.Icon className={cn('h-4 w-4', s.cls)} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">{s.label}</p>
              <p className={cn('font-display text-xl font-bold tabular-nums', s.cls)}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="rounded-xl border border-border bg-card shadow-soft">
        {/* Preset tabs */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 pt-3 pb-0 flex-wrap">
          <div className="flex gap-0">
            {(['day','week','month','custom'] as Preset[]).map((p) => (
              <button key={p} type="button" onClick={() => applyPreset(p)}
                className={cn(
                  'relative px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                  preset === p
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pb-3">
            <EmployeePicker employees={allEmployees} selected={selectedEmpIds} onChange={setSelectedEmpIds} />
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
              <button type="button" onClick={() => setView('grid')}
                className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
                  view === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutList className="h-3.5 w-3.5" />جدول
              </button>
              <button type="button" onClick={() => setView('timeline')}
                className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
                  view === 'timeline' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Clock3 className="h-3.5 w-3.5" />خط زمني
              </button>
            </div>
          </div>
        </div>

        {/* Custom date range picker */}
        {preset === 'custom' && (
          <div className="flex flex-wrap items-end gap-3 px-4 py-3 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">من</span>
              <Input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="h-8 w-36 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">إلى</span>
              <Input
                type="date"
                value={customTo}
                min={customFrom}
                onChange={e => setCustomTo(e.target.value)}
                className="h-8 w-36 text-xs"
              />
            </div>
            <Button
              size="sm"
              variant="luxe"
              className="h-8 text-xs"
              onClick={applyCustomRange}
              disabled={!customFrom || !customTo || customFrom > customTo}
            >
              <Calendar className="h-3.5 w-3.5 ml-1" />
              تطبيق
            </Button>
            {from && to && (
              <span className="text-xs text-muted-foreground">
                {fmtFull(from)} ← {fmtFull(to)} · {dates.length} يوم
              </span>
            )}
          </div>
        )}

        {/* Date range label for non-custom */}
        {preset !== 'custom' && (
          <div className="px-4 py-2 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {preset === 'day'
                ? fmtFull(from)
                : preset === 'month'
                  ? fmtMonthYear(from)
                  : `${fmtFull(from)} — ${fmtFull(to)}`
              }
              {dates.length > 1 && <> · <span className="tabular-nums">{dates.length}</span> يوم</>}
            </span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {view === 'grid'
        ? <GridView rows={filtered} />
        : <SmartTimeline
            summaries={filtered}
            events={eventsFiltered}
            dates={dates}
            from={from}
            to={to}
          />
      }
    </div>
  );
}

// ─── Grid view ───────────────────────────────────────────────────────────────

function GridView({ rows }: { rows: AttendanceDaySummary[] }) {
  if (rows.length === 0) return <EmptyState />;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div className="divide-y divide-border/40 sm:hidden">
        {rows.map((s) => {
          const cfg = STATUS[s.status];
          return (
            <div key={s.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {s.employeeName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{s.employeeName}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtDayFull(s.date)} · {s.date}</p>
                  </div>
                </div>
                <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium shrink-0', cfg.color)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                  {cfg.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {s.lateMinutes > 0 && <span className="text-warning font-medium">تأخير: {s.lateMinutes} د</span>}
                <span>العمل: <span className="font-mono text-foreground">{s.workedMinutes} د</span></span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
              <th className="px-5 py-3.5 text-right">الموظف</th>
              <th className="px-5 py-3.5 text-right">التاريخ</th>
              <th className="px-5 py-3.5 text-right">الحالة</th>
              <th className="px-5 py-3.5 text-right">تأخير</th>
              <th className="px-5 py-3.5 text-right">وقت العمل</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const cfg = STATUS[s.status];
              return (
                <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {s.employeeName.charAt(0)}
                      </div>
                      <p className="font-medium">{s.employeeName}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm">{fmtDayFull(s.date)}</p>
                    <p className="font-mono text-[10px] text-muted-foreground" dir="ltr">{s.date}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', cfg.color)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">
                    {s.lateMinutes > 0
                      ? <span className="text-warning">{s.lateMinutes} د</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{minutesToHHMM(s.workedMinutes)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Smart timeline ───────────────────────────────────────────────────────────

function SmartTimeline({
  summaries, events, dates, from, to,
}: {
  summaries: AttendanceDaySummary[];
  events: AttendanceEvent[];
  dates: string[];
  from: string;
  to: string;
}) {
  const days = dates.length;
  if (days === 0) return <EmptyState />;

  if (days <= 3) return <GanttTimeline summaries={summaries} events={events} dates={dates} />;
  if (days <= 14) return <WeekGrid summaries={summaries} dates={dates} />;
  return <MonthHeatmap summaries={summaries} dates={dates} />;
}

// ─── 1. Gantt timeline (≤ 3 days) ────────────────────────────────────────────

function GanttTimeline({
  summaries, events, dates,
}: {
  summaries: AttendanceDaySummary[];
  events: AttendanceEvent[];
  dates: string[];
}) {
  const HOUR_LABELS = [0, 4, 8, 12, 16, 20, 24];

  const eventMap = React.useMemo(() => {
    const m = new Map<string, AttendanceEvent[]>();
    for (const e of events) {
      const k = `${e.employeeId}|${e.date}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return m;
  }, [events]);

  const byEmployee = React.useMemo(() => {
    const m = new Map<string, { name: string; rows: AttendanceDaySummary[] }>();
    for (const s of summaries) {
      if (!m.has(s.employeeId)) m.set(s.employeeId, { name: s.employeeName, rows: [] });
      m.get(s.employeeId)!.rows.push(s);
    }
    return [...m.values()];
  }, [summaries]);

  if (byEmployee.length === 0) return <EmptyState />;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {/* Header with date labels */}
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex gap-2">
          {dates.map((d) => (
            <div key={d} className={cn(
              'flex-1 rounded-lg border px-3 py-2 text-center',
              d === todayIso() ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'
            )}>
              <p className="text-xs font-semibold text-foreground">{fmtDayFull(d)}</p>
              <p className={cn('text-[10px] tabular-nums', d === todayIso() ? 'text-primary font-bold' : 'text-muted-foreground')}>{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hour ruler */}
      <div className="border-b border-border bg-muted/20 px-4 py-1.5" dir="ltr">
        <div className="flex items-center" style={{ paddingRight: '10rem' }}>
          {HOUR_LABELS.map((h) => (
            <div key={h} className="flex-1 text-center text-[9px] font-mono text-muted-foreground first:text-right last:text-left">
              {String(h).padStart(2,'0')}
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/40">
        {byEmployee.map(({ name, rows }) =>
          rows.map((s) => {
            const evs    = eventMap.get(`${s.employeeId}|${s.date}`) ?? [];
            const sorted = [...evs].sort((a,b) => a.at.localeCompare(b.at));
            const checkIn  = sorted.find((e) => e.type === 'check_in');
            const checkOut = sorted.findLast((e) => e.type === 'check_out');
            const inMins   = checkIn  ? minutesFromMidnight(checkIn.at)  : null;
            const outMins  = checkOut ? minutesFromMidnight(checkOut.at) : null;
            const cfg = STATUS[s.status];
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors">
                <div className="flex w-40 shrink-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtDayFull(s.date)}</p>
                  </div>
                </div>
                <div className="relative flex-1" dir="ltr">
                  <div className="relative h-8 overflow-hidden rounded-lg bg-muted/40">
                    {[4,8,12,16,20].map((h) => (
                      <div key={h} className="absolute top-0 h-full w-px bg-border/40" style={{ left: `${(h/24)*100}%` }} />
                    ))}
                    {inMins !== null && (
                      <div
                        className={cn('absolute top-1 h-6 rounded-md opacity-80', cfg.bar)}
                        style={{
                          left:  `${(inMins / (24*60)) * 100}%`,
                          width: outMins !== null ? `${((outMins - inMins) / (24*60)) * 100}%` : '1.5%',
                        }}
                      />
                    )}
                    {sorted.map((e) => {
                      const mins = minutesFromMidnight(e.at);
                      return (
                        <div
                          key={e.id}
                          title={`${e.type === 'check_in' ? 'دخول' : 'خروج'} ${e.at}`}
                          className={cn('absolute top-1 h-6 w-1.5 rounded-sm shadow-sm',
                            e.type === 'check_in' ? 'bg-success' : 'bg-primary'
                          )}
                          style={{ left: `${(mins / (24*60)) * 100}%`, transform: 'translateX(-50%)' }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="flex w-36 shrink-0 flex-col items-end gap-1">
                  <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', cfg.color)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                    {cfg.label}
                  </span>
                  {checkIn && (
                    <span className="font-mono text-[10px] text-muted-foreground" dir="ltr">
                      {checkIn.at}{checkOut ? ` → ${checkOut.at}` : ' →'}
                    </span>
                  )}
                  {s.workedMinutes > 0 && (
                    <span className="text-[10px] text-muted-foreground">{minutesToHHMM(s.workedMinutes)} عمل</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Legend />
    </div>
  );
}

// ─── 2. Week grid (4–14 days) ─────────────────────────────────────────────────

function WeekGrid({ summaries, dates }: { summaries: AttendanceDaySummary[]; dates: string[] }) {
  const byEmployee = React.useMemo(() => {
    const m = new Map<string, { name: string; byDate: Map<string, AttendanceDaySummary> }>();
    for (const s of summaries) {
      if (!m.has(s.employeeId)) m.set(s.employeeId, { name: s.employeeName, byDate: new Map() });
      m.get(s.employeeId)!.byDate.set(s.date, s);
    }
    return [...m.values()];
  }, [summaries]);

  if (byEmployee.length === 0) return <EmptyState />;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
              <th className="sticky right-0 z-10 bg-muted/40 px-5 py-4 text-right">الموظف</th>
              {dates.map((d) => (
                <th key={d} className="min-w-[100px] px-3 py-3 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[11px] font-semibold text-muted-foreground">{fmtDayFull(d)}</span>
                    <span className={cn(
                      'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      d === todayIso() ? 'bg-primary text-primary-foreground' : 'text-foreground'
                    )}>{fmtDay(d)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byEmployee.map(({ name, byDate }, idx) => (
              <tr key={idx} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                <td className="sticky right-0 z-10 bg-card px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {name.charAt(0)}
                    </div>
                    <span className="whitespace-nowrap text-sm font-medium">{name}</span>
                  </div>
                </td>
                {dates.map((d) => {
                  const s = byDate.get(d);
                  if (!s) return (
                    <td key={d} className="px-3 py-3.5">
                      <div className="mx-auto h-10 w-20 rounded-lg bg-muted/30" />
                    </td>
                  );
                  const cfg = STATUS[s.status];
                  return (
                    <td key={d} className="px-3 py-3.5">
                      <div
                        title={`${name} · ${fmtDayFull(d)} · ${cfg.label}`}
                        className={cn('mx-auto flex w-20 flex-col items-center justify-center rounded-lg border px-1 py-2 cursor-default transition-transform hover:scale-105', cfg.color)}
                      >
                        <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                        <span className="mt-1 text-[10px] font-semibold leading-none">{cfg.label}</span>
                        {s.lateMinutes > 0 && (
                          <span className="mt-0.5 font-mono text-[9px] opacity-70">+{s.lateMinutes}د</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Legend />
    </div>
  );
}

// ─── 3. Month heatmap (> 14 days) ────────────────────────────────────────────
// First 20 days are visible, the remaining days are accessible via horizontal scroll

function MonthHeatmap({ summaries, dates }: { summaries: AttendanceDaySummary[]; dates: string[] }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const byEmployee = React.useMemo(() => {
    const m = new Map<string, { name: string; id: string; byDate: Map<string, AttendanceDaySummary> }>();
    for (const s of summaries) {
      if (!m.has(s.employeeId)) m.set(s.employeeId, { name: s.employeeName, id: s.employeeId, byDate: new Map() });
      m.get(s.employeeId)!.byDate.set(s.date, s);
    }
    return [...m.values()];
  }, [summaries]);

  if (byEmployee.length === 0) return <EmptyState />;

  // Day column width — wide enough for the rotated day-name header
  const DAY_W = 36;
  const VISIBLE_DAYS = 20;
  const totalDaysWidth = dates.length * DAY_W;
  const visibleWidth   = VISIBLE_DAYS * DAY_W;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {/* Info bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-2.5 bg-muted/20">
        <span className="text-xs text-muted-foreground">
          {dates.length} يوم · اليوم 1–{Math.min(VISIBLE_DAYS, dates.length)} مرئي
          {dates.length > VISIBLE_DAYS && <> · مرِّر للأيام {VISIBLE_DAYS + 1}–{dates.length}</>}
        </span>
        <Legend inline />
      </div>

      {/* Scrollable table — capped width so day 21+ need scroll */}
      <div
        ref={scrollRef}
        className="overflow-x-auto"
        style={{ maxWidth: '100%' }}
      >
        <div style={{ minWidth: `${totalDaysWidth + 160}px` }}>
          <table className="w-full text-sm table-fixed" style={{ minWidth: `${Math.max(totalDaysWidth + 160, visibleWidth + 160)}px` }}>
            <colgroup>
              <col style={{ width: 160 }} />
              {dates.map((d) => <col key={d} style={{ width: DAY_W }} />)}
              <col style={{ width: 72 }} />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                <th className="sticky right-0 z-10 bg-muted/40 px-4 py-3 text-right">الموظف</th>
                {dates.map((d) => (
                  <th key={d} className="text-center px-0 pt-2 pb-1">
                    <div className="flex flex-col items-center gap-1">
                      {/* Rotated full day name — reads bottom-to-top */}
                      <span
                        className="text-[10px] text-muted-foreground font-medium whitespace-nowrap"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', lineHeight: 1 }}
                      >
                        {fmtDayShort(d)}
                      </span>
                      <span className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                        d === todayIso() ? 'bg-primary text-primary-foreground' : 'text-foreground'
                      )}>{fmtDay(d)}</span>
                    </div>
                  </th>
                ))}
                <th className="px-2 py-3 text-center text-[10px]">ملخص</th>
              </tr>
            </thead>
            <tbody>
              {byEmployee.map(({ name, byDate }) => {
                const allRows   = [...byDate.values()];
                const workedM   = allRows.reduce((a, s) => a + s.workedMinutes, 0);
                const lateM     = allRows.reduce((a, s) => a + s.lateMinutes, 0);
                const absentDays = allRows.filter((s) => s.status === 'absent').length;

                return (
                  <tr key={name} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
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
                      if (!s) return (
                        <td key={d} className="py-2.5 px-0.5">
                          <div className="mx-auto h-7 rounded-md bg-muted/20" style={{ width: DAY_W - 4 }} />
                        </td>
                      );
                      const cfg = STATUS[s.status];
                      return (
                        <td key={d} className="py-2.5 px-0.5">
                          <div
                            title={`${name} · ${fmtDayFull(d)} · ${cfg.label}${s.lateMinutes > 0 ? ` · تأخير ${s.lateMinutes}د` : ''}`}
                            className={cn(
                              'mx-auto flex h-7 items-center justify-center rounded-md border cursor-default transition-transform hover:scale-110',
                              cfg.color
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
                        <span className="text-[9px] text-success font-semibold">{fmtDecimalHours(workedM/60)}س</span>
                        {lateM > 0 && <span className="text-[9px] text-warning">{fmtDecimalHours(lateM/60)}س⏱</span>}
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

// ─── Shared ───────────────────────────────────────────────────────────────────

function Legend({ inline }: { inline?: boolean }) {
  const items = (Object.entries(STATUS) as [DaySummaryStatus, typeof STATUS[DaySummaryStatus]][]);
  if (inline) {
    return (
      <div className="flex flex-wrap gap-3">
        {items.map(([, cfg]) => (
          <span key={cfg.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={cn('h-2 w-2 rounded-full shrink-0', cfg.dot)} />
            {cfg.label}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-3 border-t border-border bg-muted/20 px-5 py-3">
      {items.map(([, cfg]) => (
        <span key={cfg.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn('h-2 w-2 rounded-full shrink-0', cfg.dot)} />
          {cfg.label}
        </span>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
      <Clock3 className="mb-3 h-10 w-10 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">لا سجلات في النطاق المحدد</p>
    </div>
  );
}
