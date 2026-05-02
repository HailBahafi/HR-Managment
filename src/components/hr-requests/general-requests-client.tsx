'use client';

import * as React from 'react';
import { Eye, Trash2, Plus, RefreshCw, Search, Check, X, FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { Separator } from '@/components/ui/separator';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  MinimalDropdown, SearchableDropdown, ConfirmationModal, HRSettingsFormDrawer,
  FormField,
} from './shared-ui';
import { HRRequestTemplateFieldsForm, validateTemplateRequired } from './template-fields-form';
import type { HRRequestTemplateFieldsFormValues } from './template-fields-form';
import { useHRConfigurationStore } from '@/lib/hr-requests/configuration-store';
import { useHRRequestSubmissionsStore } from '@/lib/hr-requests/submissions-store';
import { useHRApprovalAssignmentTemplatesStore } from '@/lib/hr-requests/approval-assignment-store';
import { useHREmployeeDirectoryStore } from '@/lib/hr-requests/employee-directory-store';
import type { HRRequestSubmissionRecord, HRRequestTemplateEntity } from '@/lib/hr-requests/types';
import {
  HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID,
  buildApprovalSnapshotFromTemplate,
  deriveSubmissionApprovalSummary,
  approvalStageModeLabelAr,
  approvalStageStateLabelAr,
  getPerStageApprovalUi,
} from '@/lib/hr-requests/types';
import { matchesDateRange } from '@/lib/hr-discipline/discipline-date-filter';
import { cn, formatDateShort } from '@/lib/utils';
import { data } from '@/lib/data';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { GenericRegisterPdf } from '@/components/pdf/generic-register-pdf';
import { downloadXlsxFromAoA, type XlsxCell } from '@/lib/export/download-xlsx';

const REQUEST_APPROVAL_TAB_ORDER = ['in_progress', 'approved', 'rejected', 'no_approval'] as const;

const REQUEST_APPROVAL_TAB_LABELS: Record<string, string> = {
  in_progress: 'قيد الموافقة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  no_approval: 'بدون مسار موافقات',
};

