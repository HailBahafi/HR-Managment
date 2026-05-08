'use client';

import * as React from 'react';
import { getBranch, getDepartment } from '@/lib/data';
import { getPdfLogoSrc } from '@/lib/pdf/pdf-logo-url';
import { buildRoseTradingHrPdfProps } from '@/lib/pdf/build-rose-trading-hr-pdf-props';
import type { DocumentProps } from '@react-pdf/renderer';
import {
  RoseClearanceFormPdf,
  RoseExperienceCertificatePdf,
  RoseFinalSettlementFormPdf,
  RoseResignationFormPdf,
} from '@/components/pdf/rose-trading/rose-trading-hr-forms-pdf';
import type { EmployeeProfileDraft } from '@/features/hr/organization/employees/components/employee-profile-field';

export function useEmployeeProfileRosePdf(draft: EmployeeProfileDraft) {
  const rosePdfBundle = React.useMemo(() => {
    const b = getBranch(draft.branchId);
    const d = getDepartment(draft.departmentId);
    return buildRoseTradingHrPdfProps({
      employee: draft,
      branchNameAr: b?.name ?? '—',
      departmentNameAr: d?.name ?? '—',
    });
  }, [draft]);

  const [rosePdfLogo, setRosePdfLogo] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    setRosePdfLogo(getPdfLogoSrc());
  }, []);

  type RosePdfPreviewKind = 'resignation' | 'clearance' | 'settlement' | 'experience';
  const [rosePdfPreviewKind, setRosePdfPreviewKind] = React.useState<RosePdfPreviewKind | null>(null);

  const rosePdfPreviewPayload = React.useMemo(() => {
    if (!rosePdfPreviewKind) {
      return { doc: null as React.ReactElement<DocumentProps> | null, title: '', fileName: '' };
    }
    const logo = rosePdfLogo;
    const b = rosePdfBundle;
    const code = draft.employeeCode;
    switch (rosePdfPreviewKind) {
      case 'resignation':
        return {
          doc: <RoseResignationFormPdf logoSrc={logo} {...b.resignation} />,
          title: 'معاينة — نموذج استقالة',
          fileName: `rose-resignation-${code}.pdf`,
        };
      case 'clearance':
        return {
          doc: <RoseClearanceFormPdf logoSrc={logo} {...b.clearance} />,
          title: 'معاينة — نموذج إخلاء طرف',
          fileName: `rose-clearance-${code}.pdf`,
        };
      case 'settlement':
        return {
          doc: <RoseFinalSettlementFormPdf logoSrc={logo} {...b.settlement} />,
          title: 'معاينة — مخالصة نهائية',
          fileName: `rose-settlement-${code}.pdf`,
        };
      case 'experience':
        return {
          doc: <RoseExperienceCertificatePdf logoSrc={logo} {...b.experience} />,
          title: 'معاينة — شهادة خبرة',
          fileName: `rose-experience-${code}.pdf`,
        };
      default:
        return { doc: null as React.ReactElement<DocumentProps> | null, title: '', fileName: '' };
    }
  }, [rosePdfPreviewKind, rosePdfLogo, rosePdfBundle, draft.employeeCode]);

  return { rosePdfPreviewKind, setRosePdfPreviewKind, rosePdfPreviewPayload };
}
