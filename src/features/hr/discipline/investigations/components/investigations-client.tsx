'use client';

import * as React from 'react';
import { Trash2, CalendarDays, FileDown, FileSpreadsheet, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, MinimalDropdown, SearchableDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { useDisciplineInvestigationsDirectoryModel } from '@/features/hr/discipline/investigations/hooks/useDisciplineInvestigationsDirectoryModel';
import type {
  HRInvestigationRecommendation,
  HRInvestigationResult,
} from '@/features/hr/discipline/lib/types';
import {
  INVESTIGATION_DEDUCTION_TYPE_LABELS,
  INVESTIGATION_RECOMMENDATION_LABELS,
  INVESTIGATION_RESULT_LABELS,
  INVESTIGATION_RESULT_FILTER_ORDER,
} from '@/features/hr/discipline/lib/types';
import {
  toInvestigationRecommendationDto,
  toInvestigationResultDto,
} from '@/features/hr/discipline/investigations/services/discipline-investigations.service';
import type { DateFilterTab } from '@/features/hr/discipline/lib/discipline-date-filter';
import { matchesDateRange } from '@/features/hr/discipline/lib/discipline-date-filter';
import {
  DisciplineFilterToolbar,
  type DisciplineFilterToolbarHandle,
  type DisciplineViewMode,
} from '@/features/hr/discipline/components/discipline-filter-toolbar';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { GenericRegisterPrintHtml } from '@/components/pdf/print/generic-register-print-html';
import { downloadXlsxFromAoA, type XlsxCell } from '@/shared/export/download-xlsx';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableDateCell, TableRowActions, TableRowDetailDialog } from '@/components/ui/table-cells';
import type { HRDisciplineInvestigationRecord } from '@/features/hr/discipline/lib/types';

const RESULT_OPTIONS = (Object.entries(INVESTIGATION_RESULT_LABELS) as [HRInvestigationResult, string][]).map(([v, l]) => ({ value: v, label: l }));

type ResultFilter = 'all' | HRInvestigationResult;

type RecommendationFilter = 'all' | HRInvestigationRecommendation;

interface DraftForm {
  caseId: string; caseNumber: string; employeeId: string; employeeNameAr: string;
  investigatorEmployeeId: string; investigatorName: string; date: string;
  employeeStatement: string; witnessStatement: string;
  result: HRInvestigationResult;
  recommendationType: RecommendationFilter;
  deductionType: 'days' | 'hours' | 'fixed_amount';
  deductionValue: string;
}
const EMPTY: DraftForm = {
  caseId: '', caseNumber: '', employeeId: '', employeeNameAr: '',
  investigatorEmployeeId: '', investigatorName: '', date: '', employeeStatement: '', witnessStatement: '',
  result: 'proven', recommendationType: 'all', deductionType: 'days', deductionValue: '',
};

