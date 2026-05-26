'use client';

import * as React from 'react';
import { Trash2, CalendarDays, Eye, CheckCircle2, XCircle, Edit3, FileDown, FileSpreadsheet, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField, EmptyState, SearchableDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { useViolationCasesDirectoryModel } from '@/features/hr/discipline/violation-cases/hooks/useViolationCasesDirectoryModel';
import type { ViolationCaseRecord } from '@/features/hr/discipline/violation-cases/hooks/useViolationCasesDirectoryModel';
import type { ViolationRecordStatus } from '@/features/hr/discipline/lib/api/violation-records';
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
import { ViolationCasesRegisterPrintHtml } from '@/components/pdf/print/violation-cases-register-print-html';
import { downloadXlsxFromAoA, type XlsxCell } from '@/shared/export/download-xlsx';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';

const STATUS_LABELS: Record<ViolationRecordStatus, string> = {
  pending:    'قيد الانتظار',
  approved:   'معتمد',
  rejected:   'مرفوض',
  needs_edit: 'يحتاج تعديل',
};

const STATUS_COLORS: Record<ViolationRecordStatus, string> = {
  pending:    'text-primary border-primary/25 bg-primary/5 dark:border-primary/40 dark:bg-primary/15',
  approved:   'text-success border-success/30 bg-success/10 dark:border-success/40 dark:bg-success/10',
  rejected:   'text-destructive border-destructive/30 bg-destructive/10 dark:border-destructive/40 dark:bg-destructive/10',
  needs_edit: 'text-warning border-warning/30 bg-warning/10 dark:border-warning/40 dark:bg-warning/10',
};

const STATUS_ORDER: readonly ViolationRecordStatus[] = ['pending', 'approved', 'rejected', 'needs_edit'];

type StatusFilter = 'all' | ViolationRecordStatus;

interface CreateForm {
  employeeId: string; date: string; violationTypeId: string;
  description: string; notes: string; attachmentsNote: string;
}
const CREATE_EMPTY: CreateForm = {
  employeeId: '', date: '', violationTypeId: '',
  description: '', notes: '', attachmentsNote: '',
};

interface EditForm {
  date: string; description: string; notes: string; attachmentsNote: string;
}

export function ViolationCasesClient() {
  const hook = useViolationCasesDirectoryModel();
  const { cases, employees, violationTypes, loading, listError, createCase, updateCase, deleteCase } = hook;

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

  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<CreateForm>(CREATE_EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [viewCase, setViewCase] = React.useState<ViolationCaseRecord | null>(null);
  const [editCase, setEditCase] = React.useState<ViolationCaseRecord | null>(null);
  const [editForm, setEditForm] = React.useState<EditForm>({ date: '', description: '', notes: '', attachmentsNote: '' });
  const [editSaving, setEditSaving] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  const [rejectCase, setRejectCase] = React.useState<ViolationCaseRecord | null>(null);
  const [rejectNote, setRejectNote] = React.useState('');
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const onDateBoundsChange = React.useCallback((b: { from: string; to: string }) => setDateBounds(b), []);
  const onDateFilterMetaChange = React.useCallback((m: { tab: DateFilterTab; hasRestriction: boolean }) => setDateMeta(m), []);

  const empPickerList = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cases) map.set(c.employeeId, c.employeeNameAr);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [cases]);

  const searchFiltered = React.useMemo(
    () => cases.filter((c) => selectedEmpIds.size === 0 || selectedEmpIds.has(c.employeeId)),
    [cases, selectedEmpIds],
  );

  const filtered = React.useMemo(
    () => searchFiltered.filter((c) => matchesDateRange(c.date, dateBounds.from, dateBounds.to)),
    [searchFiltered, dateBounds.from, dateBounds.to],
  );

  const listFiltered = React.useMemo(
    () => (statusFilter === 'all' ? filtered : filtered.filter((c) => c.status === statusFilter)),
    [filtered, statusFilter],
  );

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: filtered.length };
    for (const s of STATUS_ORDER) counts[s] = 0;
    for (const c of filtered) counts[c.status] = (counts[c.status] ?? 0) + 1;
    return counts;
  }, [filtered]);

  const dateRangeActive = dateMeta.hasRestriction;

  const activeFilterCount = (selectedEmpIds.size > 0 ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (dateMeta.hasRestriction ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0"
          onClick={() => { setDraft(CREATE_EMPTY); setFormError(null); setCreateOpen(true); }}>
          <Plus className="h-3.5 w-3.5" />
          مخالفة جديدة
        </Button>
      </div>
    ),
    [activeFilterCount],
  );

  const violationPdfRows = React.useMemo(
    () => listFiltered.map((c) => ({
      caseNumber: c.caseNumber, employeeNameAr: c.employeeNameAr,
      typeNameAr: c.typeNameAr, date: c.date,
      statusAr: STATUS_LABELS[c.status], description: c.description,
    })),
    [listFiltered],
  );

  const printable = React.useMemo(
    () =>
      violationPdfRows.length === 0 ? null : (
        <ViolationCasesRegisterPrintHtml
          companyNameAr={companyNameAr}
          companyNameEn={companyNameEn}
          titleAr="سجل مخالفات الموظفين"
          filterSummary={`الموظفون: ${selectedEmpIds.size === 0 ? 'الكل' : `${selectedEmpIds.size} محدد`} · الحالة: ${statusFilter === 'all' ? 'الكل' : STATUS_LABELS[statusFilter as ViolationRecordStatus]} · التاريخ: ${dateBounds.from || dateBounds.to ? `${dateBounds.from || '…'} — ${dateBounds.to || '…'}` : 'كل الفترات'}`}
          rows={violationPdfRows}
        />
      ),
    [violationPdfRows, selectedEmpIds.size, statusFilter, dateBounds.from, dateBounds.to],
  );

  const handleExportExcel = React.useCallback(async () => {
    if (listFiltered.length === 0) { toast.error('لا توجد مخالفات للتصدير ضمن الفلاتر الحالية.'); return; }
    const rows: XlsxCell[][] = [
      ['رقم القضية', 'الموظف', 'نوع المخالفة', 'التاريخ', 'الحالة', 'الوصف'],
      ...listFiltered.map((c) => [c.caseNumber, c.employeeNameAr, c.typeNameAr, c.date, STATUS_LABELS[c.status], c.description]),
    ];
    await downloadXlsxFromAoA('violation-cases.xlsx', 'المخالفات', rows);
    toast.success('تم تنزيل ملف Excel.');
  }, [listFiltered]);

  const empOptions = employees.map(e => ({ value: e.id, label: e.nameAr }));
  const typeOptions = violationTypes.filter(t => t.isActive).map(t => ({ value: t.id, label: t.nameAr, sub: t.code }));

  const setD = (patch: Partial<CreateForm>) => setDraft(d => ({ ...d, ...patch }));

  const handleCreate = async () => {
    setFormError(null);
    if (!draft.employeeId)      { setFormError('الموظف مطلوب'); return; }
    if (!draft.violationTypeId) { setFormError('نوع المخالفة مطلوب'); return; }
    if (!draft.date)            { setFormError('التاريخ مطلوب'); return; }
    if (!draft.description.trim()) { setFormError('الوصف مطلوب'); return; }
    setSaving(true);
    try {
      await createCase({
        employeeId: draft.employeeId,
        violationTypeId: draft.violationTypeId,
        date: draft.date,
        description: draft.description,
        notes: draft.notes || null,
        attachmentsNote: draft.attachmentsNote || null,
      });
      toast.success('تم حفظ المخالفة');
      setCreateOpen(false);
      setDraft(CREATE_EMPTY);
    } catch {
      setFormError('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c: ViolationCaseRecord) => {
    setEditCase(c);
    setEditForm({ date: c.date, description: c.description, notes: c.notes ?? '', attachmentsNote: c.attachmentsNote ?? '' });
    setEditError(null);
  };

  const handleEdit = async () => {
    if (!editCase) return;
    setEditError(null);
    if (!editForm.description.trim()) { setEditError('الوصف مطلوب'); return; }
    setEditSaving(true);
    try {
      await updateCase(editCase.id, {
        violationDate: editForm.date,
        description: editForm.description,
        notes: editForm.notes || null,
        attachmentsNote: editForm.attachmentsNote || null,
      });
      toast.success('تم تحديث المخالفة');
      setEditCase(null);
    } catch {
      setEditError('حدث خطأ أثناء الحفظ');
    } finally {
      setEditSaving(false);
    }
  };

  const handleApprove = async (c: ViolationCaseRecord) => {
    try { await updateCase(c.id, { status: 'approved' }); toast.success(`تمت الموافقة على ${c.caseNumber}`); }
    catch { toast.error('فشلت الموافقة'); }
  };

  const handleReject = async () => {
    if (!rejectCase) return;
    try {
      await updateCase(rejectCase.id, { status: 'rejected', notes: rejectNote.trim() || rejectCase.notes });
      toast.success('تم رفض المخالفة');
    } catch { toast.error('فشل الرفض'); }
    setRejectCase(null);
    setRejectNote('');
  };

  const handleNeedsEdit = async (c: ViolationCaseRecord) => {
    try { await updateCase(c.id, { status: 'needs_edit' }); toast.success('تم تحديث الحالة'); }
    catch { toast.error('فشل التحديث'); }
  };

  useEntityFilterSlot(
    () => (
      <DisciplineFilterToolbar
        ref={filterToolbarRef}
        showPrimaryAction={false}
        primaryActionLabel="مخالفة جديدة"
        onPrimaryAction={() => { setDraft(CREATE_EMPTY); setFormError(null); setCreateOpen(true); }}
        toolbarExtraTrailing={(
          <>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
              onClick={() => { if (violationPdfRows.length === 0) { toast.error('لا توجد مخالفات للتصدير ضمن الفلاتر الحالية.'); return; } setPdfOpen(true); }}>
              <FileDown className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => void handleExportExcel()}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </Button>
          </>
        )}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => setStatusFilter(v as StatusFilter)}
        statusOrder={STATUS_ORDER}
        statusLabels={STATUS_LABELS as unknown as Record<string, string>}
        statusCounts={statusCounts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDateBoundsChange={onDateBoundsChange}
        onDateFilterMetaChange={onDateFilterMetaChange}
      />
    ),
    [empPickerList, selectedEmpIds, statusFilter, statusCounts, viewMode, violationPdfRows, onDateBoundsChange, onDateFilterMetaChange],
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
    return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">{listError}</div>;
  }

  return (
    <div className="space-y-4">
      <PdfPreviewExportDialog open={pdfOpen} onOpenChange={setPdfOpen} title="معاينة تصدير سجل المخالفات" fileName="violation-cases.pdf" printable={printable} />

      {searchFiltered.length === 0 ? (
        <EmptyState title="لا توجد مخالفات مطابقة للبحث أو الموظفين المحددين." />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {dateMeta.tab === 'today'  ? 'لا توجد مخالفات بتاريخ اليوم ضمن النتائج الحالية.'
              : dateMeta.tab === 'week'  ? 'لا توجد مخالفات ضمن هذا الأسبوع ضمن النتائج الحالية.'
              : dateMeta.tab === 'month' ? 'لا توجد مخالفات ضمن هذا الشهر ضمن النتائج الحالية.'
              : dateMeta.tab === 'custom' && dateRangeActive ? 'لا توجد مخالفات ضمن نطاق التاريخ المخصص مع عوامل البحث الحالية.'
              : 'لا توجد مخالفات ضمن النتائج الحالية.'}
          </p>
          {dateRangeActive ? (
            <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetDateFilter()}>عرض كل الفترات</Button>
          ) : null}
        </div>
      ) : listFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            لا توجد مخالفات بحالة «{STATUS_LABELS[statusFilter as ViolationRecordStatus]}» مع عوامل البحث الحالية.
          </p>
          <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetStatusFilter()}>عرض الكل</Button>
        </div>
      ) : viewMode === 'cards' ? (
        /* ── Cards — identical outer shell to appeals ── */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listFiltered.map((c) => (
            <div key={c.id} className="flex flex-col space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft">
              {/* Row 1: case number + name | status badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold text-muted-foreground" dir="ltr">{c.caseNumber}</p>
                  <p className="mt-0.5 truncate font-semibold">{c.employeeNameAr}</p>
                </div>
                <span className={cn('inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium', STATUS_COLORS[c.status])}>
                  {STATUS_LABELS[c.status]}
                </span>
              </div>

              {/* Row 2: type chip + date chip */}
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground truncate max-w-[10rem]">
                  {c.typeNameAr}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground tabular-nums" dir="ltr">
                  <CalendarDays className="h-3 w-3 shrink-0" />{c.date}
                </span>
              </div>

              {/* Row 3: action buttons */}
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/60 bg-muted/20 p-1">
                <Button variant="ghost" size="sm" type="button"
                  className="h-8 gap-1 px-2 text-xs"
                  onClick={() => setViewCase(c)}>
                  <Eye className="h-3.5 w-3.5" /> عرض
                </Button>
                <Button variant="ghost" size="sm" type="button"
                  className="h-8 gap-1 px-2 text-xs text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
                  onClick={() => void handleApprove(c)}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> موافقة
                </Button>
                <Button variant="ghost" size="sm" type="button"
                  className="h-8 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => { setRejectNote(''); setRejectCase(c); }}>
                  <XCircle className="h-3.5 w-3.5" /> رفض
                </Button>
                <Button variant="ghost" size="sm" type="button"
                  className="h-8 gap-1 px-2 text-xs text-amber-700 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
                  onClick={() => openEdit(c)}>
                  <Edit3 className="h-3.5 w-3.5" /> تعديل
                </Button>
              </div>

              {/* Footer: delete */}
              <div className="mt-auto flex justify-end border-t border-border pt-3">
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Table ── */
        <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-right">
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">الرقم</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">الموظف</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">نوع المخالفة</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">التاريخ</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">الحالة</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {listFiltered.map((c) => (
                <tr key={c.id} className="border-b border-border/70 transition-colors hover:bg-muted/25">
                  <td className="p-3 font-mono text-xs font-medium tabular-nums text-muted-foreground" dir="ltr">{c.caseNumber}</td>
                  <td className="max-w-[10rem] truncate p-3 font-medium">{c.employeeNameAr}</td>
                  <td className="max-w-[9rem] truncate p-3 text-xs text-muted-foreground">{c.typeNameAr}</td>
                  <td className="whitespace-nowrap p-3 font-mono text-xs tabular-nums" dir="ltr">{c.date}</td>
                  <td className="p-3">
                    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium', STATUS_COLORS[c.status])}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" type="button" onClick={() => setViewCase(c)}>
                        <Eye className="h-3.5 w-3.5" /> عرض
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs text-emerald-700 hover:bg-emerald-500/10" type="button" onClick={() => void handleApprove(c)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> موافقة
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10" type="button" onClick={() => { setRejectNote(''); setRejectCase(c); }}>
                        <XCircle className="h-3.5 w-3.5" /> رفض
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs text-amber-700 hover:bg-amber-500/10" type="button" onClick={() => openEdit(c)}>
                        <Edit3 className="h-3.5 w-3.5" /> تعديل
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive" type="button" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Drawer ── */}
      <HRSettingsFormDrawer open={createOpen} onOpenChange={setCreateOpen} title="مخالفة جديدة" size="lg"
        onSave={() => void handleCreate()} saveDisabled={saving} error={formError}>
        <FormField label="الموظف" required>
          <SearchableDropdown value={draft.employeeId} onChange={v => setD({ employeeId: v })} options={empOptions} placeholder="اختر الموظف…" />
        </FormField>
        <FormField label="نوع المخالفة" required>
          <SearchableDropdown value={draft.violationTypeId} onChange={v => setD({ violationTypeId: v })} options={typeOptions} placeholder="اختر نوع المخالفة…" />
        </FormField>
        <FormField label="تاريخ المخالفة" required>
          <Input type="date" value={draft.date} onChange={e => setD({ date: e.target.value })} />
        </FormField>
        <FormField label="الوصف" required>
          <textarea value={draft.description} onChange={e => setD({ description: e.target.value })} placeholder="اكتب وصف المخالفة…"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="ملاحظات">
          <textarea value={draft.notes} onChange={e => setD({ notes: e.target.value })} placeholder="ملاحظات إضافية…"
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="ملاحظة المرفقات">
          <Input value={draft.attachmentsNote} onChange={e => setD({ attachmentsNote: e.target.value })} placeholder="وصف المستندات المرفقة…" />
        </FormField>
      </HRSettingsFormDrawer>

      {/* ── Edit Drawer ── */}
      <HRSettingsFormDrawer open={!!editCase} onOpenChange={v => !v && setEditCase(null)}
        title={`تعديل: ${editCase?.caseNumber ?? ''}`} size="lg"
        onSave={() => void handleEdit()} saveDisabled={editSaving} error={editError}>
        <FormField label="تاريخ المخالفة" required>
          <Input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
        </FormField>
        <FormField label="الوصف" required>
          <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف المخالفة…"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="ملاحظات">
          <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات إضافية…"
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="ملاحظة المرفقات">
          <Input value={editForm.attachmentsNote} onChange={e => setEditForm(f => ({ ...f, attachmentsNote: e.target.value }))} placeholder="وصف المستندات المرفقة…" />
        </FormField>
      </HRSettingsFormDrawer>

      {/* ── View Dialog ── */}
      <Dialog open={!!viewCase} onOpenChange={v => !v && setViewCase(null)}>
        <DialogContent className="sm:max-w-lg border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{viewCase?.caseNumber}</DialogTitle>
            <DialogDescription className="sr-only">تفاصيل المخالفة</DialogDescription>
          </DialogHeader>
          {viewCase && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground text-xs">الموظف</span><p className="font-medium">{viewCase.employeeNameAr}</p></div>
                <div><span className="text-muted-foreground text-xs">نوع المخالفة</span><p className="font-medium">{viewCase.typeNameAr}</p></div>
                <div><span className="text-muted-foreground text-xs">التاريخ</span><p>{viewCase.date}</p></div>
                <div>
                  <span className="text-muted-foreground text-xs">الحالة</span>
                  <p><span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', STATUS_COLORS[viewCase.status])}>{STATUS_LABELS[viewCase.status]}</span></p>
                </div>
              </div>
              <div><span className="text-muted-foreground text-xs">الوصف</span><p className="mt-1">{viewCase.description}</p></div>
              {viewCase.notes && <div><span className="text-muted-foreground text-xs">ملاحظات</span><p className="mt-1">{viewCase.notes}</p></div>}
              {viewCase.attachmentsNote && <div><span className="text-muted-foreground text-xs">المرفقات</span><p className="mt-1">{viewCase.attachmentsNote}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog open={!!rejectCase} onOpenChange={v => !v && setRejectCase(null)}>
        <DialogContent className="sm:max-w-sm border-border">
          <DialogHeader>
            <DialogTitle>رفض المخالفة {rejectCase?.caseNumber}</DialogTitle>
            <DialogDescription className="sr-only">أدخل سبب الرفض اختياريًا ثم أكّد.</DialogDescription>
          </DialogHeader>
          <Input value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="سبب الرفض (اختياري)…" />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectCase(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => void handleReject()}>تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            try { await deleteCase(deleteId); toast.success('تم الحذف'); } catch { toast.error('فشل الحذف'); }
            setDeleteId(null);
          }
        }}
        title="حذف المخالفة"
      />
    </div>
  );
}
