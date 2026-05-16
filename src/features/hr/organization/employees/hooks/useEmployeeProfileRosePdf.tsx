'use client';

import * as React from 'react';
import { getBranch, getDepartment } from '@/features/hr/lib/data';
import { data } from '@/features/hr/lib/data';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import {
  buildRoseTradingHrPdfProps,
  type RoseTradingHrPdfOverrides,
} from '@/components/pdf/lib/build-rose-trading-hr-pdf-props';
import { RoseClearancePrintHtml } from '@/components/pdf/rose-trading/rose-clearance-print-html';
import {
  RoseExperienceCertificatePrintHtml,
  RoseFinalSettlementFormPrintHtml,
  RoseResignationFormPrintHtml,
} from '@/components/pdf/rose-trading/rose-trading-hr-forms-print-html';
import { CashReceiptPrintHtml, type CashReceiptReason } from '@/features/hr/contracts/reports/components/pdf-cash-receipt-print-html';
import type { EmployeeProfileDraft } from '@/features/hr/organization/employees/components/employee-profile-field';

export type EmployeeHrPdfPrepKind = 'resignation' | 'clearance' | 'cash-receipt' | 'experience' | null;

export type EmployeeProfileHrPdfPayload = {
  printable: React.ReactElement | null;
  title: string;
  fileName: string;
};

export function useEmployeeProfileRosePdf(draft: EmployeeProfileDraft) {
  const pdfCtx = React.useMemo(() => {
    const b = getBranch(draft.branchId);
    const d = getDepartment(draft.departmentId);
    return {
      employee: draft,
      branchNameAr: b?.name ?? '—',
      departmentNameAr: d?.name ?? '—',
    };
  }, [draft]);

  const [prepKind, setPrepKind] = React.useState<EmployeeHrPdfPrepKind>(null);
  /** يُحمَّل قبل فتح المعاينة بعد خطوة الإدخال */
  const [roseOverrides, setRoseOverrides] = React.useState<RoseTradingHrPdfOverrides>({});

  const [preview, setPreview] = React.useState<EmployeeProfileHrPdfPayload | null>(null);

  const [rosePdfLogo, setRosePdfLogo] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    setRosePdfLogo(getPdfLogoSrc());
  }, []);

  const closeHrPdfPreview = React.useCallback(() => {
    setPreview(null);
    setRoseOverrides({});
  }, []);

  const openHrPdfPrep = React.useCallback((kind: Exclude<EmployeeHrPdfPrepKind, null>) => {
    setPrepKind(kind);
    setRoseOverrides({});
  }, []);

  const cancelHrPdfPrep = React.useCallback(() => {
    setPrepKind(null);
    setRoseOverrides({});
  }, []);

  const openSettlementPdfQuick = React.useCallback(() => {
    const logo = rosePdfLogo;
    const b = buildRoseTradingHrPdfProps(pdfCtx, {});
    setPreview({
      printable: <RoseFinalSettlementFormPrintHtml logoSrc={logo} {...b.settlement} />,
      title: 'معاينة — مخالصة نهائية',
      fileName: `rose-settlement-${draft.employeeCode}.pdf`,
    });
  }, [draft.employeeCode, pdfCtx, rosePdfLogo]);

  const applyHrPdfPrepResult = React.useCallback(
    (
      previewTarget: Exclude<EmployeeHrPdfPrepKind, null>,
      patch: RoseTradingHrPdfOverrides,
      receipt?: {
        amount: number;
        amountWritten: string;
        reason: CashReceiptReason;
        reasonDetail: string;
        date: string;
      },
    ) => {
      setPrepKind(null);
      const logo = rosePdfLogo;
      const code = draft.employeeCode;

      if (previewTarget === 'cash-receipt' && receipt) {
        const branch = getBranch(draft.branchId);
        const company = {
          nameAr: data.company.name as string,
          nameEn: ((data.company as { nameEn?: string }).nameEn ?? 'rose'),
        };
        setPreview({
          printable: (
            <CashReceiptPrintHtml
              company={company}
              employeeNameAr={draft.name}
              branchNameAr={branch?.name ?? '—'}
              amountNumeric={receipt.amount}
              amountWritten={receipt.amountWritten}
              reason={receipt.reason}
              reasonDetail={receipt.reasonDetail}
              date={receipt.date}
            />
          ),
          title: 'معاينة — سند استلام نقدي',
          fileName: `cash-receipt-${code}.pdf`,
        });
        return;
      }

      setRoseOverrides(patch);
      const b = buildRoseTradingHrPdfProps(pdfCtx, patch);

      if (previewTarget === 'resignation') {
        setPreview({
          printable: <RoseResignationFormPrintHtml logoSrc={logo} {...b.resignation} />,
          title: 'معاينة — نموذج استقالة',
          fileName: `rose-resignation-${code}.pdf`,
        });
        return;
      }
      if (previewTarget === 'clearance') {
        setPreview({
          printable: <RoseClearancePrintHtml logoSrc={logo} {...b.clearance} />,
          title: 'معاينة — نموذج إخلاء طرف',
          fileName: `rose-clearance-${code}.pdf`,
        });
        return;
      }
      if (previewTarget === 'experience') {
        setPreview({
          printable: <RoseExperienceCertificatePrintHtml logoSrc={logo} {...b.experience} />,
          title: 'معاينة — شهادة خبرة',
          fileName: `rose-experience-${code}.pdf`,
        });
      }
    },
    [draft.branchId, draft.employeeCode, draft.name, pdfCtx, rosePdfLogo],
  );

  /** توافق مع المكوّنات القديمة */
  const rosePdfPreviewPayload = React.useMemo(
    () =>
      preview
        ? preview
        : {
            printable: null as React.ReactElement | null,
            title: '',
            fileName: '',
          },
    [preview],
  );

  /** @deprecated */
  const rosePdfPreviewKind = preview ? 'open' : null;
  /** @deprecated */
  const setRosePdfPreviewKind = React.useCallback(
    (_: 'resignation' | 'clearance' | 'settlement' | 'experience' | null) => {
      closeHrPdfPreview();
    },
    [closeHrPdfPreview],
  );

  return {
    hrPdfPrepKind: prepKind,
    openHrPdfPrep,
    cancelHrPdfPrep,
    applyHrPdfPrepResult,
    openSettlementPdfQuick,
    hrPdfPreviewOpen: !!preview,
    closeHrPdfPreview,
    rosePdfPreviewKind,
    setRosePdfPreviewKind,
    rosePdfPreviewPayload,
  };
}