export function InvestigationsClient() {
  const m = useDisciplineInvestigationsDirectoryModel();
  const { investigations, reloadInvestigations } = m;

  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<DisciplineViewMode>('cards');
  const [resultFilter, setResultFilter] = React.useState<ResultFilter>('all');
  const [recommendationFilter, setRecommendationFilter] = React.useState<RecommendationFilter>('all');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [dateMeta, setDateMeta] = React.useState<{ tab: DateFilterTab; hasRestriction: boolean }>({ tab: 'all', hasRestriction: false });
  const filterToolbarRef = React.useRef<DisciplineFilterToolbarHandle>(null);
  const onDateBoundsChange = React.useCallback((b: { from: string; to: string }) => { setDateBounds(b); }, []);
  const onDateFilterMetaChange = React.useCallback((m: { tab: DateFilterTab; hasRestriction: boolean }) => { setDateMeta(m); }, []);

  const empPickerList = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const i of investigations) map.set(i.employeeId, i.employeeNameAr);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [investigations]);

  React.useEffect(() => {
    const employeeId = selectedEmpIds.size === 1 ? [...selectedEmpIds][0] : undefined;
    const result = resultFilter !== 'all' ? resultFilter : undefined;
    void reloadInvestigations({ employeeId, result });
  }, [selectedEmpIds, resultFilter, reloadInvestigations]);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<HRDisciplineInvestigationRecord | null>(null);

  const caseOptions = m.cases.map(c => ({ value: c.id, label: c.caseNumber, sub: c.employeeNameAr }));
  const investigatorOptions = m.employees.map((e) => ({ value: e.id, label: e.nameAr }));

  // Employee and result filters are handled by the backend via reloadInvestigations; use investigations directly.
  const searchFiltered = investigations;

  const filtered = React.useMemo(
    () => investigations.filter((i) => matchesDateRange(i.date, dateBounds.from, dateBounds.to)),
    [investigations, dateBounds.from, dateBounds.to],
  );

  const listFiltered = React.useMemo(
    () => {
      if (recommendationFilter === 'all') return filtered;
      return filtered.filter((i) => i.recommendationType === recommendationFilter);
    },
    [filtered, recommendationFilter],
  );

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: investigations.length };
    for (const r of INVESTIGATION_RESULT_FILTER_ORDER) counts[r] = 0;
    for (const i of investigations) counts[i.result] = (counts[i.result] ?? 0) + 1;
    return counts;
  }, [investigations]);

  const dateRangeActive = dateMeta.hasRestriction;

  const activeFilterCount = (selectedEmpIds.size > 0 ? 1 : 0) + (resultFilter !== 'all' ? 1 : 0) + (recommendationFilter !== 'all' ? 1 : 0) + (dateMeta.hasRestriction ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0"
          onClick={() => setDrawerOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          إضافة تحقيق
        </Button>
      </div>
    ),
    [activeFilterCount],
  );

  const investigationsFilterSummary = React.useMemo(() => {
    const parts: string[] = [];
    parts.push(selectedEmpIds.size === 0 ? 'الموظفون: الكل' : `الموظفون: ${selectedEmpIds.size} محدد`);
    parts.push(`النتيجة: ${resultFilter === 'all' ? 'الكل' : INVESTIGATION_RESULT_LABELS[resultFilter]}`);
    if (recommendationFilter !== 'all') {
      parts.push(`التوصية: ${INVESTIGATION_RECOMMENDATION_LABELS[recommendationFilter]}`);
    }
    parts.push(`التاريخ: ${dateBounds.from || dateBounds.to ? `${dateBounds.from || '…'} — ${dateBounds.to || '…'}` : 'كل الفترات'}`);
    return parts.join(' · ');
  }, [selectedEmpIds.size, resultFilter, recommendationFilter, dateBounds.from, dateBounds.to]);

  const investigationsPdfRows = React.useMemo(
    () =>
      listFiltered.map((inv) => [
        inv.caseNumber,
        inv.employeeNameAr,
        inv.investigatorName,
        inv.date,
        INVESTIGATION_RESULT_LABELS[inv.result],
        inv.recommendation,
      ]),
    [listFiltered],
  );

  const printable = React.useMemo(
    () =>
      investigationsPdfRows.length === 0 ? null : (
        <GenericRegisterPrintHtml
          companyNameAr={m.company?.nameAr ?? '—'}
          companyNameEn={m.company?.nameEn ?? m.company?.nameAr ?? '—'}
          titleAr="سجل التحقيقات"
          filterSummary={investigationsFilterSummary}
          headers={['رقم القضية', 'الموظف', 'المحقق', 'التاريخ', 'النتيجة', 'التوصية']}
          rows={investigationsPdfRows}
          landscape
        />
      ),
    [investigationsPdfRows, investigationsFilterSummary, m.company],
  );

  const handleExportInvestigationsExcel = React.useCallback(async () => {
    if (listFiltered.length === 0) {
      toast.error('لا توجد تحقيقات للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    const header: XlsxCell[] = ['رقم القضية', 'الموظف', 'المحقق', 'التاريخ', 'النتيجة', 'التوصية'];
    const rows: XlsxCell[][] = [
      header,
      ...listFiltered.map((inv) => [
        inv.caseNumber,
        inv.employeeNameAr,
        inv.investigatorName,
        inv.date,
        INVESTIGATION_RESULT_LABELS[inv.result],
        inv.recommendation,
      ]),
    ];
    await downloadXlsxFromAoA('discipline-investigations.xlsx', 'التحقيقات', rows);
    toast.success('تم تنزيل ملف Excel.');
  }, [listFiltered]);

  const set = (patch: Partial<DraftForm>) => setDraft(d => ({ ...d, ...patch }));

  const columns = React.useMemo((): ColumnDef<HRDisciplineInvestigationRecord>[] => [
    {
      key: 'caseNumber',
      title: 'المخالفة',
      headerClassName: 'whitespace-nowrap',
      className: 'font-mono text-xs font-medium tabular-nums text-muted-foreground',
      render: (inv) => <span dir="ltr">{inv.caseNumber}</span>,
    },
    {
      key: 'employee',
      title: 'الموظف',
      headerClassName: 'whitespace-nowrap',
      className: 'max-w-[10rem] truncate font-medium',
      render: (inv) => inv.employeeNameAr,
    },
    {
      key: 'investigator',
      title: 'المحقق',
      headerClassName: 'whitespace-nowrap',
      className: 'max-w-[9rem] truncate text-xs',
      render: (inv) => inv.investigatorName,
    },
    {
      key: 'date',
      title: 'التاريخ',
      headerClassName: 'whitespace-nowrap',
      className: 'whitespace-nowrap font-mono text-xs tabular-nums',
      render: (inv) => <TableDateCell value={inv.date} />,
    },
    {
      key: 'result',
      title: 'النتيجة',
      headerClassName: 'whitespace-nowrap',
      className: 'whitespace-nowrap text-xs',
      render: (inv) => INVESTIGATION_RESULT_LABELS[inv.result],
    },
    {
      key: 'recommendation',
      title: 'التوصية',
      headerClassName: 'whitespace-nowrap',
      className: 'whitespace-nowrap text-xs',
      render: (inv) => inv.recommendationType ? INVESTIGATION_RECOMMENDATION_LABELS[inv.recommendationType] : '—',
    },
    {
      key: 'deductionType',
      title: 'نوع الاستقطاع',
      headerClassName: 'whitespace-nowrap',
      className: 'whitespace-nowrap text-xs text-muted-foreground',
      render: (inv) => inv.deductionType ? INVESTIGATION_DEDUCTION_TYPE_LABELS[inv.deductionType] : '—',
    },
    {
      key: 'deductionValue',
      title: 'قيمة الاستقطاع',
      headerClassName: 'whitespace-nowrap',
      className: 'whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground',
      render: (inv) => <span dir="ltr">{inv.deductionValue != null ? inv.deductionValue : '—'}</span>,
    },
    {
      key: 'employeeStatement',
      title: 'أقوال الموظف',
      headerClassName: 'whitespace-nowrap',
      className: 'max-w-[14rem] text-xs text-muted-foreground',
      render: (inv) => (
        <span className="line-clamp-2" title={inv.employeeStatement || undefined}>{inv.employeeStatement || '—'}</span>
      ),
    },
    {
      key: 'witnessStatement',
      title: 'أقوال الشهود',
      headerClassName: 'whitespace-nowrap',
      className: 'max-w-[14rem] text-xs text-muted-foreground',
      render: (inv) => (
        <span className="line-clamp-2" title={inv.witnessStatement || undefined}>{inv.witnessStatement || '—'}</span>
      ),
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      headerClassName: 'whitespace-nowrap',
      render: (inv) => (
        <TableRowActions
          menuItems={[
            {
              label: 'حذف',
              onClick: () => setDeleteId(inv.id),
              icon: <Trash2 className="h-3.5 w-3.5" />,
              destructive: true,
            },
          ]}
        />
      ),
    },
  ], []);

  const handleCaseSelect = (caseId: string) => {
    const c = m.cases.find(x => x.id === caseId);
    if (!c) { set({ caseId: '', caseNumber: '', employeeId: '', employeeNameAr: '' }); return; }
    set({ caseId: c.id, caseNumber: c.caseNumber, employeeId: c.employeeId, employeeNameAr: c.employeeNameAr });
  };

  const handleSave = async () => {
    setFormError(null);
    if (!draft.caseId) { setFormError('المخالفة مطلوبة'); return; }
    if (!draft.investigatorEmployeeId) { setFormError('المحقق مطلوب'); return; }
    if (!draft.date) { setFormError('التاريخ مطلوب'); return; }
    if (!m.companyId) { setFormError('تعذر تحديد الشركة'); return; }

    const recommendation = draft.recommendationType === 'all'
      ? null
      : toInvestigationRecommendationDto(draft.recommendationType);

    const deductionValue = recommendation === 'deduction'
      ? Number(draft.deductionValue)
      : undefined;

    if (recommendation === 'deduction' && (!draft.deductionValue || Number.isNaN(deductionValue))) {
      setFormError('قيمة الاستقطاع مطلوبة');
      return;
    }

    try {
      await m.add({
        companyId: m.companyId,
        violationRecordId: draft.caseId,
        investigatorEmployeeId: draft.investigatorEmployeeId,
        investigationDate: draft.date,
        employeeStatement: draft.employeeStatement || null,
        witnessStatement: draft.witnessStatement || null,
        result: toInvestigationResultDto(draft.result),
        recommendation,
        deductionType: recommendation === 'deduction' ? draft.deductionType : undefined,
        deductionValue: recommendation === 'deduction' ? deductionValue : undefined,
      });
      toast.success('تم إضافة التحقيق');
      setDrawerOpen(false);
      setDraft(EMPTY);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-investigations.save');
      setFormError(displayMessage);
    }
  };

  useEntityFilterSlot(
    () => (
      <DisciplineFilterToolbar
        ref={filterToolbarRef}
        showPrimaryAction={false}
        primaryActionLabel="إضافة تحقيق"
        onPrimaryAction={() => { setDraft(EMPTY); setFormError(null); setDrawerOpen(true); }}
        toolbarExtraTrailing={(
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                if (investigationsPdfRows.length === 0) {
                  toast.error('لا توجد تحقيقات للتصدير ضمن الفلاتر الحالية.');
                  return;
                }
                setPdfOpen(true);
              }}
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => void handleExportInvestigationsExcel()}>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </Button>
          </>
        )}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={resultFilter}
        onStatusFilterChange={(v) => setResultFilter(v as ResultFilter)}
        statusOrder={INVESTIGATION_RESULT_FILTER_ORDER}
        statusLabels={INVESTIGATION_RESULT_LABELS as unknown as Record<string, string>}
        statusCounts={statusCounts}
        moreFilters={[
          {
            id: 'recommendation',
            value: recommendationFilter,
            onChange: (v) => setRecommendationFilter(v as RecommendationFilter),
            placeholder: 'التوصية',
            options: [
              { value: 'all', label: 'كل التوصيات' },
              ...Object.entries(INVESTIGATION_RECOMMENDATION_LABELS).map(([value, label]) => ({ value, label })),
            ],
          },
        ]}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDateBoundsChange={onDateBoundsChange}
        onDateFilterMetaChange={onDateFilterMetaChange}
      />
    ),
    [
      empPickerList,
      selectedEmpIds,
      resultFilter,
      recommendationFilter,
      statusCounts,
      viewMode,
      investigationsPdfRows.length,
      onDateBoundsChange,
      onDateFilterMetaChange,
      handleExportInvestigationsExcel,
    ],
  );

  return (
    <div className="space-y-4">
      <PdfPreviewExportDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        title="معاينة تصدير التحقيقات"
        fileName="discipline-investigations.pdf"
        printable={printable}
      />

      {m.listError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive whitespace-pre-wrap">
          {m.listError}
        </p>
      ) : null}

      {m.loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">جاري التحميل...</p>
      ) : searchFiltered.length === 0 ? (
        <EmptyState title="لا توجد تحقيقات مطابقة للبحث أو الموظفين المحددين." />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {dateMeta.tab === 'today'
              ? 'لا توجد تحقيقات بتاريخ اليوم ضمن النتائج الحالية.'
              : dateMeta.tab === 'week'
                ? 'لا توجد تحقيقات ضمن هذا الأسبوع ضمن النتائج الحالية.'
                : dateMeta.tab === 'month'
                  ? 'لا توجد تحقيقات ضمن هذا الشهر ضمن النتائج الحالية.'
                  : dateMeta.tab === 'custom' && dateRangeActive
                    ? 'لا توجد تحقيقات ضمن نطاق التاريخ المخصص مع عوامل البحث الحالية.'
                    : 'لا توجد تحقيقات ضمن النتائج الحالية.'}
          </p>
          {dateRangeActive ? (
            <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetDateFilter()}>
              عرض كل الفترات
            </Button>
          ) : null}
        </div>
      ) : listFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            لا توجد تحقيقات بنتيجة «{resultFilter === 'all' ? '' : INVESTIGATION_RESULT_LABELS[resultFilter]}» مع عوامل البحث الحالية.
          </p>
          <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetStatusFilter()}>
            عرض الكل
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listFiltered.map(inv => (
            <div key={inv.id} className="flex flex-col space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold text-muted-foreground" dir="ltr">{inv.caseNumber}</p>
                  <p className="mt-0.5 truncate font-semibold">{inv.employeeNameAr}</p>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  {INVESTIGATION_RESULT_LABELS[inv.result]}
                </span>
              </div>
              <div className="space-y-0.5 text-xs text-muted-foreground">
                <p>المحقق: {inv.investigatorName}</p>
                <p className="flex items-center gap-1 font-mono tabular-nums" dir="ltr">
                  <CalendarDays className="h-3 w-3 shrink-0" />
                  {inv.date}
                </p>
              </div>
              {inv.employeeStatement?.trim() ? (
                <div className="space-y-0.5">
                  <p className="text-[10px] font-medium text-muted-foreground/80">أقوال الموظف</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground text-right" title={inv.employeeStatement}>
                    {inv.employeeStatement}
                  </p>
                </div>
              ) : null}
              {inv.witnessStatement?.trim() ? (
                <div className="space-y-0.5">
                  <p className="text-[10px] font-medium text-muted-foreground/80">أقوال الشهود</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground text-right" title={inv.witnessStatement}>
                    {inv.witnessStatement}
                  </p>
                </div>
              ) : null}
              {inv.recommendationType === 'deduction' ? (
                <div className="space-y-0.5 text-xs text-muted-foreground">
                  <p>التوصية: {INVESTIGATION_RECOMMENDATION_LABELS.deduction}</p>
                  {inv.deductionType ? (
                    <p>نوع الاستقطاع: {INVESTIGATION_DEDUCTION_TYPE_LABELS[inv.deductionType]}</p>
                  ) : null}
                  {inv.deductionValue != null ? (
                    <p className="font-mono tabular-nums" dir="ltr">قيمة الاستقطاع: {inv.deductionValue}</p>
                  ) : null}
                </div>
              ) : inv.recommendationType === 'warning' ? (
                <p className="text-xs text-muted-foreground">
                  التوصية: {INVESTIGATION_RECOMMENDATION_LABELS.warning}
                </p>
              ) : null}
              <div className="mt-auto flex justify-end border-t border-border pt-3">
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(inv.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataTable
          variant="directory"
          alwaysShowTable
          tableClassName="min-w-[720px]"
          columns={columns}
          data={listFiltered}
          keyExtractor={(inv) => inv.id}
          onRowClick={(inv) => setDetailRow(inv)}
        />
      )}

      <HRSettingsFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="إضافة تحقيق" size="lg" onSave={() => void handleSave()} error={formError}>
        <FormField label="المخالفة" required>
          <SearchableDropdown value={draft.caseId} onChange={handleCaseSelect} options={caseOptions} placeholder="اختر المخالفة…" />
        </FormField>
        {draft.employeeNameAr && (
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm"><span className="text-muted-foreground">الموظف: </span>{draft.employeeNameAr}</div>
        )}
        <FormField label="المحقق" required>
          <SearchableDropdown
            value={draft.investigatorEmployeeId}
            onChange={(v) => {
              const selected = m.employees.find((emp) => emp.id === v);
              set({
                investigatorEmployeeId: v,
                investigatorName: selected?.nameAr ?? '',
              });
            }}
            options={investigatorOptions}
            placeholder="اختر المحقق…"
          />
        </FormField>
        <FormField label="تاريخ التحقيق" required>
          <DatePickerInput value={draft.date} onChange={(ymd) => set({ date: ymd })} />
        </FormField>
        <FormField label="أقوال الموظف">
          <textarea value={draft.employeeStatement} onChange={e => set({ employeeStatement: e.target.value })} placeholder="ما قاله الموظف في التحقيق…" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="أقوال الشهود">
          <textarea value={draft.witnessStatement} onChange={e => set({ witnessStatement: e.target.value })} placeholder="شهادة الشهود…" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="نتيجة التحقيق" required>
          <MinimalDropdown value={draft.result} onChange={v => set({ result: v as HRInvestigationResult })} options={RESULT_OPTIONS} />
        </FormField>
        <FormField label="التوصية">
          <MinimalDropdown
            value={draft.recommendationType}
            onChange={(v) => {
              const next = v as RecommendationFilter;
              set({
                recommendationType: next,
                deductionValue: next === 'deduction' ? draft.deductionValue : '',
              });
            }}
            options={[
              { value: 'all', label: 'بدون توصية' },
              ...Object.entries(INVESTIGATION_RECOMMENDATION_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
        </FormField>
        {draft.recommendationType === 'deduction' ? (
          <>
            <FormField label="نوع الاستقطاع" required>
              <MinimalDropdown
                value={draft.deductionType}
                onChange={(v) => set({ deductionType: v as DraftForm['deductionType'] })}
                options={[
                  { value: 'days', label: 'أيام' },
                  { value: 'hours', label: 'ساعات' },
                  { value: 'fixed_amount', label: 'مبلغ ثابت' },
                ]}
              />
            </FormField>
            <FormField label="قيمة الاستقطاع" required>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={draft.deductionValue}
                onChange={(e) => set({ deductionValue: e.target.value })}
                placeholder="أدخل القيمة…"
              />
            </FormField>
          </>
        ) : null}
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          void (async () => {
            try {
              await m.remove(deleteId);
              toast.success('تم الحذف');
              setDeleteId(null);
            } catch (err) {
              const { displayMessage } = handleApiError(err, 'discipline-investigations.delete');
              toast.error(displayMessage);
            }
          })();
        }}
        title="حذف التحقيق"
      />

      <TableRowDetailDialog
        open={detailRow != null}
        onOpenChange={(o) => !o && setDetailRow(null)}
        title="تفاصيل التحقيق"
        fields={detailRow ? [
          { label: 'المخالفة', value: detailRow.caseNumber },
          { label: 'الموظف', value: detailRow.employeeNameAr },
          { label: 'المحقق', value: detailRow.investigatorName },
          { label: 'التاريخ', value: <TableDateCell value={detailRow.date} /> },
          { label: 'النتيجة', value: INVESTIGATION_RESULT_LABELS[detailRow.result] },
          { label: 'التوصية', value: detailRow.recommendationType ? INVESTIGATION_RECOMMENDATION_LABELS[detailRow.recommendationType] : '—' },
          { label: 'نوع الاستقطاع', value: detailRow.deductionType ? INVESTIGATION_DEDUCTION_TYPE_LABELS[detailRow.deductionType] : '—' },
          { label: 'قيمة الاستقطاع', value: detailRow.deductionValue != null ? detailRow.deductionValue : '—' },
          { label: 'أقوال الموظف', value: detailRow.employeeStatement || '—' },
          { label: 'أقوال الشهود', value: detailRow.witnessStatement || '—' },
        ] : []}
      />
    </div>
  );
}
