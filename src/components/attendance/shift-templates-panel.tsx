'use client';

import * as React from 'react';
import { Pencil, Plus, Trash2, Clock, ChevronDown, Coffee } from 'lucide-react';
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
import { defaultShiftPeriod } from '@/lib/attendance/defaults';
import type { ShiftPeriod, ShiftTemplate, WeekDayIndex } from '@/lib/attendance/types';
import { useAttendanceStore } from '@/lib/attendance/store';
import { genId } from '@/lib/attendance/utils';
import { cn } from '@/lib/utils';
import { LabelWithTooltip } from '@/components/ui/tooltip';
import { TimePicker } from '@/components/ui/time-picker';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS: Record<WeekDayIndex, string> = {
  0: 'الأحد', 1: 'الإثنين', 2: 'الثلاثاء', 3: 'الأربعاء',
  4: 'الخميس', 5: 'الجمعة', 6: 'السبت',
};

const DAY_SHORT: Record<WeekDayIndex, string> = {
  0: 'أحد', 1: 'إثن', 2: 'ثلا', 3: 'أرب', 4: 'خمس', 5: 'جمع', 6: 'سبت',
};

const WEEK_ORDER: WeekDayIndex[] = [6, 0, 1, 2, 3, 4, 5];
const DEFAULT_REST: WeekDayIndex[] = [5, 6];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
        return `${DAY_LABELS[d.day]}: وقت النهاية يجب أن يكون بعد البداية`;
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
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const d = (eh * 60 + em) - (sh * 60 + sm);
  if (d <= 0) return '';
  const h = Math.floor(d / 60), m = d % 60;
  return m > 0 ? `${h}س ${m}د` : `${h}س`;
}

// ─── Schedule form ────────────────────────────────────────────────────────────

