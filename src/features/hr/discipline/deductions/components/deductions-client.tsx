'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  EmptyState,
} from '@/components/hr-requests/shared-ui';
import { useHRDisciplinePayrollDeductionsStore } from '@/lib/hr-discipline/payroll-deductions-store';
import {
  DEDUCTION_KIND_LABELS,
  DEDUCTION_STATUS_LABELS,
} from '@/lib/hr-discipline/types';
import type { HRDeductionStatus, HRViolationDeductionKind } from '@/lib/hr-discipline/types';
import type { DateFilterTab } from '@/lib/hr-discipline/discipline-date-filter';
import { dateToYMD, matchesDateRange } from '@/lib/hr-discipline/discipline-date-filter';
import { cn, formatNumber } from '@/lib/utils';
import {
  DisciplineFilterToolbar,
  type DisciplineFilterToolbarHandle,
  type DisciplineViewMode,
} from '@/features/hr/discipline/components/discipline-filter-toolbar';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';

const DEDUCTION_STATUS_ORDER: readonly HRDeductionStatus[] = ['ready', 'posted', 'calculated', 'cancelled'];

type KindFilter = 'all' | Exclude<HRViolationDeductionKind, 'none'>;

const KIND_FILTER_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'كل أنواع الاستقطاع' },
  ...(Object.entries(DEDUCTION_KIND_LABELS) as [HRViolationDeductionKind, string][])
    .filter(([k]) => k !== 'none')
    .map(([value, label]) => ({ value: value as Exclude<HRViolationDeductionKind, 'none'>, label })),
];

function createdAtToYmd(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return dateToYMD(d);
}

const STATUS_COLORS: Record<HRDeductionStatus, string> = {
  ready: 'text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950/30',
  posted: 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30',
  calculated: 'text-purple-700 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950/30',
  cancelled: 'text-muted-foreground border-border bg-muted/30',
};

