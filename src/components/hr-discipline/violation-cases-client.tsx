'use client';

import * as React from 'react';
import {
  Plus, Eye, Trash2, Send, CheckCircle2, XCircle, Edit3, ShieldAlert, CalendarDays, User, FileDown, FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, SearchableDropdown,
} from '@/components/hr-requests/shared-ui';
import { useHRViolationCasesStore } from '@/lib/hr-discipline/violation-cases-store';
import { useHRViolationTypesStore } from '@/lib/hr-discipline/violation-types-store';
import { useHREmployeeDirectoryStore } from '@/lib/hr-requests/employee-directory-store';
import type { HRViolationCaseRecord, HRViolationCaseStatus, HRApproverRole } from '@/lib/hr-discipline/types';
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_COLORS,
  CASE_STATUS_FILTER_ORDER,
  CASE_MAIN_FLOW,
  caseMainFlowIndex,
} from '@/lib/hr-discipline/types';
import { cn, formatDate, formatTime } from '@/lib/utils';
import { data } from '@/lib/data';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { ViolationCasesRegisterPdf } from '@/components/pdf/violation-cases-register-pdf';
import type { DateFilterTab } from '@/lib/hr-discipline/discipline-date-filter';
import { matchesDateRange } from '@/lib/hr-discipline/discipline-date-filter';
import {
  DisciplineFilterToolbar,
  type DisciplineFilterToolbarHandle,
  type DisciplineViewMode,
} from '@/components/hr-discipline/discipline-filter-toolbar';
import { downloadXlsxFromAoA, type XlsxCell } from '@/lib/export/download-xlsx';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';

type StatusFilter = 'all' | HRViolationCaseStatus;

const APPROVER_LABEL_AR: Record<HRApproverRole, string> = {
  manager: 'المدير المباشر',
  hr: 'الموارد البشرية',
  executive: 'التنفيذي',
};