function ScheduleForm({ period, onChange }: { period: ShiftPeriod; onChange: (p: ShiftPeriod) => void }) {
  const dur = durationLabel(period.startTime, period.endTime);
  const [showAdv, setShowAdv] = React.useState(false);

  return (
    <div className="space-y-3">
      {/* Times row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">بداية الدوام</Label>
          <TimePicker value={period.startTime} onChange={(v) => onChange({ ...period, startTime: v })} />
        </div>
        <div className="flex flex-col items-center pb-2.5 text-muted-foreground/50 gap-0.5">
          <span className="text-lg">←</span>
          {dur && <span className="text-[10px] font-mono text-primary/70 font-medium">{dur}</span>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">نهاية الدوام</Label>
          <TimePicker value={period.endTime} onChange={(v) => onChange({ ...period, endTime: v })} />
        </div>
      </div>

      {/* Break — compact single row, times expand inline when enabled */}
      <div className={cn(
        'flex flex-wrap items-center gap-3 rounded-xl border-2 px-4 py-2.5 transition-all duration-200',
        period.breakEnabled ? 'border-primary/30 bg-primary/[0.05]' : 'border-border/50 bg-muted/10',
      )}>
        <label className="flex cursor-pointer items-center gap-2 shrink-0">
          <Coffee className={cn('h-4 w-4', period.breakEnabled ? 'text-primary' : 'text-muted-foreground/40')} />
          <span className={cn('text-sm font-medium', period.breakEnabled ? 'text-foreground' : 'text-muted-foreground')}>
            استراحة
          </span>
          <Switch
            checked={period.breakEnabled}
            onCheckedChange={(v) => onChange({ ...period, breakEnabled: v })}
          />
        </label>

        {period.breakEnabled && (
          <div className="flex items-center gap-2">
            <TimePicker value={period.breakStart} onChange={(v) => onChange({ ...period, breakStart: v })} className="h-9 w-32 text-sm" />
            <span className="text-muted-foreground/60 text-xs">—</span>
            <TimePicker value={period.breakEnd} onChange={(v) => onChange({ ...period, breakEnd: v })} className="h-9 w-32 text-sm" />
          </div>
        )}
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdv((p) => !p)}
        className="flex w-full items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
      >
        <span>إعدادات متقدمة (نوافذ الدخول والخروج)</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showAdv && 'rotate-180')} />
      </button>

      {showAdv && (
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-4">
          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-primary/70">نافذة الدخول</p>
            <div className="grid grid-cols-3 gap-2">
              <MiniField
                label="قبل (د)"
                value={period.checkIn.beforeStartMinutes}
                onChange={(v) => onChange({ ...period, checkIn: { ...period.checkIn, beforeStartMinutes: v } })}
                tooltip={
                  <>
                    <strong className="block mb-1">السماح بالدخول المبكر</strong>
                    عدد الدقائق قبل بداية الفترة التي يُسمح فيها بتسجيل الدخول.
                    <br />مثال: بداية الدوام 09:00 وهذه القيمة 30 دقيقة ← أقرب بصمة مقبولة هي 08:30.
                    أي بصمة قبل ذلك لا تُعد حضوراً ضمن هذه النافذة.
                  </>
                }
              />
              <MiniField
                label="سماحية (د)"
                value={period.checkIn.graceMinutes}
                onChange={(v) => onChange({ ...period, checkIn: { ...period.checkIn, graceMinutes: v } })}
                tooltip={
                  <>
                    <strong className="block mb-1">فترة التسامح</strong>
                    عدد الدقائق بعد بداية الفترة لا يُحسب فيها تأخير.
                    <br />مثال: بداية 09:00 وسماحية 10 دقائق ← الدخول حتى 09:10 لا يُسجَّل تأخيراً.
                  </>
                }
              />
              <MiniField
                label="بعد (د)"
                value={period.checkIn.afterStartMinutes}
                onChange={(v) => onChange({ ...period, checkIn: { ...period.checkIn, afterStartMinutes: v } })}
                tooltip={
                  <>
                    <strong className="block mb-1">آخر قبول للدخول</strong>
                    عدد الدقائق بعد بداية الفترة يُغلق فيها باب الدخول.
                    <br />مثال: بداية 09:00 وهذه القيمة 60 دقيقة:
                    <ul className="mt-1 space-y-0.5 list-disc ps-4">
                      <li>09:00 – 09:10: ضمن السماحية، لا تأخير</li>
                      <li>09:10 – 10:00: دخول متأخر مقبول</li>
                      <li>بعد 10:00: يُعتبر الموظف غائباً</li>
                    </ul>
                  </>
                }
              />
            </div>
          </div>
          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-primary/70">نافذة الخروج</p>
            <div className="grid grid-cols-3 gap-2">
              <MiniField
                label="قبل النهاية (د)"
                value={period.checkOut.beforeEndMinutes}
                onChange={(v) => onChange({ ...period, checkOut: { ...period.checkOut, beforeEndMinutes: v } })}
                tooltip={
                  <>
                    <strong className="block mb-1">الخروج المبكر المسموح</strong>
                    عدد الدقائق قبل نهاية الفترة التي يُمكن فيها بدء تسجيل الخروج.
                    <br />مثال: نهاية 17:00 وهذه القيمة 10 دقائق ← يُقبل الخروج من 16:50.
                  </>
                }
              />
              <MiniField
                label="نقص مسموح (د)"
                value={period.checkOut.allowedShortageMinutes}
                onChange={(v) => onChange({ ...period, checkOut: { ...period.checkOut, allowedShortageMinutes: v } })}
                tooltip={
                  <>
                    <strong className="block mb-1">نقص الوقت المغفور</strong>
                    الخروج قبل نهاية الدوام بهذا القدر لا يُعدّ خروجاً مبكراً مؤثراً.
                    <br />مثال: نهاية 17:00 ونقص مسموح 15 دقيقة ← الخروج من 16:45 لا يُحسب مخالفة.
                  </>
                }
              />
              <MiniField
                label="بعد النهاية (د)"
                value={period.checkOut.afterEndMinutes}
                onChange={(v) => onChange({ ...period, checkOut: { ...period.checkOut, afterEndMinutes: v } })}
                tooltip={
                  <>
                    <strong className="block mb-1">آخر قبول لتسجيل الخروج</strong>
                    عدد الدقائق بعد نهاية الفترة يظل فيها تسجيل الخروج مقبولاً.
                    <br />مثال: نهاية 17:00 وهذه القيمة 120 دقيقة ← تُقبل بصمة الخروج حتى 19:00.
                  </>
                }
              />
            </div>
          </div>
        </div>
      )}
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

// ─── Day pill ─────────────────────────────────────────────────────────────────

