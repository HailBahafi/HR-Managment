'use client';

import * as React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/shared-dialogs';
import { cn } from '@/shared/utils';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { attendanceEventsApi } from '@/features/hr/attendance/lib/api/attendance-events';
import type { DailyBreakdownResponseDto } from '@/features/hr/attendance/types/api/attendance-events';
import { requestTypesApi, type ApiRequestType } from '@/features/hr/requests/lib/api/request-types';
import { useAttendanceCorrectionRequestsStore } from '@/features/hr/requests/lib/attendance-correction-store';
import {
  buildCorrectionFormPeriodsFromBreakdown,
  formPeriodToApiPunches,
  type CorrectionFormPeriod,
} from '@/features/hr/requests/attendance-corrections/lib/correction-from-daily-breakdown';
import {
  defaultTimezoneOffsetMinutes,
  formatClockLabel,
  timePickerToIso,
} from '@/features/hr/requests/attendance-corrections/lib/correction-period-time';

export type AttendanceCorrectionRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | undefined;
  employees: Array<{ id: string; nameAr: string }>;
  initialEmployeeId?: string;
  initialWorkDate?: string;
  initialAttendanceDaySummaryId?: string;
  /** When set, only pre-fill this shift period from daily breakdown. */
  initialPeriodIndex?: number;
  onSuccess?: () => void;
};

function PunchRow({
  label,
  checkIn,
  checkOut,
  tone = 'default',
}: {
  label: string;
  checkIn: string;
  checkOut: string;
  tone?: 'default' | 'primary';
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 text-xs',
        tone === 'primary'
          ? 'border-primary/30 bg-primary/5'
          : 'border-border/50 bg-background/70',
      )}
    >
      <p
        className={cn(
          'mb-1 font-medium',
          tone === 'primary' ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {label}
      </p>
      <p className="font-mono tabular-nums" dir="ltr">
        دخول {checkIn || '—'}
        {' · '}
        خروج {checkOut || '—'}
      </p>
    </div>
  );
}

