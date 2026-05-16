'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHRPayrollPeriodsStore, type HRPayrollEmploymentLine } from '@/features/hr/contracts/lib/payroll-periods-store';
import { useHRContractsStore } from '@/features/hr/contracts/lib/contracts-store';
import { useHRAllowanceTypesStore } from '@/features/hr/contracts/lib/allowance-types-store';
import { buildCompensationPreviews, formatLatinNumber } from '@/features/hr/contracts/lib/compensation-preview';
import {
  usePayrollSalaryCircularStore,
  DEFAULT_PAYROLL_SALARY_CIRCULAR_ENTRY,
  getPayrollSalaryCircularEntryKey,
  SEND_STATUS_LABELS_AR,
  READ_STATUS_LABELS_AR,
  APPROVAL_STATUS_LABELS_AR,
  type PayrollSalaryCircularApprovalStatus,
} from '@/features/hr/contracts/lib/payroll-salary-circular-store';
import { cn } from '@/shared/utils';

function sendBadgeClass(s: 'not_sent' | 'sent') {
  return s === 'sent'
    ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-emerald-500/25'
    : 'bg-muted text-muted-foreground border-border';
}

function readBadgeClass(s: 'not_read' | 'read') {
  return s === 'read'
    ? 'bg-sky-500/15 text-sky-900 dark:text-sky-200 border-sky-500/25'
    : 'bg-amber-500/12 text-amber-950 dark:text-amber-200 border-amber-500/25';
}

function approvalBadgeClass(s: PayrollSalaryCircularApprovalStatus) {
  if (s === 'approved') return 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-emerald-500/25';
  if (s === 'rejected') return 'bg-destructive/12 text-destructive border-destructive/25';
  if (s === 'ignored') return 'bg-slate-500/12 text-slate-800 dark:text-slate-200 border-slate-500/25';
  return 'bg-muted text-muted-foreground border-border';
}