function DayPill({ day, isRest, onClick }: { day: WeekDayIndex; isRest: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-center transition-all duration-150 select-none',
        isRest
          ? 'border-border/50 bg-muted/20 text-muted-foreground/50 hover:border-border hover:bg-muted/30'
          : 'border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/10',
      )}
    >
      <span className="text-[11px] font-bold">{DAY_SHORT[day]}</span>
      <span className={cn('h-1.5 w-1.5 rounded-full', isRest ? 'bg-muted-foreground/30' : 'bg-primary')} />
    </button>
  );
}

// ─── Dialog form ─────────────────────────────────────────────────────────────

function DialogForm({ draft, setDraft }: {
  draft: ShiftTemplate;
  setDraft: React.Dispatch<React.SetStateAction<ShiftTemplate | null>>;
}) {
  const firstWorkPeriod = draft.weekDays.find((d) => !d.isRest && d.periods.length > 0)?.periods[0]
    ?? defaultShiftPeriod(genId('per'));
  const [period, setPeriod] = React.useState<ShiftPeriod>(firstWorkPeriod);

  const workDays = WEEK_ORDER.filter((d) => !draft.weekDays.find((w) => w.day === d)?.isRest);

  const toggleDay = (day: WeekDayIndex) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weekDays: prev.weekDays.map((w) => {
          if (w.day !== day) return w;
          const toRest = !w.isRest;
          return toRest
            ? { ...w, isRest: true, periods: [] }
            : { ...w, isRest: false, periods: [{ ...period, id: genId('per') }] };
        }),
      };
    });
  };

  const applyToAll = () => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weekDays: prev.weekDays.map((w) =>
          w.isRest ? w : { ...w, periods: [{ ...period, id: genId('per') }] },
        ),
      };
    });
  };

  const applyToDays = (days: WeekDayIndex[]) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weekDays: prev.weekDays.map((w) =>
          days.includes(w.day) ? { ...w, isRest: false, periods: [{ ...period, id: genId('per') }] } : w,
        ),
      };
    });
  };

  const handlePeriodChange = (p: ShiftPeriod) => {
    setPeriod(p);
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weekDays: prev.weekDays.map((w) =>
          w.isRest ? w : { ...w, periods: [{ ...p, id: w.periods[0]?.id ?? genId('per') }] },
        ),
      };
    });
  };

  return (
    <div className="space-y-5">
      {/* ── Name + active toggle in one row ── */}
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
          <Switch
            checked={draft.isActive}
            onCheckedChange={(v) => setDraft((d) => d ? { ...d, isActive: v } : d)}
          />
        </label>
      </div>

      <Separator />

      {/* ── Work days picker ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">أيام العمل</p>
            <p className="text-[11px] text-muted-foreground">انقر لتبديل العمل / الراحة</p>
          </div>
        </div>

        <div className="flex gap-1.5" dir="rtl">
          {WEEK_ORDER.map((day) => {
            const wd = draft.weekDays.find((w) => w.day === day)!;
            return <DayPill key={day} day={day} isRest={wd.isRest} onClick={() => toggleDay(day)} />;
          })}
        </div>

        {workDays.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {workDays.map((d) => (
              <span key={d} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                {DAY_LABELS[d]}
              </span>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* ── Schedule ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">أوقات الدوام</p>
            <p className="text-[11px] text-muted-foreground">يُطبَّق تلقائياً على جميع أيام العمل</p>
          </div>
        </div>
        <ScheduleForm period={period} onChange={handlePeriodChange} />
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

        {/* 7-day strip */}
        <div className="flex gap-1 mb-4" dir="rtl">
          {WEEK_ORDER.map((day) => {
            const wd = t.weekDays.find((w) => w.day === day);
            return (
              <div
                key={day}
                title={DAY_LABELS[day]}
                className={cn(
                  'flex h-6 flex-1 items-center justify-center rounded text-[9px] font-bold',
                  wd?.isRest ? 'bg-muted text-muted-foreground/40' : 'bg-primary/15 text-primary',
                )}
              >
                {DAY_SHORT[day]}
              </div>
            );
          })}
        </div>

        <div
          className="flex items-center justify-end border-t border-border/60 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
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
  const openEdit = (t: ShiftTemplate) => { setDraft(cloneTemplate(t)); setError(null); setOpen(true); };

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
        <DialogContent className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden border-border p-0">
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
