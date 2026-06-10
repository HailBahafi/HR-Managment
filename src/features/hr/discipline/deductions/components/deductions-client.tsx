'use client';

import * as React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  EmptyState,
} from '@/features/hr/requests/components/shared-ui';
import { useDisciplinePayrollDeductionsDirectoryModel } from '@/features/hr/discipline/deductions/hooks/useDisciplinePayrollDeductionsDirectoryModel';
import type { DeductionFetchParams } from '@/features/hr/discipline/deductions/hooks/useDisciplinePayrollDeductionsDirectoryModel';
import {
  toPayrollDeductionStatusDto,
  toPayrollDeductionTypeDto,
} from '@/features/hr/discipline/deductions/services/discipline-payroll-deductions.service';
import {
  DEDUCTION_KIND_LABELS,
  DEDUCTION_STATUS_LABELS,
} from '@/features/hr/discipline/lib/types';
import type { HRDeductionStatus, HRViolationDeductionKind } from '@/features/hr/discipline/lib/types';
import type { DateFilterTab } from '@/features/hr/discipline/lib/discipline-date-filter';
import { dateToYMD, matchesDateRange } from '@/features/hr/discipline/lib/discipline-date-filter';
import { cn, formatNumber } from '@/shared/utils';
import {
  DisciplineFilterToolbar,
  type DisciplineFilterToolbarHandle,
  type DisciplineViewMode,
} from '@/features/hr/discipline/components/discipline-filter-toolbar';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { toast } from 'sonner';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableDateCell, TableRowActions, TableRowDetailDialog } from '@/components/ui/table-cells';
import type { HRDisciplinePayrollDeductionRecord } from '@/features/hr/discipline/lib/types';

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
  const m = useDisciplinePayrollDeductionsDirectoryModel();
  const { deductions } = m;

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
  const [detailRow, setDetailRow] = React.useState<HRDisciplinePayrollDeductionRecord | null>(null);

  // Backend filtering: re-fetch when employee/status/kind filters change
  React.useEffect(() => {
    const params: DeductionFetchParams = {};
    if (selectedEmpIds.size === 1) {
      params.employeeId = [...selectedEmpIds][0];
    }
    if (statusFilter !== 'all') {
      params.status = toPayrollDeductionStatusDto(statusFilter);
    }
    if (kindFilter !== 'all') {
      params.deductionType = toPayrollDeductionTypeDto(kindFilter as Exclude<HRViolationDeductionKind, 'none'>);
    }
    void m.reload(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmpIds, statusFilter, kindFilter]);

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

  // Date filter is applied locally (API doesn't support date range filtering)
  const dateFiltered = React.useMemo(
    () =>
      deductions.filter((d) =>
        matchesDateRange(createdAtToYmd(d.createdAt), dateBounds.from, dateBounds.to),
      ),
    [deductions, dateBounds.from, dateBounds.to],
  );

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: dateFiltered.length };
    for (const s of DEDUCTION_STATUS_ORDER) counts[s] = 0;
    for (const d of dateFiltered) counts[d.status] = (counts[d.status] ?? 0) + 1;
    return counts;
  }, [dateFiltered]);

  // Status filter is sent to backend, but counts are computed from local dateFiltered
  // The displayed list is dateFiltered (backend already handles employee/kind/status)
  const listFiltered = dateFiltered;

  const dateRangeActive = dateMeta.hasRestriction;

  const activeFilterCount = (selectedEmpIds.size > 0 ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (kindFilter !== 'all' ? 1 : 0) + (dateMeta.hasRestriction ? 1 : 0);

  usePageHeaderActions(
    () => <FilterToggleButton activeFilterCount={activeFilterCount} />,
    [activeFilterCount],
  );

  const handleSendToPayroll = React.useCallback(
    async (id: string) => {
      try {
        await m.sendToPayroll(id);
        toast.success('تم إرسال الاستقطاع إلى الرواتب');
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'discipline-payroll-deductions.send');
        toast.error(displayMessage);
      }
    },
    [m],
  );

  const columns = React.useMemo((): ColumnDef<HRDisciplinePayrollDeductionRecord>[] => [
    {
      key: 'caseNumber',
      title: 'القضية',
      className: 'font-mono text-xs text-muted-foreground',
      render: (d) => d.caseNumber,
    },
    {
      key: 'employee',
      title: 'الموظف',
      className: 'font-medium',
      render: (d) => d.employeeNameAr,
    },
    {
      key: 'kind',
      title: 'النوع',
      className: 'text-muted-foreground',
      render: (d) => DEDUCTION_KIND_LABELS[d.deductionKind],
    },
    {
      key: 'month',
      title: 'الشهر',
      className: 'font-mono text-xs',
      render: (d) => d.month,
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (d) => (
        <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium', STATUS_COLORS[d.status])}>
          {DEDUCTION_STATUS_LABELS[d.status]}
        </span>
      ),
    },
    {
      key: 'amount',
      title: 'المبلغ',
      className: 'font-semibold tabular-nums',
      render: (d) => formatNumber(d.amount),
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      render: (d) => (
        d.status === 'ready' ? (
          <TableRowActions
            primaryActions={[
              {
                label: 'إرسال للرواتب',
                variant: 'primary',
                icon: <Send className="h-3.5 w-3.5" />,
                onClick: () => void handleSendToPayroll(d.id),
              },
            ]}
          />
        ) : null
      ),
    },
  ], [handleSendToPayroll]);

  const kindSelect = (
    <div className="flex min-w-0 items-center gap-2">
      <Label htmlFor="deduction-kind-filter" className="shrink-0 text-[11px] font-medium text-muted-foreground">
        نوع الاستقطاع
      </Label>
      <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as KindFilter)}>
        <SelectTrigger id="deduction-kind-filter" className="h-8 max-w-56 text-xs" dir="rtl">
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
      dateFiltered.length,
      onDateBoundsChange,
      onDateFilterMetaChange,
    ],
  );

  return (
    <div className="space-y-4">
      {m.listError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive whitespace-pre-wrap">
          {m.listError}
        </p>
      ) : null}

      {m.loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">جاري التحميل...</p>
      ) : (
        <>
          {deductions.length === 0 ? (
            <EmptyState title="لا توجد استقطاعات" />
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
            <EmptyState title="لا توجد استقطاعات مطابقة للفلاتر المحددة." />
          ) : viewMode === 'list' ? (
            <DataTable
              variant="directory"
              alwaysShowTable
              tableClassName="min-w-[640px]"
              columns={columns}
              data={listFiltered}
              keyExtractor={(d) => d.id}
              onRowClick={(d) => setDetailRow(d)}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listFiltered.map((d) => (
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
                    <span className="font-semibold">{formatNumber(d.amount)}</span>
                  </div>
                  {d.status === 'ready' ? (
                    <div className="pt-1">
                      <Button size="sm" variant="outline" className="w-full h-7 text-[11px]" onClick={() => handleSendToPayroll(d.id)}>
                        إرسال للرواتب
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <TableRowDetailDialog
        open={detailRow != null}
        onOpenChange={(o) => !o && setDetailRow(null)}
        title="تفاصيل الاستقطاع"
        fields={detailRow ? [
          { label: 'القضية', value: detailRow.caseNumber },
          { label: 'الموظف', value: detailRow.employeeNameAr },
          { label: 'النوع', value: DEDUCTION_KIND_LABELS[detailRow.deductionKind] },
          { label: 'الشهر', value: detailRow.month },
          { label: 'الحالة', value: DEDUCTION_STATUS_LABELS[detailRow.status] },
          { label: 'المبلغ', value: formatNumber(detailRow.amount) },
          { label: 'السبب', value: detailRow.reasonAr || '—' },
          { label: 'تاريخ التسجيل', value: <TableDateCell value={detailRow.createdAt} mode="datetime" /> },
          { label: 'آخر تحديث', value: <TableDateCell value={detailRow.updatedAt} mode="datetime" /> },
        ] : []}
      />
    </div>
  );
}