function CaseWorkflowStrip({ status }: { status: HRViolationCaseStatus }) {
  if (status === 'rejected') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
        <span className="font-semibold">مسار مرفوض:</span> انتهت المخالفة بالرفض وسجّل في سجل الاعتماد.
      </div>
    );
  }
  const currentIdx = caseMainFlowIndex(status);
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">مراحل مسار الطلب</p>
      <div className="flex flex-wrap items-center gap-1.5" dir="rtl">
        {CASE_MAIN_FLOW.map((step, i) => {
          const done = i <= currentIdx;
          const active = step === status;
          return (
            <span key={step} className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors',
                  done
                    ? 'border-primary/35 bg-primary/10 text-primary'
                    : 'border-border/80 bg-muted/25 text-muted-foreground',
                  active && 'ring-2 ring-primary/25 ring-offset-1 ring-offset-background',
                )}
              >
                {CASE_STATUS_LABELS[step]}
              </span>
              {i < CASE_MAIN_FLOW.length - 1 ? (
                <span className={cn('text-[10px]', done ? 'text-primary/50' : 'text-muted-foreground/40')}>←</span>
              ) : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}

interface DraftForm {
  employeeId: string; date: string; violationTypeId: string;
  description: string; notes: string; attachmentsNote: string;
}
const EMPTY: DraftForm = { employeeId: '', date: '', violationTypeId: '', description: '', notes: '', attachmentsNote: '' };

function isViolationCaseRecord(c: unknown): c is HRViolationCaseRecord {
  return (
    c != null &&
    typeof (c as HRViolationCaseRecord).id === 'string' &&
    typeof (c as HRViolationCaseRecord).caseNumber === 'string' &&
    typeof (c as HRViolationCaseRecord).employeeId === 'string'
  );
}

export function ViolationCasesClient() {
  const { cases, add, submit, remove, approve, reject, requestEdit } = useHRViolationCasesStore();
  const safeCases = React.useMemo(() => cases.filter(isViolationCaseRecord), [cases]);
  const { types } = useHRViolationTypesStore();
  const { activeEmployees } = useHREmployeeDirectoryStore();

  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());

  const empPickerList = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of safeCases) map.set(c.employeeId, c.employeeNameAr);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [safeCases]);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [viewCase, setViewCase] = React.useState<HRViolationCaseRecord | null>(null);
  const [rejectModal, setRejectModal] = React.useState<HRViolationCaseRecord | null>(null);
  const [rejectNote, setRejectNote] = React.useState('');
  const [editModal, setEditModal] = React.useState<HRViolationCaseRecord | null>(null);
  const [editNote, setEditNote] = React.useState('');
  const [viewMode, setViewMode] = React.useState<DisciplineViewMode>('cards');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [dateMeta, setDateMeta] = React.useState<{ tab: DateFilterTab; hasRestriction: boolean }>({
    tab: 'all',
    hasRestriction: false,
  });
  const filterToolbarRef = React.useRef<DisciplineFilterToolbarHandle>(null);
  const [pdfOpen, setPdfOpen] = React.useState(false);

  const onDateBoundsChange = React.useCallback((b: { from: string; to: string }) => {
    setDateBounds(b);
  }, []);

  const onDateFilterMetaChange = React.useCallback((m: { tab: DateFilterTab; hasRestriction: boolean }) => {
    setDateMeta(m);
  }, []);

  const handleApprove = (c: HRViolationCaseRecord) => {
    const role = c.requiredApprovers[c.currentApprovalIndex];
    if (!role) { toast.error('لا يوجد دور معتمد للمخالفة'); return; }
    const res = approve(c.id, role);
    if (res.ok) toast.success(`تمت الموافقة على ${c.caseNumber}`);
    else toast.error(res.error ?? 'خطأ');
  };

  const handleReject = () => {
    if (!rejectModal) return;
    const role = rejectModal.requiredApprovers[rejectModal.currentApprovalIndex];
    if (!role) { toast.error('لا يوجد دور معتمد للمخالفة'); return; }
    const res = reject(rejectModal.id, role, rejectNote);
    if (res.ok) toast.success('تم رفض المخالفة');
    else toast.error(res.error ?? 'خطأ');
    setRejectModal(null);
    setRejectNote('');
  };

  const handleRequestEdit = () => {
    if (!editModal) return;
    if (!editNote.trim()) { toast.error('ملاحظة التعديل مطلوبة'); return; }
    const role = editModal.requiredApprovers[editModal.currentApprovalIndex];
    if (!role) { toast.error('لا يوجد دور معتمد للمخالفة'); return; }
    const res = requestEdit(editModal.id, role, editNote);
    if (res.ok) toast.success('تم إرسال طلب التعديل');
    else toast.error(res.error ?? 'خطأ');
    setEditModal(null);
    setEditNote('');
  };

  const searchFiltered = React.useMemo(
    () =>
      safeCases.filter(
        (c) => selectedEmpIds.size === 0 || selectedEmpIds.has(c.employeeId),
      ),
    [safeCases, selectedEmpIds],
  );

  const filtered = React.useMemo(
    () => searchFiltered.filter((c) => matchesDateRange(c.date, dateBounds.from, dateBounds.to)),
    [searchFiltered, dateBounds.from, dateBounds.to],
  );

  const dateRangeActive = dateMeta.hasRestriction;

  const listFiltered = React.useMemo(
    () => filtered.filter((c) => statusFilter === 'all' || c.status === statusFilter),
    [filtered, statusFilter],
  );

  const violationPdfRows = React.useMemo(
    () =>
      listFiltered.map((c) => ({
        caseNumber: c.caseNumber,
        employeeNameAr: c.employeeNameAr,
        typeNameAr: c.typeNameAr,
        date: c.date,
        statusAr: CASE_STATUS_LABELS[c.status],
        description: c.description,
      })),
    [listFiltered],
  );

  const violationPdfDoc = React.useMemo(
    () =>
      violationPdfRows.length === 0 ? null : (
        <ViolationCasesRegisterPdf
          companyNameAr={data.company.name}
          companyNameEn={data.company.nameEn}
          titleAr="سجل مخالفات الموظفين"
          filterSummary={`الموظفون: ${selectedEmpIds.size === 0 ? 'الكل' : `${selectedEmpIds.size} محدد`} · الحالة: ${statusFilter === 'all' ? 'الكل' : CASE_STATUS_LABELS[statusFilter]} · التاريخ: ${dateBounds.from || dateBounds.to ? `${dateBounds.from || '…'} — ${dateBounds.to || '…'}` : 'كل الفترات'}`}
          rows={violationPdfRows}
        />
      ),
    [violationPdfRows, selectedEmpIds.size, statusFilter, dateBounds.from, dateBounds.to],
  );

  const violationPdfFileName = 'violation-cases.pdf';

  const handleExportViolationExcel = React.useCallback(async () => {
    if (listFiltered.length === 0) {
      toast.error('لا توجد مخالفات للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    const header: XlsxCell[] = ['رقم القضية', 'الموظف', 'نوع المخالفة', 'التاريخ', 'الحالة', 'الوصف'];
    const rows: XlsxCell[][] = [
      header,
      ...listFiltered.map((c) => [
        c.caseNumber,
        c.employeeNameAr,
        c.typeNameAr,
        c.date,
        CASE_STATUS_LABELS[c.status],
        c.description,
      ]),
    ];
    await downloadXlsxFromAoA('violation-cases.xlsx', 'المخالفات', rows);
    toast.success('تم تنزيل ملف Excel.');
  }, [listFiltered]);

  const statusCounts = React.useMemo(() => {
    const counts: Partial<Record<StatusFilter, number>> = { all: filtered.length };
    for (const s of CASE_STATUS_FILTER_ORDER) counts[s] = 0;
    for (const c of filtered) {
      counts[c.status] = (counts[c.status] ?? 0) + 1;
    }
    return counts as Record<StatusFilter, number>;
  }, [filtered]);

  const empOptions = activeEmployees.map(e => ({ value: e.id, label: e.nameAr, sub: e.jobTitleAr }));
  const typeOptions = types.filter(t => t.isActive).map(t => ({ value: t.id, label: t.nameAr, sub: t.code }));

  const set = (patch: Partial<DraftForm>) => setDraft(d => ({ ...d, ...patch }));

  const handleSave = (andSubmit: boolean) => {
    setFormError(null);
    if (!draft.employeeId) { setFormError('الموظف مطلوب'); return; }
    if (!draft.violationTypeId) { setFormError('نوع المخالفة مطلوب'); return; }
    if (!draft.date) { setFormError('التاريخ مطلوب'); return; }
    if (!draft.description.trim()) { setFormError('الوصف مطلوب'); return; }

    const vt = types.find(t => t.id === draft.violationTypeId)!;
    const emp = activeEmployees.find(e => e.id === draft.employeeId)!;

    const result = add({
      employeeId: emp.id,
      employeeNameAr: emp.nameAr,
      employeeNameEn: emp.nameAr,
      date: draft.date,
      description: draft.description,
      notes: draft.notes,
      attachmentsNote: draft.attachmentsNote,
      violationTypeId: vt.id,
      typeCode: vt.code,
      typeNameAr: vt.nameAr,
      typeHasDeduction: vt.hasDeduction,
      typeDeductionKind: vt.deductionKind,
      typeDeductionValue: vt.deductionValue,
      typeNeedsWarning: vt.needsWarning,
      typeNeedsInvestigation: vt.needsInvestigation,
      typeNeedsApproval: vt.needsApproval,
      approvalTemplateId: vt.approvalTemplateId,
    });

    if (!result.ok) { setFormError(result.error ?? 'خطأ'); return; }

    if (andSubmit && result.id) {
      submit(result.id);
    }

    toast.success(andSubmit ? 'تم حفظ المخالفة وتقديمها' : 'تم حفظ المسودة');
    setDrawerOpen(false);
    setDraft(EMPTY);
  };

  useEntityFilterSlot(
    () => (
      <DisciplineFilterToolbar
        ref={filterToolbarRef}
        primaryActionLabel="مخالفة جديدة"
        onPrimaryAction={() => { setDraft(EMPTY); setFormError(null); setDrawerOpen(true); }}
        toolbarExtraTrailing={(
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                if (violationPdfRows.length === 0) {
                  toast.error('لا توجد مخالفات للتصدير ضمن الفلاتر الحالية.');
                  return;
                }
                setPdfOpen(true);
              }}
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => void handleExportViolationExcel()}>
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
        statusOrder={CASE_STATUS_FILTER_ORDER}
        statusLabels={CASE_STATUS_LABELS as unknown as Record<string, string>}
        statusCounts={statusCounts as unknown as Record<string, number>}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDateBoundsChange={onDateBoundsChange}
        onDateFilterMetaChange={onDateFilterMetaChange}
      />
    ),
    [
      empPickerList,
      selectedEmpIds,
      statusFilter,
      statusCounts,
      viewMode,
      listFiltered,
      onDateBoundsChange,
      onDateFilterMetaChange,
    ],
  );

  return (
    <div className="space-y-4">
      <PdfPreviewExportDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        title="معاينة تصدير سجل المخالفات"
        fileName={violationPdfFileName}
        document={violationPdfDoc}
      />

      {searchFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <ShieldAlert className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا توجد مخالفات ضمن الموظفين المحددين.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <ShieldAlert className="mb-3 h-10 w-10 text-muted-foreground/25" />
          <p className="text-sm text-muted-foreground">
            {dateMeta.tab === 'today'
              ? 'لا توجد مخالفات بتاريخ اليوم ضمن النتائج الحالية.'
              : dateMeta.tab === 'week'
                ? 'لا توجد مخالفات ضمن هذا الأسبوع (الأحد–السبت) ضمن النتائج الحالية.'
                : dateMeta.tab === 'month'
                  ? 'لا توجد مخالفات ضمن هذا الشهر ضمن النتائج الحالية.'
                  : dateMeta.tab === 'custom' && dateRangeActive
                    ? 'لا توجد مخالفات ضمن نطاق التاريخ المخصص مع عوامل البحث الحالية.'
                    : 'لا توجد مخالفات ضمن النتائج الحالية.'}
          </p>
          {dateRangeActive ? (
            <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetDateFilter()}>
              عرض كل الفترات
            </Button>
          ) : null}
        </div>
      ) : listFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <ShieldAlert className="mb-3 h-10 w-10 text-muted-foreground/25" />
          <p className="text-sm text-muted-foreground">لا توجد مخالفات ضمن مرحلة «{statusFilter === 'all' ? '' : CASE_STATUS_LABELS[statusFilter]}» مع عوامل البحث الحالية.</p>
          <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetStatusFilter()}>
            عرض الكل
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listFiltered.map((c) => {
            const isUnderReview = c.status === 'under_review';
            const isDraft = c.status === 'draft';
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => setViewCase(c)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewCase(c); } }}
                className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring flex flex-col"
              >
                <div className={cn(
                  'absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-10',
                  isUnderReview ? 'bg-amber-500' : 'bg-primary',
                )} />
                <div className="relative p-5 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      isUnderReview ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-primary/10 text-primary',
                    )}>
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0',
                      CASE_STATUS_COLORS[c.status],
                    )}>
                      {CASE_STATUS_LABELS[c.status]}
                    </span>
                  </div>

                  {/* Case number + employee */}
                  <p className="font-mono text-[10px] font-bold text-muted-foreground/80 mb-0.5" dir="ltr">{c.caseNumber}</p>
                  <h3 className="font-display text-base font-bold leading-snug mb-3 group-hover:text-primary transition-colors truncate flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{c.employeeNameAr}</span>
                  </h3>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary truncate max-w-full">
                      {c.typeNameAr}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground" dir="ltr">
                      <CalendarDays className="h-2.5 w-2.5" />
                      {c.date}
                    </span>
                    {c.requiredApprovers.length > 1 && isUnderReview && (
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                        مرحلة {c.currentApprovalIndex + 1}/{c.requiredApprovers.length}
                      </span>
                    )}
                  </div>

                  {/* Description preview */}
                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{c.description}</p>
                  )}

                  {/* Approval action strip — only under_review */}
                  {isUnderReview && (
                    <div
                      className="grid grid-cols-3 gap-1 rounded-lg border border-amber-500/20 bg-amber-500/5 p-1 mb-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
                        onClick={() => handleApprove(c)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> موافقة
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-1 text-xs font-semibold text-red-700 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
                        onClick={() => { setRejectNote(''); setRejectModal(c); }}
                      >
                        <XCircle className="h-3.5 w-3.5" /> رفض
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-1 text-xs font-semibold text-amber-700 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
                        onClick={() => { setEditNote(''); setEditModal(c); }}
                      >
                        <Edit3 className="h-3.5 w-3.5" /> تعديل
                      </Button>
                    </div>
                  )}

                  {/* Footer */}
                  <div
                    className="mt-auto flex items-center gap-1 border-t border-border/60 pt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="sm" type="button" className="h-7 gap-1 px-2 text-xs flex-1" onClick={() => setViewCase(c)}>
                      <Eye className="h-3 w-3" /> عرض
                    </Button>
                    {isDraft && (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="h-7 gap-1 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                        onClick={() => { submit(c.id); toast.success('تم تقديم المخالفة'); }}
                      >
                        <Send className="h-3 w-3" /> تقديم
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(c.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-right">
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">الرقم</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">الموظف</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">نوع المخالفة</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">التاريخ</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">الحالة</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">مرحلة الاعتماد</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {listFiltered.map((c) => {
                const isUnderReview = c.status === 'under_review';
                const isDraft = c.status === 'draft';
                return (
                  <tr key={c.id} className="border-b border-border/70 transition-colors hover:bg-muted/25">
                    <td className="p-3 font-mono text-xs font-medium tabular-nums text-muted-foreground" dir="ltr">{c.caseNumber}</td>
                    <td className="max-w-[10rem] truncate p-3 font-medium">{c.employeeNameAr}</td>
                    <td className="max-w-[9rem] truncate p-3 text-xs text-muted-foreground">{c.typeNameAr}</td>
                    <td className="whitespace-nowrap p-3 font-mono text-xs tabular-nums" dir="ltr">{c.date}</td>
                    <td className="p-3">
                      <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium', CASE_STATUS_COLORS[c.status])}>
                        {CASE_STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {isUnderReview && c.requiredApprovers.length > 0
                        ? `${c.currentApprovalIndex + 1} / ${c.requiredApprovers.length}`
                        : '—'}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" type="button" onClick={() => setViewCase(c)}>
                          <Eye className="h-3.5 w-3.5" /> عرض
                        </Button>
                        {isDraft && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 px-2 text-xs text-blue-600 hover:bg-blue-500/10 hover:text-blue-700"
                            type="button"
                            onClick={() => { submit(c.id); toast.success('تم تقديم المخالفة'); }}
                          >
                            <Send className="h-3.5 w-3.5" /> تقديم
                          </Button>
                        )}
                        {isUnderReview && (
                          <>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs text-emerald-700 hover:bg-emerald-500/10" type="button" onClick={() => handleApprove(c)}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> موافقة
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs text-red-700 hover:bg-red-500/10" type="button" onClick={() => { setRejectNote(''); setRejectModal(c); }}>
                              <XCircle className="h-3.5 w-3.5" /> رفض
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs text-amber-700 hover:bg-amber-500/10" type="button" onClick={() => { setEditNote(''); setEditModal(c); }}>
                              <Edit3 className="h-3.5 w-3.5" /> تعديل
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive" type="button" onClick={() => setDeleteId(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Drawer */}
      <HRSettingsFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="مخالفة جديدة"
        size="lg"
        onSave={() => handleSave(false)}
        saveLabel="حفظ مسودة"
        error={formError}
      >
        <FormField label="الموظف" required>
          <SearchableDropdown value={draft.employeeId} onChange={v => set({ employeeId: v })} options={empOptions} placeholder="اختر الموظف…" />
        </FormField>
        <FormField label="نوع المخالفة" required>
          <SearchableDropdown value={draft.violationTypeId} onChange={v => set({ violationTypeId: v })} options={typeOptions} placeholder="اختر نوع المخالفة…" />
        </FormField>
        <FormField label="تاريخ المخالفة" required>
          <Input type="date" value={draft.date} onChange={e => set({ date: e.target.value })} />
        </FormField>
        <FormField label="الوصف" required>
          <textarea
            value={draft.description}
            onChange={e => set({ description: e.target.value })}
            placeholder="اكتب وصف المخالفة…"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </FormField>
        <FormField label="ملاحظات">
          <textarea
            value={draft.notes}
            onChange={e => set({ notes: e.target.value })}
            placeholder="ملاحظات إضافية…"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </FormField>
        <FormField label="ملاحظة المرفقات">
          <Input value={draft.attachmentsNote} onChange={e => set({ attachmentsNote: e.target.value })} placeholder="وصف المستندات المرفقة…" />
        </FormField>

      </HRSettingsFormDrawer>

      <Dialog open={!!viewCase} onOpenChange={v => !v && setViewCase(null)}>
        <DialogContent className="sm:max-w-lg border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{viewCase?.caseNumber}</DialogTitle>
            <DialogDescription className="sr-only">تفاصيل المخالفة والموظف وحالة المسار.</DialogDescription>
          </DialogHeader>
          {viewCase && (
            <div className="space-y-4 text-sm">
              <CaseWorkflowStrip status={viewCase.status} />
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground text-xs">الموظف</span><p className="font-medium">{viewCase.employeeNameAr}</p></div>
                <div><span className="text-muted-foreground text-xs">نوع المخالفة</span><p className="font-medium">{viewCase.typeNameAr}</p></div>
                <div><span className="text-muted-foreground text-xs">التاريخ</span><p>{viewCase.date}</p></div>
                <div>
                  <span className="text-muted-foreground text-xs">الحالة الحالية</span>
                  <p><span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', CASE_STATUS_COLORS[viewCase.status])}>{CASE_STATUS_LABELS[viewCase.status]}</span></p>
                </div>
              </div>
              {viewCase.status === 'under_review' && viewCase.requiredApprovers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  مرحلة الاعتماد الحالية: <span className="font-mono font-semibold text-foreground">{viewCase.currentApprovalIndex + 1}</span> من{' '}
                  <span className="font-mono font-semibold text-foreground">{viewCase.requiredApprovers.length}</span>
                  {' '}({viewCase.requiredApprovers.map((r) => APPROVER_LABEL_AR[r]).join(' ← ')})
                </p>
              )}
              <div><span className="text-muted-foreground text-xs">الوصف</span><p className="mt-1">{viewCase.description}</p></div>
              {viewCase.notes && <div><span className="text-muted-foreground text-xs">ملاحظات</span><p className="mt-1">{viewCase.notes}</p></div>}
              {viewCase.approvalLog.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">سجل الاعتماد</p>
                  <div className="space-y-2">
                    {viewCase.approvalLog.map((entry, i) => (
                      <div key={i} className="rounded-lg border border-border p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{entry.role}</span>
                          <span className={cn('font-medium', entry.action === 'approved' ? 'text-emerald-600' : entry.action === 'rejected' ? 'text-red-600' : 'text-amber-600')}>{entry.action === 'approved' ? 'معتمد' : entry.action === 'rejected' ? 'مرفوض' : 'طلب تعديل'}</span>
                        </div>
                        {entry.note && <p className="mt-1 text-muted-foreground">{entry.note}</p>}
                        <p className="mt-1 text-muted-foreground">
                          {formatDate(entry.at)} · {formatTime(entry.at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        onConfirm={() => { if (deleteId) { remove(deleteId); toast.success('تم الحذف'); setDeleteId(null); } }}
        title="حذف المخالفة"
      />

      {/* Reject Modal */}
      <Dialog open={!!rejectModal} onOpenChange={v => !v && setRejectModal(null)}>
        <DialogContent className="sm:max-w-sm border-border">
          <DialogHeader>
            <DialogTitle>رفض المخالفة {rejectModal?.caseNumber}</DialogTitle>
            <DialogDescription className="sr-only">أدخل سبب الرفض اختياريًا ثم أكّد.</DialogDescription>
          </DialogHeader>
          <Input value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="سبب الرفض (اختياري)…" />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectModal(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleReject}>تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Edit Modal */}
      <Dialog open={!!editModal} onOpenChange={v => !v && setEditModal(null)}>
        <DialogContent className="sm:max-w-sm border-border">
          <DialogHeader>
            <DialogTitle>طلب تعديل {editModal?.caseNumber}</DialogTitle>
            <DialogDescription className="sr-only">صف الملاحظات المطلوبة للتعديل ثم أرسل الطلب.</DialogDescription>
          </DialogHeader>
          <Input value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="ملاحظة التعديل المطلوب…" />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditModal(null)}>إلغاء</Button>
            <Button onClick={handleRequestEdit}>إرسال الطلب</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
