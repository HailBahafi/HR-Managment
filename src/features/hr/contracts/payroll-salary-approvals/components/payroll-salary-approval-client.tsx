'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHRPayrollPeriodsStore, type HRPayrollEmploymentLine } from '@/features/hr/contracts/lib/payroll-periods-store';
import { useHRContractsStore } from '@/features/hr/contracts/lib/contracts-store';
import { useHRAllowanceTypesStore } from '@/features/hr/contracts/lib/allowance-types-store';
import { buildCompensationPreviews, formatLatinNumber } from '@/features/hr/contracts/lib/compensation-preview';

export function PayrollSalaryApprovalClient() {
  const searchParams = useSearchParams();
  const requestedPeriodId = searchParams.get('period') ?? '';

  const periods = useHRPayrollPeriodsStore((s) => s.periods);
  const fetchPeriods = useHRPayrollPeriodsStore((s) => s.fetch);
  const materializePeriodLines = useHRPayrollPeriodsStore((s) => s.materializeFromContracts);
  const contracts = useHRContractsStore((s) => s.contracts);
  const fetchContracts = useHRContractsStore((s) => s.fetch);
  const allowanceTypes = useHRAllowanceTypesStore((s) => s.items);
  const fetchAllowanceTypes = useHRAllowanceTypesStore((s) => s.fetch);

  React.useEffect(() => {
    fetchPeriods();
    fetchContracts();
    fetchAllowanceTypes();
  }, [fetchPeriods, fetchContracts, fetchAllowanceTypes]);

  React.useEffect(() => {
    if (periods.length > 0 && contracts.length > 0) {
      materializePeriodLines(contracts);
    }
  }, [periods.length, contracts, materializePeriodLines]);

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

  return (
    <div className="space-y-6">
      <SetPageTitle
        titleAr="كشف موافقة الموظفين"
        descriptionAr="متابعة إرسال كشف المستحق لكل موظف، قراءته، وموافقته على الراتب قبل إصدار مسير الرواتب"
        iconName="UserCheck"
      />

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
        لا يوجد endpoint لتتبع حالات الإرسال والقراءة والموافقة — هذه الميزة غير متصلة بالخادم بعد.
      </div>

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

      {!period || previews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 py-14 text-center text-sm text-muted-foreground">
          لا توجد فترات بأسطر مسير مادّية. أنشئ فترة وادمج أسطر الموظفين من «فترات الراتب» أولاً.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground">
                  <th className="px-3 py-3 text-right">الموظف</th>
                  <th className="px-3 py-3 text-right hidden md:table-cell">القسم</th>
                  <th className="px-3 py-3 text-left whitespace-nowrap">المستحق الصافي (ر.س.)</th>
                </tr>
              </thead>
              <tbody>
                {previews.map((row) => {
                  const line = lineById.get(row.lineId);
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