export function DeductionsClient() {
  const { deductions } = useHRDisciplinePayrollDeductionsStore();

  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<DisciplineViewMode>('cards');
  const [statusFilter, setStatusFilter] = React.useState<'all' | HRDeductionStatus>('all');
  const [kindFilter, setKindFilter] = React.useState<KindFilter>('all');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [dateMeta, setDateMeta] = React.useState<{ tab: DateFilterTab; hasRestriction: boolean }>({
    tab: 'all',
    hasRestriction: false,
  });
  const filterToolbarRef = React.useRef<DisciplineFilterToolbarHandle>(null);

  const onDateBoundsChange = React.useCallback((b: { from: string; to: string }) => {
    setDateBounds(b);
  }, []);

  const onDateFilterMetaChange = React.useCallback((m: { tab: DateFilterTab; hasRestriction: boolean }) => {
    setDateMeta(m);
  }, []);

  const empPickerList = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const d of deductions) map.set(d.employeeId, d.employeeNameAr);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [deductions]);

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  const searchFiltered = React.useMemo(
    () => deductions.filter((d) => selectedEmpIds.size === 0 || selectedEmpIds.has(d.employeeId)),
    [deductions, selectedEmpIds],
  );

  const dateFiltered = React.useMemo(
    () =>
      searchFiltered.filter((d) =>
        matchesDateRange(createdAtToYmd(d.createdAt), dateBounds.from, dateBounds.to),
      ),
    [searchFiltered, dateBounds.from, dateBounds.to],
  );

  const kindFiltered = React.useMemo(
    () => (kindFilter === 'all' ? dateFiltered : dateFiltered.filter((d) => d.deductionKind === kindFilter)),
    [dateFiltered, kindFilter],
  );

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: kindFiltered.length };
    for (const s of DEDUCTION_STATUS_ORDER) counts[s] = 0;
    for (const d of kindFiltered) counts[d.status] = (counts[d.status] ?? 0) + 1;
    return counts;
  }, [kindFiltered]);

  const listFiltered = React.useMemo(
    () => (statusFilter === 'all' ? kindFiltered : kindFiltered.filter((d) => d.status === statusFilter)),
    [kindFiltered, statusFilter],
  );

  const dateRangeActive = dateMeta.hasRestriction;

  const activeFilterCount = (selectedEmpIds.size > 0 ? 1 : 0) + (kindFilter !== 'all' ? 1 : 0) + (dateMeta.hasRestriction ? 1 : 0);

  usePageHeaderActions(
    () => <FilterToggleButton activeFilterCount={activeFilterCount} />,
    [activeFilterCount],
  );

  const kindSelect = (
    <div className="flex min-w-0 items-center gap-2">
      <Label htmlFor="deduction-kind-filter" className="shrink-0 text-[11px] font-medium text-muted-foreground">
        نوع الاستقطاع
      </Label>
      <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as KindFilter)}>
        <SelectTrigger id="deduction-kind-filter" className="h-8 max-w-[14rem] text-xs" dir="rtl">
          <SelectValue placeholder="النوع" />
        </SelectTrigger>
        <SelectContent>
          {KIND_FILTER_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  useEntityFilterSlot(
    () => (
      <DisciplineFilterToolbar
        ref={filterToolbarRef}
        showPrimaryAction={false}
        primaryActionLabel=""
        onPrimaryAction={() => {}}
        beforeEmployeePicker={kindSelect}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => setStatusFilter(v as 'all' | HRDeductionStatus)}
        statusOrder={DEDUCTION_STATUS_ORDER}
        statusLabels={DEDUCTION_STATUS_LABELS as unknown as Record<string, string>}
        statusCounts={statusCounts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDateBoundsChange={onDateBoundsChange}
        onDateFilterMetaChange={onDateFilterMetaChange}
      />
    ),
    [
      empPickerList,
      selectedEmpKey,
      statusFilter,
      kindFilter,
      statusCounts,
      viewMode,
      kindFiltered.length,
      onDateBoundsChange,
      onDateFilterMetaChange,
    ],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{listFiltered.length} استقطاع</p>

      {deductions.length === 0 ? (
        <EmptyState title="لا توجد استقطاعات" />
      ) : searchFiltered.length === 0 ? (
        <EmptyState title="لا توجد استقطاعات مطابقة للموظفين المحددين." />
      ) : dateFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center px-4">
          <p className="text-sm text-muted-foreground">
            {dateMeta.tab === 'today'
              ? 'لا توجد استقطاعات بتاريخ التسجيل ضمن اليوم ضمن النتائج الحالية.'
              : dateMeta.tab === 'week'
                ? 'لا توجد استقطاعات ضمن هذا الأسبوع ضمن النتائج الحالية.'
                : dateMeta.tab === 'month'
                  ? 'لا توجد استقطاعات ضمن هذا الشهر ضمن النتائج الحالية.'
                  : dateMeta.tab === 'custom' && dateRangeActive
                    ? 'لا توجد استقطاعات ضمن نطاق التاريخ المخصص مع عوامل التصفية الحالية.'
                    : 'لا توجد استقطاعات ضمن الفترة المحددة.'}
          </p>
          {dateRangeActive ? (
            <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetDateFilter()}>
              عرض كل الفترات
            </Button>
          ) : null}
        </div>
      ) : listFiltered.length === 0 ? (
        <EmptyState title="لا توجد استقطاعات مطابقة لحالة التصفية المحددة." />
      ) : viewMode === 'list' ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-right">
                <th className="p-3 font-semibold">القضية</th>
                <th className="p-3 font-semibold">الموظف</th>
                <th className="p-3 font-semibold">النوع</th>
                <th className="p-3 font-semibold">الشهر</th>
                <th className="p-3 font-semibold">الحالة</th>
                <th className="p-3 font-semibold">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {listFiltered.map((d) => (
                <tr key={d.id} className="border-b border-border/60">
                  <td className="p-3 font-mono text-xs text-muted-foreground">{d.caseNumber}</td>
                  <td className="p-3 font-medium">{d.employeeNameAr}</td>
                  <td className="p-3 text-muted-foreground">{DEDUCTION_KIND_LABELS[d.deductionKind]}</td>
                  <td className="p-3 font-mono text-xs">{d.month}</td>
                  <td className="p-3">
                    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium', STATUS_COLORS[d.status])}>
                      {DEDUCTION_STATUS_LABELS[d.status]}
                    </span>
                  </td>
                  <td className="p-3 font-semibold tabular-nums">{formatNumber(d.amount)} ر.س</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listFiltered.map(d => (
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
                <span className="font-semibold">{formatNumber(d.amount)} ر.س</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
