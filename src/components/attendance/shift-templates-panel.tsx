'use client';

import * as React from 'react';
import { Pencil, Plus, Trash2, Clock, ChevronDown, Settings2, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SingleDatePicker } from '@/components/ui/single-date-picker';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { defaultShiftPeriod, defaultWorkWeekPeriods } from '@/lib/attendance/defaults';
import type { ShiftPeriod, ShiftTemplate, TemplateDayConfig, WeekDayIndex } from '@/lib/attendance/types';
import { useAttendanceStore } from '@/lib/attendance/store';
import { genId } from '@/lib/attendance/utils';
import { cn } from '@/lib/utils';

const DAY_LABELS: Record<WeekDayIndex, string> = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

const DAY_SHORT: Record<WeekDayIndex, string> = {
  0: 'أحد',
  1: 'إثن',
  2: 'ثلا',
  3: 'أرب',
  4: 'خمس',
  5: 'جمع',
  6: 'سبت',
};

function summarizeTemplate(t: ShiftTemplate): string {
  const workDays = t.weekDays.filter((d) => !d.isRest).length;
  const maxP = Math.max(0, ...t.weekDays.map((d) => (d.isRest ? 0 : d.periods.length)));
  return `${workDays} أيام · ${maxP} فترات`;
}

function cloneTemplate(t: ShiftTemplate): ShiftTemplate {
  return JSON.parse(JSON.stringify(t)) as ShiftTemplate;
}

function validateTemplate(t: ShiftTemplate): string | null {
  if (!t.nameAr.trim()) return 'اسم القالب بالعربية مطلوب';
  for (const d of t.weekDays) {
    if (d.isRest) continue;
    if (d.periods.length === 0) return `${DAY_LABELS[d.day]}: يجب وجود فترة أو تعيين اليوم كراحة`;
    for (const p of d.periods) {
      const [sh, sm] = p.startTime.split(':').map(Number);
      const [eh, em] = p.endTime.split(':').map(Number);
      const a = sh * 60 + sm;
      const b = eh * 60 + em;
      if (!(b > a)) return `${DAY_LABELS[d.day]}: وقت النهاية يجب أن يكون بعد البداية`;
      if (p.breakEnabled) {
        const [bh, bm] = p.breakStart.split(':').map(Number);
        const [eh2, em2] = p.breakEnd.split(':').map(Number);
        const bs = bh * 60 + bm;
        const be = eh2 * 60 + em2;
        if (bs < a || be > b || be <= bs) return `${DAY_LABELS[d.day]}: أوقات الاستراحة يجب أن تقع داخل الفترة`;
      }
    }
  }
  return null;
}

/** Row whose border and background clearly reflect on/off; whole row is clickable. */
function SettingToggleRow({
  checked,
  onCheckedChange,
  title,
  subtitle,
  compact,
  className,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  title: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
}) {
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer select-none items-center justify-between gap-3 border-2 transition-all duration-200',
        compact ? 'rounded-xl px-3 py-2' : 'rounded-2xl px-4 py-3.5',
        checked
          ? 'border-primary/40 bg-primary/[0.09] shadow-sm shadow-primary/10'
          : 'border-border/70 bg-muted/15 hover:border-border hover:bg-muted/30',
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className={cn('font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>{title}</span>
        {subtitle ? <span className="mt-0.5 block text-xs text-muted-foreground">{subtitle}</span> : null}
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} className="shrink-0" />
    </label>
  );
}

// ─── Period card ──────────────────────────────────────────────────────────────

