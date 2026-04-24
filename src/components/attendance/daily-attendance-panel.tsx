'use client';

import * as React from 'react';
import { format, subDays, parseISO, eachDayOfInterval, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
import {
  LayoutList, Clock3, Download, Search,
  TrendingUp, Users, Timer, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SingleDatePicker } from '@/components/ui/single-date-picker';
import { Label } from '@/components/ui/label';
import { useAttendanceStore } from '@/lib/attendance/store';
import type { AttendanceDaySummary, AttendanceEvent, DaySummaryStatus } from '@/lib/attendance/types';
import { enumerateDates, minutesFromMidnight, todayIso } from '@/lib/attendance/utils';
import { cn } from '@/lib/utils';

// ─── Status config ──────────────────────────────────────────────────────────────

const STATUS: Record<DaySummaryStatus, { label: string; color: string; dot: string; bar: string }> = {
  present:     { label: 'حاضر',          color: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',   dot: 'bg-emerald-500',     bar: 'bg-emerald-500' },
  late:        { label: 'متأخر',         color: 'bg-amber-500/15 text-amber-700 border-amber-500/30',         dot: 'bg-amber-500',       bar: 'bg-amber-400' },
  absent:      { label: 'غائب',          color: 'bg-destructive/15 text-destructive border-destructive/30',   dot: 'bg-destructive',     bar: 'bg-destructive/60' },
  early_leave: { label: 'انصراف مبكر',  color: 'bg-orange-500/15 text-orange-700 border-orange-500/30',      dot: 'bg-orange-500',      bar: 'bg-orange-400' },
  incomplete:  { label: 'غير مكتمل',   color: 'bg-muted text-muted-foreground border-border',               dot: 'bg-muted-foreground',bar: 'bg-slate-300' },
  overtime:    { label: 'تمديد',         color: 'bg-primary/15 text-primary border-primary/30',               dot: 'bg-primary',         bar: 'bg-primary' },
};

type ViewMode = 'grid' | 'timeline';
type Preset   = 'day' | 'week' | 'month' | 'custom';

function fmtDay(iso: string) { return format(parseISO(iso), 'd', { locale: arSA }); }
function fmtDayName(iso: string) { return format(parseISO(iso + 'T12:00:00'), 'EEE', { locale: arSA }); }
function fmtFull(iso: string) { return format(parseISO(iso + 'T12:00:00'), 'EEEE d MMM', { locale: arSA }); }
function minutesToHHMM(m: number) {
  const h = Math.floor(m / 60) % 24;
  const mn = m % 60;
  return `${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}`;
}

// ─── Main component ─────────────────────────────────────────────────────────────

export function DailyAttendancePanel() {
  const daySummaries = useAttendanceStore((s) => s.daySummaries);
  const events       = useAttendanceStore((s) => s.events);

  const [preset, setPreset] = React.useState<Preset>('week');
  const [from,   setFrom]   = React.useState(() => format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [to,     setTo]     = React.useState(todayIso);
  const [q,      setQ]      = React.useState('');
  const [view,   setView]   = React.useState<ViewMode>('timeline');

  const applyPreset = (p: Preset) => {
    setPreset(p);
    const t = todayIso();
    if (p === 'day')   { setFrom(t); setTo(t); }
    if (p === 'week')  { setFrom(format(subDays(new Date(), 6),  'yyyy-MM-dd')); setTo(t); }
    if (p === 'month') { setFrom(format(subDays(new Date(), 29), 'yyyy-MM-dd')); setTo(t); }
  };

  const dates = React.useMemo(() => enumerateDates(from, to), [from, to]);

  const filtered = React.useMemo(() =>
    daySummaries.filter((s) =>
      s.date >= from && s.date <= to &&
      (!q.trim() || s.employeeName.includes(q) || s.employeeId.includes(q)),
    ), [daySummaries, from, to, q]);

  const eventsFiltered = React.useMemo(() =>
    events.filter((e) =>
      e.date >= from && e.date <= to &&
      (!q.trim() || e.employeeName.includes(q)),
    ), [events, from, to, q]);

  const stats = React.useMemo(() => ({
    present: filtered.filter((s) => s.status === 'present').length,
    late:    filtered.filter((s) => s.status === 'late').length,
    absent:  filtered.filter((s) => s.status === 'absent').length,
    avgWork: filtered.length ? Math.round(filtered.reduce((a, s) => a + s.workedMinutes, 0) / filtered.length) : 0,
  }), [filtered]);

  const exportCsv = () => {
    const header = ['employeeId','employeeName','date','status','late','early','ot','workedMin','notes'];
    const lines = [header.join(',')].concat(
      filtered.map((s) =>
        [s.employeeId,`"${s.employeeName}"`,s.date,s.status,s.lateMinutes,s.earlyLeaveMinutes,s.overtimeMinutes,s.workedMinutes,`"${s.notes??''}"`].join(','),
      ),
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `attendance-${from}-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* ── Top controls ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Presets */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1">
          {(['day','week','month','custom'] as Preset[]).map((p) => (
            <button key={p} type="button" onClick={() => applyPreset(p)}
              className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                preset === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p === 'day' ? 'اليوم' : p === 'week' ? 'أسبوع' : p === 'month' ? 'شهر' : 'مخصص'}
            </button>
          ))}
        </div>

        {/* View toggle + export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1">
            <button type="button" onClick={() => setView('grid')}
              className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                view === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
              جدول
            </button>
            <button type="button" onClick={() => setView('timeline')}
              className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                view === 'timeline' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Clock3 className="h-3.5 w-3.5" />
              خط زمني
            </button>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">من</Label>
          <SingleDatePicker
            value={from}
            onChange={(v) => { setFrom(v); setPreset('custom'); }}
            placeholder="تاريخ البداية"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">إلى</Label>
          <SingleDatePicker
            value={to}
            onChange={(v) => { setTo(v); setPreset('custom'); }}
            placeholder="تاريخ النهاية"
            min={from}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">بحث</Label>
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input className="pr-8 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="اسم الموظف أو الرقم…" />
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users}    label="حاضر"           value={stats.present} color="text-emerald-600" bg="bg-emerald-500/10" />
        <StatCard icon={Timer}    label="متأخر"           value={stats.late}    color="text-amber-600"   bg="bg-amber-500/10" />
        <StatCard icon={TrendingUp} label="غائب"         value={stats.absent}  color="text-destructive" bg="bg-destructive/10" />
        <StatCard icon={Clock3}   label="متوسط العمل (د)" value={stats.avgWork} color="text-primary"     bg="bg-primary/10" />
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

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType; label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-soft">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', bg)}>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-display text-xl font-bold number-ar">{value}</p>
      </div>
    </div>
  );
}

// ─── Grid view ─────────────────────────────────────────────────────────────────

function GridView({ rows }: { rows: AttendanceDaySummary[] }) {
  if (rows.length === 0)
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
        <LayoutList className="mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">لا سجلات في النطاق المحدد</p>
      </div>
    );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-right">الموظف</th>
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">تأخير (د)</th>
              <th className="px-4 py-3 text-right">العمل (د)</th>
              <th className="px-4 py-3 text-right">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const cfg = STATUS[s.status];
              return (
                <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {s.employeeName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{s.employeeName}</p>
                        <p className="font-mono text-[10px] text-muted-foreground" dir="ltr">{s.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs" dir="ltr">{s.date}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtFull(s.date)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', cfg.color)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.lateMinutes > 0
                      ? <span className="font-mono text-xs text-amber-600">{s.lateMinutes}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{s.workedMinutes}</td>
                  <td className="max-w-[180px] px-4 py-3 text-xs text-muted-foreground truncate">{s.notes ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Smart timeline (auto adapts to range size) ────────────────────────────────

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

  if (days === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
        <Clock3 className="mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">لا أحداث في النطاق المحدد</p>
      </div>
    );
  }

  if (days <= 3) return <GanttTimeline summaries={summaries} events={events} dates={dates} />;
  if (days <= 14) return <WeekGrid summaries={summaries} dates={dates} />;
  return <MonthHeatmap summaries={summaries} dates={dates} />;
}

// ─── 1. Gantt timeline (≤3 days) ───────────────────────────────────────────────
//    Shows a real 24h bar per employee-day with colored work segments

function GanttTimeline({
  summaries, events, dates,
}: {
  summaries: AttendanceDaySummary[];
  events: AttendanceEvent[];
  dates: string[];
}) {
  const HOUR_LABELS = [0, 4, 8, 12, 16, 20, 24];

  // Group events by employeeId+date
  const eventMap = React.useMemo(() => {
    const m = new Map<string, AttendanceEvent[]>();
    for (const e of events) {
      const k = `${e.employeeId}|${e.date}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return m;
  }, [events]);

  // Group summaries by employee
  const byEmployee = React.useMemo(() => {
    const m = new Map<string, { name: string; rows: AttendanceDaySummary[] }>();
    for (const s of summaries) {
      if (!m.has(s.employeeId)) m.set(s.employeeId, { name: s.employeeName, rows: [] });
      m.get(s.employeeId)!.rows.push(s);
    }
    return [...m.values()];
  }, [summaries]);

  if (byEmployee.length === 0)
    return <EmptyTimeline />;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {/* Hour ruler */}
      <div className="border-b border-border bg-muted/30 px-4 py-2" dir="ltr">
        <div className="flex items-center" style={{ paddingRight: '11rem' }}>
          {HOUR_LABELS.map((h) => (
            <div key={h} className="flex-1 text-center text-[10px] font-mono text-muted-foreground first:text-right last:text-left">
              {String(h).padStart(2,'0')}
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/60">
        {byEmployee.map(({ name, rows }) =>
          rows.map((s) => {
            const evs = eventMap.get(`${s.employeeId}|${s.date}`) ?? [];
            const sorted = [...evs].sort((a,b) => a.at.localeCompare(b.at));
            const checkIn  = sorted.find((e) => e.type === 'check_in');
            const checkOut = sorted.findLast((e) => e.type === 'check_out');
            const inMins   = checkIn  ? minutesFromMidnight(checkIn.at)  : null;
            const outMins  = checkOut ? minutesFromMidnight(checkOut.at) : null;
            const cfg = STATUS[s.status];

            return (
              <div key={s.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors">
                {/* Employee + date label */}
                <div className="flex w-44 shrink-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtDayName(s.date)} {fmtDay(s.date)}</p>
                  </div>
                </div>

                {/* 24h bar */}
                <div className="relative flex-1" dir="ltr">
                  <div className="relative h-8 overflow-hidden rounded-lg bg-muted/40">
                    {/* Hour grid lines */}
                    {[4,8,12,16,20].map((h) => (
                      <div key={h} className="absolute top-0 h-full w-px bg-border/40" style={{ left: `${(h/24)*100}%` }} />
                    ))}

                    {/* Worked segment */}
                    {inMins !== null && (
                      <div
                        className={cn('absolute top-1 h-6 rounded-md opacity-80', cfg.bar)}
                        style={{
                          left:  `${(inMins / (24*60)) * 100}%`,
                          width: outMins !== null
                            ? `${((outMins - inMins) / (24*60)) * 100}%`
                            : '1.5%',
                        }}
                      />
                    )}

                    {/* Event dots */}
                    {sorted.map((e) => {
                      const mins = minutesFromMidnight(e.at);
                      return (
                        <div
                          key={e.id}
                          title={`${e.type === 'check_in' ? 'دخول' : 'خروج'} ${e.at}`}
                          className={cn(
                            'absolute top-1 h-6 w-1.5 rounded-sm shadow-sm',
                            e.type === 'check_in' ? 'bg-emerald-600' : 'bg-primary',
                          )}
                          style={{ left: `${(mins / (24*60)) * 100}%`, transform: 'translateX(-50%)' }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Status + times */}
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
    </div>
  );
}

// ─── 2. Week grid (4–14 days) ──────────────────────────────────────────────────
//    Employees as rows, dates as columns, colored status cells

function WeekGrid({
  summaries, dates,
}: {
  summaries: AttendanceDaySummary[];
  dates: string[];
}) {
  const byEmployee = React.useMemo(() => {
    const m = new Map<string, { name: string; byDate: Map<string, AttendanceDaySummary> }>();
    for (const s of summaries) {
      if (!m.has(s.employeeId)) m.set(s.employeeId, { name: s.employeeName, byDate: new Map() });
      m.get(s.employeeId)!.byDate.set(s.date, s);
    }
    return [...m.values()];
  }, [summaries]);

  if (byEmployee.length === 0) return <EmptyTimeline />;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="sticky right-0 z-10 bg-muted/40 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">الموظف</th>
              {dates.map((d) => (
                <th key={d} className="min-w-[80px] px-2 py-2.5 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground">{fmtDayName(d)}</span>
                    <span className={cn('mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      d === todayIso() ? 'bg-primary text-primary-foreground' : 'text-foreground'
                    )}>{fmtDay(d)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {byEmployee.map(({ name, byDate }, idx) => (
              <tr key={idx} className="hover:bg-muted/10 transition-colors">
                <td className="sticky right-0 z-10 bg-card px-4 py-2.5">
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
                    <td key={d} className="px-2 py-2.5">
                      <div className="mx-auto h-8 w-16 rounded-lg bg-muted/30" />
                    </td>
                  );
                  const cfg = STATUS[s.status];
                  return (
                    <td key={d} className="px-2 py-2.5">
                      <div
                        title={`${s.employeeName} · ${d} · ${cfg.label}`}
                        className={cn('mx-auto flex w-16 flex-col items-center justify-center rounded-lg border px-1 py-1.5 cursor-default transition-transform hover:scale-105', cfg.color)}
                      >
                        <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                        <span className="mt-0.5 text-[9px] font-semibold leading-none">{cfg.label}</span>
                        {s.lateMinutes > 0 && (
                          <span className="mt-0.5 font-mono text-[8px] opacity-70">+{s.lateMinutes}د</span>
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

      {/* Legend */}
      <div className="flex flex-wrap gap-3 border-t border-border bg-muted/20 px-4 py-3">
        {(Object.entries(STATUS) as [DaySummaryStatus, typeof STATUS[DaySummaryStatus]][]).map(([, cfg]) => (
          <span key={cfg.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
            {cfg.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── 3. Month heatmap (>14 days) ───────────────────────────────────────────────
//    Compact calendar heatmap: employee rows × day columns

function MonthHeatmap({
  summaries, dates,
}: {
  summaries: AttendanceDaySummary[];
  dates: string[];
}) {
  const [page, setPage] = React.useState(0);
  const CHUNK = 7;
  const chunks = [];
  for (let i = 0; i < dates.length; i += CHUNK) chunks.push(dates.slice(i, i + CHUNK));
  const visibleDates = chunks[page] ?? [];

  const byEmployee = React.useMemo(() => {
    const m = new Map<string, { name: string; id: string; byDate: Map<string, AttendanceDaySummary> }>();
    for (const s of summaries) {
      if (!m.has(s.employeeId)) m.set(s.employeeId, { name: s.employeeName, id: s.employeeId, byDate: new Map() });
      m.get(s.employeeId)!.byDate.set(s.date, s);
    }
    return [...m.values()];
  }, [summaries]);

  if (byEmployee.length === 0) return <EmptyTimeline />;

  return (
    <div className="space-y-2">
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          الأسبوع {page + 1} من {chunks.length} · {dates.length} يوم إجمالاً
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p-1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="px-2 text-xs text-muted-foreground">{page+1}/{chunks.length}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === chunks.length-1} onClick={() => setPage(p => p+1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="sticky right-0 z-10 bg-muted/40 px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground min-w-[140px]">الموظف</th>
                {visibleDates.map((d) => (
                  <th key={d} className="min-w-[56px] px-1 py-2.5 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px] text-muted-foreground">{fmtDayName(d)}</span>
                      <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                        d === todayIso() ? 'bg-primary text-white' : 'text-foreground'
                      )}>{fmtDay(d)}</span>
                    </div>
                  </th>
                ))}
                {/* Totals column */}
                <th className="px-3 py-2.5 text-center text-[10px] text-muted-foreground">ملخص</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {byEmployee.map(({ name, byDate }) => {
                const allRows = [...byDate.values()];
                const presentCount = allRows.filter(s => s.status === 'present').length;
                const lateCount    = allRows.filter(s => s.status === 'late').length;
                const absentCount  = allRows.filter(s => s.status === 'absent').length;

                return (
                  <tr key={name} className="hover:bg-muted/10 transition-colors">
                    <td className="sticky right-0 z-10 bg-card px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {name.charAt(0)}
                        </div>
                        <span className="whitespace-nowrap text-xs font-medium">{name}</span>
                      </div>
                    </td>
                    {visibleDates.map((d) => {
                      const s = byDate.get(d);
                      if (!s) return (
                        <td key={d} className="px-1 py-2">
                          <div className="mx-auto h-7 w-10 rounded-md bg-muted/20" />
                        </td>
                      );
                      const cfg = STATUS[s.status];
                      return (
                        <td key={d} className="px-1 py-2">
                          <div
                            title={`${name} · ${d} · ${cfg.label}`}
                            className={cn('mx-auto flex h-7 w-10 items-center justify-center rounded-md border cursor-default transition-transform hover:scale-110', cfg.color)}
                          >
                            <span className={cn('h-2.5 w-2.5 rounded-full', cfg.dot)} />
                          </div>
                        </td>
                      );
                    })}
                    {/* Row totals */}
                    <td className="px-3 py-2">
                      <div className="flex flex-col items-center gap-0.5 text-center">
                        <span className="text-[10px] text-emerald-600">{presentCount}✓</span>
                        {lateCount > 0 && <span className="text-[10px] text-amber-600">{lateCount}⏱</span>}
                        {absentCount > 0 && <span className="text-[10px] text-destructive">{absentCount}✗</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 border-t border-border bg-muted/20 px-4 py-3">
          {(Object.entries(STATUS) as [DaySummaryStatus, typeof STATUS[DaySummaryStatus]][]).map(([, cfg]) => (
            <span key={cfg.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
              {cfg.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyTimeline() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
      <Clock3 className="mb-3 h-10 w-10 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">لا أحداث في النطاق المحدد</p>
    </div>
  );
}