function submissionCreatedYmd(s: HRRequestSubmissionRecord): string {
  const raw = s.createdAt;
  if (typeof raw === 'string' && raw.length >= 10) return raw.slice(0, 10);
  try {
    return new Date(raw as string).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function submissionApprovalTab(s: HRRequestSubmissionRecord): (typeof REQUEST_APPROVAL_TAB_ORDER)[number] {
  const ap = s.approvalSnapshot;
  if (!ap?.stages?.length) return 'no_approval';
  const sum = deriveSubmissionApprovalSummary(ap);
  if (!sum) return 'no_approval';
  return sum.overall;
}

function formatFieldSummary(record: HRRequestSubmissionRecord, template: HRRequestTemplateEntity | undefined): string {
  if (!template) return '—';
  const sorted = [...template.formFields].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 2);
  return sorted.map(f => {
    const v = record.fieldValues[f.id];
    if (v === undefined || v === null || v === '') return null;
    if (typeof v === 'boolean') return `${f.labelAr}: ${v ? 'نعم' : 'لا'}`;
    if (typeof v === 'object') return `${f.labelAr}: ${JSON.stringify(v).slice(0, 30)}`;
    return `${f.labelAr}: ${String(v).slice(0, 40)}`;
  }).filter(Boolean).join(' · ') || '—';
}

const ACTING_REVIEWER_STORAGE = 'hr-requests-acting-reviewer-id';

export function GeneralRequestsClient() {
  const { departments, requestTypes, templates, getTemplateById } = useHRConfigurationStore();
  const { submissions, addSubmission, deleteSubmission, patchSubmissionApprovalStage } = useHRRequestSubmissionsStore();
  const approvalTemplates = useHRApprovalAssignmentTemplatesStore(s => s.templates);
  const { activeEmployees } = useHREmployeeDirectoryStore();

  const [actingReviewerId, setActingReviewerId] = React.useState('');
  React.useEffect(() => {
    if (typeof window === 'undefined' || activeEmployees.length === 0) return;
    const saved = localStorage.getItem(ACTING_REVIEWER_STORAGE);
    if (saved && activeEmployees.some(e => e.id === saved)) setActingReviewerId(saved);
    else setActingReviewerId(activeEmployees[0]!.id);
  }, [activeEmployees]);
  React.useEffect(() => {
    if (actingReviewerId && typeof window !== 'undefined') {
      localStorage.setItem(ACTING_REVIEWER_STORAGE, actingReviewerId);
    }
  }, [actingReviewerId]);

  const [refreshing, setRefreshing] = React.useState(false);

  // Drawer / modals
  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [viewRecord, setViewRecord] = React.useState<HRRequestSubmissionRecord | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Create form state
  const [formDeptId, setFormDeptId] = React.useState('');
  const [formTypeId, setFormTypeId] = React.useState('');
  const [formEmpId, setFormEmpId] = React.useState('');
  const [formValues, setFormValues] = React.useState<HRRequestTemplateFieldsFormValues>({});
  const [formApprovalTemplateId, setFormApprovalTemplateId] = React.useState('');

  const activeApprovalTemplates = React.useMemo(
    () => approvalTemplates.filter(t => t.isActive).sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar')),
    [approvalTemplates],
  );

  // Derived
  const activeDepts = departments.filter(d => d.isActive);
  const deptOptions = React.useMemo(
    () => [{ value: 'all', label: 'جميع الأقسام' }, ...activeDepts.map((d) => ({ value: d.id, label: d.nameAr }))],
    [activeDepts],
  );
  const empOptions = React.useMemo(
    () => activeEmployees.map((e) => ({ value: e.id, label: e.nameAr, sub: e.jobTitleAr })),
    [activeEmployees],
  );

  const [appliedDept, setAppliedDept] = React.useState('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [approvalStatusFilter, setApprovalStatusFilter] = React.useState<string>('all');

  const empPickerList = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const s of submissions) map.set(s.employeeId, s.employeeNameAr);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [submissions]);

  const formDeptTypes = requestTypes.filter(rt =>
    rt.isActive && (rt.departmentId === HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID || rt.departmentId === formDeptId)
  ).sort((a, b) => a.sortOrder - b.sortOrder);

  const selectedRt = requestTypes.find(rt => rt.id === formTypeId);
  const resolvedTemplate = React.useMemo((): HRRequestTemplateEntity | undefined => {
    if (!selectedRt) return undefined;
    return getTemplateById(selectedRt.templateId)
      ?? templates.find(t => t.isUniversalDefault)
      ?? templates[0];
  }, [selectedRt, templates, getTemplateById]);

  const narrowedForStatusCounts = React.useMemo(() => {
    return submissions.filter((s) => {
      if (appliedDept !== 'all' && s.departmentId !== appliedDept) return false;
      if (selectedEmpIds.size > 0 && !selectedEmpIds.has(s.employeeId)) return false;
      const ymd = submissionCreatedYmd(s);
      if (!matchesDateRange(ymd, dateBounds.from, dateBounds.to)) return false;
      return true;
    });
  }, [submissions, appliedDept, selectedEmpIds, dateBounds.from, dateBounds.to]);

  const approvalStatusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: narrowedForStatusCounts.length,
      in_progress: 0,
      approved: 0,
      rejected: 0,
      no_approval: 0,
    };
    for (const s of narrowedForStatusCounts) {
      counts[submissionApprovalTab(s)] += 1;
    }
    return counts;
  }, [narrowedForStatusCounts]);

  const filtered = React.useMemo(() => {
    if (approvalStatusFilter === 'all') return narrowedForStatusCounts;
    return narrowedForStatusCounts.filter((s) => submissionApprovalTab(s) === approvalStatusFilter);
  }, [narrowedForStatusCounts, approvalStatusFilter]);

  const generalFilterSummary = React.useMemo(() => {
    const parts: string[] = [];
    if (appliedDept !== 'all') {
      parts.push(`قسم: ${activeDepts.find((d) => d.id === appliedDept)?.nameAr ?? appliedDept}`);
    }
    parts.push(selectedEmpIds.size === 0 ? 'جدول الموظفين: الكل' : `جدول الموظفين: ${selectedEmpIds.size} محدد`);
    if (dateBounds.from || dateBounds.to) {
      parts.push(`التاريخ: ${dateBounds.from || '…'} — ${dateBounds.to || '…'}`);
    }
    parts.push(
      `الموافقات: ${approvalStatusFilter === 'all' ? 'الكل' : (REQUEST_APPROVAL_TAB_LABELS[approvalStatusFilter] ?? approvalStatusFilter)}`,
    );
    return parts.join(' · ');
  }, [
    appliedDept,
    selectedEmpIds.size,
    dateBounds.from,
    dateBounds.to,
    approvalStatusFilter,
    activeDepts,
  ]);

  const generalPdfRows = React.useMemo(
    () =>
      filtered.map((r) => {
        const tpl = getTemplateById(r.templateId);
        const apSum = deriveSubmissionApprovalSummary(r.approvalSnapshot);
        return [
          r.employeeNameAr,
          r.departmentNameAr,
          r.requestTypeNameAr,
          formatFieldSummary(r, tpl),
          apSum?.labelAr ?? '—',
          formatDateShort(r.createdAt),
        ];
      }),
    [filtered, getTemplateById],
  );

  const generalPdfDoc = React.useMemo(
    () =>
      generalPdfRows.length === 0 ? null : (
        <GenericRegisterPdf
          companyNameAr={data.company.name}
          companyNameEn={data.company.nameEn}
          titleAr="طلبات الموارد البشرية العامة"
          filterSummary={generalFilterSummary}
          headers={['الموظف', 'القسم', 'نوع الطلب', 'ملخص الحقول', 'حالة الموافقة', 'تاريخ الإنشاء']}
          rows={generalPdfRows}
          landscape
        />
      ),
    [generalPdfRows, generalFilterSummary],
  );

  const handleExportGeneralExcel = React.useCallback(async () => {
    if (filtered.length === 0) {
      toast.error('لا توجد طلبات للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    const header: XlsxCell[] = ['الموظف', 'القسم', 'نوع الطلب', 'ملخص الحقول', 'حالة الموافقة', 'تاريخ الإنشاء'];
    const rows: XlsxCell[][] = [header, ...generalPdfRows.map((r) => [...r])];
    await downloadXlsxFromAoA('hr-general-requests.xlsx', 'الطلبات', rows);
    toast.success('تم تنزيل ملف Excel.');
  }, [filtered.length, generalPdfRows]);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const resetCreate = () => {
    setFormDeptId('');
    setFormTypeId('');
    setFormEmpId('');
    setFormValues({});
    setFormApprovalTemplateId('');
    setCreateError(null);
  };

  const pickDefaultApprovalTemplateId = React.useCallback((typeId: string) => {
    const rt = requestTypes.find(r => r.id === typeId);
    const activeAa = approvalTemplates.filter(t => t.isActive);
    const pref = rt?.approvalAssignmentTemplateId;
    if (pref && activeAa.some(t => t.id === pref)) return pref;
    return activeAa[0]?.id ?? '';
  }, [requestTypes, approvalTemplates]);

  const handleSave = () => {
    if (!formEmpId) { setCreateError('يرجى اختيار موظف'); return; }
    if (!formDeptId) { setCreateError('يرجى اختيار القسم'); return; }
    if (!formTypeId) { setCreateError('يرجى اختيار نوع الطلب'); return; }
    if (resolvedTemplate) {
      const err = validateTemplateRequired(resolvedTemplate.formFields, formValues);
      if (err) { setCreateError(err); return; }
    }
    const dept = departments.find(d => d.id === formDeptId);
    const rt = requestTypes.find(r => r.id === formTypeId);
    const emp = activeEmployees.find(e => e.id === formEmpId);
    if (!dept || !rt || !emp) return;
    const resolveName = (employeeId: string) =>
      activeEmployees.find(e => e.id === employeeId)?.nameAr ?? employeeId;
    const aaTpl = approvalTemplates.find(t => t.id === formApprovalTemplateId && t.isActive);
    const approvalSnapshot =
      aaTpl && aaTpl.stages.length > 0
        ? buildApprovalSnapshotFromTemplate(
            aaTpl,
            resolveName,
            Array.from({ length: aaTpl.stages.length }, () => 'pending' as const),
          )
        : null;
    addSubmission({
      employeeId: emp.id, employeeNameAr: emp.nameAr, employeeNameEn: emp.nameAr,
      requestTypeId: rt.id, requestTypeNameAr: rt.nameAr, requestTypeNameEn: rt.nameAr,
      departmentId: dept.id, departmentNameAr: dept.nameAr, departmentNameEn: dept.nameAr,
      templateId: resolvedTemplate?.id ?? null,
      fieldValues: formValues,
      approvalSnapshot,
    });
    setCreateOpen(false);
    resetCreate();
  };

  const viewTemplate = viewRecord ? getTemplateById(viewRecord.templateId) : undefined;

  const syncViewRecordAfterPatch = React.useCallback((submissionId: string) => {
    const next = useHRRequestSubmissionsStore.getState().submissions.find(s => s.id === submissionId);
    setViewRecord(prev => (prev?.id === submissionId && next ? next : prev));
  }, []);

  const handleApprovalStage = React.useCallback(
    (submissionId: string, stageIndex: number, state: 'approved' | 'rejected') => {
      patchSubmissionApprovalStage(submissionId, stageIndex, state);
      syncViewRecordAfterPatch(submissionId);
    },
    [patchSubmissionApprovalStage, syncViewRecordAfterPatch],
  );

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        inlineSelects={[
          {
            id: 'dept',
            value: appliedDept,
            onChange: setAppliedDept,
            placeholder: 'القسم',
            options: deptOptions,
          },
        ]}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={approvalStatusFilter}
        onStatusFilterChange={setApprovalStatusFilter}
        statusOrder={REQUEST_APPROVAL_TAB_ORDER}
        statusLabels={REQUEST_APPROVAL_TAB_LABELS}
        statusCounts={approvalStatusCounts}
        onDateBoundsChange={setDateBounds}
        beforeEmployeePicker={activeEmployees.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">موافق كـ:</span>
            <MinimalDropdown
              value={actingReviewerId}
              onChange={setActingReviewerId}
              options={activeEmployees.map((e) => ({ value: e.id, label: e.nameAr }))}
              placeholder="المعتمد"
            />
          </div>
        ) : undefined}
        trailingActions={(
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => {
                if (!generalPdfDoc) {
                  toast.error('لا توجد طلبات للتصدير ضمن الفلاتر الحالية.');
                  return;
                }
                setPdfOpen(true);
              }}
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => void handleExportGeneralExcel()}>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} /> تحديث
            </Button>
            <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={() => { resetCreate(); setCreateOpen(true); }}>
              <Plus className="h-4 w-4" /> طلب جديد
            </Button>
          </>
        )}
      />
    ),
    [
      appliedDept,
      actingReviewerId,
      approvalStatusFilter,
      selectedEmpKey,
      dateBounds.from,
      dateBounds.to,
      approvalStatusCounts.all,
      approvalStatusCounts.in_progress,
      approvalStatusCounts.approved,
      approvalStatusCounts.rejected,
      approvalStatusCounts.no_approval,
      generalPdfRows.length,
      generalFilterSummary,
      handleExportGeneralExcel,
      refreshing,
      empPickerList,
      deptOptions,
      activeEmployees,
    ],
  );

  return (
    <div className="space-y-4">
      <PdfPreviewExportDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        title="معاينة تصدير الطلبات العامة"
        fileName="hr-general-requests.pdf"
        document={generalPdfDoc}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا توجد طلبات. جرّب تعديل الفلاتر أو أضف طلباً جديداً</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(r => {
              const tpl = getTemplateById(r.templateId);
              const initial = r.employeeNameAr.charAt(0);
              const apSum = deriveSubmissionApprovalSummary(r.approvalSnapshot);
              const perStageUi = getPerStageApprovalUi(r.approvalSnapshot, actingReviewerId || undefined);
              const actionRows = perStageUi.filter(p => p.showActionRow);
              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col cursor-pointer"
                  onClick={() => setViewRecord(r)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{r.employeeNameAr}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{r.departmentNameAr}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                      {r.requestTypeNameAr}
                    </span>
                    {formatFieldSummary(r, tpl) !== '—' && (
                      <span className="text-[11px] text-muted-foreground line-clamp-1">{formatFieldSummary(r, tpl)}</span>
                    )}
                  </div>
                  {apSum && (
                    <div className="rounded-lg border border-border/60 bg-muted/25 px-2.5 py-2 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'text-[10px] font-semibold',
                            apSum.overall === 'approved' && 'text-emerald-700 dark:text-emerald-400',
                            apSum.overall === 'rejected' && 'text-destructive',
                            apSum.overall === 'in_progress' && 'text-primary',
                          )}
                        >
                          {apSum.labelAr}
                        </span>
                        {apSum.totalStages > 0 && (
                          <span
                            className="shrink-0 text-[10px] text-muted-foreground tabular-nums"
                            title="مراحل معتمدة / إجمالي المراحل"
                          >
                            {apSum.approvedStagesCount}/{apSum.totalStages}
                          </span>
                        )}
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full transition-[width]',
                            apSum.overall === 'approved' && 'bg-emerald-600',
                            apSum.overall === 'rejected' && 'bg-destructive',
                            apSum.overall === 'in_progress' && 'bg-primary',
                          )}
                          style={{
                            width: apSum.totalStages > 0
                              ? `${Math.min(
                                100,
                                apSum.overall === 'rejected'
                                  ? 100
                                  : Math.round((apSum.approvedStagesCount / apSum.totalStages) * 100),
                              )}%`
                              : '0%',
                          }}
                        />
                      </div>
                      {apSum.detailAr ? (
                        <p className="text-[10px] text-muted-foreground line-clamp-3 leading-snug">{apSum.detailAr}</p>
                      ) : null}
                    </div>
                  )}
                  {actionRows.length > 0 && (
                    <div className="space-y-2" onClick={e => e.stopPropagation()}>
                      {actionRows.map(row => (
                        <div key={row.stageIndex} className="space-y-1">
                          {r.approvalSnapshot && r.approvalSnapshot.stages.length >= 2 && (
                            <p className="text-[10px] font-medium text-muted-foreground">
                              الموافقة {row.stageIndex + 1} من {r.approvalSnapshot.stages.length}
                            </p>
                          )}
                          {row.state === 'approved' && (
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400">تمت الموافقة على هذه المرحلة</p>
                          )}
                          {row.state === 'rejected' && (
                            <p className="text-[10px] text-destructive">مرفوضة هذه المرحلة</p>
                          )}
                          {row.state === 'pending' && row.disabledHintAr && !row.canAct && (
                            <p className="text-[10px] text-muted-foreground leading-snug">{row.disabledHintAr}</p>
                          )}
                          {row.state === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!row.canAct}
                                className="h-8 flex-1 gap-1 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-40"
                                onClick={() => row.canAct && handleApprovalStage(r.id, row.stageIndex, 'approved')}
                              >
                                <Check className="h-3.5 w-3.5" /> موافقة
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!row.canAct}
                                className="h-8 flex-1 gap-1 border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                                onClick={() => row.canAct && handleApprovalStage(r.id, row.stageIndex, 'rejected')}
                              >
                                <X className="h-3.5 w-3.5" /> رفض
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {formatDateShort(r.createdAt)}
                  </p>
                  <div className="mt-auto flex gap-1 border-t border-border pt-3" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="gap-1.5 flex-1" onClick={() => setViewRecord(r)}>
                      <Eye className="h-3.5 w-3.5" /> عرض
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create drawer */}
      <HRSettingsFormDrawer
        open={createOpen}
        onOpenChange={v => { setCreateOpen(v); if (!v) resetCreate(); }}
        title="إنشاء طلب جديد"
        description="اختر القسم ونوع الطلب ثم أدخل بيانات النموذج"
        onSave={handleSave}
        saveLabel="إرسال الطلب"
        error={createError}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="القسم" required>
            <MinimalDropdown
              value={formDeptId}
              onChange={(v) => {
                setFormDeptId(v);
                setFormTypeId('');
                setFormValues({});
                setFormApprovalTemplateId('');
              }}
              options={activeDepts.map(d => ({ value: d.id, label: d.nameAr }))}
              placeholder="اختر القسم"
            />
          </FormField>
          <FormField label="نوع الطلب" required>
            <MinimalDropdown
              value={formTypeId}
              onChange={(v) => {
                setFormTypeId(v);
                setFormValues({});
                setFormApprovalTemplateId(pickDefaultApprovalTemplateId(v));
              }}
              options={formDeptTypes.map(rt => ({ value: rt.id, label: rt.nameAr }))}
              placeholder={formDeptId ? (formDeptTypes.length ? 'اختر النوع' : 'لا توجد أنواع') : 'اختر القسم أولاً'}
              disabled={!formDeptId || formDeptTypes.length === 0}
            />
          </FormField>
          <FormField label="قالب إسناد الموافقات" span2>
            <MinimalDropdown
              value={formApprovalTemplateId}
              onChange={setFormApprovalTemplateId}
              options={activeApprovalTemplates.map(t => ({ value: t.id, label: t.nameAr }))}
              placeholder={formTypeId ? (activeApprovalTemplates.length ? 'اختر القالب' : 'لا توجد قوالب نشطة') : 'اختر نوع الطلب أولاً'}
              disabled={!formTypeId || activeApprovalTemplates.length === 0}
            />
          </FormField>
          <FormField label="الموظف" required span2>
            <SearchableDropdown value={formEmpId} onChange={setFormEmpId} options={empOptions} placeholder="ابحث عن موظف…" />
          </FormField>
        </div>
        {resolvedTemplate && (
          <>
            <Separator />
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">القالب المستخدم:</p>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{resolvedTemplate.nameAr}</span>
            </div>
            <HRRequestTemplateFieldsForm template={resolvedTemplate} values={formValues} onChange={setFormValues} />
          </>
        )}
      </HRSettingsFormDrawer>

      {/* View modal */}
      <Dialog open={!!viewRecord} onOpenChange={v => !v && setViewRecord(null)}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border-border p-0">
          <div className="shrink-0 border-b border-border px-6 py-5">
            <DialogHeader>
              <DialogTitle>{viewRecord?.requestTypeNameAr}</DialogTitle>
              <DialogDescription>
                {viewRecord?.employeeNameAr} · {viewRecord?.departmentNameAr}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {viewRecord?.approvalSnapshot && viewRecord.approvalSnapshot.stages.length > 0 && (() => {
              const vPer = getPerStageApprovalUi(viewRecord.approvalSnapshot, actingReviewerId || undefined);
              return (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">مسار الموافقات</p>
                <p className="text-[11px] text-muted-foreground">{viewRecord.approvalSnapshot.assignmentTemplateNameAr}</p>
                <ul className="space-y-2">
                  {viewRecord.approvalSnapshot.stages.map((st, idx) => {
                    const stateLabel = approvalStageStateLabelAr(st.state);
                    const rowUi = vPer[idx];
                    return (
                      <li
                        key={st.stageId}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-sm',
                          st.state === 'approved' && 'border-emerald-500/30 bg-emerald-500/5',
                          st.state === 'rejected' && 'border-destructive/40 bg-destructive/5',
                          st.state === 'pending' && 'border-border bg-muted/30',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">المرحلة {idx + 1}</span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              st.state === 'approved' && 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
                              st.state === 'rejected' && 'bg-destructive/15 text-destructive',
                              st.state === 'pending' && 'bg-muted text-muted-foreground',
                            )}
                          >
                            {stateLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{st.approverNamesAr.join('، ') || '—'}</p>
                        <p className="text-[9px] text-muted-foreground/80 mt-0.5">
                          نوع المرحلة: {approvalStageModeLabelAr(st.mode)}
                        </p>
                        {rowUi?.showActionRow && st.state === 'pending' && rowUi.disabledHintAr && !rowUi.canAct && (
                          <p className="mt-1.5 text-[10px] text-muted-foreground leading-snug">{rowUi.disabledHintAr}</p>
                        )}
                        {rowUi?.showActionRow && st.state === 'pending' && viewRecord && (
                          <div className="mt-2 flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={!rowUi.canAct}
                              className="h-8 flex-1 gap-1 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-40"
                              onClick={() => rowUi.canAct && handleApprovalStage(viewRecord.id, idx, 'approved')}
                            >
                              <Check className="h-3.5 w-3.5" /> موافقة
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={!rowUi.canAct}
                              className="h-8 flex-1 gap-1 border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                              onClick={() => rowUi.canAct && handleApprovalStage(viewRecord.id, idx, 'rejected')}
                            >
                              <X className="h-3.5 w-3.5" /> رفض
                            </Button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
              );
            })()}
            {viewRecord && (() => {
              const fields = viewTemplate?.formFields ?? [];
              const sorted = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);
              if (sorted.length === 0) return <p className="text-sm text-muted-foreground">لا توجد حقول</p>;
              return (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">بيانات النموذج</p>
                  {sorted.map(f => {
                    const v = viewRecord.fieldValues[f.id];
                    const display = v === undefined || v === null ? '—' : typeof v === 'boolean' ? (v ? 'نعم' : 'لا') : Array.isArray(v) ? (v as string[]).join('، ') : String(v);
                    return (
                      <div key={f.id} className="flex flex-col gap-0.5 rounded-lg bg-muted/30 px-3 py-2.5">
                        <p className="text-[11px] font-medium text-muted-foreground">{f.labelAr}</p>
                        <p className="text-sm font-medium">{display || '—'}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        title="حذف الطلب"
        description="سيتم حذف هذا الطلب نهائياً ولا يمكن التراجع."
        onConfirm={() => { if (deleteId) deleteSubmission(deleteId); setDeleteId(null); }}
      />
    </div>
  );
}