export function PayrollSalaryApprovalClient() {
  const searchParams = useSearchParams();
  const requestedPeriodId = searchParams.get('period') ?? '';

  const periods = useHRPayrollPeriodsStore((s) => s.periods);
  const contracts = useHRContractsStore((s) => s.contracts);
  const allowanceTypes = useHRAllowanceTypesStore((s) => s.items);

  const circularEntries = usePayrollSalaryCircularStore((s) => s.entries);
  const setSendStatus = usePayrollSalaryCircularStore((s) => s.setSendStatus);
  const markAllSent = usePayrollSalaryCircularStore((s) => s.markAllSent);
  const setReadStatus = usePayrollSalaryCircularStore((s) => s.setReadStatus);
  const setApprovalStatus = usePayrollSalaryCircularStore((s) => s.setApprovalStatus);
  const resetLine = usePayrollSalaryCircularStore((s) => s.resetLine);

  const periodsWithLines = React.useMemo(
    () =>
      [...periods]
        .filter((p) => (p.employmentLines?.length ?? 0) > 0)
        .sort((a, b) => (a.periodEnd < b.periodEnd ? 1 : -1)),
    [periods],
  );

  const [periodId, setPeriodId] = React.useState<string>(requestedPeriodId);

  React.useEffect(() => {
    if (requestedPeriodId && periodsWithLines.some((p) => p.id === requestedPeriodId)) {
      setPeriodId(requestedPeriodId);
    }
  }, [periodsWithLines, requestedPeriodId]);

  React.useEffect(() => {
    if (periodId && periodsWithLines.some((p) => p.id === periodId)) return;

    const first = periodsWithLines[0];
    setPeriodId(first?.id ?? '');
  }, [periodId, periodsWithLines]);

  const period = periods.find((p) => p.id === periodId);

  const previews = React.useMemo(() => {
    if (!period) return [];
    return buildCompensationPreviews(
      period,
      (id) => contracts.find((c) => c.id === id),
      (id) => allowanceTypes.find((a) => a.id === id),
    );
  }, [period, contracts, allowanceTypes]);

  const lineById = React.useMemo(() => {
    const m = new Map<string, HRPayrollEmploymentLine>();
    if (!period?.employmentLines) return m;
    for (const el of period.employmentLines) m.set(el.id, el);
    return m;
  }, [period]);

  const allLineIds = React.useMemo(() => previews.map((p) => p.lineId), [previews]);

  const handleMarkAllSent = () => {
    if (!periodId || !allLineIds.length) return;
    markAllSent(periodId, allLineIds);
    toast.success('تم تسجيل إرسال التعميم لجميع الموظفين في هذه الفترة');
  };

  return (
    <div className="space-y-6">
      <SetPageTitle
        titleAr="كشف موافقة الموظفين"
        descriptionAr="متابعة إرسال كشف المستحق لكل موظف، قراءته، وموافقته على الراتب قبل إصدار مسير الرواتب  "
        iconName="UserCheck"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2 min-w-[min(100%,20rem)]">
          <p className="text-sm font-medium text-foreground">فترة الراتب</p>
          <Select value={periodId || undefined} onValueChange={setPeriodId}>
            <SelectTrigger className="w-full sm:max-w-md">
              <SelectValue placeholder="اختر فترةً تضم أسطر مسير" />
            </SelectTrigger>
            <SelectContent>
              {periodsWithLines.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nameAr} ({p.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {periodId && allLineIds.length > 0 ? (
          <Button type="button" variant="outline" size="sm" className="gap-2 shrink-0" onClick={handleMarkAllSent}>
            <Send className="h-4 w-4" />
            تسجيل إرسال التعميم للجميع
          </Button>
        ) : null}
      </div>

      {!period || previews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 py-14 text-center text-sm text-muted-foreground">
          لا توجد فترات بأسطر مسير مادّية. أنشئ فترة وادمج أسطر الموظفين من «فترات الراتب» أولاً.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground">
                    <th className="px-3 py-3 text-right">الموظف</th>
                    <th className="px-3 py-3 text-right hidden md:table-cell">القسم</th>
                    <th className="px-3 py-3 text-left whitespace-nowrap">المستحق الصافي (ر.س.)</th>
                    <th className="px-3 py-3 text-center">الإرسال</th>
                    <th className="px-3 py-3 text-center">القراءة</th>
                    <th className="px-3 py-3 text-center">الموافقة</th>
                    <th className="px-3 py-3 text-left w-[7.5rem]">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {previews.map((row) => {
                    const line = lineById.get(row.lineId);
                    const st = {
                      ...DEFAULT_PAYROLL_SALARY_CIRCULAR_ENTRY,
                      ...circularEntries[getPayrollSalaryCircularEntryKey(periodId, row.lineId)],
                    };
                    return (
                      <tr key={row.lineId} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-foreground">{row.namePrimary}</p>
                          <p className="text-[11px] text-muted-foreground md:hidden">{line?.departmentSnapshot ?? '—'}</p>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell">
                          {line?.departmentSnapshot ?? '—'}
                        </td>
                        <td className="px-3 py-2.5 text-left font-mono tabular-nums font-semibold">
                          {formatLatinNumber(row.lineNetSar, 2)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Badge variant="outline" className={cn('text-[10px] font-medium', sendBadgeClass(st.sendStatus))}>
                            {SEND_STATUS_LABELS_AR[st.sendStatus]}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Badge variant="outline" className={cn('text-[10px] font-medium', readBadgeClass(st.readStatus))}>
                            {READ_STATUS_LABELS_AR[st.readStatus]}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Badge variant="outline" className={cn('text-[10px] font-medium', approvalBadgeClass(st.approvalStatus))}>
                            {APPROVAL_STATUS_LABELS_AR[st.approvalStatus]}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 text-xs">
                                تحديث
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[12rem]">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSendStatus(periodId, row.lineId, 'sent');
                                  toast.message('تم تسجيل الإرسال');
                                }}
                              >
                                تسجيل: تم إرسال التعميم
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSendStatus(periodId, row.lineId, 'not_sent');
                                  toast.message('تم إلغاء تسجيل الإرسال');
                                }}
                              >
                                إعادة: لم يُرسل التعميم
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setReadStatus(periodId, row.lineId, 'read');
                                  toast.message('تم تسجيل القراءة');
                                }}
                              >
                                تسجيل: تمت قراءة الكشف
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setReadStatus(periodId, row.lineId, 'not_read');
                                  toast.message('تم إلغاء تسجيل القراءة');
                                }}
                              >
                                إعادة: لم تُقرأ
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setApprovalStatus(periodId, row.lineId, 'approved');
                                  toast.success('تم تسجيل الموافقة على الراتب');
                                }}
                              >
                                تسجيل: موافقة على الراتب
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setApprovalStatus(periodId, row.lineId, 'rejected');
                                  toast.message('تم تسجيل الرفض');
                                }}
                              >
                                تسجيل: رفض الراتب
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setApprovalStatus(periodId, row.lineId, 'ignored');
                                  toast.message('تم تسجيل التجاهل');
                                }}
                              >
                                تسجيل: تجاهل (لم يرد)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setApprovalStatus(periodId, row.lineId, 'pending');
                                  toast.message('إعادة لبانتظار الرد');
                                }}
                              >
                                إعادة: بانتظار موافقة الراتب
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  resetLine(periodId, row.lineId);
                                  toast.message('تم مسح سجل التعميم لهذا السطر');
                                }}
                              >
                                <RotateCcw className="ms-2 h-3.5 w-3.5" />
                                مسح السجل لهذا الموظف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            بعد موافقة الجميع (أو استثناء من رفض أو تجاهل حسب سياسة شركتكم) يمكن إصدار مسير الرواتب من «كشف مسيرات الرواتب».
            يُرجى إشعار من لم يوافق عبر التعميم أو الإشعارات — الحالية تسجيل يدوي للعرض حتى ربط قنوات الإرسال.
          </p>
        </>
      )}
    </div>
  );
}
