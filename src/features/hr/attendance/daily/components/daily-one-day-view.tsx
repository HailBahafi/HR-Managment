'use client';

import * as React from 'react';
import {
  Plus, X, AlertTriangle, Clock, LogIn, LogOut, Coffee,
  Loader2, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  attendanceEventsApi,
  type AttendanceEventResponseDto,
  type AttendanceEventType,
} from '@/features/hr/attendance/lib/api/attendance-events';
import { DailyRegisterEventDialog } from '@/features/hr/attendance/daily/components/daily-register-event-dialog';
import type { AttendanceDaySummary, AttendanceEvent } from '@/features/hr/attendance/lib/types';
import { minutesFromMidnight } from '@/features/hr/attendance/lib/utils';
import { resolveVisualKey } from '@/features/hr/attendance/daily/utils/daily-attendance-status-resolve';
import { STATUS } from '@/features/hr/attendance/daily/constants/daily-attendance-status';
import { fmtDayFull, minutesToHHMM } from '@/features/hr/attendance/daily/utils/daily-attendance-format';
import { DailyAttendanceLegend } from '@/features/hr/attendance/daily/components/daily-attendance-legend';

// ─── constants ─────────────────────────────────────────────────────────────────

const TOTAL_MINS = 24 * 60;
/** Hour buckets 0–23 (00:00 → 23:00), displayed as 12-hour with ص / م. */
const HOUR_BUCKETS = Array.from({ length: 24 }, (_, i) => i);

function minsToPct(mins: number) {
  return `${(mins / TOTAL_MINS) * 100}%`;
}

function minsTo12HourParts(mins: number): { hour: number; period: 'ص' | 'م'; bucket: number } {
  const bucket = Math.min(23, Math.max(0, Math.floor(mins / 60)));
  const h24 = bucket;
  if (h24 === 0) return { hour: 12, period: 'ص', bucket };
  if (h24 < 12) return { hour: h24, period: 'ص', bucket };
  if (h24 === 12) return { hour: 12, period: 'م', bucket };
  return { hour: h24 - 12, period: 'م', bucket };
}

function minsToHourBucket(mins: number): number {
  return Math.min(23, Math.max(0, Math.floor(mins / 60)));
}

function formatHoverTime12(mins: number): string {
  const minute = mins % 60;
  const h24 = Math.floor(mins / 60) % 24;
  let h12: number;
  let period: 'ص' | 'م';
  if (h24 === 0) {
    h12 = 12;
    period = 'ص';
  } else if (h24 < 12) {
    h12 = h24;
    period = 'ص';
  } else if (h24 === 12) {
    h12 = 12;
    period = 'م';
  } else {
    h12 = h24 - 12;
    period = 'م';
  }
  return `${h12}:${String(minute).padStart(2, '0')} ${period}`;
}

