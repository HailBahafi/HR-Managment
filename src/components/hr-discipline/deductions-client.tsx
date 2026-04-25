'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  PageHeader, EmptyState, Pagination,
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
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  React.useEffect(() => { setPage(1); }, [q]);

  const filtered = deductions.filter(d =>
    d.caseNumber.includes(q) || d.employeeNameAr.includes(q) || d.reasonAr.includes(q) || d.month.includes(q)
  );
  const total = filtered.length;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      <PageHeader title="الاستقطاعات" description="استقطاعات الرواتب المرتبطة بقضايا الانضباط (للاطلاع فقط)" />

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث برقم القضية أو الموظف…" className="pr-9" />
      </div>

      {/* Desktop */}
      <div className="hidden md:block rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">رقم القضية</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الموظف</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">السبب</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">النوع</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">المبلغ</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الشهر</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.length === 0 && <tr><td colSpan={7}><EmptyState title="لا توجد استقطاعات" /></td></tr>}
            {paged.map(d => (
              <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{d.caseNumber}</td>
                <td className="px-4 py-3 font-medium">{d.employeeNameAr}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{d.reasonAr}</td>
                <td className="px-4 py-3">{DEDUCTION_KIND_LABELS[d.deductionKind]}</td>
                <td className="px-4 py-3 font-medium">{d.amount.toLocaleString('ar-SA')} ر.س</td>
                <td className="px-4 py-3 text-muted-foreground">{d.month}</td>
                <td className="px-4 py-3">
                  <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[d.status])}>
                    {DEDUCTION_STATUS_LABELS[d.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 0 && <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={setPerPage} />}
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        {paged.length === 0 && <EmptyState title="لا توجد استقطاعات" />}
        {paged.map(d => (
          <div key={d.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-xs font-bold">{d.caseNumber}</div>
                <div className="font-medium">{d.employeeNameAr}</div>
                <div className="text-xs text-muted-foreground">{d.reasonAr}</div>
              </div>
              <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium shrink-0', STATUS_COLORS[d.status])}>
                {DEDUCTION_STATUS_LABELS[d.status]}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm pt-1 border-t border-border">
              <span className="text-muted-foreground">{DEDUCTION_KIND_LABELS[d.deductionKind]} · {d.month}</span>
              <span className="font-semibold">{d.amount.toLocaleString('ar-SA')} ر.س</span>
            </div>
          </div>
        ))}
        {total > perPage && <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={setPerPage} />}
      </div>
    </div>
  );
}
