'use client';

import * as React from 'react';
import { Trash2, CalendarDays, FileDown, FileSpreadsheet, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, MinimalDropdown, SearchableDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { useDisciplineNoticesDirectoryModel } from '@/features/hr/discipline/notices/hooks/useDisciplineNoticesDirectoryModel';
import type { HRDisciplineNoticeKind } from '@/features/hr/discipline/lib/types';
import { NOTICE_KIND_LABELS, NOTICE_KIND_FILTER_ORDER } from '@/features/hr/discipline/lib/types';
import type { DateFilterTab } from '@/features/hr/discipline/lib/discipline-date-filter';
import { matchesDateRange } from '@/features/hr/discipline/lib/discipline-date-filter';
import {
  DisciplineFilterToolbar,
  type DisciplineFilterToolbarHandle,
  type DisciplineViewMode,
} from '@/features/hr/discipline/components/discipline-filter-toolbar';
import { companiesApi } from '@/features/hr/lib/api/companies';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { GenericRegisterPrintHtml } from '@/components/pdf/print/generic-register-print-html';
import { downloadXlsxFromAoA, type XlsxCell } from '@/shared/export/download-xlsx';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import {
  DirectoryTableContainer, DirectoryTable, DirectoryTableHeaderRow, DirectoryTableHead,
  DirectoryTableBody, DirectoryTableRow, DirectoryTableCell, DirectoryTableActionsCell,
} from '@/components/ui/directory-table';

const KIND_OPTIONS = (Object.entries(NOTICE_KIND_LABELS) as [HRDisciplineNoticeKind, string][]).map(([v, l]) => ({ value: v, label: l }));

type KindFilter = 'all' | HRDisciplineNoticeKind;

interface DraftForm {
  employeeId: string; kind: HRDisciplineNoticeKind; reasonAr: string;
  date: string; linkedCaseId: string; attachmentsNote: string;
}
const EMPTY: DraftForm = { employeeId: '', kind: 'verbal', reasonAr: '', date: '', linkedCaseId: '', attachmentsNote: '' };

export function NoticesClient() {
  const hook = useDisciplineNoticesDirectoryModel();
  const { notices, employees, cases, loading, listError, createNotice, deleteNotice, reloadNotices } = hook;

  const [companyNameAr, setCompanyNameAr] = React.useState('');
  const [companyNameEn, setCompanyNameEn] = React.useState('');
  React.useEffect(() => {
    void (async () => {
      try {
        const res = await companiesApi.getAll({ limit: 1 });
        const c = res.items[0];
        if (c) { setCompanyNameAr(c.nameAr); setCompanyNameEn(c.nameEn ?? ''); }
      } catch { /* ignore */ }
    })();
  }, []);

  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<DisciplineViewMode>('cards');
  const [kindFilter, setKindFilter] = React.useState<KindFilter>('all');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [dateMeta, setDateMeta] = React.useState<{ tab: DateFilterTab; hasRestriction: boolean }>({ tab: 'all', hasRestriction: false });
  const filterToolbarRef = React.useRef<DisciplineFilterToolbarHandle>(null);
  const onDateBoundsChange = React.useCallback((b: { from: string; to: string }) => { setDateBounds(b); }, []);
  const onDateFilterMetaChange = React.useCallback((m: { tab: DateFilterTab; hasRestriction: boolean }) => { setDateMeta(m); }, []);

  const empPickerList = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const n of notices) map.set(n.employeeId, n.employeeNameAr);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [notices]);

  React.useEffect(() => {
    const employeeId = selectedEmpIds.size === 1 ? [...selectedEmpIds][0] : undefined;
    void reloadNotices({ employeeId });
  }, [selectedEmpIds, reloadNotices]);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = React.useState(false);

  const empOptions = employees.map(e => ({ value: e.id, label: e.nameAr }));
  const caseOptions = cases.map(c => ({ value: c.id, label: c.caseNumber, sub: c.employeeNameAr }));

  // Employee filter is handled by the backend via reloadNotices; use notices directly.
  const searchFiltered = notices;

  const filtered = React.useMemo(
    () => notices.filter((n) => matchesDateRange(n.date, dateBounds.from, dateBounds.to)),
    [notices, dateBounds.from, dateBounds.to],
  );

  const listFiltered = React.useMemo(
    () => (kindFilter === 'all' ? filtered : filtered.filter((n) => n.kind === kindFilter)),
    [filtered, kindFilter],
  );

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: filtered.length };
    for (const k of NOTICE_KIND_FILTER_ORDER) counts[k] = 0;
    for (const n of filtered) counts[n.kind] = (counts[n.kind] ?? 0) + 1;
    return counts;
  }, [filtered]);

  const dateRangeActive = dateMeta.hasRestriction;

  const activeFilterCount = (selectedEmpIds.size > 0 ? 1 : 0) + (kindFilter !== 'all' ? 1 : 0) + (dateMeta.hasRestriction ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0"
          onClick={() => setDrawerOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          إضافة إنذار
        </Button>
      </div>
    ),
    [activeFilterCount],
  );

  const noticesFilterSummary = React.useMemo(() => {
    const parts: string[] = [];
    parts.push(selectedEmpIds.size === 0 ? 'الموظفون: الكل' : `الموظفون: ${selectedEmpIds.size} محدد`);
    parts.push(`نوع الإنذار: ${kindFilter === 'all' ? 'الكل' : NOTICE_KIND_LABELS[kindFilter]}`);
    parts.push(`التاريخ: ${dateBounds.from || dateBounds.to ? `${dateBounds.from || '…'} — ${dateBounds.to || '…'}` : 'كل الفترات'}`);
    return parts.join(' · ');
  }, [selectedEmpIds.size, kindFilter, dateBounds.from, dateBounds.to]);

  const noticesPdfRows = React.useMemo(
    () => listFiltered.map((n) => [n.employeeNameAr, n.date, NOTICE_KIND_LABELS[n.kind], n.reasonAr, n.attachmentsNote || '—']),
    [listFiltered],
  );

  const printable = React.useMemo(
    () =>
      noticesPdfRows.length === 0 ? null : (
        <GenericRegisterPrintHtml
          companyNameAr={companyNameAr}
          companyNameEn={companyNameEn}
          titleAr="سجل الإنذارات"
          filterSummary={noticesFilterSummary}
          headers={['الموظف', 'التاريخ', 'النوع', 'السبب', 'المرفقات']}
          rows={noticesPdfRows}
          landscape
        />
      ),
    [noticesPdfRows, noticesFilterSummary],
  );

  const handleExportNoticesExcel = React.useCallback(async () => {
    if (listFiltered.length === 0) { toast.error('لا توجد إنذارات للتصدير ضمن الفلاتر الحالية.'); return; }
    const rows: XlsxCell[][] = [
      ['الموظف', 'التاريخ', 'النوع', 'السبب', 'المرفقات'],
      ...listFiltered.map((n) => [n.employeeNameAr, n.date, NOTICE_KIND_LABELS[n.kind], n.reasonAr, n.attachmentsNote || '—']),
    ];
    await downloadXlsxFromAoA('discipline-notices.xlsx', 'الإنذارات', rows);
    toast.success('تم تنزيل ملف Excel.');
  }, [listFiltered]);

  const set = (patch: Partial<DraftForm>) => setDraft(d => ({ ...d, ...patch }));

  const handleSave = async () => {
    setFormError(null);
    if (!draft.employeeId) { setFormError('الموظف مطلوب'); return; }
    if (!draft.reasonAr.trim()) { setFormError('السبب مطلوب'); return; }
    if (!draft.date) { setFormError('التاريخ مطلوب'); return; }
    setSaving(true);
    try {
      await createNotice({
        employeeId: draft.employeeId,
        kind: draft.kind,
        reasonAr: draft.reasonAr,
        date: draft.date,
        linkedCaseId: draft.linkedCaseId || null,
        attachmentsNote: draft.attachmentsNote || null,
      });
      toast.success('تم إضافة الإنذار');
      setDrawerOpen(false);
      setDraft(EMPTY);
    } catch {
      setFormError('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  useEntityFilterSlot(
    () => (
      <DisciplineFilterToolbar
        ref={filterToolbarRef}
        showPrimaryAction={false}
        primaryActionLabel="إضافة إنذار"
        onPrimaryAction={() => { setDraft(EMPTY); setFormError(null); setDrawerOpen(true); }}
        toolbarExtraTrailing={(
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => { if (noticesPdfRows.length === 0) { toast.error('لا توجد إنذارات للتصدير ضمن الفلاتر الحالية.'); return; } setPdfOpen(true); }}
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => void handleExportNoticesExcel()}>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </Button>
          </>
        )}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={kindFilter}
        onStatusFilterChange={(v) => setKindFilter(v as KindFilter)}
        statusOrder={NOTICE_KIND_FILTER_ORDER}
        statusLabels={NOTICE_KIND_LABELS as unknown as Record<string, string>}
        statusCounts={statusCounts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDateBoundsChange={onDateBoundsChange}
        onDateFilterMetaChange={onDateFilterMetaChange}
      />
    ),
    [empPickerList, selectedEmpIds, kindFilter, statusCounts, viewMode, listFiltered, onDateBoundsChange, onDateFilterMetaChange],
  );

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-muted/30" />
        ))}
      </div>
    );
  }

  if (listError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        {listError}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PdfPreviewExportDialog open={pdfOpen} onOpenChange={setPdfOpen} title="معاينة تصدير الإنذارات" fileName="discipline-notices.pdf" printable={printable} />

      {searchFiltered.length === 0 ? (
        <EmptyState title="لا توجد إنذارات مطابقة للبحث أو الموظفين المحددين." />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {dateMeta.tab === 'today' ? 'لا توجد إنذارات بتاريخ اليوم ضمن النتائج الحالية.'
              : dateMeta.tab === 'week' ? 'لا توجد إنذارات ضمن هذا الأسبوع ضمن النتائج الحالية.'
              : dateMeta.tab === 'month' ? 'لا توجد إنذارات ضمن هذا الشهر ضمن النتائج الحالية.'
              : dateMeta.tab === 'custom' && dateRangeActive ? 'لا توجد إنذارات ضمن نطاق التاريخ المخصص مع عوامل البحث الحالية.'
              : 'لا توجد إنذارات ضمن النتائج الحالية.'}
          </p>
          {dateRangeActive ? (
            <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetDateFilter()}>عرض كل الفترات</Button>
          ) : null}
        </div>
      ) : listFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">لا توجد إنذارات من نوع «{kindFilter === 'all' ? '' : NOTICE_KIND_LABELS[kindFilter]}» مع عوامل البحث الحالية.</p>
          <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetStatusFilter()}>عرض الكل</Button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listFiltered.map(n => (
            <div key={n.id} className="flex flex-col space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{n.employeeNameAr}</p>
                  <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-muted-foreground" dir="ltr">
                    <CalendarDays className="h-3 w-3 shrink-0" />{n.date}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  {NOTICE_KIND_LABELS[n.kind]}
                </span>
              </div>
              <p className="line-clamp-3 text-xs text-muted-foreground">{n.reasonAr}</p>
              <div className="mt-auto flex justify-end border-t border-border pt-3">
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(n.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DirectoryTableContainer>
          <DirectoryTable className="min-w-[640px]">
            <DirectoryTableHeaderRow>
              <DirectoryTableHead className="whitespace-nowrap">الموظف</DirectoryTableHead>
              <DirectoryTableHead className="whitespace-nowrap">نوع الإنذار</DirectoryTableHead>
              <DirectoryTableHead className="whitespace-nowrap">التاريخ</DirectoryTableHead>
              <DirectoryTableHead>السبب</DirectoryTableHead>
              <DirectoryTableHead className="whitespace-nowrap">إجراءات</DirectoryTableHead>
            </DirectoryTableHeaderRow>
            <DirectoryTableBody>
              {listFiltered.map((n) => (
                <DirectoryTableRow key={n.id}>
                  <DirectoryTableCell className="max-w-[12rem] truncate font-medium">{n.employeeNameAr}</DirectoryTableCell>
                  <DirectoryTableCell className="whitespace-nowrap text-xs">{NOTICE_KIND_LABELS[n.kind]}</DirectoryTableCell>
                  <DirectoryTableCell className="whitespace-nowrap font-mono text-xs tabular-nums" dir="ltr">{n.date}</DirectoryTableCell>
                  <DirectoryTableCell className="max-w-[20rem] truncate text-xs text-muted-foreground">{n.reasonAr}</DirectoryTableCell>
                  <DirectoryTableActionsCell>
                    <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" type="button" onClick={() => setDeleteId(n.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </DirectoryTableActionsCell>
                </DirectoryTableRow>
              ))}
            </DirectoryTableBody>
          </DirectoryTable>
        </DirectoryTableContainer>
      )}

      <HRSettingsFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="إضافة إنذار" size="lg" onSave={() => void handleSave()} saveDisabled={saving} error={formError}>
        <FormField label="الموظف" required>
          <SearchableDropdown value={draft.employeeId} onChange={v => set({ employeeId: v })} options={empOptions} placeholder="اختر الموظف…" />
        </FormField>
        <FormField label="نوع الإنذار" required>
          <MinimalDropdown value={draft.kind} onChange={v => set({ kind: v as HRDisciplineNoticeKind })} options={KIND_OPTIONS} />
        </FormField>
        <FormField label="السبب" required>
          <textarea value={draft.reasonAr} onChange={e => set({ reasonAr: e.target.value })} placeholder="اكتب سبب الإنذار…" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="التاريخ" required>
          <DatePickerInput value={draft.date} onChange={(ymd) => set({ date: ymd })} />
        </FormField>
        <FormField label="ربط بمخالفة">
          <SearchableDropdown value={draft.linkedCaseId} onChange={v => set({ linkedCaseId: v })} options={caseOptions} placeholder="اختر مخالفة (اختياري)…" allowClear />
        </FormField>
        <FormField label="ملاحظة المرفقات">
          <Input value={draft.attachmentsNote} onChange={e => set({ attachmentsNote: e.target.value })} placeholder="وصف المرفقات…" />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            try { await deleteNotice(deleteId); toast.success('تم الحذف'); } catch { toast.error('فشل الحذف'); }
            setDeleteId(null);
          }
        }}
        title="حذف الإنذار"
      />
    </div>
  );
}
