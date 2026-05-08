'use client';

import * as React from 'react';
import { Plus, RefreshCw, Search, FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { Separator } from '@/components/ui/separator';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';
import {
  MinimalDropdown, SearchableDropdown, ConfirmationModal, HRSettingsFormDrawer,
  FormField,
} from '@/components/hr-requests/shared-ui';
import {
  HRRequestTemplateFieldsForm,
  validateTemplateRequired,
  type HRRequestTemplateFieldsFormValues,
} from '@/features/hr/requests/shared/template-fields-form';
import { useHRConfigurationStore } from '@/lib/hr-requests/configuration-store';
import { useHRRequestSubmissionsStore } from '@/lib/hr-requests/submissions-store';
import { useHRApprovalAssignmentTemplatesStore } from '@/lib/hr-requests/approval-assignment-store';
import { useHREmployeeDirectoryStore } from '@/lib/hr-requests/employee-directory-store';
import type { HRRequestSubmissionRecord, HRRequestTemplateEntity } from '@/lib/hr-requests/types';
import {
  HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID,
  buildApprovalSnapshotFromTemplate,
  deriveSubmissionApprovalSummary,
  getDefaultHRRequestFormTemplate,
} from '@/lib/hr-requests/types';
import { matchesDateRange } from '@/lib/hr-discipline/discipline-date-filter';
import { cn, formatDateShort } from '@/lib/utils';
import { data } from '@/lib/data';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { GenericRegisterPdf } from '@/components/pdf/generic-register-pdf';
import { downloadXlsxFromAoA, type XlsxCell } from '@/lib/export/download-xlsx';
import {
  REQUEST_APPROVAL_TAB_ORDER,
  REQUEST_APPROVAL_TAB_LABELS,
  ACTING_REVIEWER_STORAGE,
} from '@/features/hr/requests/general/constants/general-requests-ui';
import {
  submissionCreatedYmd,
  submissionApprovalTab,
  formatFieldSummary,
} from '@/features/hr/requests/general/utils/general-request-submission-helpers';
import { GeneralRequestSubmissionCard } from '@/features/hr/requests/general/components/general-request-submission-card';
import { GeneralRequestViewDialog } from '@/features/hr/requests/general/components/general-request-view-dialog';

export function GeneralRequestsClient() {
  const { departments, requestTypes, templates, getTemplateById } = useHRConfigurationStore();
  const { submissions, addSubmission, deleteSubmission, patchSubmissionApprovalStage } = useHRRequestSubmissionsStore();
  const approvalTemplates = useHRApprovalAssignmentTemplatesStore(s => s.templates);
  const employees = useHREmployeeDirectoryStore(s => s.employees);
  const activeEmployees = React.useMemo(
    () => employees.filter((e) => e.status === 'active'),
    [employees],
  );

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

  const activeDeptsList = React.useMemo(
    () => departments.filter((d) => d.isActive),
    [departments],
  );
  const deptOptions = React.useMemo(
    () => [{ value: 'all', label: 'جميع الأقسام' }, ...activeDeptsList.map((d) => ({ value: d.id, label: d.nameAr }))],
    [activeDeptsList],
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
  const resolvedTemplate = React.useMemo(
    (): HRRequestTemplateEntity | undefined => getDefaultHRRequestFormTemplate(templates),
    [templates],
  );

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
      parts.push(`قسم: ${departments.find((d) => d.id === appliedDept)?.nameAr ?? appliedDept}`);
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
    departments,
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
      submissions,
      departments,
      employees,
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
            {filtered.map((r) => (
              <GeneralRequestSubmissionCard
                key={r.id}
                record={r}
                template={getTemplateById(r.templateId)}
                actingReviewerId={actingReviewerId}
                onOpenView={setViewRecord}
                onDelete={setDeleteId}
                onApprovalStage={handleApprovalStage}
              />
            ))}
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
              options={activeDeptsList.map((d) => ({ value: d.id, label: d.nameAr }))}
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
        {formTypeId && resolvedTemplate && (
          <>
            <Separator />
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">حقول الطلب:</p>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{resolvedTemplate.nameAr}</span>
            </div>
            <HRRequestTemplateFieldsForm template={resolvedTemplate} values={formValues} onChange={setFormValues} />
          </>
        )}
      </HRSettingsFormDrawer>

      <GeneralRequestViewDialog
        record={viewRecord}
        template={viewTemplate}
        actingReviewerId={actingReviewerId}
        onOpenChange={(v) => !v && setViewRecord(null)}
        onApprovalStage={handleApprovalStage}
      />

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
