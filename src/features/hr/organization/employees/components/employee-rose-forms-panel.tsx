'use client';

import * as React from 'react';
import { FileStack, Plus, Pencil, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn, formatDateShort } from '@/shared/utils';
import { useEmployeeRoseFormsStore } from '@/features/hr/organization/employees/lib/employee-rose-forms/store';
import {
  ROSE_FORM_TAB_LABELS,
  ROSE_TRADING_COMPANY_AR_DEFAULT,
  type RoseClearanceRecord,
  type RoseExperienceRecord,
  type RoseResignationRecord,
  type RoseSettlementRecord,
  type RoseTradingFormTab,
} from '@/features/hr/organization/employees/lib/employee-rose-forms/types';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { RoseClearanceRecordPrintHtml } from '@/components/pdf/rose-trading/rose-clearance-record-print-html';
import {
  RoseExperienceRecordPrintHtml,
  RoseResignationRecordPrintHtml,
  RoseSettlementRecordPrintHtml,
  type RoseFormPdfEmployee,
} from '@/components/pdf/rose-trading/rose-forms-records-print-html';
import { ConfirmationModal } from '@/features/hr/requests/components/shared-ui';
import { appendEmployeeAudit } from '@/features/hr/organization/employees/lib/employee-audit-log/append';
import { diffRoseRecordAudit, roseTabToScope } from '@/features/hr/organization/employees/lib/employee-audit-log/rose-audit';
import type { Employee } from '@/features/hr/organization/employees/types';

type Props = {
  employee: Employee;
  departmentName: string;
  branchName: string;
};

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function buildPdfEmp(employee: Employee, departmentName: string, branchName: string): RoseFormPdfEmployee {
  return {
    nameAr: employee.name,
    nameEn: employee.nameEn,
    employeeCode: employee.employeeCode,
    nationalId: employee.nationalId,
    nationalityAr: employee.nationality,
    positionAr: employee.position,
    departmentAr: departmentName,
    branchAr: branchName,
    hireDate: employee.startDate?.slice(0, 10) ?? '',
  };
}

