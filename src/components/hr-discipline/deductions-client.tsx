'use client';

import * as React from 'react';
import { usePageFilters } from '@/components/filter-panel-context';
import {
  EmptyState,
} from '@/components/hr-requests/shared-ui';
import { useHRDisciplinePayrollDeductionsStore } from '@/lib/hr-discipline/payroll-deductions-store';
import { DEDUCTION_KIND_LABELS, DEDUCTION_STATUS_LABELS } from '@/lib/hr-discipline/types';
import type { HRDeductionStatus } from '@/lib/hr-discipline/types';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<HRDeductionStatus, string> = {
  ready: 'text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950/30',
  posted: 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30',
  calculated: 'text-purple-700 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950/30',
  cancelled: 'text-muted-foreground border-border bg-muted/30',
};

export function DeductionsClient() {
  const { deductions } = useHRDisciplinePayrollDeductionsStore();
  const { values } = usePageFilters([{ key: 'q', label: 'بحث', type: 'text', placeholder: 'رقم القضية أو الموظف…' }]);
  const q = (values.q as string) ?? '';

  const filtered = deductions.filter(d =>
    d.caseNumber.includes(q) || d.employeeNameAr.includes(q) || d.reasonAr.includes(q) || d.month.includes(q)
  );

  return (
    <div className="space-y-4">
      {filtered.length === 0 ? (
        <EmptyState title="لا توجد استقطاعات" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(d => (
            <div key={d.id} className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold text-muted-foreground">{d.caseNumber}</p>
                  <p className="font-semibold truncate mt-0.5">{d.employeeNameAr}</p>
                </div>
                <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium shrink-0', STATUS_COLORS[d.status])}>
                  {DEDUCTION_STATUS_LABELS[d.status]}
                </span>
              </div>
              {d.reasonAr && <p className="text-xs text-muted-foreground line-clamp-2">{d.reasonAr}</p>}
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {DEDUCTION_KIND_LABELS[d.deductionKind]}
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {d.month}
                </span>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                <span className="text-[10px] text-muted-foreground">المبلغ</span>
                <span className="font-semibold">{d.amount.toLocaleString('ar-SA')} ر.س</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