function HourAxis({ activeBucket }: { activeBucket: number | null }) {
  return (
    <div className="relative mt-2 w-full select-none overflow-visible" aria-hidden>
     

      <div className="relative h-7 w-full">
        {HOUR_BUCKETS.map((bucket) => {
          const isActive = activeBucket === bucket;
          const { hour, period } = minsTo12HourParts(bucket * 60);
          const mins = bucket * 60;
          return (
            <span
              key={bucket}
              className={cn(
                'absolute top-0 whitespace-nowrap font-mono text-[10px] leading-none tabular-nums sm:text-[11px]',
                isActive
                  ? 'font-bold text-primary'
                  : bucket % 6 === 0
                    ? 'text-muted-foreground/70'
                    : 'text-muted-foreground/35',
              )}
              style={{
                left: minsToPct(TOTAL_MINS - mins),
                transform: bucket === 0 ? 'translateX(50%)' : bucket === 23 ? 'translateX(-100%)' : 'translateX(-50%)',
              }}
            >
              {hour}
              <span className={cn('ms-px text-[9px] sm:text-[10px]', isActive ? 'text-primary' : 'text-muted-foreground/50')}>
                {period}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Hex colors for event ticks (used in inline styles only — not theme tokens)
const EVENT_TICK_COLOR: Record<AttendanceEventType, string> = {
  check_in:    '#22c55e',
  check_out:   '#38bdf8',
  break_start: '#f59e0b',
  break_end:   '#f97316',
};

const EVENT_TYPE_META: Record<AttendanceEventType, { labelAr: string; icon: React.ElementType }> = {
  check_in:    { labelAr: 'دخول',           icon: LogIn  },
  check_out:   { labelAr: 'خروج',           icon: LogOut },
  break_start: { labelAr: 'بداية استراحة',  icon: Coffee },
  break_end:   { labelAr: 'نهاية استراحة',  icon: Coffee },
};

// Status → timeline fill class (using Tailwind design-token colors)
const STATUS_BAR_CLASS: Record<string, string> = {
  present:     'bg-success/20 border-success/40',
  late:        'bg-warning/20 border-warning/40',
  absent:      'bg-destructive/15 border-destructive/30',
  early_leave: 'bg-warning/20 border-warning/40',
  holiday:     'bg-purple-500/15 border-purple-500/30 dark:bg-purple-500/20',
  rest_day:    'bg-muted/60 border-border',
  unscheduled: 'bg-muted/40 border-border',
  on_leave:    'bg-blue-500/15 border-blue-500/30 dark:bg-blue-500/20',
};

function pct(mins: number) { return minsToPct(mins); }

function isoToHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── void dialog ───────────────────────────────────────────────────────────────

function VoidDialog({
  event, onClose, onVoided,
}: {
  event: AttendanceEventResponseDto | null;
  onClose: () => void;
  onVoided: (id: string) => void;
}) {
  const [reason, setReason] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { if (event) setReason(''); }, [event]);

  const handleVoid = async () => {
    if (!event) return;
    setSaving(true);
    try {
      await attendanceEventsApi.void(event.id, reason.trim() || 'تصحيح يدوي');
      toast.success('تم إلغاء الحدث');
      onVoided(event.id);
      onClose();
    } catch { toast.error('فشل إلغاء الحدث'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={!!event} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            إلغاء الحدث
          </DialogTitle>
        </DialogHeader>
        {event && (
          <div className="space-y-4 py-1">
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm space-y-1">
              <p className="font-medium">{EVENT_TYPE_META[event.eventType]?.labelAr}</p>
              <p className="font-mono text-xs text-muted-foreground" dir="ltr">{isoToHHMM(event.occurredAt)}</p>
            </div>
            <p className="text-xs text-muted-foreground">الحدث لن يُحذف — سيُعلَّم كملغى ويظل في السجل للمراجعة.</p>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">سبب الإلغاء</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اختياري"
                className="min-h-[56px] resize-none text-sm"
              />
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 sm:flex-row-reverse sm:justify-start">
          <Button variant="destructive" onClick={handleVoid} disabled={saving} className="flex-1 gap-2">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            تأكيد الإلغاء
          </Button>
          <Button variant="outline" onClick={onClose}>تراجع</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 24h timeline bar (with hover scrubber) ───────────────────────────────────

function pointerMinsFromRtlBar(el: HTMLElement, clientX: number): number {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0) return 0;
  const fromInlineStart = rect.right - clientX;
  const ratio = Math.max(0, Math.min(1, fromInlineStart / rect.width));
  return Math.round(ratio * TOTAL_MINS);
}

function TimelineBar({
  summary,
  events,
  onVoid,
}: {
  summary: AttendanceDaySummary;
  events: AttendanceEventResponseDto[];
  onVoid: (e: AttendanceEventResponseDto) => void;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [hoverMins, setHoverMins] = React.useState<number | null>(null);

  const updateHover = React.useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    setHoverMins(pointerMinsFromRtlBar(el, clientX));
  }, []);

  const vk = resolveVisualKey(summary.status);
  const barClass = STATUS_BAR_CLASS[vk] ?? STATUS_BAR_CLASS.unscheduled;
  const isFullCover = vk === 'holiday' || vk === 'rest_day' || vk === 'on_leave' || vk === 'absent';

  const activeEvents = events.filter((e) => !e.isVoided);
  const sorted = [...activeEvents].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const checkIn = sorted.find((e) => e.eventType === 'check_in');
  const checkOut = [...sorted].reverse().find((e) => e.eventType === 'check_out');
  const inMins = checkIn ? minutesFromMidnight(checkIn.occurredAt) : null;
  const outMins = checkOut ? minutesFromMidnight(checkOut.occurredAt) : null;
  const expectedIn = summary.expectedStartAt ? minutesFromMidnight(summary.expectedStartAt) : null;
  const expectedOut = summary.expectedEndAt ? minutesFromMidnight(summary.expectedEndAt) : null;

  const hoverBucket = hoverMins !== null ? minsToHourBucket(hoverMins) : null;

  return (
    <div
      ref={trackRef}
      className="relative cursor-crosshair pt-8"
      onPointerMove={(e) => updateHover(e.clientX)}
      onPointerLeave={() => setHoverMins(null)}
    >
      {/* Hover time card — above dotted line */}
      {hoverMins !== null && (
        <div
          className="pointer-events-none absolute top-0 z-[3] whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-elevated"
          style={{ left: minsToPct(TOTAL_MINS - hoverMins), transform: 'translateX(-50%)' }}
        >
          <span className="font-mono tabular-nums text-primary">{formatHoverTime12(hoverMins)}</span>
        </div>
      )}

      <div className="relative h-14 w-full overflow-hidden rounded-xl border border-border/50 bg-muted/20" dir="rtl">
        {/* Hour grid — every hour boundary */}
        {Array.from({ length: 25 }, (_, h) => (
          <div
            key={h}
            className={cn(
              'absolute top-0 h-full w-px',
              h === 0 || h === 12 || h === 24
                ? 'bg-border/55'
                : h % 6 === 0
                  ? 'bg-border/45'
                  : 'bg-border/15',
            )}
            style={{ insetInlineStart: minsToPct(h * 60) }}
          />
        ))}

        {/* Hover position — dotted vertical line */}
        {hoverMins !== null && (
          <div
            className="pointer-events-none absolute top-0 z-[2] h-full w-0 border-s-2 border-dotted border-primary/75"
            style={{ insetInlineStart: minsToPct(hoverMins) }}
          />
        )}

        {/* Full-cover fill (holiday / rest / leave / absent) */}
        {isFullCover && (
          <div
            className={cn('absolute inset-0 border', barClass)}
            style={vk === 'absent' ? {
              backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 5px, hsl(var(--destructive)/0.06) 5px, hsl(var(--destructive)/0.06) 6px)',
            } : undefined}
          />
        )}

        {/* Expected shift window */}
        {expectedIn !== null && expectedOut !== null && !isFullCover && (
          <div
            className="absolute top-3 h-8 rounded-md border border-border/40 bg-muted/50"
            style={{ insetInlineStart: pct(expectedIn), width: pct(Math.max(expectedOut - expectedIn, 0)) }}
          />
        )}

        {/* Actual worked band */}
        {inMins !== null && (
          <div
            className={cn('absolute top-2 h-10 rounded-lg border', barClass)}
            style={{
              insetInlineStart: pct(inMins),
              width: outMins !== null ? pct(Math.max(outMins - inMins, 5)) : pct(8),
            }}
          />
        )}

        {/* Event ticks */}
        {sorted.map((e) => {
          const mins = minutesFromMidnight(e.occurredAt);
          const color = EVENT_TICK_COLOR[e.eventType];
          return (
            <button
              key={e.id}
              type="button"
              title={`${EVENT_TYPE_META[e.eventType]?.labelAr} — ${isoToHHMM(e.occurredAt)}`}
              onClick={() => onVoid(e)}
              className="absolute top-0 z-[1] h-full w-1.5 cursor-pointer opacity-80 transition-all hover:w-2 hover:opacity-100"
              style={{ insetInlineStart: pct(mins), transform: 'translateX(-50%)', backgroundColor: color }}
            />
          );
        })}

        {/* Voided ticks */}
        {events.filter((e) => e.isVoided).map((e) => {
          const mins = minutesFromMidnight(e.occurredAt);
          return (
            <div
              key={e.id}
              title={`ملغى — ${EVENT_TYPE_META[e.eventType]?.labelAr}`}
              className="absolute top-0 h-full w-px bg-muted-foreground/25"
              style={{ insetInlineStart: pct(mins), transform: 'translateX(-50%)' }}
            />
          );
        })}

        {/* Live now cursor */}
        <NowCursor workDate={summary.date} />
      </div>

      <HourAxis activeBucket={hoverBucket} />
    </div>
  );
}

function NowCursor({ workDate }: { workDate: string }) {
  const [nowMins, setNowMins] = React.useState<number | null>(null);
  React.useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (workDate !== today) return;
    const tick = () => { const n = new Date(); setNowMins(n.getHours() * 60 + n.getMinutes()); };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [workDate]);
  if (nowMins === null) return null;
  return (
    <div
      className="absolute top-0 z-[1] h-full w-px bg-primary/70"
      style={{ insetInlineStart: pct(nowMins) }}
    />
  );
}

// ─── employee row ──────────────────────────────────────────────────────────────

function EmployeeRow({
  summary, events, workDate, companyId, onEventsChange,
}: {
  summary: AttendanceDaySummary;
  events: AttendanceEventResponseDto[];
  workDate: string;
  companyId: string;
  onEventsChange: (employeeId: string, newEvents: AttendanceEventResponseDto[]) => void;
}) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [voidTarget, setVoidTarget] = React.useState<AttendanceEventResponseDto | null>(null);

  const vk = resolveVisualKey(summary.status);
  const cfg = STATUS[vk];

  const activeEvents = events.filter((e) => !e.isVoided);
  const sorted = [...activeEvents].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const checkIn  = sorted.find((e) => e.eventType === 'check_in');
  const checkOut = [...sorted].reverse().find((e) => e.eventType === 'check_out');

  const handleCreated = (evt: AttendanceEventResponseDto) => onEventsChange(summary.employeeId, [...events, evt]);
  const handleVoided  = (id: string) => onEventsChange(summary.employeeId, events.map((e) => e.id === id ? { ...e, isVoided: true } : e));

  return (
    <>
      <div className="group border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20">
        <div className="grid grid-cols-[11rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5">

          {/* Avatar + name */}
          <div className="col-start-1 flex min-w-0 items-center gap-2.5">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {summary.employeeName.charAt(0)}
              <span className={cn('absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full border-2 border-card', cfg.dot)} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">{summary.employeeName}</p>
              <span className={cn('mt-0.5 inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[9px] font-medium', cfg.color)}>
                {cfg.label}
              </span>
            </div>
          </div>

          {/* 24h timeline */}
          <div
            className="col-start-2 min-w-0"
            onDoubleClick={() => setAddOpen(true)}
            title="انقر مرتين لتسجيل حدث"
          >
            <TimelineBar summary={summary} events={events} onVoid={setVoidTarget} />
          </div>
        </div>
      </div>

      <DailyRegisterEventDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        employeeId={summary.employeeId}
        employeeName={summary.employeeName}
        workDate={workDate}
        companyId={companyId}
        onCreated={handleCreated}
      />
      <VoidDialog event={voidTarget} onClose={() => setVoidTarget(null)} onVoided={handleVoided} />
    </>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

export function DailyOneDayView({
  summaries,
  initialEvents,
  workDate,
}: {
  summaries: AttendanceDaySummary[];
  initialEvents: AttendanceEvent[];
  workDate: string;
}) {
  const companyId = useAuthStore((s) => s.activeCompanyId) ?? '';

  const [eventsMap, setEventsMap] = React.useState<Map<string, AttendanceEventResponseDto[]>>(() => {
    const m = new Map<string, AttendanceEventResponseDto[]>();
    for (const e of initialEvents) {
      if (!m.has(e.employeeId)) m.set(e.employeeId, []);
      m.get(e.employeeId)!.push({
        id: e.id, companyId: '', employeeId: e.employeeId, employeeNameAr: e.employeeName,
        workDate: e.date, eventType: e.type as AttendanceEventType, occurredAt: e.at,
        source: (e.source as AttendanceEventResponseDto['source']) ?? 'manual_hr',
        checkInPointId: null, checkInPointNameAr: null, shiftAssignmentId: null,
        latitude: null, longitude: null, distanceMeters: null, withinRadius: null,
        periodSortOrder: null, notes: null, isVoided: false, voidReason: null,
        voidedAt: null, recordedBy: null, createdAt: e.at,
      });
    }
    return m;
  });

  const handleEventsChange = React.useCallback((employeeId: string, newEvents: AttendanceEventResponseDto[]) => {
    setEventsMap((prev) => new Map(prev).set(employeeId, newEvents));
  }, []);

  const sorted = React.useMemo(
    () => [...summaries].sort((a, b) => a.employeeName.localeCompare(b.employeeName, 'ar')),
    [summaries],
  );

  const totalEvents = React.useMemo(
    () => [...eventsMap.values()].reduce((acc, arr) => acc + arr.filter((e) => !e.isVoided).length, 0),
    [eventsMap],
  );

  const [headerEventsExpanded, setHeaderEventsExpanded] = React.useState(false);
  const [registerOpen, setRegisterOpen] = React.useState(false);
  const [pickEmployeeOpen, setPickEmployeeOpen] = React.useState(false);
  const [registerEmployeeId, setRegisterEmployeeId] = React.useState<string | null>(null);

  const allDayEvents = React.useMemo(() => {
    const items: { event: AttendanceEventResponseDto; employeeId: string; employeeName: string }[] = [];
    for (const s of sorted) {
      for (const e of eventsMap.get(s.employeeId) ?? []) {
        if (!e.isVoided) {
          items.push({ event: e, employeeId: s.employeeId, employeeName: s.employeeName });
        }
      }
    }
    return items.sort((a, b) => a.event.occurredAt.localeCompare(b.event.occurredAt));
  }, [sorted, eventsMap]);

  const registerEmployeeName = React.useMemo(
    () => sorted.find((s) => s.employeeId === registerEmployeeId)?.employeeName ?? '',
    [sorted, registerEmployeeId],
  );

  const openRegisterForEmployee = React.useCallback((employeeId: string) => {
    setRegisterEmployeeId(employeeId);
    setPickEmployeeOpen(false);
    setRegisterOpen(true);
  }, []);

  const handleHeaderRegister = React.useCallback(() => {
    if (sorted.length === 0) {
      toast.error('لا يوجد موظفون في هذا اليوم');
      return;
    }
    if (sorted.length === 1) {
      openRegisterForEmployee(sorted[0]!.employeeId);
      return;
    }
    setPickEmployeeOpen(true);
  }, [sorted, openRegisterForEmployee]);

  const handleHeaderEventCreated = React.useCallback((evt: AttendanceEventResponseDto) => {
    if (!registerEmployeeId) return;
    const existing = eventsMap.get(registerEmployeeId) ?? [];
    handleEventsChange(registerEmployeeId, [...existing, evt]);
  }, [registerEmployeeId, eventsMap, handleEventsChange]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{fmtDayFull(workDate)}</p>
          <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">{workDate}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => totalEvents > 0 && setHeaderEventsExpanded((v) => !v)}
            disabled={totalEvents === 0}
            className={cn(
              'inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors',
              totalEvents > 0 && 'hover:text-foreground',
            )}
          >
            <span>{totalEvents} حدث</span>
            {totalEvents > 0 && (
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', headerEventsExpanded && 'rotate-180')} />
            )}
          </button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleHeaderRegister}
            className="h-8 gap-1.5 border-dashed border-primary/40 text-primary hover:border-primary hover:bg-primary/5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">تسجيل</span>
          </Button>
        </div>
      </div>

    

      {/* Rows — dispatch console */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Clock className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا سجلات في هذا اليوم</p>
        </div>
      ) : (
        sorted.map((s) => (
          <EmployeeRow
            key={s.id}
            summary={s}
            events={eventsMap.get(s.employeeId) ?? []}
            workDate={workDate}
            companyId={companyId}
            onEventsChange={handleEventsChange}
          />
        ))
      )}

      {headerEventsExpanded && allDayEvents.length > 0 && (
        <div className="border-t border-border/50 bg-muted/10 px-4 py-2" dir="rtl">
          {allDayEvents.map(({ event, employeeName }, i) => {
            const meta = EVENT_TYPE_META[event.eventType];
            const Icon = meta.icon;
            const color = EVENT_TICK_COLOR[event.eventType];
            return (
              <div
                key={event.id}
                className={cn('flex items-center justify-between gap-3 py-2 text-xs', i > 0 && 'border-t border-border/40')}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="shrink-0 font-medium text-foreground">{employeeName}</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    <span>{meta.labelAr}</span>
                  </div>
                  <span className="font-mono tabular-nums" dir="ltr">{isoToHHMM(event.occurredAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer legend */}
      <div className="border-t border-border/50 px-4 py-2.5">
        <DailyAttendanceLegend />
      </div>

      <Dialog open={pickEmployeeOpen} onOpenChange={setPickEmployeeOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-base">اختر الموظف</DialogTitle>
          </DialogHeader>
          <div className="max-h-64 space-y-1 overflow-y-auto py-1">
            {sorted.map((s) => (
              <button
                key={s.employeeId}
                type="button"
                onClick={() => openRegisterForEmployee(s.employeeId)}
                className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-right transition-colors hover:bg-muted"
              >
                {s.employeeName}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {registerEmployeeId && (
        <DailyRegisterEventDialog
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          employeeId={registerEmployeeId}
          employeeName={registerEmployeeName}
          workDate={workDate}
          companyId={companyId}
          onCreated={handleHeaderEventCreated}
        />
      )}
    </div>
  );
}
