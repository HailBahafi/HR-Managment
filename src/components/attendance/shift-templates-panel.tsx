'use client';

import * as React from 'react';
import { Pencil, Plus, Trash2, Clock, ChevronDown, Coffee, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { defaultShiftPeriod, normalizeShiftTemplate } from '@/lib/attendance/defaults';
import type { ShiftPeriod, ShiftTemplate, WeekDayIndex } from '@/lib/attendance/types';
import { useAttendanceStore } from '@/lib/attendance/store';
import { genId } from '@/lib/attendance/utils';
import { cn } from '@/lib/utils';
import { InfoTooltip, LabelWithTooltip } from '@/components/ui/tooltip';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS: Record<WeekDayIndex, string> = {
  0: 'الأحد', 1: 'الإثنين', 2: 'الثلاثاء', 3: 'الأربعاء',
  4: 'الخميس', 5: 'الجمعة', 6: 'السبت',
};

const WEEK_ORDER: WeekDayIndex[] = [6, 0, 1, 2, 3, 4, 5];
const DEFAULT_REST: WeekDayIndex[] = [5, 6];

const GROUP_COLORS = [
  {
    pill: 'bg-primary/10 text-primary border-primary/30',
    header: 'text-primary/80',
    add: 'text-primary hover:bg-primary/10',
    accent: 'border-l-primary/40',
    periodBg: ['bg-card', 'bg-primary/[0.03]'],
  },
  {
    pill: 'bg-violet-500/10 text-violet-600 border-violet-400/30',
    header: 'text-violet-600/80',
    add: 'text-violet-600 hover:bg-violet-500/10',
    accent: 'border-l-violet-400/50',
    periodBg: ['bg-card', 'bg-violet-500/[0.03]'],
  },
  {
    pill: 'bg-amber-500/10 text-amber-600 border-amber-400/30',
    header: 'text-amber-600/80',
    add: 'text-amber-600 hover:bg-amber-500/10',
    accent: 'border-l-amber-400/50',
    periodBg: ['bg-card', 'bg-amber-500/[0.03]'],
  },
];

const GROUP_LABELS = ['الجدول الأول', 'الجدول الثاني', 'الجدول الثالث'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMinutes(t: string): number {
  const [h = 0, m = 0] = t.split(':').map(Number);
  return h * 60 + m;
}

function fmtMin(totalMin: number): string {
  const safe = ((totalMin % 1440) + 1440) % 1440;
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

/** قيمة `<input type="time" />` → `HH:mm` للتخزين */
function normalizeTimeInput(raw: string): string {
  if (!raw?.trim()) return '00:00';
  const [hPart = '0', mPart = '0'] = raw.split(':');
  const h = Math.min(23, Math.max(0, parseInt(hPart, 10) || 0));
  const m = Math.min(59, Math.max(0, parseInt(mPart, 10) || 0));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function summarizeTemplate(t: ShiftTemplate): string {
  const workDays = t.weekDays.filter((d) => !d.isRest).length;
  const sample = t.weekDays.find((d) => !d.isRest && d.periods.length > 0);
  if (!sample) return `${workDays} أيام عمل`;
  const p = sample.periods[0];
  return `${workDays} أيام · ${p.startTime} – ${p.endTime}`;
}

function cloneTemplate(t: ShiftTemplate): ShiftTemplate {
  return JSON.parse(JSON.stringify(t)) as ShiftTemplate;
}

function validateTemplate(t: ShiftTemplate): string | null {
  if (!t.nameAr.trim()) return 'اسم القالب مطلوب';
  const workDays = t.weekDays.filter((d) => !d.isRest);
  if (workDays.length === 0) return 'يجب تحديد يوم عمل واحد على الأقل';
  for (const d of workDays) {
    for (const p of d.periods) {
      const [sh, sm] = p.startTime.split(':').map(Number);
      const [eh, em] = p.endTime.split(':').map(Number);
      if (eh * 60 + em <= sh * 60 + sm)
        return `${DAY_LABELS[d.day]}: وقت النهاية يجب أن يكون بعد بداية الدوام`;
      if (p.breakEnabled) {
        const [bh, bm] = p.breakStart.split(':').map(Number);
        const [xh, xm] = p.breakEnd.split(':').map(Number);
        const a = sh * 60 + sm, b = eh * 60 + em;
        const bs = bh * 60 + bm, be = xh * 60 + xm;
        if (bs < a || be > b || be <= bs)
          return `${DAY_LABELS[d.day]}: أوقات الاستراحة يجب أن تقع داخل فترة العمل`;
      }
    }
  }
  return null;
}

function durationLabel(start: string, end: string): string {
  const d = toMinutes(end) - toMinutes(start);
  if (d <= 0) return '';
  const h = Math.floor(d / 60), m = d % 60;
  return m > 0 ? `${h}س ${m}د` : `${h}س`;
}

// ─── Shift Timeline ───────────────────────────────────────────────────────────

function ShiftTimeline({ period, showWindows }: { period: ShiftPeriod; showWindows: boolean }) {
  const startMin = toMinutes(period.startTime);
  const endMin   = toMinutes(period.endTime);
  const workDur  = endMin - startMin;
  if (workDur <= 0) return null;

  const preWin  = showWindows ? period.checkIn.beforeStartMinutes  : 0;
  const postWin = showWindows ? period.checkOut.afterEndMinutes     : 0;
  const grace   = showWindows ? period.checkIn.graceMinutes         : 0;
  const early   = showWindows ? period.checkOut.beforeEndMinutes    : 0;
  const total   = preWin + workDur + postWin || 1;

  const prePct  = (preWin  / total) * 100;
  const workPct = (workDur / total) * 100;
  const postPct = (postWin / total) * 100;

  // Break relative to work block
  const bStart = toMinutes(period.breakStart);
  const bEnd   = toMinutes(period.breakEnd);
  const breakOk = period.breakEnabled && bEnd > bStart && bStart >= startMin && bEnd <= endMin;
  const breakLeft  = breakOk ? ((bStart - startMin) / workDur) * 100 : 0;
  const breakWidth = breakOk ? ((bEnd   - bStart)   / workDur) * 100 : 0;

  // Grace & early-out relative to work block
  const graceWidth = showWindows && grace > 0 ? (grace / workDur) * 100 : 0;
  const earlyLeft  = showWindows && early > 0 ? ((workDur - early) / workDur) * 100 : 0;
  const earlyWidth = showWindows && early > 0 ? (early / workDur) * 100 : 0;

  const dur = durationLabel(period.startTime, period.endTime);

  return (
    <div className="space-y-1.5 select-none" dir="rtl">
      {/* Bar — RTL: نافذة ما قبل الدوام (يمين) ← الدوام ← نافذة ما بعد الخروج (يسار) */}
      <div className="flex h-9 overflow-hidden rounded-xl text-[9px] font-semibold ring-1 ring-border/40">
        {/* Pre check-in window */}
        {preWin > 0 && (
          <div
            style={{ width: `${prePct}%` }}
            className="flex shrink-0 items-center justify-center border-e border-blue-500/20 bg-blue-500/10 text-blue-500/70"
            title={`نافذة الدخول المبكر: ${preWin}د`}
          >
            {prePct > 6 && `${preWin}د`}
          </div>
        )}

        {/* Work block — داخلي LTR حتى تبقى شرائح السماحية/الاستراحة/الخروج المبكر وفق ترتيب الوقت داخل الفترة */}
        <div
          dir="ltr"
          style={{ width: `${workPct}%` }}
          className="relative flex shrink-0 items-center justify-center overflow-hidden bg-primary/15 text-primary"
        >
          {/* Grace stripe */}
          {graceWidth > 0 && (
            <div
              style={{ left: 0, width: `${graceWidth}%` }}
              className="absolute inset-y-0 border-e border-emerald-500/30 bg-emerald-500/20"
              title={`سماحية: ${grace}د`}
            />
          )}
          {/* Early-out stripe */}
          {earlyWidth > 0 && (
            <div
              style={{ left: `${earlyLeft}%`, width: `${earlyWidth}%` }}
              className="absolute inset-y-0 border-s border-orange-400/30 bg-orange-400/20"
              title={`خروج مبكر مسموح: ${early}د`}
            />
          )}
          {/* Break stripe */}
          {breakWidth > 0 && (
            <div
              style={{ left: `${breakLeft}%`, width: `${breakWidth}%` }}
              className="absolute inset-y-0 border-x border-amber-400/40 bg-amber-400/30"
              title="استراحة"
            />
          )}
          <span className="relative z-10 text-[10px] font-bold">{dur}</span>
        </div>

        {/* Post check-out window */}
        {postWin > 0 && (
          <div
            style={{ width: `${postPct}%` }}
            className="flex shrink-0 items-center justify-center border-s border-green-500/20 bg-green-500/10 text-green-600/70"
            title={`نافذة الخروج المتأخر: ${postWin}د`}
          >
            {postPct > 6 && `${postWin}د`}
          </div>
        )}
      </div>

      {/* Labels row — يتماشى مع الشريط (يمين: بداية / قبل الدوام — وسط: ساعات العمل — يسار: بعد الدوام / النهاية) */}
      <div
        className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1 px-0.5 text-[9px] text-muted-foreground/50"
        dir="rtl"
      >
        <span className="shrink-0 font-mono tabular-nums">
          {showWindows && preWin > 0 ? fmtMin(startMin - preWin) : period.startTime}
        </span>
        <div className="grid min-w-0 grid-cols-3 items-center gap-x-2 gap-y-1">
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-0.5">
            {showWindows && preWin > 0 && (
              <span className="text-blue-500/60">دخول ±{preWin}د</span>
            )}
            {showWindows && grace > 0 && (
              <span className="text-emerald-500/60">سماحية {grace}د</span>
            )}
          </div>
          <div className="flex justify-center px-1">
            <span className="whitespace-nowrap text-center font-semibold text-primary/60">ساعات العمل: {dur}</span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-start gap-x-2 gap-y-0.5">
            {showWindows && early > 0 && (
              <span className="text-orange-500/60">خروج مبكر {early}د</span>
            )}
            {showWindows && postWin > 0 && (
              <span className="text-green-600/60">خروج ±{postWin}د</span>
            )}
          </div>
        </div>
        <span className="shrink-0 text-end font-mono tabular-nums">
          {showWindows && postWin > 0 ? fmtMin(endMin + postWin) : period.endTime}
        </span>
      </div>
    </div>
  );
}

// ─── Schedule form ────────────────────────────────────────────────────────────

function ScheduleForm({ period, onChange }: { period: ShiftPeriod; onChange: (p: ShiftPeriod) => void }) {
  const [showAdv, setShowAdv] = React.useState(false);

  return (
    <div className="space-y-3">
      {/* Times row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">بداية الدوام</Label>
          <Input
            type="time"
            step={60}
            value={period.startTime}
            onChange={(e) => onChange({ ...period, startTime: normalizeTimeInput(e.target.value) })}
            className="h-11 font-mono text-sm tabular-nums"
          />
        </div>
        <div className="flex flex-col items-center pb-2.5 text-muted-foreground/50 gap-0.5">
          <span className="text-lg">←</span>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">نهاية الدوام</Label>
          <Input
            type="time"
            step={60}
            value={period.endTime}
            onChange={(e) => onChange({ ...period, endTime: normalizeTimeInput(e.target.value) })}
            className="h-11 font-mono text-sm tabular-nums"
          />
        </div>
      </div>

      {/* عقوبات الفترة — صف واحد، أيقونة المساعدة يساراً (في RTL) */}
      {period.strictMode && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.04] px-3 py-2 dark:bg-rose-950/20" dir="rtl">
          <div className="mb-2 border-b border-border/50 pb-1.5" dir="rtl">
            <div className="inline-flex items-center gap-1">
              <span className="text-xs font-semibold text-foreground">عقوبة الغياب</span>
              <InfoTooltip
                side="top"
                content={
                  <>
                    تُطبَّق هذه الخيارات عند اعتبار الموظف <strong className="text-foreground">غائباً عن هذه الفترة</strong> فقط.
                    يمكن تفعيل أكثر من خيار معاً؛ مرّر على أيقونة المساعدة بجانب كل خيار للتفاصيل.
                  </>
                }
              />
            </div>
          </div>
          <div className="flex flex-nowrap items-center gap-x-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-x-3">
            <div className="flex min-h-8 shrink-0 items-center gap-1">
              <Switch
                id={`sp-warn-${period.id}`}
                className="scale-90 shrink-0"
                checked={period.strictPenaltyWarning}
                onCheckedChange={(v) => onChange({ ...period, strictPenaltyWarning: v })}
              />
              <label htmlFor={`sp-warn-${period.id}`} className="cursor-pointer text-xs font-medium whitespace-nowrap">
                إنذار
              </label>
              <InfoTooltip
                side="top"
                content={<>يُسجَّل <strong>إنذار</strong> للموظف عند غيابه عن الفترة، وفق مسار الإنذارات في النظام.</>}
              />
            </div>

            <span className="hidden h-5 w-px shrink-0 bg-border/70 md:block" aria-hidden />

            <div className="flex min-h-8 shrink-0 items-center gap-1">
              <Switch
                id={`sp-bal-${period.id}`}
                className="scale-90 shrink-0"
                checked={period.strictPenaltyBalanceEnabled}
                onCheckedChange={(v) => onChange({ ...period, strictPenaltyBalanceEnabled: v })}
              />
              <label htmlFor={`sp-bal-${period.id}`} className="cursor-pointer text-xs font-medium whitespace-nowrap">
                خصم
              </label>
              <Input
                type="number"
                min={1}
                max={99}
                dir="ltr"
                disabled={!period.strictPenaltyBalanceEnabled}
                aria-label="عدد أيام الخصم من الرصيد"
                className={cn(
                  'h-7 w-11 shrink-0 px-1 text-center font-mono text-xs tabular-nums',
                  !period.strictPenaltyBalanceEnabled && 'opacity-40',
                )}
                value={period.strictPenaltyBalanceDays}
                onChange={(e) => {
                  const n = Math.min(99, Math.max(1, Number(e.target.value) || 1));
                  onChange({ ...period, strictPenaltyBalanceDays: n });
                }}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">يوم من الرصيد</span>
              <InfoTooltip
                side="top"
                content={
                  <>
                    يُخصم من راتب الموظف ما يعادل <strong>يوم عمل أو أكثر</strong> حسب الرقم الذي تدخله (مثلاً 1 = راتب يوم،
                    2 = راتب يومين) عن <strong>كل غياب</strong> في هذه الفترة.
                  </>
                }
              />
            </div>

            <span className="hidden h-5 w-px shrink-0 bg-border/70 md:block" aria-hidden />

            <div className="flex min-h-8 shrink-0 items-center gap-1">
              <Switch
                id={`sp-vac-${period.id}`}
                className="scale-90 shrink-0"
                checked={period.strictPenaltyVacationEnabled}
                onCheckedChange={(v) => onChange({ ...period, strictPenaltyVacationEnabled: v })}
              />
              <label
                htmlFor={`sp-vac-${period.id}`}
                className="flex cursor-pointer items-center gap-x-1 whitespace-nowrap text-[11px] sm:text-xs"
              >
                <span className="font-medium text-foreground">خصم</span>
                <span className="text-muted-foreground">يوم من رصيد الإجازة</span>
              </label>
              <InfoTooltip
                side="top"
                content={
                  <>
                    يُخصم <strong>يوم واحد فقط</strong> من رصيد إجازة الموظف عند غيابه عن هذه الفترة (بدون إدخال يدوي).
                  </>
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdv((p) => !p)}
        className="flex w-full items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
      >
        <span>إعدادات نوافذ الدخول والخروج</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showAdv && 'rotate-180')} />
      </button>

      {/* Advanced fields — directly after toggle */}
      {showAdv && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 bg-muted/10 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">نافذة الدخول</p>
            <MiniField
              label="قبل بداية الدوام (د)"
              value={period.checkIn.beforeStartMinutes}
              onChange={(v) => onChange({ ...period, checkIn: { ...period.checkIn, beforeStartMinutes: v } })}
              tooltip={<><strong className="block mb-1">السماح بالدخول المبكر</strong>دقائق قبل بداية الدوام يُسمح فيها بالبصمة.</>}
            />
            <MiniField
              label="سماحية (د)"
              value={period.checkIn.graceMinutes}
              onChange={(v) => onChange({ ...period, checkIn: { ...period.checkIn, graceMinutes: v } })}
              tooltip={<><strong className="block mb-1">فترة سماح</strong>دقائق بعد بداية الدوام لا يُحسب فيها تأخير.</>}
            />
            <MiniField
              label="بعد بداية الدوام (د)"
              value={period.checkIn.afterStartMinutes}
              onChange={(v) => onChange({ ...period, checkIn: { ...period.checkIn, afterStartMinutes: v } })}
              tooltip={<><strong className="block mb-1">آخر قبول للدخول</strong>بعدها الموظف غائب.</>}
            />
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/10 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">نافذة الخروج</p>
            <MiniField
              label="قبل نهاية الدوام (د)"
              value={period.checkOut.beforeEndMinutes}
              onChange={(v) => onChange({ ...period, checkOut: { ...period.checkOut, beforeEndMinutes: v } })}
              tooltip={<><strong className="block mb-1">الخروج المبكر المسموح</strong>دقائق قبل نهاية الدوام يمكن البصمة فيها.</>}
            />
            <MiniField
              label="نقص مسموح (د)"
              value={period.checkOut.allowedShortageMinutes}
              onChange={(v) => onChange({ ...period, checkOut: { ...period.checkOut, allowedShortageMinutes: v } })}
              tooltip={<><strong className="block mb-1">فترة سماح</strong>الخروج بهذا القدر قبل نهاية الدوام لا يُعدّ مخالفة.</>}
            />
            <MiniField
              label="بعد نهاية الدوام (د)"
              value={period.checkOut.afterEndMinutes}
              onChange={(v) => onChange({ ...period, checkOut: { ...period.checkOut, afterEndMinutes: v } })}
              tooltip={<><strong className="block mb-1">آخر قبول لتسجيل الخروج</strong>دقائق بعد نهاية الدوام تُقبل فيها بصمة الخروج.</>}
            />
          </div>
        </div>
      )}

      {/* Break — صف واحد: أيقونة + تسمية + مفتاح + وقت البداية — وقت النهاية */}
      <div
        className={cn(
          'flex min-w-0 flex-row flex-nowrap items-center gap-3 overflow-x-auto rounded-xl border-2 px-4 py-2.5 transition-all duration-200',
          period.breakEnabled ? 'border-amber-400/40 bg-amber-500/[0.05]' : 'border-border/50 bg-muted/10',
        )}
      >
        <label className="flex shrink-0 cursor-pointer items-center gap-2">
          <Coffee className={cn('h-4 w-4', period.breakEnabled ? 'text-amber-500' : 'text-muted-foreground/40')} />
          <span className={cn('text-sm font-medium whitespace-nowrap', period.breakEnabled ? 'text-foreground' : 'text-muted-foreground')}>
            استراحة
          </span>
          <Switch checked={period.breakEnabled} onCheckedChange={(v) => onChange({ ...period, breakEnabled: v })} />
        </label>
        {period.breakEnabled && (
          <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2">
            <Input
              type="time"
              step={60}
              value={period.breakStart}
              onChange={(e) => onChange({ ...period, breakStart: normalizeTimeInput(e.target.value) })}
              className="h-9 w-auto min-w-[7.5rem] max-w-[9.5rem] shrink-0 font-mono text-sm tabular-nums"
            />
            <span className="shrink-0 text-muted-foreground/60 text-xs">—</span>
            <Input
              type="time"
              step={60}
              value={period.breakEnd}
              onChange={(e) => onChange({ ...period, breakEnd: normalizeTimeInput(e.target.value) })}
              className="h-9 w-auto min-w-[7.5rem] max-w-[9.5rem] shrink-0 font-mono text-sm tabular-nums"
            />
          </div>
        )}
      </div>

      {/* Timeline / progress bar — after break so it reflects break + windows */}
      <ShiftTimeline period={period} showWindows={showAdv} />
    </div>
  );
}

function MiniField({
  label, value, onChange, tooltip,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  tooltip?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      {tooltip
        ? <LabelWithTooltip label={label} tooltip={tooltip} tooltipSide="top" />
        : <Label className="text-[10px] text-muted-foreground">{label}</Label>
      }
      <Input type="number" className="h-8 font-mono text-xs" value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </div>
  );
}

// ─── Period row (collapsible) ─────────────────────────────────────────────────

function PeriodRow({
  period, index, total, accentClass, periodBgClass, onRemove, onChange,
}: {
  period: ShiftPeriod;
  index: number;
  total: number;
  accentClass: string;
  periodBgClass: string;
  onRemove: () => void;
  onChange: (p: ShiftPeriod) => void;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const dur = durationLabel(period.startTime, period.endTime);

  return (
    <div className={cn('border-l-[3px] transition-colors', accentClass, periodBgClass)}>
      {/* Period header — صف: طي / معلومات / دوام صارم / حذف */}
      <div className="flex w-full min-h-[2.75rem] items-stretch">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5 text-start transition-colors hover:bg-muted/20"
          onClick={() => setCollapsed((c) => !c)}
        >
          <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200', collapsed && '-rotate-90')} />
          <span className="text-[11px] font-semibold text-muted-foreground">
            {total > 1 ? `الفترة ${index + 1}` : 'فترة الدوام'}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground/70">{period.startTime} ← {period.endTime}</span>
          {dur && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {dur}
            </span>
          )}
          {period.strictMode && period.strictPenaltyBalanceEnabled && (
            <span className="hidden rounded-full bg-muted/80 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground sm:inline">
              رصيد −{period.strictPenaltyBalanceDays}
            </span>
          )}
          {period.strictMode && period.strictPenaltyVacationEnabled && (
            <span className="hidden rounded-full bg-sky-500/15 px-2 py-0.5 text-[9px] font-semibold text-sky-800 dark:text-sky-300 sm:inline">
              إجازة −1
            </span>
          )}
          {period.strictMode && period.strictPenaltyWarning && (
            <span className="hidden rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold text-amber-800 dark:text-amber-300 sm:inline">
              إنذار
            </span>
          )}
        </button>

        <div
          className="flex shrink-0 flex-col items-center justify-center gap-0.5 border-s border-border/60 bg-muted/[0.35] px-3 py-2"
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          <span className="max-w-[4.5rem] text-center text-[9px] font-bold leading-tight text-muted-foreground">دوام صارم</span>
          <Switch
            checked={period.strictMode}
            onCheckedChange={(v) =>
              onChange({
                ...period,
                strictMode: v,
                ...(!v
                  ? {
                      strictPenaltyWarning: false,
                      strictPenaltyBalanceEnabled: false,
                      strictPenaltyVacationEnabled: false,
                    }
                  : {}),
              })
            }
            className="data-[state=checked]:bg-rose-600"
          />
        </div>

        {total > 1 && (
          <div className="flex items-center pe-2">
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-destructive/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3 w-3" /> حذف
            </button>
          </div>
        )}
      </div>

      {/* Period body */}
      {!collapsed && (
        <div className="px-4 pb-4 pt-1">
          <ScheduleForm period={period} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// ─── Day pill ─────────────────────────────────────────────────────────────────

function DayPill({ day, isRest, onClick }: { day: WeekDayIndex; isRest: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={DAY_LABELS[day]}
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 rounded-xl border-2 px-0.5 py-2.5 text-center transition-all duration-150 select-none',
        isRest
          ? 'border-border/50 bg-muted/20 text-muted-foreground/50 hover:border-border hover:bg-muted/30'
          : 'border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/10',
      )}
    >
      <span className="line-clamp-2 text-[10px] font-bold leading-tight">{DAY_LABELS[day]}</span>
      <span className={cn('h-1.5 w-1.5 rounded-full', isRest ? 'bg-muted-foreground/30' : 'bg-primary')} />
    </button>
  );
}

// ─── Shift group interface ────────────────────────────────────────────────────

interface ShiftGroup {
  id: string;
  days: WeekDayIndex[];
  periods: ShiftPeriod[];
}

function initGroups(template: ShiftTemplate): ShiftGroup[] {
  const workDays = template.weekDays.filter((w) => !w.isRest);
  if (workDays.length === 0) return [{ id: genId('grp'), days: [], periods: [defaultShiftPeriod(genId('per'))] }];
  const groups: ShiftGroup[] = [];
  for (const wd of workDays) {
    const firstP = wd.periods[0] ?? defaultShiftPeriod(genId('per'));
    const existing = groups.find((g) => g.periods[0]?.startTime === firstP.startTime && g.periods[0]?.endTime === firstP.endTime);
    if (existing) existing.days.push(wd.day);
    else groups.push({ id: genId('grp'), days: [wd.day], periods: wd.periods.length > 0 ? [...wd.periods] : [defaultShiftPeriod(genId('per'))] });
  }
  return groups.length > 0 ? groups : [{ id: genId('grp'), days: [], periods: [defaultShiftPeriod(genId('per'))] }];
}

// ─── Dialog form ─────────────────────────────────────────────────────────────

function DialogForm({ draft, setDraft }: {
  draft: ShiftTemplate;
  setDraft: React.Dispatch<React.SetStateAction<ShiftTemplate | null>>;
}) {
  const [groups, setGroups] = React.useState<ShiftGroup[]>(() => initGroups(draft));
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());

  const workDays     = WEEK_ORDER.filter((d) => !draft.weekDays.find((w) => w.day === d)?.isRest);
  const assignedDays = groups.flatMap((g) => g.days);
  const unassignedDays = workDays.filter((d) => !assignedDays.includes(d));

  const toggleGroupCollapse = (id: string) =>
    setCollapsedGroups((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // Sync groups → draft.weekDays
  React.useEffect(() => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weekDays: prev.weekDays.map((wd) => {
          if (wd.isRest) return wd;
          const grp = groups.find((g) => g.days.includes(wd.day));
          if (!grp) return wd;
          return { ...wd, periods: grp.periods.map((p, i) => ({ ...p, id: wd.periods[i]?.id ?? genId('per') })) };
        }),
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const toggleDay = (day: WeekDayIndex) => {
    const currentlyRest = draft.weekDays.find((w) => w.day === day)?.isRest ?? true;
    if (!currentlyRest) {
      setGroups((gs) => gs.map((g) => ({ ...g, days: g.days.filter((d) => d !== day) })));
    } else {
      setGroups((gs) => gs.length > 0 ? gs.map((g, i) => i === 0 ? { ...g, days: [...g.days, day] } : g) : gs);
    }
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weekDays: prev.weekDays.map((w) => {
          if (w.day !== day) return w;
          const toRest = !w.isRest;
          const basePeriods = groups[0]?.periods ?? [defaultShiftPeriod(genId('per'))];
          return toRest
            ? { ...w, isRest: true, periods: [] }
            : { ...w, isRest: false, periods: basePeriods.map((p) => ({ ...p, id: genId('per') })) };
        }),
      };
    });
  };

  const updateGroupPeriod = (groupId: string, periodIdx: number, p: ShiftPeriod) =>
    setGroups((gs) => gs.map((g) =>
      g.id === groupId ? { ...g, periods: g.periods.map((ex, i) => i === periodIdx ? p : ex) } : g,
    ));

  const addPeriodToGroup = (groupId: string) =>
    setGroups((gs) => gs.map((g) =>
      g.id === groupId ? { ...g, periods: [...g.periods, defaultShiftPeriod(genId('per'))] } : g,
    ));

  const removePeriodFromGroup = (groupId: string, periodIdx: number) =>
    setGroups((gs) => gs.map((g) =>
      g.id === groupId && g.periods.length > 1
        ? { ...g, periods: g.periods.filter((_, i) => i !== periodIdx) }
        : g,
    ));

  const moveDay = (day: WeekDayIndex, toGroupId: string) =>
    setGroups((gs) => gs.map((g) =>
      g.id === toGroupId
        ? { ...g, days: g.days.includes(day) ? g.days : [...g.days, day] }
        : { ...g, days: g.days.filter((d) => d !== day) },
    ));

  const addGroup = () => {
    const newGrp: ShiftGroup = { id: genId('grp'), days: [], periods: [defaultShiftPeriod(genId('per'))] };
    setGroups((gs) => [...gs, newGrp]);
  };

  const removeGroup = (groupId: string) => {
    setGroups((gs) => {
      const removing = gs.find((g) => g.id === groupId);
      if (!removing) return gs;
      const remaining = gs.filter((g) => g.id !== groupId);
      if (remaining.length > 0 && removing.days.length > 0) {
        remaining[0] = { ...remaining[0], days: [...remaining[0].days, ...removing.days] };
      }
      return remaining;
    });
  };

  return (
    <div className="space-y-5">
      {/* ── Name + active toggle ── */}
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <Label>اسم القالب</Label>
          <Input
            placeholder="مثال: دوام صباحي، دوام مسائي…"
            value={draft.nameAr}
            onChange={(e) => setDraft((d) => d ? { ...d, nameAr: e.target.value } : d)}
          />
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border-2 border-border/60 px-3 py-2.5 transition-all hover:bg-muted/20">
          <span className="text-sm font-medium">نشط</span>
          <Switch checked={draft.isActive} onCheckedChange={(v) => setDraft((d) => d ? { ...d, isActive: v } : d)} />
        </label>
      </div>

      <Separator />

      {/* ── Work days picker ── */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">أيام العمل</p>
        <div className="flex gap-1.5" dir="rtl">
          {WEEK_ORDER.map((day) => {
            const wd = draft.weekDays.find((w) => w.day === day)!;
            return <DayPill key={day} day={day} isRest={wd.isRest} onClick={() => toggleDay(day)} />;
          })}
        </div>
      </div>

      <Separator />

      {/* ── Schedule groups ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">جداول الدوام</p>
            <p className="text-[11px] text-muted-foreground">يمكنك إضافة جدول مختلف لمجموعة أيام معينة</p>
          </div>
          {groups.length < 3 && (
            <button
              type="button"
              onClick={addGroup}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              إضافة جدول مختلف
            </button>
          )}
        </div>

        {groups.map((group, gi) => {
          const color     = GROUP_COLORS[gi % GROUP_COLORS.length];
          const collapsed = collapsedGroups.has(group.id);
          const groupDur  = group.periods.reduce((acc, p) => {
            const d = toMinutes(p.endTime) - toMinutes(p.startTime);
            return acc + (d > 0 ? d : 0);
          }, 0);
          const groupDurLabel = groupDur > 0
            ? `${Math.floor(groupDur / 60)}س${groupDur % 60 > 0 ? ` ${groupDur % 60}د` : ''}`
            : '';

          return (
            <div key={group.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              {/* Group header — collapse control + delete (sibling buttons, no nested <button>) */}
              <div className="flex w-full items-center gap-1 border-b border-border/60 bg-muted/20 pe-2">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3 text-start transition-colors hover:bg-muted/30"
                  onClick={() => toggleGroupCollapse(group.id)}
                >
                  <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200', collapsed && '-rotate-90')} />
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span className={cn('text-[11px] font-semibold uppercase tracking-wide shrink-0', color.header)}>
                      {GROUP_LABELS[gi] ?? `الجدول ${gi + 1}`}
                    </span>
                    {groupDurLabel && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {groupDurLabel} إجمالي
                      </span>
                    )}
                    {/* Day chips */}
                    {group.days.length === 0 && (
                      <span className="text-[11px] text-muted-foreground/50 italic">لا توجد أيام</span>
                    )}
                    {group.days.map((d) => (
                      <span
                        key={d}
                        className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium cursor-pointer transition-colors hover:opacity-70', color.pill)}
                        title="انقر لنقل هذا اليوم إلى الجدول التالي"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextGroup = groups[(gi + 1) % groups.length];
                          if (nextGroup && nextGroup.id !== group.id) moveDay(d, nextGroup.id);
                        }}
                      >
                        {DAY_LABELS[d]}
                        {groups.length > 1 && <span className="opacity-50 text-[9px]">↕</span>}
                      </span>
                    ))}
                    {/* Unassigned days */}
                    {unassignedDays.map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-border/50 bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground cursor-pointer hover:border-primary/40 hover:text-primary transition-colors"
                        title="انقر لإضافة هذا اليوم لهذا الجدول"
                        onClick={(e) => { e.stopPropagation(); moveDay(d, group.id); }}
                      >
                        <Plus className="h-2.5 w-2.5" />
                        {DAY_LABELS[d]}
                      </span>
                    ))}
                  </div>
                </button>
                {groups.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeGroup(group.id); }}
                    className="shrink-0 rounded-full p-1 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="حذف الجدول"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Group body — collapsible */}
              {!collapsed && (
                <div>
                  {/* Periods */}
                  <div className="divide-y divide-border/40">
                    {group.periods.map((period, pi) => (
                      <PeriodRow
                        key={period.id}
                        period={period}
                        index={pi}
                        total={group.periods.length}
                        accentClass={color.accent}
                        periodBgClass={color.periodBg[pi % color.periodBg.length]}
                        onRemove={() => removePeriodFromGroup(group.id, pi)}
                        onChange={(p) => updateGroupPeriod(group.id, pi, p)}
                      />
                    ))}
                  </div>

                  {/* Add period button */}
                  <div className="border-t border-border/40 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => addPeriodToGroup(group.id)}
                      className={cn(
                        'flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs font-medium transition-colors',
                        'border-border/60 text-muted-foreground hover:border-border',
                        color.add,
                      )}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      إضافة فترة دوام أخرى
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({ t, onEdit, onDelete }: { t: ShiftTemplate; onEdit: () => void; onDelete: () => void }) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated cursor-pointer"
      onClick={onEdit}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
            t.isActive
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'border-border bg-muted text-muted-foreground',
          )}>
            <span className={cn('h-1.5 w-1.5 rounded-full', t.isActive ? 'bg-emerald-500' : 'bg-muted-foreground')} />
            {t.isActive ? 'نشط' : 'موقوف'}
          </span>
        </div>

        <h3 className="font-display text-base font-bold leading-snug mb-1 group-hover:text-primary transition-colors">
          {t.nameAr}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">{summarizeTemplate(t)}</p>

        <div className="flex gap-1 mb-4" dir="rtl">
          {WEEK_ORDER.map((day) => {
            const wd = t.weekDays.find((w) => w.day === day);
            return (
              <div
                key={day}
                title={DAY_LABELS[day]}
                className={cn(
                  'flex h-7 flex-1 items-center justify-center rounded px-0.5 text-[8px] font-bold leading-tight',
                  wd?.isRest ? 'bg-muted text-muted-foreground/40' : 'bg-primary/15 text-primary',
                )}
              >
                <span className="line-clamp-2 text-center">{DAY_LABELS[day]}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end border-t border-border/60 pt-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" type="button" className="h-7 gap-1 px-2 text-xs" onClick={onEdit}>
              <Pencil className="h-3 w-3" /> تعديل
            </Button>
            <Button variant="ghost" size="sm" type="button"
              className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
              onClick={onDelete}>
              <Trash2 className="h-3 w-3" /> حذف
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main panel ────────────────────────────────────────────────────────────────

export function ShiftTemplatesPanel() {
  const shiftTemplates = useAttendanceStore((s) => s.shiftTemplates);
  const upsertTemplate  = useAttendanceStore((s) => s.upsertTemplate);
  const removeTemplate  = useAttendanceStore((s) => s.removeTemplate);

  const [open, setOpen]   = React.useState(false);
  const [draft, setDraft] = React.useState<ShiftTemplate | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const buildDefault = (): ShiftTemplate => {
    const per = defaultShiftPeriod(genId('per'));
    return {
      id: genId('tpl'),
      nameAr: '',
      nameEn: '',
      colorHex: '#0f766e',
      effectiveFrom: new Date().toISOString().slice(0, 10),
      isActive: true,
      weekDays: ([6, 0, 1, 2, 3, 4, 5] as WeekDayIndex[]).map((day) => ({
        day,
        isRest: DEFAULT_REST.includes(day),
        periods: DEFAULT_REST.includes(day) ? [] : [{ ...per, id: genId('per') }],
      })),
    };
  };

  const openCreate = () => { setDraft(buildDefault()); setError(null); setOpen(true); };
  const openEdit = (t: ShiftTemplate) => {
    setDraft(normalizeShiftTemplate(cloneTemplate(t)));
    setError(null);
    setOpen(true);
  };

  const save = () => {
    if (!draft) return;
    const err = validateTemplate(draft);
    if (err) { setError(err); return; }
    upsertTemplate({ ...draft, nameEn: draft.nameAr.trim() });
    setOpen(false);
    setDraft(null);
  };

  const isEdit = !!draft && shiftTemplates.some((x) => x.id === draft.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button variant="luxe" className="gap-2 shrink-0" type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" /> قالب جديد
        </Button>
      </div>

      {shiftTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <Clock className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا توجد قوالب بعد</p>
          <p className="mt-1 text-xs text-muted-foreground/60">أضف قالباً جديداً لتحديد أوقات الدوام</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shiftTemplates.map((t) => (
            <TemplateCard
              key={t.id}
              t={t}
              onEdit={() => openEdit(t)}
              onDelete={() => { if (window.confirm('حذف القالب؟')) removeTemplate(t.id); }}
            />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden border-border p-0">
          <div className="shrink-0 border-b border-border px-6 py-5">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {isEdit ? 'تعديل القالب' : 'قالب دوام جديد'}
              </DialogTitle>
              <DialogDescription>
                حدد أيام العمل ثم أدخل أوقات الدوام — تُطبَّق تلقائياً على جميع الأيام المحددة.
              </DialogDescription>
            </DialogHeader>
          </div>

          {draft && (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <DialogForm draft={draft} setDraft={setDraft as React.Dispatch<React.SetStateAction<ShiftTemplate | null>>} />
              {error && (
                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="shrink-0 gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:justify-start sm:space-x-2 sm:space-x-reverse">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button variant="luxe" type="button" onClick={save}>حفظ القالب</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