export function AttendanceCorrectionRequestDialog({
  open,
  onOpenChange,
  companyId,
  employees,
  initialEmployeeId,
  initialWorkDate,
  initialAttendanceDaySummaryId,
  initialPeriodIndex,
  onSuccess,
}: AttendanceCorrectionRequestDialogProps) {
  const { submit } = useAttendanceCorrectionRequestsStore();

  const [correctionRequestType, setCorrectionRequestType] = React.useState<ApiRequestType | null>(null);
  const [formEmpId, setFormEmpId] = React.useState('');
  const [formWorkDate, setFormWorkDate] = React.useState('');
  const [formReason, setFormReason] = React.useState('');
  const [formPeriods, setFormPeriods] = React.useState<CorrectionFormPeriod[]>([]);
  const [attendanceDaySummaryId, setAttendanceDaySummaryId] = React.useState<string | undefined>();
  const [breakdown, setBreakdown] = React.useState<DailyBreakdownResponseDto | null>(null);
  const [breakdownLoading, setBreakdownLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const periodIndexRef = React.useRef<number | undefined>(initialPeriodIndex);

  const timezoneOffsetMinutes = breakdown?.timezoneOffsetMinutes ?? defaultTimezoneOffsetMinutes();

  React.useEffect(() => {
    if (!companyId || !open) return;
    let cancelled = false;
    void requestTypesApi
      .list({ companyId, requestCategory: 'attendance_correction', isActive: true, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        const officialFirst =
          res.items.find((t) => t.slug === 'attendance-correction') ?? res.items[0] ?? null;
        setCorrectionRequestType(officialFirst);
      })
      .catch(() => {
        if (!cancelled) setCorrectionRequestType(null);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, open]);

  const resetForm = React.useCallback(() => {
    setFormEmpId(initialEmployeeId ?? employees[0]?.id ?? '');
    setFormWorkDate(initialWorkDate ?? '');
    setFormReason('');
    setFormPeriods([]);
    setAttendanceDaySummaryId(initialAttendanceDaySummaryId);
    setBreakdown(null);
  }, [employees, initialAttendanceDaySummaryId, initialEmployeeId, initialWorkDate]);

  React.useEffect(() => {
    if (!open) return;
    periodIndexRef.current = initialPeriodIndex;
    resetForm();
  }, [open, resetForm, initialPeriodIndex]);

  React.useEffect(() => {
    if (!open || !companyId || !formEmpId || !formWorkDate) {
      setBreakdown(null);
      setFormPeriods([]);
      return;
    }

    let cancelled = false;
    setBreakdownLoading(true);
    void attendanceEventsApi
      .getDailyBreakdown({
        employeeId: formEmpId,
        workDate: formWorkDate,
        companyId,
        timezoneOffsetMinutes: defaultTimezoneOffsetMinutes(),
      })
      .then((data) => {
        if (cancelled) return;
        setBreakdown(data);
        if (data.periods.length > 0) {
          setFormPeriods(
            buildCorrectionFormPeriodsFromBreakdown(data, periodIndexRef.current),
          );
        } else {
          setFormPeriods([]);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setBreakdown(null);
        setFormPeriods([]);
        handleApiError(err, 'correction-requests.daily-breakdown');
      })
      .finally(() => {
        if (!cancelled) setBreakdownLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, companyId, formEmpId, formWorkDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionRequestType) {
      toast.error('تعذر تحديد نوع طلب تصحيح الحضور — تأكد من وجود نوع طلب مفعّل.');
      return;
    }

    if (formPeriods.length === 0) {
      toast.error('لا توجد فترات تحتاج تصحيحاً — البصمات مطابقة لأوقات الوردية.');
      return;
    }

    const apiPeriods = formPeriods.map((p) =>
      formPeriodToApiPunches(formWorkDate, timezoneOffsetMinutes, p),
    );

    setSubmitting(true);
    try {
      const res = await submit({
        employeeId: formEmpId,
        requestTypeId: correctionRequestType.id,
        workDate: formWorkDate,
        attendanceDaySummaryId,
        reasonAr: formReason.trim(),
        periods: apiPeriods,
      });
      if (res.ok === false) {
        toast.error(res.error);
        return;
      }
      toast.success('تم تسجيل طلب التصحيح — قيد الموافقة.');
      onOpenChange(false);
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  const shiftTemplateName = breakdown?.shiftTemplate?.nameAr;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'sm:max-w-xl')} dir="rtl">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className={dialogShellHeaderClass}>
            <DialogTitle>طلب تصحيح حضور</DialogTitle>
            <DialogDescription>
              تُقارَن بصمات الموظف بأوقات الوردية تلقائياً؛ يُرسل الطلب بالأوقات المطلوبة من الشفت دون إدخال يدوي.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className={cn(dialogShellBodyClass, 'grid gap-4')}>
            <FormField label="الموظف مقدّم الطلب">
              <Select
                value={formEmpId}
                onValueChange={setFormEmpId}
                disabled={initialEmployeeId != null}
              >
                <SelectTrigger><SelectValue placeholder="اختر الموظف…" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nameAr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="تاريخ التصحيح">
              <DatePickerInput
                value={formWorkDate}
                onChange={setFormWorkDate}
                placeholder="اختر تاريخ التصحيح"
                disabled={initialWorkDate != null}
              />
            </FormField>

            {shiftTemplateName ? (
              <p className="rounded-xl border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                الوردية: <span className="font-medium text-foreground">{shiftTemplateName}</span>
              </p>
            ) : null}

            {breakdownLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري تحميل الوردية والبصمات…
              </div>
            ) : null}

            {!breakdownLoading && formEmpId && formWorkDate && breakdown?.periods.length === 0 ? (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-800">
                لا توجد فترات دوام مسجّلة لهذا اليوم.
              </p>
            ) : null}

            {!breakdownLoading && formEmpId && formWorkDate && breakdown && breakdown.periods.length > 0 && formPeriods.length === 0 ? (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-800">
                جميع البصمات مطابقة لأوقات الوردية — لا حاجة لتصحيح.
              </p>
            ) : null}

            <div className="space-y-3">
              {formPeriods.map((period, index) => {
                const recordedIn = formatClockLabel(
                  timePickerToIso(formWorkDate, period.recordedCheckIn, timezoneOffsetMinutes),
                  timezoneOffsetMinutes,
                );
                const recordedOut = formatClockLabel(
                  timePickerToIso(formWorkDate, period.recordedCheckOut, timezoneOffsetMinutes),
                  timezoneOffsetMinutes,
                );
                const correctedIn = formatClockLabel(
                  timePickerToIso(formWorkDate, period.correctedCheckIn, timezoneOffsetMinutes),
                  timezoneOffsetMinutes,
                );
                const correctedOut = formatClockLabel(
                  timePickerToIso(formWorkDate, period.correctedCheckOut, timezoneOffsetMinutes),
                  timezoneOffsetMinutes,
                );

                return (
                  <div
                    key={period.periodId || index}
                    className="space-y-2.5 rounded-xl border border-border/70 bg-muted/10 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{period.labelAr}</p>
                      <p className="text-[11px] text-muted-foreground font-mono tabular-nums" dir="ltr">
                        {period.expectedRangeAr}
                      </p>
                    </div>

                    <PunchRow label="مسجّل (بصمات الموظف)" checkIn={recordedIn} checkOut={recordedOut} />

                    <div className="flex items-center justify-center text-muted-foreground">
                      <ArrowLeft className="h-3.5 w-3.5 rotate-90" />
                    </div>

                    <PunchRow
                      label="تصحيح إلى (أوقات الوردية)"
                      checkIn={correctedIn}
                      checkOut={correctedOut}
                      tone="primary"
                    />
                  </div>
                );
              })}
            </div>

            <FormField label="سبب الطلب">
              <Textarea
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                rows={3}
                minLength={3}
                required
                placeholder="اشرح سبب طلب التصحيح (٣ أحرف على الأقل)…"
              />
            </FormField>
          </DialogBody>

          <DialogFooter className={dialogFormFooterClass}>
            <Button
              type="submit"
              variant="luxe"
              disabled={submitting || breakdownLoading || formPeriods.length === 0}
            >
              {submitting ? 'جاري الإرسال…' : 'تسجيل الطلب'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
