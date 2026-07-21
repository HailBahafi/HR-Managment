'use client';

import * as React from 'react';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { usePdfCompanyLetterhead } from '@/components/pdf/hooks/use-pdf-company-letterhead';
import { RoseClearancePrintHtml } from '@/components/pdf/rose-trading/rose-clearance-print-html';
import { RoseResignationPrintHtml } from '@/components/pdf/rose-trading/rose-resignation-print-html';
import { RoseExperiencePrintHtml } from '@/components/pdf/rose-trading/rose-experience-print-html';
import { RoseSettlementPrintHtml } from '@/components/pdf/rose-trading/rose-settlement-print-html';
import { RoseMobileCircularPrintHtml } from '@/components/pdf/rose-trading/rose-mobile-circular-print-html';
import { CashReceiptPrintHtml } from '@/features/hr/payroll/reports/components/pdf-cash-receipt-print-html';
import type { EmployeeProfileDraft } from '@/features/hr/organization/employees/components/employee-profile-field';
import {
  formatGregorianDateAr,
  todayIsoDate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';
import type { ExperiencePdfMode } from '@/features/hr/organization/employees/components/dialogs/employee-experience-pdf-prep-dialog';
import type { SettlementPdfMode } from '@/features/hr/organization/employees/components/dialogs/employee-settlement-pdf-prep-dialog';

export type EmployeeHrPdfPrepKind = null;

export type EmployeeProfileHrPdfPayload = {
  printable: React.ReactElement | null;
  title: string;
  fileName: string;
};

export function useEmployeeProfileRosePdf(draft: EmployeeProfileDraft) {
  const { data: activeCompany } = useActiveCompany();
  const pdfCompany = usePdfCompanyLetterhead();

  const pdfCtx = React.useMemo(() => ({
    employee: draft,
    branchNameAr: draft.branchNameAr ?? '—',
    departmentNameAr: draft.departmentNameAr ?? '—',
  }), [draft]);

  const companyNames = React.useMemo(() => ({
    nameAr: activeCompany?.nameAr ?? pdfCompany.companyNameAr,
    nameEn: activeCompany?.nameEn ?? pdfCompany.companyNameEn,
    crNumber: activeCompany?.commercialRegistrationNo ?? pdfCompany.commercialReg,
  }), [activeCompany, pdfCompany]);

  const [clearancePrepOpen, setClearancePrepOpen] = React.useState(false);
  const [settlementPrepOpen, setSettlementPrepOpen] = React.useState(false);
  const [experiencePrepOpen, setExperiencePrepOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<EmployeeProfileHrPdfPayload | null>(null);

  const closeHrPdfPreview = React.useCallback(() => {
    setPreview(null);
  }, []);

  const openHrPdfPrep = React.useCallback((kind: 'resignation' | 'clearance' | 'settlement' | 'experience' | 'cash-receipt' | 'mobile-circular') => {
    switch (kind) {
      case 'resignation':
        setPreview({
          printable: (
            <RoseResignationPrintHtml
              companyNameAr={companyNames.nameAr}
              companyNameEn={companyNames.nameEn}
            />
          ),
          title: 'معاينة — نموذج استقالة',
          fileName: 'rose-resignation-form.pdf',
        });
        break;
      case 'clearance':
        setPreview({
          printable: (
            <RoseClearancePrintHtml
              companyNameAr={companyNames.nameAr}
              companyNameEn={companyNames.nameEn}
            />
          ),
          title: 'معاينة — نموذج إخلاء طرف',
          fileName: 'rose-clearance-form.pdf',
        });
        break;
      case 'settlement':
        setPreview({
          printable: (
            <RoseSettlementPrintHtml
              companyNameAr={companyNames.nameAr}
              companyNameEn={companyNames.nameEn}
            />
          ),
          title: 'معاينة — مخالصة نهائية',
          fileName: 'rose-settlement-blank.pdf',
        });
        break;
      case 'experience':
        setExperiencePrepOpen(true);
        break;
      case 'cash-receipt':
        setPreview({
          printable: (
            <CashReceiptPrintHtml
              companyNameAr={companyNames.nameAr}
              companyNameEn={companyNames.nameEn}
            />
          ),
          title: 'معاينة — سند استلام نقدي',
          fileName: 'rose-cash-receipt-form.pdf',
        });
        break;
      case 'mobile-circular':
        setPreview({
          printable: (
            <RoseMobileCircularPrintHtml
              companyNameAr={companyNames.nameAr}
              companyNameEn={companyNames.nameEn}
              employeeName={draft.name}
              nationalId={draft.nationalId}
            />
          ),
          title: 'معاينة — تعميم استخدام الجوال',
          fileName: `rose-mobile-circular-${draft.employeeCode}.pdf`,
        });
        break;
    }
  }, [companyNames.nameAr, companyNames.nameEn, draft.employeeCode, draft.name, draft.nationalId]);

  const cancelClearancePrep = React.useCallback(() => setClearancePrepOpen(false), []);
  const cancelSettlementPrep = React.useCallback(() => setSettlementPrepOpen(false), []);
  const cancelExperiencePrep = React.useCallback(() => setExperiencePrepOpen(false), []);

  const applyClearanceWizard = React.useCallback(() => {
    setClearancePrepOpen(false);
    setPreview({
      printable: (
        <RoseClearancePrintHtml
          companyNameAr={companyNames.nameAr}
          companyNameEn={companyNames.nameEn}
        />
      ),
      title: 'معاينة — نموذج إخلاء طرف',
      fileName: 'rose-clearance-form.pdf',
    });
  }, [companyNames.nameAr, companyNames.nameEn]);

  const applySettlementWizard = React.useCallback(
    (mode: SettlementPdfMode) => {
      setSettlementPrepOpen(false);
      const today = todayIsoDate();
      const fields =
        mode === 'filled'
          ? {
              employeeName: draft.name || '—',
              nationality: draft.nationality || '—',
              nationalId: draft.nationalId || '—',
              endDateGregorian: draft.endDate
                ? formatGregorianDateAr(draft.endDate)
                : formatGregorianDateAr(today),
              companyName: companyNames.nameAr || '—',
            }
          : null;

      setPreview({
        printable: (
          <RoseSettlementPrintHtml
            companyNameAr={companyNames.nameAr}
            companyNameEn={companyNames.nameEn}
            fields={fields}
          />
        ),
        title: 'معاينة — مخالصة نهائية',
        fileName:
          mode === 'filled'
            ? `rose-settlement-${draft.employeeCode}.pdf`
            : 'rose-settlement-blank.pdf',
      });
    },
    [companyNames.nameAr, companyNames.nameEn, draft],
  );

  const applyExperienceWizard = React.useCallback(
    (mode: ExperiencePdfMode) => {
      setExperiencePrepOpen(false);
      const today = todayIsoDate();
      const fields =
        mode === 'filled'
          ? {
              certificateDate: formatGregorianDateAr(today),
              employeeName: draft.name || '—',
              companyName: companyNames.nameAr || '—',
              department: pdfCtx.departmentNameAr || '—',
              position: draft.position || '—',
              startDate: draft.startDate ? formatGregorianDateAr(draft.startDate) : '—',
              endDate: draft.endDate ? formatGregorianDateAr(draft.endDate) : formatGregorianDateAr(today),
            }
          : null;

      setPreview({
        printable: (
          <RoseExperiencePrintHtml
            companyNameAr={companyNames.nameAr}
            companyNameEn={companyNames.nameEn}
            fields={fields}
          />
        ),
        title: 'معاينة — شهادة خبرة',
        fileName:
          mode === 'filled'
            ? `rose-experience-${draft.employeeCode}.pdf`
            : 'rose-experience-blank.pdf',
      });
    },
    [companyNames.nameAr, companyNames.nameEn, draft, pdfCtx.departmentNameAr],
  );

  const rosePdfPreviewPayload = React.useMemo(
    () =>
      preview ?? {
        printable: null as React.ReactElement | null,
        title: '',
        fileName: '',
      },
    [preview],
  );

  return {
    hrPdfPrepKind: null as EmployeeHrPdfPrepKind,
    clearancePrepOpen,
    settlementPrepOpen,
    experiencePrepOpen,
    openHrPdfPrep,
    cancelHrPdfPrep: () => {},
    cancelClearancePrep,
    cancelSettlementPrep,
    cancelExperiencePrep,
    applyClearanceWizard,
    applySettlementWizard,
    applyExperienceWizard,
    applyHrPdfPrepResult: () => {},
    hrPdfPreviewOpen: !!preview,
    closeHrPdfPreview,
    rosePdfPreviewPayload,
    rosePdfBranchNameAr: pdfCtx.branchNameAr,
    rosePdfDepartmentNameAr: pdfCtx.departmentNameAr,
    rosePdfCompanyNameAr: companyNames.nameAr,
    rosePdfCompanyNameEn: companyNames.nameEn,
  };
}