export function EmployeeRoseFormsPanel({ employee, departmentName, branchName }: Props) {
  const pdfEmp = React.useMemo(
    () => buildPdfEmp(employee, departmentName, branchName),
    [employee, departmentName, branchName],
  );
  const companyAr = ROSE_TRADING_COMPANY_AR_DEFAULT;
  const companyEn = 'Rose Trading Establishment';

  const bucket = useEmployeeRoseFormsStore((s) => s.getBucket(employee.id));
  const addResignation = useEmployeeRoseFormsStore((s) => s.addResignation);
  const updateResignation = useEmployeeRoseFormsStore((s) => s.updateResignation);
  const removeResignation = useEmployeeRoseFormsStore((s) => s.removeResignation);
  const addClearance = useEmployeeRoseFormsStore((s) => s.addClearance);
  const updateClearance = useEmployeeRoseFormsStore((s) => s.updateClearance);
  const removeClearance = useEmployeeRoseFormsStore((s) => s.removeClearance);
  const addSettlement = useEmployeeRoseFormsStore((s) => s.addSettlement);
  const updateSettlement = useEmployeeRoseFormsStore((s) => s.updateSettlement);
  const removeSettlement = useEmployeeRoseFormsStore((s) => s.removeSettlement);
  const addExperience = useEmployeeRoseFormsStore((s) => s.addExperience);
  const updateExperience = useEmployeeRoseFormsStore((s) => s.updateExperience);
  const removeExperience = useEmployeeRoseFormsStore((s) => s.removeExperience);

  const [tab, setTab] = React.useState<RoseTradingFormTab>('resignation');

  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [printable, setPrintable] = React.useState<React.ReactElement | null>(null);
  const [pdfName, setPdfName] = React.useState('document.pdf');
  const [pdfTitle, setPdfTitle] = React.useState('معاينة');

  const [deleteTarget, setDeleteTarget] = React.useState<{ kind: RoseTradingFormTab; id: string } | null>(null);

  const [editor, setEditor] = React.useState<
    | { open: false }
    | { open: true; mode: 'create' | 'edit'; kind: RoseTradingFormTab; id?: string }
  >({ open: false });

  /* ─── resignation form state ─── */
  const [rDoc, setRDoc] = React.useState(todayYmd());
  const [rEff, setREff] = React.useState(todayYmd());
  const [rReason, setRReason] = React.useState('');
  const [rNotes, setRNotes] = React.useState('');
  const [rApproved, setRApproved] = React.useState('');
  const [rRef, setRRef] = React.useState('');

  /* clearance */
  const [cDoc, setCDoc] = React.useState(todayYmd());
  const [cLast, setCLast] = React.useState(todayYmd());
  const [cFin, setCFin] = React.useState('');
  const [cHr, setCHr] = React.useState('');
  const [cIt, setCIt] = React.useState('');
  const [cAdm, setCAdm] = React.useState('');
  const [cNotes, setCNotes] = React.useState('');

  /* settlement */
  const [sDoc, setSDoc] = React.useState(todayYmd());
  const [sPeriod, setSPeriod] = React.useState('');
  const [sRights, setSRights] = React.useState('');
  const [sDed, setSDed] = React.useState('');
  const [sNet, setSNet] = React.useState('');
  const [sDecl, setSDecl] = React.useState('');

  /* experience */
  const [eDoc, setEDoc] = React.useState(todayYmd());
  const [eFrom, setEFrom] = React.useState(employee.startDate?.slice(0, 10) ?? todayYmd());
  const [eTo, setETo] = React.useState(todayYmd());
  const [eJob, setEJob] = React.useState(employee.position);
  const [eDuties, setEDuties] = React.useState('');
  const [ePurpose, setEPurpose] = React.useState('');
  const [eIssued, setEIssued] = React.useState('');

  const resetResignation = () => {
    setRDoc(todayYmd());
    setREff(todayYmd());
    setRReason('');
    setRNotes('');
    setRApproved('');
    setRRef('');
  };
  const resetClearance = () => {
    setCDoc(todayYmd());
    setCLast(todayYmd());
    setCFin('');
    setCHr('');
    setCIt('');
    setCAdm('');
    setCNotes('');
  };
  const resetSettlement = () => {
    setSDoc(todayYmd());
    setSPeriod('');
    setSRights('');
    setSDed('');
    setSNet('');
    setSDecl('');
  };
  const resetExperience = () => {
    setEDoc(todayYmd());
    setEFrom(employee.startDate?.slice(0, 10) ?? todayYmd());
    setETo(todayYmd());
    setEJob(employee.position);
    setEDuties('');
    setEPurpose('');
    setEIssued('');
  };

  const openCreate = (k: RoseTradingFormTab) => {
    if (k === 'resignation') resetResignation();
    if (k === 'clearance') resetClearance();
    if (k === 'settlement') resetSettlement();
    if (k === 'experience') resetExperience();
    setEditor({ open: true, mode: 'create', kind: k });
  };

  const openEdit = (k: RoseTradingFormTab, id: string) => {
    if (k === 'resignation') {
      const row = bucket.resignations.find((x) => x.id === id);
      if (!row) return;
      setRDoc(row.documentDate);
      setREff(row.effectiveResignationDate);
      setRReason(row.reasonAr);
      setRNotes(row.notesAr);
      setRApproved(row.approvedByAr);
      setRRef(row.referenceNo);
    } else if (k === 'clearance') {
      const row = bucket.clearances.find((x) => x.id === id);
      if (!row) return;
      setCDoc(row.documentDate);
      setCLast(row.lastWorkingDay);
      setCFin(row.financeClearAr);
      setCHr(row.hrClearAr);
      setCIt(row.itClearAr);
      setCAdm(row.adminClearAr);
      setCNotes(row.notesAr);
    } else if (k === 'settlement') {
      const row = bucket.settlements.find((x) => x.id === id);
      if (!row) return;
      setSDoc(row.documentDate);
      setSPeriod(row.settlementPeriodAr);
      setSRights(row.salaryAndRightsAr);
      setSDed(row.deductionsAr);
      setSNet(row.netAmountAr);
      setSDecl(row.declarationAr);
    } else {
      const row = bucket.experiences.find((x) => x.id === id);
      if (!row) return;
      setEDoc(row.documentDate);
      setEFrom(row.serviceFrom);
      setETo(row.serviceTo);
      setEJob(row.jobTitleAr);
      setEDuties(row.dutiesSummaryAr);
      setEPurpose(row.certificatePurposeAr);
      setEIssued(row.issuedToAr);
    }
    setEditor({ open: true, mode: 'edit', kind: k, id });
  };

  const closeEditor = () => setEditor({ open: false });

  const saveEditor = () => {
    if (!editor.open) return;
    const k = editor.kind;
    const scope = roseTabToScope(k);
    if (editor.mode === 'create') {
      if (k === 'resignation') {
        addResignation(employee.id, {
          documentDate: rDoc,
          effectiveResignationDate: rEff,
          reasonAr: rReason,
          notesAr: rNotes,
          approvedByAr: rApproved,
          referenceNo: rRef,
        });
        const row = useEmployeeRoseFormsStore.getState().getBucket(employee.id).resignations[0];
        if (row) appendEmployeeAudit(employee.id, diffRoseRecordAudit(null, { ...row } as Record<string, unknown>, scope));
        toast.success('تمت إضافة نموذج الاستقالة');
      } else if (k === 'clearance') {
        addClearance(employee.id, {
          documentDate: cDoc,
          lastWorkingDay: cLast,
          financeClearAr: cFin,
          hrClearAr: cHr,
          itClearAr: cIt,
          adminClearAr: cAdm,
          notesAr: cNotes,
        });
        const row = useEmployeeRoseFormsStore.getState().getBucket(employee.id).clearances[0];
        if (row) appendEmployeeAudit(employee.id, diffRoseRecordAudit(null, { ...row } as Record<string, unknown>, scope));
        toast.success('تمت إضافة إخلاء الطرف');
      } else if (k === 'settlement') {
        addSettlement(employee.id, {
          documentDate: sDoc,
          settlementPeriodAr: sPeriod,
          salaryAndRightsAr: sRights,
          deductionsAr: sDed,
          netAmountAr: sNet,
          declarationAr: sDecl,
        });
        const row = useEmployeeRoseFormsStore.getState().getBucket(employee.id).settlements[0];
        if (row) appendEmployeeAudit(employee.id, diffRoseRecordAudit(null, { ...row } as Record<string, unknown>, scope));
        toast.success('تمت إضافة المخالصة');
      } else {
        addExperience(employee.id, {
          documentDate: eDoc,
          serviceFrom: eFrom,
          serviceTo: eTo,
          jobTitleAr: eJob,
          dutiesSummaryAr: eDuties,
          certificatePurposeAr: ePurpose,
          issuedToAr: eIssued,
        });
        const row = useEmployeeRoseFormsStore.getState().getBucket(employee.id).experiences[0];
        if (row) appendEmployeeAudit(employee.id, diffRoseRecordAudit(null, { ...row } as Record<string, unknown>, scope));
        toast.success('تمت إضافة شهادة الخبرة');
      }
    } else if (editor.id) {
      const id = editor.id;
      let prevRow: Record<string, unknown> | null = null;
      if (k === 'resignation') {
        const r = bucket.resignations.find((x) => x.id === id);
        if (r) prevRow = { ...r };
        updateResignation(employee.id, id, {
          documentDate: rDoc,
          effectiveResignationDate: rEff,
          reasonAr: rReason,
          notesAr: rNotes,
          approvedByAr: rApproved,
          referenceNo: rRef,
        });
      } else if (k === 'clearance') {
        const r = bucket.clearances.find((x) => x.id === id);
        if (r) prevRow = { ...r };
        updateClearance(employee.id, id, {
          documentDate: cDoc,
          lastWorkingDay: cLast,
          financeClearAr: cFin,
          hrClearAr: cHr,
          itClearAr: cIt,
          adminClearAr: cAdm,
          notesAr: cNotes,
        });
      } else if (k === 'settlement') {
        const r = bucket.settlements.find((x) => x.id === id);
        if (r) prevRow = { ...r };
        updateSettlement(employee.id, id, {
          documentDate: sDoc,
          settlementPeriodAr: sPeriod,
          salaryAndRightsAr: sRights,
          deductionsAr: sDed,
          netAmountAr: sNet,
          declarationAr: sDecl,
        });
      } else {
        const r = bucket.experiences.find((x) => x.id === id);
        if (r) prevRow = { ...r };
        updateExperience(employee.id, id, {
          documentDate: eDoc,
          serviceFrom: eFrom,
          serviceTo: eTo,
          jobTitleAr: eJob,
          dutiesSummaryAr: eDuties,
          certificatePurposeAr: ePurpose,
          issuedToAr: eIssued,
        });
      }
      const b = useEmployeeRoseFormsStore.getState().getBucket(employee.id);
      let nextRow: Record<string, unknown> | null = null;
      if (k === 'resignation') {
        const r = b.resignations.find((x) => x.id === id);
        if (r) nextRow = { ...r };
      } else if (k === 'clearance') {
        const r = b.clearances.find((x) => x.id === id);
        if (r) nextRow = { ...r };
      } else if (k === 'settlement') {
        const r = b.settlements.find((x) => x.id === id);
        if (r) nextRow = { ...r };
      } else {
        const r = b.experiences.find((x) => x.id === id);
        if (r) nextRow = { ...r };
      }
      if (prevRow && nextRow) appendEmployeeAudit(employee.id, diffRoseRecordAudit(prevRow, nextRow, scope));
      toast.success('تم حفظ التعديلات');
    }
    closeEditor();
  };

  const preview = (
    k: RoseTradingFormTab,
    row: RoseResignationRecord | RoseClearanceRecord | RoseSettlementRecord | RoseExperienceRecord,
  ) => {
    setPdfTitle(`معاينة — ${ROSE_FORM_TAB_LABELS[k]}`);
    setPrintable(null);
    if (k === 'resignation') {
      setPdfName(`استقالة-${employee.employeeCode}-${(row as RoseResignationRecord).id.slice(-6)}.pdf`);
      setPrintable(
        <RoseResignationRecordPrintHtml companyNameAr={companyAr} companyNameEn={companyEn} emp={pdfEmp} row={row as RoseResignationRecord} />,
      );
    } else if (k === 'clearance') {
      setPdfName(`اخلاء-طرف-${employee.employeeCode}-${(row as RoseClearanceRecord).id.slice(-6)}.pdf`);
      setPrintable(
        <RoseClearanceRecordPrintHtml companyNameAr={companyAr} companyNameEn={companyEn} emp={pdfEmp} row={row as RoseClearanceRecord} />,
      );
    } else if (k === 'settlement') {
      setPdfName(`مخالصة-${employee.employeeCode}-${(row as RoseSettlementRecord).id.slice(-6)}.pdf`);
      setPrintable(
        <RoseSettlementRecordPrintHtml companyNameAr={companyAr} companyNameEn={companyEn} emp={pdfEmp} row={row as RoseSettlementRecord} />,
      );
    } else {
      setPdfName(`شهادة-خبرة-${employee.employeeCode}-${(row as RoseExperienceRecord).id.slice(-6)}.pdf`);
      setPrintable(
        <RoseExperienceRecordPrintHtml companyNameAr={companyAr} companyNameEn={companyEn} emp={pdfEmp} row={row as RoseExperienceRecord} />,
      );
    }
    setPdfOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { kind, id } = deleteTarget;
    const scope = roseTabToScope(kind);
    let snap: Record<string, unknown> | null = null;
    if (kind === 'resignation') {
      const r = bucket.resignations.find((x) => x.id === id);
      if (r) snap = { ...r };
    } else if (kind === 'clearance') {
      const r = bucket.clearances.find((x) => x.id === id);
      if (r) snap = { ...r };
    } else if (kind === 'settlement') {
      const r = bucket.settlements.find((x) => x.id === id);
      if (r) snap = { ...r };
    } else {
      const r = bucket.experiences.find((x) => x.id === id);
      if (r) snap = { ...r };
    }
    if (kind === 'resignation') removeResignation(employee.id, id);
    if (kind === 'clearance') removeClearance(employee.id, id);
    if (kind === 'settlement') removeSettlement(employee.id, id);
    if (kind === 'experience') removeExperience(employee.id, id);
    if (snap) appendEmployeeAudit(employee.id, diffRoseRecordAudit(snap, null, scope));
    toast.success('تم الحذف');
    setDeleteTarget(null);
  };

  const tabCounts: Record<RoseTradingFormTab, number> = {
    resignation: bucket.resignations.length,
    clearance: bucket.clearances.length,
    settlement: bucket.settlements.length,
    experience: bucket.experiences.length,
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
        <div className="pointer-events-none absolute inset-0 dotted-bg opacity-25" aria-hidden />
        <div className="relative p-5 sm:p-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <FileStack className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">نماذج {ROSE_TRADING_COMPANY_AR_DEFAULT}</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                  سجل مستقل لكل نوع نموذج مع إمكانية إضافة أكثر من نسخة (مثلاً عدة شهادات خبرة أو إخلاءات طرف عبر
                  دورات عمل متقطعة). البيانات تُحفظ في هذا المتصفح ثم يمكن معاينة كل نسخة وتحميلها PDF.
                </p>
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as RoseTradingFormTab)} className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1.5 rounded-xl">
              {(Object.keys(ROSE_FORM_TAB_LABELS) as RoseTradingFormTab[]).map((k) => (
                <TabsTrigger key={k} value={k} className="gap-1.5 rounded-lg text-xs sm:text-sm px-2.5 sm:px-3">
                  {ROSE_FORM_TAB_LABELS[k]}
                  <Badge variant="subtle" className="h-5 min-w-5 px-1 text-[10px] tabular-nums">
                    {tabCounts[k]}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="resignation" className="mt-4 space-y-3 outline-none">
              <div className="flex justify-end">
                <Button size="sm" className="gap-1.5" onClick={() => openCreate('resignation')}>
                  <Plus className="h-3.5 w-3.5" />
                  إضافة استقالة
                </Button>
              </div>
              {bucket.resignations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center rounded-xl border border-dashed border-border/80">لا توجد نماذج استقالة بعد.</p>
              ) : (
                <ul className="space-y-2">
                  {bucket.resignations.map((row) => (
                    <li key={row.id} className={cn('rounded-xl border border-border/70 bg-muted/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between')}>
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium">آخر يوم عمل: {formatDateShort(row.effectiveResignationDate)}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">السبب: {row.reasonAr || '—'}</p>
                        <p className="text-[11px] text-muted-foreground">تاريخ النموذج: {formatDateShort(row.documentDate)}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={() => preview('resignation', row)}>
                          <Eye className="h-3.5 w-3.5" /> معاينة
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" onClick={() => openEdit('resignation', row.id)}>
                          <Pencil className="h-3.5 w-3.5" /> تعديل
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 text-destructive gap-1" onClick={() => setDeleteTarget({ kind: 'resignation', id: row.id })}>
                          <Trash2 className="h-3.5 w-3.5" /> حذف
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="clearance" className="mt-4 space-y-3 outline-none">
              <div className="flex justify-end">
                <Button size="sm" className="gap-1.5" onClick={() => openCreate('clearance')}>
                  <Plus className="h-3.5 w-3.5" />
                  إضافة إخلاء طرف
                </Button>
              </div>
              {bucket.clearances.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center rounded-xl border border-dashed border-border/80">لا توجد إخلاءات طرف بعد.</p>
              ) : (
                <ul className="space-y-2">
                  {bucket.clearances.map((row) => (
                    <li key={row.id} className="rounded-xl border border-border/70 bg-muted/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium">آخر يوم عمل: {formatDateShort(row.lastWorkingDay)}</p>
                        <p className="text-[11px] text-muted-foreground">تاريخ النموذج: {formatDateShort(row.documentDate)}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={() => preview('clearance', row)}>
                          <Eye className="h-3.5 w-3.5" /> معاينة
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" onClick={() => openEdit('clearance', row.id)}>
                          <Pencil className="h-3.5 w-3.5" /> تعديل
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 text-destructive gap-1" onClick={() => setDeleteTarget({ kind: 'clearance', id: row.id })}>
                          <Trash2 className="h-3.5 w-3.5" /> حذف
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="settlement" className="mt-4 space-y-3 outline-none">
              <div className="flex justify-end">
                <Button size="sm" className="gap-1.5" onClick={() => openCreate('settlement')}>
                  <Plus className="h-3.5 w-3.5" />
                  إضافة مخالصة
                </Button>
              </div>
              {bucket.settlements.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center rounded-xl border border-dashed border-border/80">لا توجد مخالصات بعد.</p>
              ) : (
                <ul className="space-y-2">
                  {bucket.settlements.map((row) => (
                    <li key={row.id} className="rounded-xl border border-border/70 bg-muted/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium line-clamp-2">{row.settlementPeriodAr || 'مخالصة'}</p>
                        <p className="text-[11px] text-muted-foreground">تاريخ النموذج: {formatDateShort(row.documentDate)}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={() => preview('settlement', row)}>
                          <Eye className="h-3.5 w-3.5" /> معاينة
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" onClick={() => openEdit('settlement', row.id)}>
                          <Pencil className="h-3.5 w-3.5" /> تعديل
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 text-destructive gap-1" onClick={() => setDeleteTarget({ kind: 'settlement', id: row.id })}>
                          <Trash2 className="h-3.5 w-3.5" /> حذف
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="experience" className="mt-4 space-y-3 outline-none">
              <div className="flex justify-end">
                <Button size="sm" className="gap-1.5" onClick={() => openCreate('experience')}>
                  <Plus className="h-3.5 w-3.5" />
                  إضافة شهادة خبرة
                </Button>
              </div>
              {bucket.experiences.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center rounded-xl border border-dashed border-border/80">لا توجد شهادات خبرة بعد.</p>
              ) : (
                <ul className="space-y-2">
                  {bucket.experiences.map((row) => (
                    <li key={row.id} className="rounded-xl border border-border/70 bg-muted/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium">{row.jobTitleAr}</p>
                        <p className="text-xs text-muted-foreground">
                          من {formatDateShort(row.serviceFrom)} إلى {formatDateShort(row.serviceTo)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">إصدار: {formatDateShort(row.documentDate)}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={() => preview('experience', row)}>
                          <Eye className="h-3.5 w-3.5" /> معاينة
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" onClick={() => openEdit('experience', row.id)}>
                          <Pencil className="h-3.5 w-3.5" /> تعديل
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 text-destructive gap-1" onClick={() => setDeleteTarget({ kind: 'experience', id: row.id })}>
                          <Trash2 className="h-3.5 w-3.5" /> حذف
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={editor.open} onOpenChange={(o) => !o && closeEditor()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-right font-display">
              {editor.open ? (editor.mode === 'create' ? 'إضافة' : 'تعديل') : ''}{' '}
              {editor.open ? ROSE_FORM_TAB_LABELS[editor.kind] : ''}
            </DialogTitle>
          </DialogHeader>
          {editor.open && editor.kind === 'resignation' && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">تاريخ النموذج</Label>
                  <Input type="date" value={rDoc} onChange={(e) => setRDoc(e.target.value)} className="mt-1" dir="ltr" />
                </div>
                <div>
                  <Label className="text-xs">آخر يوم عمل</Label>
                  <Input type="date" value={rEff} onChange={(e) => setREff(e.target.value)} className="mt-1" dir="ltr" />
                </div>
              </div>
              <div>
                <Label className="text-xs">رقم مرجعي (اختياري)</Label>
                <Input value={rRef} onChange={(e) => setRRef(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">سبب الاستقالة</Label>
                <Textarea value={rReason} onChange={(e) => setRReason(e.target.value)} className="mt-1 min-h-[72px]" />
              </div>
              <div>
                <Label className="text-xs">ملاحظات</Label>
                <Textarea value={rNotes} onChange={(e) => setRNotes(e.target.value)} className="mt-1 min-h-[56px]" />
              </div>
              <div>
                <Label className="text-xs">اسم المعتمد</Label>
                <Input value={rApproved} onChange={(e) => setRApproved(e.target.value)} className="mt-1" />
              </div>
            </div>
          )}
          {editor.open && editor.kind === 'clearance' && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">تاريخ النموذج</Label>
                  <Input type="date" value={cDoc} onChange={(e) => setCDoc(e.target.value)} className="mt-1" dir="ltr" />
                </div>
                <div>
                  <Label className="text-xs">آخر يوم عمل</Label>
                  <Input type="date" value={cLast} onChange={(e) => setCLast(e.target.value)} className="mt-1" dir="ltr" />
                </div>
              </div>
              <div>
                <Label className="text-xs">المالية — ملاحظة / توقيع</Label>
                <Textarea value={cFin} onChange={(e) => setCFin(e.target.value)} className="mt-1 min-h-[48px]" />
              </div>
              <div>
                <Label className="text-xs">الموارد البشرية</Label>
                <Textarea value={cHr} onChange={(e) => setCHr(e.target.value)} className="mt-1 min-h-[48px]" />
              </div>
              <div>
                <Label className="text-xs">تقنية المعلومات</Label>
                <Textarea value={cIt} onChange={(e) => setCIt(e.target.value)} className="mt-1 min-h-[48px]" />
              </div>
              <div>
                <Label className="text-xs">الإدارة / العمليات</Label>
                <Textarea value={cAdm} onChange={(e) => setCAdm(e.target.value)} className="mt-1 min-h-[48px]" />
              </div>
              <div>
                <Label className="text-xs">ملاحظات عامة</Label>
                <Textarea value={cNotes} onChange={(e) => setCNotes(e.target.value)} className="mt-1 min-h-[48px]" />
              </div>
            </div>
          )}
          {editor.open && editor.kind === 'settlement' && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs">تاريخ النموذج</Label>
                <Input type="date" value={sDoc} onChange={(e) => setSDoc(e.target.value)} className="mt-1" dir="ltr" />
              </div>
              <div>
                <Label className="text-xs">نطاق المخالصة / الفترة</Label>
                <Textarea value={sPeriod} onChange={(e) => setSPeriod(e.target.value)} className="mt-1 min-h-[48px]" />
              </div>
              <div>
                <Label className="text-xs">الراتب والحقوق</Label>
                <Textarea value={sRights} onChange={(e) => setSRights(e.target.value)} className="mt-1 min-h-[56px]" />
              </div>
              <div>
                <Label className="text-xs">الاستقطاعات</Label>
                <Textarea value={sDed} onChange={(e) => setSDed(e.target.value)} className="mt-1 min-h-[48px]" />
              </div>
              <div>
                <Label className="text-xs">الصافي / البيان</Label>
                <Textarea value={sNet} onChange={(e) => setSNet(e.target.value)} className="mt-1 min-h-[48px]" />
              </div>
              <div>
                <Label className="text-xs">نص الإقرار (اختياري — يُستخدم افتراضي إن وُجد فارغ في PDF)</Label>
                <Textarea value={sDecl} onChange={(e) => setSDecl(e.target.value)} className="mt-1 min-h-[80px]" placeholder="اتركه فارغاً لاستخدام نص إقرار افتراضي في المستند" />
              </div>
            </div>
          )}
          {editor.open && editor.kind === 'experience' && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs">تاريخ الإصدار</Label>
                <Input type="date" value={eDoc} onChange={(e) => setEDoc(e.target.value)} className="mt-1" dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">بداية الخدمة</Label>
                  <Input type="date" value={eFrom} onChange={(e) => setEFrom(e.target.value)} className="mt-1" dir="ltr" />
                </div>
                <div>
                  <Label className="text-xs">نهاية الخدمة</Label>
                  <Input type="date" value={eTo} onChange={(e) => setETo(e.target.value)} className="mt-1" dir="ltr" />
                </div>
              </div>
              <div>
                <Label className="text-xs">المسمى الوظيفي في الشهادة</Label>
                <Input value={eJob} onChange={(e) => setEJob(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">ملخص المهام</Label>
                <Textarea value={eDuties} onChange={(e) => setEDuties(e.target.value)} className="mt-1 min-h-[88px]" />
              </div>
              <div>
                <Label className="text-xs">الغرض من الشهادة (اختياري)</Label>
                <Input value={ePurpose} onChange={(e) => setEPurpose(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">التوجيه (مثلاً: الجهات الحكومية — اختياري)</Label>
                <Input value={eIssued} onChange={(e) => setEIssued(e.target.value)} className="mt-1" placeholder="إلى من يهمه الأمر" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-start sm:space-x-reverse">
            <Button type="button" variant="outline" onClick={closeEditor}>إلغاء</Button>
            <Button type="button" onClick={saveEditor}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PdfPreviewExportDialog
        open={pdfOpen}
        onOpenChange={(open) => {
          setPdfOpen(open);
          if (!open) {
            setPrintable(null);
          }
        }}
        title={pdfTitle}
        fileName={pdfName}
        printable={printable}
      />

      <ConfirmationModal
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف النموذج"
        description="سيتم حذف هذه النسخة من السجل. يمكنك لاحقاً إنشاء نموذج جديد بنفس النوع."
        onConfirm={confirmDelete}
      />
    </>
  );
}
