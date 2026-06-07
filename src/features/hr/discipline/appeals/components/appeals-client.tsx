'use client';

import * as React from 'react';
import { Trash2, CalendarDays, FileDown, FileSpreadsheet, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, MinimalDropdown, SearchableDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { useDisciplineAppealsDirectoryModel } from '@/features/hr/discipline/appeals/hooks/useDisciplineAppealsDirectoryModel';
import type { HRAppealChannel, HRAppealStatus } from '@/features/hr/discipline/lib/types';
import { APPEAL_CHANNEL_LABELS, APPEAL_STATUS_LABELS, APPEAL_STATUS_FILTER_ORDER } from '@/features/hr/discipline/lib/types';
import type { AppealChannelDto, AppealStatusDto } from '@/features/hr/discipline/lib/api/discipline-appeals';
import type { DateFilterTab } from '@/features/hr/discipline/lib/discipline-date-filter';
import { matchesDateRange } from '@/features/hr/discipline/lib/discipline-date-filter';
import {
  DisciplineFilterToolbar,
  type DisciplineFilterToolbarHandle,
  type DisciplineViewMode,
} from '@/features/hr/discipline/components/discipline-filter-toolbar';
import { cn } from '@/shared/utils';
import { companiesApi } from '@/features/hr/lib/api/companies';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { GenericRegisterPrintHtml } from '@/components/pdf/print/generic-register-print-html';
import { downloadXlsxFromAoA, type XlsxCell } from '@/shared/export/download-xlsx';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';

const CHANNEL_OPTIONS = (Object.entries(APPEAL_CHANNEL_LABELS) as [HRAppealChannel, string][]).map(([v, l]) => ({ value: v, label: l }));
const STATUS_OPTIONS = (Object.entries(APPEAL_STATUS_LABELS) as [HRAppealStatus, string][]).map(([v, l]) => ({ value: v, label: l }));

const STATUS_COLORS: Record<HRAppealStatus, string> = {
  pending: 'text-primary border-primary/25 bg-primary/5 dark:border-primary/40 dark:bg-primary/15',
  under_review: 'text-warning border-warning/30 bg-warning/10 dark:border-warning/40 dark:bg-warning/10',
  accepted: 'text-success border-success/30 bg-success/10 dark:border-success/40 dark:bg-success/10',
  rejected: 'text-destructive border-destructive/30 bg-destructive/10 dark:border-destructive/40 dark:bg-destructive/10',
  withdrawn: 'text-muted-foreground border-border bg-muted/30',
};

type StatusFilter = 'all' | HRAppealStatus;

interface DraftForm {
  caseId: string; employeeNameAr: string;
  date: string; channel: HRAppealChannel; grounds: string;
}
const EMPTY: DraftForm = { caseId: '', employeeNameAr: '', date: '', channel: 'in_person', grounds: '' };

export function AppealsClient() {
  const hook = useDisciplineAppealsDirectoryModel();
  const { appeals, employees, cases, loading, listError, createAppeal, updateAppeal, deleteAppeal, reload } = hook;

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
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [dateMeta, setDateMeta] = React.useState<{ tab: DateFilterTab; hasRestriction: boolean }>({ tab: 'all', hasRestriction: false });
  const filterToolbarRef = React.useRef<DisciplineFilterToolbarHandle>(null);
  const onDateBoundsChange = React.useCallback((b: { from: string; to: string }) => { setDateBounds(b); }, []);
  const onDateFilterMetaChange = React.useCallback((m: { tab: DateFilterTab; hasRestriction: boolean }) => { setDateMeta(m); }, []);

  const empPickerList = React.useMemo(
    () => employees.map((e) => ({ id: e.id, name: e.nameAr })),
    [employees],
  );

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = React.useState(false);

  const caseOptions = cases.map(c => ({ value: c.id, label: c.caseNumber, sub: c.employeeNameAr }));

  // Backend fetch whenever employee or status filters change
  React.useEffect(() => {
    const employeeId = selectedEmpIds.size === 1 ? [...selectedEmpIds][0] : undefined;
    const status = statusFilter !== 'all' ? (statusFilter as AppealStatusDto) : undefined;
    void reload({ employeeId, status });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmpIds, statusFilter]);

  // Date range filter applied locally (API doesn't support it)
  const filtered = React.useMemo(
    () => appeals.filter((a) => matchesDateRange(a.date, dateBounds.from, dateBounds.to)),
    [appeals, dateBounds.from, dateBounds.to],
  );

  const listFiltered = filtered;

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: appeals.length };
    for (const s of APPEAL_STATUS_FILTER_ORDER) counts[s] = 0;
    for (const a of appeals) counts[a.status] = (counts[a.status] ?? 0) + 1;
    return counts;
  }, [appeals]);

  const dateRangeActive = dateMeta.hasRestriction;

  const activeFilterCount = (selectedEmpIds.size > 0 ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (dateMeta.hasRestriction ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0"
          onClick={() => setDrawerOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          إضافة تظلم
        </Button>
      </div>
    ),
    [activeFilterCount],
  );

  const appealsFilterSummary = React.useMemo(() => {
    const parts: string[] = [];
    parts.push(selectedEmpIds.size === 0 ? 'الموظفون: الكل' : `الموظفون: ${selectedEmpIds.size} محدد`);
    parts.push(`الحالة: ${statusFilter === 'all' ? 'الكل' : APPEAL_STATUS_LABELS[statusFilter]}`);
    parts.push(`التاريخ: ${dateBounds.from || dateBounds.to ? `${dateBounds.from || '…'} — ${dateBounds.to || '…'}` : 'كل الفترات'}`);
    return parts.join(' · ');
  }, [selectedEmpIds.size, statusFilter, dateBounds.from, dateBounds.to]);

  const appealsPdfRows = React.useMemo(
    () => listFiltered.map((a) => [a.caseNumber, a.employeeNameAr, a.date, APPEAL_CHANNEL_LABELS[a.channel], APPEAL_STATUS_LABELS[a.status], a.grounds]),
    [listFiltered],
  );

  const printable = React.useMemo(
    () =>
      appealsPdfRows.length === 0 ? null : (
        <GenericRegisterPrintHtml
          companyNameAr={companyNameAr}
          companyNameEn={companyNameEn}
          titleAr="سجل التظلمات"
          filterSummary={appealsFilterSummary}
          headers={['رقم القضية', 'الموظف', 'التاريخ', 'القناة', 'الحالة', 'أسباب التظلم']}
          rows={appealsPdfRows}
          landscape
        />
      ),
    [appealsPdfRows, appealsFilterSummary],
  );

  const handleExportAppealsExcel = React.useCallback(async () => {
    if (listFiltered.length === 0) { toast.error('لا توجد تظلمات للتصدير ضمن الفلاتر الحالية.'); return; }
    const rows: XlsxCell[][] = [
      ['رقم القضية', 'الموظف', 'التاريخ', 'القناة', 'الحالة', 'أسباب التظلم'],
      ...listFiltered.map((a) => [a.caseNumber, a.employeeNameAr, a.date, APPEAL_CHANNEL_LABELS[a.channel], APPEAL_STATUS_LABELS[a.status], a.grounds]),
    ];
    await downloadXlsxFromAoA('discipline-appeals.xlsx', 'التظلمات', rows);
    toast.success('تم تنزيل ملف Excel.');
  }, [listFiltered]);

  const set = (patch: Partial<DraftForm>) => setDraft(d => ({ ...d, ...patch }));

  const handleCaseSelect = (caseId: string) => {
    const c = cases.find(x => x.id === caseId);
    if (!c) { set({ caseId: '', employeeNameAr: '' }); return; }
    set({ caseId: c.id, employeeNameAr: c.employeeNameAr });
  };

  const handleSave = async () => {
    setFormError(null);
    if (!draft.caseId) { setFormError('المخالفة مطلوبة'); return; }
    if (!draft.date) { setFormError('التاريخ مطلوب'); return; }
    if (!draft.grounds.trim()) { setFormError('أسباب التظلم مطلوبة'); return; }
    setSaving(true);
    try {
      await createAppeal({ caseId: draft.caseId, date: draft.date, channel: draft.channel as AppealChannelDto, grounds: draft.grounds });
      toast.success('تم تقديم التظلم');
      setDrawerOpen(false);
      setDraft(EMPTY);
    } catch {
      setFormError('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateAppeal(id, { status: status as AppealStatusDto });
      toast.success('تم تحديث الحالة');
    } catch {
      toast.error('فشل تحديث الحالة');
    }
  };

  useEntityFilterSlot(
    () => (
      <DisciplineFilterToolbar
        ref={filterToolbarRef}
        showPrimaryAction={false}
        primaryActionLabel="إضافة تظلم"
        onPrimaryAction={() => { setDraft(EMPTY); setFormError(null); setDrawerOpen(true); }}
        toolbarExtraTrailing={(
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => { if (appealsPdfRows.length === 0) { toast.error('لا توجد تظلمات للتصدير ضمن الفلاتر الحالية.'); return; } setPdfOpen(true); }}
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => void handleExportAppealsExcel()}>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </Button>
          </>
        )}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => setStatusFilter(v as StatusFilter)}
        statusOrder={APPEAL_STATUS_FILTER_ORDER}
        statusLabels={APPEAL_STATUS_LABELS as unknown as Record<string, string>}
        statusCounts={statusCounts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDateBoundsChange={onDateBoundsChange}
        onDateFilterMetaChange={onDateFilterMetaChange}
      />
    ),
    [empPickerList, selectedEmpIds, statusFilter, statusCounts, viewMode, listFiltered, onDateBoundsChange, onDateFilterMetaChange],
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
      <PdfPreviewExportDialog open={pdfOpen} onOpenChange={setPdfOpen} title="معاينة تصدير التظلمات" fileName="discipline-appeals.pdf" printable={printable} />

      {appeals.length === 0 && !loading ? (
        <EmptyState title="لا توجد تظلمات مطابقة للفلاتر المحددة." />
      ) : filtered.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {dateMeta.tab === 'today' ? 'لا توجد تظلمات بتاريخ اليوم ضمن النتائج الحالية.'
              : dateMeta.tab === 'week' ? 'لا توجد تظلمات ضمن هذا الأسبوع ضمن النتائج الحالية.'
              : dateMeta.tab === 'month' ? 'لا توجد تظلمات ضمن هذا الشهر ضمن النتائج الحالية.'
              : dateMeta.tab === 'custom' && dateRangeActive ? 'لا توجد تظلمات ضمن نطاق التاريخ المخصص مع عوامل البحث الحالية.'
              : 'لا توجد تظلمات ضمن النتائج الحالية.'}
          </p>
          {dateRangeActive ? (
            <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetDateFilter()}>عرض كل الفترات</Button>
          ) : null}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listFiltered.map(a => (
            <div key={a.id} className="flex flex-col space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold text-muted-foreground" dir="ltr">{a.caseNumber}</p>
                  <p className="mt-0.5 truncate font-semibold">{a.employeeNameAr}</p>
                </div>
                <span className={cn('inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium', STATUS_COLORS[a.status])}>
                  {APPEAL_STATUS_LABELS[a.status]}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {APPEAL_CHANNEL_LABELS[a.channel]}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground tabular-nums" dir="ltr">
                  <CalendarDays className="h-3 w-3 shrink-0" />{a.date}
                </span>
              </div>
              {a.grounds?.trim() ? (
                <p className="line-clamp-3 text-xs text-muted-foreground text-right" title={a.grounds}>
                  {a.grounds}
                </p>
              ) : null}
              <MinimalDropdown
                value={a.status}
                onChange={v => void handleStatusChange(a.id, v)}
                options={STATUS_OPTIONS}
              />
              <div className="mt-auto flex justify-end border-t border-border pt-3">
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(a.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-right">
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">المخالفة</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">الموظف</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">التاريخ</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">القناة</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">أسباب التظلم</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">الحالة</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {listFiltered.map((a) => (
                <tr key={a.id} className="border-b border-border/70 transition-colors hover:bg-muted/25">
                  <td className="p-3 font-mono text-xs font-medium tabular-nums text-muted-foreground" dir="ltr">{a.caseNumber}</td>
                  <td className="max-w-[10rem] truncate p-3 font-medium">{a.employeeNameAr}</td>
                  <td className="whitespace-nowrap p-3 font-mono text-xs tabular-nums" dir="ltr">{a.date}</td>
                  <td className="whitespace-nowrap p-3 text-xs">{APPEAL_CHANNEL_LABELS[a.channel]}</td>
                  <td className="max-w-[16rem] p-3 text-xs text-muted-foreground">
                    <span className="line-clamp-2" title={a.grounds ?? undefined}>{a.grounds ?? '—'}</span>
                  </td>
                  <td className="p-3">
                    <MinimalDropdown
                      value={a.status}
                      onChange={v => void handleStatusChange(a.id, v)}
                      options={STATUS_OPTIONS}
                    />
                  </td>
                  <td className="p-2">
                    <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" type="button" onClick={() => setDeleteId(a.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <HRSettingsFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="تقديم تظلم" size="lg" onSave={() => void handleSave()} saveDisabled={saving} error={formError}>
        <FormField label="المخالفة" required>
          <SearchableDropdown value={draft.caseId} onChange={handleCaseSelect} options={caseOptions} placeholder="اختر المخالفة…" />
        </FormField>
        {draft.employeeNameAr && (
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm"><span className="text-muted-foreground">الموظف: </span>{draft.employeeNameAr}</div>
        )}
        <FormField label="تاريخ التظلم" required>
          <Input type="date" value={draft.date} onChange={e => set({ date: e.target.value })} />
        </FormField>
        <FormField label="قناة التظلم" required>
          <MinimalDropdown value={draft.channel} onChange={v => set({ channel: v as HRAppealChannel })} options={CHANNEL_OPTIONS} />
        </FormField>
        <FormField label="أسباب التظلم" required>
          <textarea value={draft.grounds} onChange={e => set({ grounds: e.target.value })} placeholder="اشرح أسباب التظلم…" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            try { await deleteAppeal(deleteId); toast.success('تم الحذف'); } catch { toast.error('فشل الحذف'); }
            setDeleteId(null);
          }
        }}
        title="حذف التظلم"
      />
    </div>
  );
}