function PeriodCard({
  period,
  dayLabel,
  onUpdate,
  onRemove,
}: {
  period: ShiftPeriod;
  dayLabel: string;
  onUpdate: (patch: Partial<ShiftPeriod>) => void;
  onRemove: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const breakSwitchId = React.useId();

  const durationMins = React.useMemo(() => {
    const [sh, sm] = period.startTime.split(':').map(Number);
    const [eh, em] = period.endTime.split(':').map(Number);
    const d = (eh * 60 + em) - (sh * 60 + sm);
    return d > 0 ? d : 0;
  }, [period.startTime, period.endTime]);

  const durationLabel = durationMins > 0
    ? `${Math.floor(durationMins / 60)}س ${durationMins % 60 > 0 ? `${durationMins % 60}د` : ''}`.trim()
    : '';

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {/* Main times row */}
      <div className="flex items-center gap-0 divide-x divide-x-reverse divide-border/60">
        <div className="flex flex-1 flex-col items-center gap-0.5 px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">بداية</span>
          <Input
            type="time"
            className="h-9 border-0 bg-transparent p-0 text-center font-mono text-base font-bold shadow-none focus-visible:ring-0"
            value={period.startTime}
            onChange={(e) => onUpdate({ startTime: e.target.value })}
          />
        </div>

        <div className="flex flex-col items-center px-3 py-3 text-muted-foreground/40">
          <span className="text-lg">→</span>
          {durationLabel && (
            <span className="mt-0.5 text-[10px] font-mono text-primary/70">{durationLabel}</span>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center gap-0.5 px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">نهاية</span>
          <Input
            type="time"
            className="h-9 border-0 bg-transparent p-0 text-center font-mono text-base font-bold shadow-none focus-visible:ring-0"
            value={period.endTime}
            onChange={(e) => onUpdate({ endTime: e.target.value })}
          />
        </div>
      </div>

      <Separator />

      {/* Break row */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
        <label
          htmlFor={breakSwitchId}
          className={cn(
            'flex cursor-pointer select-none items-center gap-2 rounded-xl border-2 px-3 py-2 transition-all duration-200',
            period.breakEnabled
              ? 'border-primary/40 bg-primary/[0.07] shadow-sm shadow-primary/5'
              : 'border-transparent bg-muted/25 hover:bg-muted/40',
          )}
        >
          <Coffee className={cn('h-3.5 w-3.5 shrink-0', period.breakEnabled ? 'text-primary' : 'text-muted-foreground')} />
          <span className={cn('text-xs', period.breakEnabled ? 'font-medium text-foreground' : 'text-muted-foreground')}>استراحة</span>
          <Switch
            id={breakSwitchId}
            checked={period.breakEnabled}
            onCheckedChange={(v) => onUpdate({ breakEnabled: v })}
            className="shrink-0"
          />
        </label>
        {period.breakEnabled && (
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5" dir="ltr">
            <Input
              type="time"
              className="h-7 w-[6.5rem] border-0 bg-transparent p-0 font-mono text-xs shadow-none focus-visible:ring-0"
              value={period.breakStart}
              onChange={(e) => onUpdate({ breakStart: e.target.value })}
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="time"
              className="h-7 w-[6.5rem] border-0 bg-transparent p-0 font-mono text-xs shadow-none focus-visible:ring-0"
              value={period.breakEnd}
              onChange={(e) => onUpdate({ breakEnd: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced((p) => !p)}
        className="flex w-full items-center justify-between border-t border-border/60 bg-muted/20 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40"
      >
        <span className="flex items-center gap-1.5">
          <Settings2 className="h-3 w-3" />
          إعدادات نوافذ الدخول والخروج
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showAdvanced && 'rotate-180')} />
      </button>

      {showAdvanced && (
        <div className="border-t border-border/40 bg-muted/10 px-4 py-3 space-y-3">
          {/* Check-in windows */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary/70">نافذة الدخول</p>
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                label="قبل (د)"
                value={period.checkIn.beforeStartMinutes}
                onChange={(v) => onUpdate({ checkIn: { ...period.checkIn, beforeStartMinutes: v } })}
              />
              <NumberField
                label="سماحية (د)"
                value={period.checkIn.graceMinutes}
                onChange={(v) => onUpdate({ checkIn: { ...period.checkIn, graceMinutes: v } })}
              />
              <NumberField
                label="بعد (د)"
                value={period.checkIn.afterStartMinutes}
                onChange={(v) => onUpdate({ checkIn: { ...period.checkIn, afterStartMinutes: v } })}
              />
            </div>
          </div>

          {/* Check-out windows */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary/70">نافذة الخروج</p>
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                label="قبل النهاية (د)"
                value={period.checkOut.beforeEndMinutes}
                onChange={(v) => onUpdate({ checkOut: { ...period.checkOut, beforeEndMinutes: v } })}
              />
              <NumberField
                label="نقص مسموح (د)"
                value={period.checkOut.allowedShortageMinutes}
                onChange={(v) => onUpdate({ checkOut: { ...period.checkOut, allowedShortageMinutes: v } })}
              />
              <NumberField
                label="بعد النهاية (د)"
                value={period.checkOut.afterEndMinutes}
                onChange={(v) => onUpdate({ checkOut: { ...period.checkOut, afterEndMinutes: v } })}
              />
            </div>
          </div>

          {/* Flexibility + flags */}
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="مرونة (د)"
              value={period.flexibilityMinutes}
              onChange={(v) => onUpdate({ flexibilityMinutes: v })}
            />
            <div className="flex items-end">
              <SettingToggleRow
                className="w-full"
                compact
                checked={period.checkOutNotRequired}
                onCheckedChange={(v) => onUpdate({ checkOutNotRequired: v })}
                title="خروج غير إلزامي"
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex justify-end border-t border-border/40 px-3 py-2">
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs text-destructive hover:text-destructive" onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
          حذف الفترة
        </Button>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <Input
        type="number"
        className="h-8 font-mono text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}

// ─── Day column ────────────────────────────────────────────────────────────────

function DayColumn({
  wd,
  onUpdateDay,
  onUpdatePeriod,
  onAddPeriod,
  onRemovePeriod,
}: {
  wd: TemplateDayConfig;
  onUpdateDay: (patch: Partial<TemplateDayConfig>) => void;
  onUpdatePeriod: (periodId: string, patch: Partial<ShiftPeriod>) => void;
  onAddPeriod: () => void;
  onRemovePeriod: (periodId: string) => void;
}) {
  const restToggleId = React.useId();
  return (
    <div className={cn('rounded-xl border p-4 space-y-3', wd.isRest ? 'border-dashed border-border/60 bg-muted/20' : 'border-border bg-card shadow-soft')}>
      {/* Day header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold', wd.isRest ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary')}>
            {DAY_SHORT[wd.day]}
          </div>
          <span className="font-semibold">{DAY_LABELS[wd.day]}</span>
          {!wd.isRest && wd.periods.length > 0 && (
            <Badge variant="secondary" className="h-5 text-[10px]">{wd.periods.length} فترة</Badge>
          )}
        </div>
        <label
          htmlFor={restToggleId}
          className={cn(
            'flex cursor-pointer select-none items-center gap-2 rounded-full border-2 px-3 py-1.5 transition-all duration-200',
            wd.isRest
              ? 'border-amber-500/45 bg-amber-500/[0.12] shadow-sm shadow-amber-500/10'
              : 'border-border/70 bg-muted/20 hover:bg-muted/35',
          )}
        >
          <span className={cn('text-xs', wd.isRest ? 'font-medium text-amber-950 dark:text-amber-100' : 'text-muted-foreground')}>راحة</span>
          <Switch
            id={restToggleId}
            checked={wd.isRest}
            onCheckedChange={(v) =>
              onUpdateDay({ isRest: v, periods: v ? [] : [defaultShiftPeriod(genId('per'))] })
            }
            className="shrink-0"
          />
        </label>
      </div>

      {wd.isRest ? (
        <div className="flex items-center justify-center py-4">
          <span className="text-xs text-muted-foreground/60">يوم راحة</span>
        </div>
      ) : (
        <div className="space-y-2">
          {wd.periods.map((p) => (
            <PeriodCard
              key={p.id}
              period={p}
              dayLabel={DAY_LABELS[wd.day]}
              onUpdate={(patch) => onUpdatePeriod(p.id, patch)}
              onRemove={() => onRemovePeriod(p.id)}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
            onClick={onAddPeriod}
          >
            <Plus className="h-3.5 w-3.5" />
            إضافة فترة
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main panel ────────────────────────────────────────────────────────────────

export function ShiftTemplatesPanel() {
  const shiftTemplates = useAttendanceStore((s) => s.shiftTemplates);
  const upsertTemplate = useAttendanceStore((s) => s.upsertTemplate);
  const removeTemplate = useAttendanceStore((s) => s.removeTemplate);

  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<ShiftTemplate | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const openCreate = () => {
    setDraft({
      id: genId('tpl'),
      nameAr: '',
      nameEn: '',
      colorHex: '#0f766e',
      effectiveFrom: new Date().toISOString().slice(0, 10),
      isActive: true,
      weekDays: defaultWorkWeekPeriods((day, i) => `p-${day}-${i}`),
    });
    setError(null);
    setOpen(true);
  };

  const openEdit = (t: ShiftTemplate) => {
    setDraft(cloneTemplate(t));
    setError(null);
    setOpen(true);
  };

  const save = () => {
    if (!draft) return;
    const err = validateTemplate(draft);
    if (err) { setError(err); return; }
    upsertTemplate(draft);
    setOpen(false);
    setDraft(null);
  };

  const updateDay = (day: WeekDayIndex, patch: Partial<TemplateDayConfig>) =>
    setDraft((d) => d ? { ...d, weekDays: d.weekDays.map((w) => w.day === day ? { ...w, ...patch } : w) } : d);

  const updatePeriod = (day: WeekDayIndex, periodId: string, patch: Partial<ShiftPeriod>) =>
    setDraft((d) => d ? {
      ...d,
      weekDays: d.weekDays.map((w) =>
        w.day !== day ? w : { ...w, periods: w.periods.map((p) => p.id === periodId ? { ...p, ...patch } : p) },
      ),
    } : d);

  const addPeriod = (day: WeekDayIndex) =>
    setDraft((d) => d ? {
      ...d,
      weekDays: d.weekDays.map((w) =>
        w.day !== day ? w : { ...w, isRest: false, periods: [...w.periods, defaultShiftPeriod(genId('per'))] },
      ),
    } : d);

  const removePeriod = (day: WeekDayIndex, periodId: string) =>
    setDraft((d) => d ? {
      ...d,
      weekDays: d.weekDays.map((w) =>
        w.day !== day ? w : { ...w, periods: w.periods.filter((p) => p.id !== periodId) },
      ),
    } : d);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          إنشاء وتعديل قوالب الجدول الأسبوعي، الفترات، النوافذ، والمرونة.
        </p>
        <Button variant="luxe" className="gap-2 shrink-0" type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          قالب جديد
        </Button>
      </div>

      {/* Templates table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        {shiftTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Clock className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">لا توجد قوالب بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-right">القالب</th>
                  <th className="px-4 py-3 text-right">اللون</th>
                  <th className="px-4 py-3 text-right">ساري من</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">ملخص</th>
                  <th className="px-4 py-3 text-right">أيام الأسبوع</th>
                  <th className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {shiftTemplates.map((t) => (
                  <tr key={t.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{t.nameAr}</p>
                      {t.nameEn && <p className="text-xs text-muted-foreground" dir="ltr">{t.nameEn}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md border border-border shadow-sm" style={{ background: t.colorHex }} />
                        <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">{t.colorHex}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">{t.effectiveFrom}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                        t.isActive
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-border bg-muted text-muted-foreground',
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', t.isActive ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                        {t.isActive ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{summarizeTemplate(t)}</td>
                    <td className="px-4 py-3">
                      {/* 7-day mini indicator */}
                      <div className="flex gap-0.5" dir="rtl">
                        {t.weekDays.map((wd) => (
                          <div
                            key={wd.day}
                            title={DAY_LABELS[wd.day]}
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded text-[9px] font-semibold',
                              wd.isRest
                                ? 'bg-muted text-muted-foreground/50'
                                : 'text-white',
                            )}
                            style={!wd.isRest ? { background: t.colorHex } : undefined}
                          >
                            {DAY_SHORT[wd.day].charAt(0)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" type="button" onClick={() => openEdit(t)} aria-label="تعديل">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="text-destructive hover:text-destructive"
                          aria-label="حذف"
                          onClick={() => { if (typeof window !== 'undefined' && window.confirm('حذف القالب؟')) removeTemplate(t.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden border-border p-0 sm:max-w-5xl">
          {/* Fixed header */}
          <div className="shrink-0 border-b border-border px-6 py-5">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {draft && shiftTemplates.some((x) => x.id === draft.id) ? 'تعديل القالب' : 'قالب جديد'}
              </DialogTitle>
              <DialogDescription>حدد الأسماء، الألوان، والجدول الأسبوعي والفترات لكل يوم.</DialogDescription>
            </DialogHeader>
          </div>

          {/* Scrollable body */}
          {draft && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Meta fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nameAr">الاسم بالعربية</Label>
                  <Input id="nameAr" value={draft.nameAr} onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">الاسم بالإنجليزية</Label>
                  <Input id="nameEn" dir="ltr" value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>اللون</Label>
                  <div className="flex gap-2">
                    <Input type="color" className="h-10 w-14 cursor-pointer p-1" value={draft.colorHex} onChange={(e) => setDraft({ ...draft, colorHex: e.target.value })} />
                    <Input dir="ltr" className="font-mono text-sm" value={draft.colorHex} onChange={(e) => setDraft({ ...draft, colorHex: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eff">ساري من</Label>
                  <SingleDatePicker
                    id="eff"
                    value={draft.effectiveFrom}
                    onChange={(effectiveFrom) => setDraft({ ...draft, effectiveFrom })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <SettingToggleRow
                    checked={draft.isActive}
                    onCheckedChange={(v) => setDraft({ ...draft, isActive: v })}
                    title="قالب نشط"
                    subtitle="يمكن إيقاف القالب دون حذفه"
                  />
                </div>
              </div>

              <Separator />

              {/* Weekly schedule */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Clock className="h-4 w-4 text-primary" />
                  الجدول الأسبوعي
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {draft.weekDays.map((wd) => (
                    <DayColumn
                      key={wd.day}
                      wd={wd}
                      onUpdateDay={(patch) => updateDay(wd.day, patch)}
                      onUpdatePeriod={(pid, patch) => updatePeriod(wd.day, pid, patch)}
                      onAddPeriod={() => addPeriod(wd.day)}
                      onRemovePeriod={(pid) => removePeriod(wd.day, pid)}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Fixed footer */}
          <DialogFooter className="shrink-0 gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:justify-start sm:space-x-2 sm:space-x-reverse">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button variant="luxe" type="button" onClick={save}>حفظ القالب</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
