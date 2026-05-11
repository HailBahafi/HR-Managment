'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/lib/pdf/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/lib/pdf/pdf-logo-url';
import {
  ROSE_TRADING_COMPANY_AR_DEFAULT,
  type RoseExperienceRecord,
  type RoseResignationRecord,
  type RoseSettlementRecord,
} from '@/lib/employee-rose-forms/types';

const C = {
  primary: '#1a3d3a',
  gold: '#b8933e',
  muted: '#64748b',
  border: '#e2e8f0',
  bg: '#fafaf9',
} as const;

export type RoseFormPdfEmployee = {
  nameAr: string;
  nameEn: string;
  employeeCode: string;
  nationalId: string;
  positionAr: string;
  departmentAr: string;
  branchAr: string;
  hireDate: string;
};

/**
 * صفّان من «تسمية: قيمة» داخل RTL — العمود الأيمن أولاً في DOM ليظهر يميناً.
 * يُصدَّر لإعادة الاستخدام في نماذج روز الأخرى (مثل سجل إخلاء الطرف).
 */
export function RosePrintPairedTwoColumnRow({
  pairEnd,
  pairStart,
}: {
  pairEnd: { label: string; value: string };
  pairStart: { label: string; value: string };
}) {
  const cell = (p: { label: string; value: string }) => (
    <div style={{ flex: '1 1 48%', minWidth: 140, fontSize: 8, color: '#334155', textAlign: 'right' }}>
      <span style={{ fontWeight: 700 }}>{sanitizePdfText(p.label)}</span>
      <span>:</span>
      <span dir="auto"> {sanitizePdfText(p.value)}</span>
    </div>
  );

  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginTop: 10,
        gap: 8,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      {cell(pairEnd)}
      {cell(pairStart)}
    </div>
  );
}

function TableRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        borderBottom: last ? undefined : `0.5px solid ${C.border}`,
        padding: '5px 6px',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          width: '28%',
          boxSizing: 'border-box',
          fontSize: 8.5,
          fontWeight: 700,
          color: C.primary,
          textAlign: 'right',
          paddingInlineEnd: 4,
        }}
      >
        {sanitizePdfText(label)}
        <span dir="ltr" style={{ unicodeBidi: 'embed' }}>
          :
        </span>
      </div>
      <div
        dir="auto"
        style={{
          width: '72%',
          boxSizing: 'border-box',
          fontSize: 8.5,
          color: '#334155',
          lineHeight: 1.4,
          textAlign: 'right',
          fontFamily: 'Arial, Helvetica, sans-serif',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {sanitizePdfText(value || '—')}
      </div>
    </div>
  );
}

function RecordsDocumentLetterhead({
  companyNameAr,
  companyNameEn,
  titleAr,
}: {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
}) {
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>();
  React.useEffect(() => {
    setLogoSrc(getPdfLogoSrc());
  }, []);

  return (
    <>
      <RoseTradingLetterheadPrint
        logoSrc={logoSrc}
        companyNameAr={companyNameAr}
        companyNameEn={companyNameEn}
      />
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          marginTop: 4,
          marginBottom: 2,
          textAlign: 'right',
          color: C.primary,
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        {sanitizePdfText(titleAr)}
      </div>
    </>
  );
}

function EmployeeStrip({ emp }: { emp: RoseFormPdfEmployee }) {
  return (
    <section>
      <RosePrintPairedTwoColumnRow
        pairEnd={{ label: 'الاسم', value: emp.nameAr }}
        pairStart={{ label: 'الرقم الوظيفي', value: emp.employeeCode }}
      />
      <RosePrintPairedTwoColumnRow
        pairEnd={{ label: 'الوظيفة', value: emp.positionAr }}
        pairStart={{ label: 'الهوية', value: emp.nationalId }}
      />
      <RosePrintPairedTwoColumnRow
        pairEnd={{ label: 'القسم', value: emp.departmentAr }}
        pairStart={{ label: 'الفرع', value: emp.branchAr }}
      />
      <RosePrintPairedTwoColumnRow
        pairEnd={{ label: 'تاريخ الالتحاق', value: emp.hireDate }}
        pairStart={{ label: 'الاسم (إنجليزي)', value: emp.nameEn }}
      />
    </section>
  );
}

function FooterPage() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        paddingTop: 10,
        fontSize: 8,
        color: C.muted,
        textAlign: 'center',
        borderTop: `1px solid ${C.border}`,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <span dir="rtl">صفحة </span>
      <span dir="ltr">1</span>
      <span dir="rtl"> / </span>
      <span dir="ltr">1</span>
    </footer>
  );
}

function SignatureRow({
  endLabel,
  startLabel,
}: {
  endLabel: string;
  startLabel: string;
}) {
  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 28,
        paddingTop: 12,
        gap: 12,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div style={{ width: '42%', borderTop: `0.5px solid ${C.muted}`, paddingTop: 6 }}>
        <div style={{ fontSize: 8, color: C.muted, textAlign: 'center' }}>{sanitizePdfText(endLabel)}</div>
      </div>
      <div style={{ width: '42%', borderTop: `0.5px solid ${C.muted}`, paddingTop: 6 }}>
        <div style={{ fontSize: 8, color: C.muted, textAlign: 'center' }}>{sanitizePdfText(startLabel)}</div>
      </div>
    </div>
  );
}

export type RoseResignationRecordPrintHtmlProps = {
  companyNameAr?: string;
  companyNameEn?: string;
  emp: RoseFormPdfEmployee;
  row: RoseResignationRecord;
};

export const RoseResignationRecordPrintHtml = React.forwardRef<HTMLDivElement, RoseResignationRecordPrintHtmlProps>(
  function RoseResignationRecordPrintHtml(
    { companyNameAr = ROSE_TRADING_COMPANY_AR_DEFAULT, companyNameEn = 'Rose Trading Est.', emp, row },
    ref,
  ) {
    const legal = sanitizePdfText(
      `أنا الموقّع أدناه ${emp.nameAr} أقرّ بتقديم طلب استقالتي على ${companyNameAr}، على أن يسري الطلب اعتباراً من تاريخ ${row.effectiveResignationDate}، وأتعهد بإتمام تسليم العهد والمستندات وفق الإجراءات المعتمدة.`,
    );

    return (
      <div
        ref={ref}
        dir="rtl"
        lang="ar"
        style={{
          width: '210mm',
          maxWidth: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          backgroundColor: C.bg,
          padding: '28px 24px 44px',
          fontSize: 10,
          color: '#1e293b',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '297mm',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <RecordsDocumentLetterhead companyNameAr={companyNameAr} companyNameEn={companyNameEn} titleAr="نموذج استقالة" />
        <EmployeeStrip emp={emp} />

        <div style={{ marginTop: 10, fontSize: 9, fontWeight: 700, color: C.primary, textAlign: 'right', borderInlineStart: `3px solid ${C.gold}`, paddingInlineStart: 6 }}>
          بيانات طلب الاستقالة
        </div>
        <div style={{ marginTop: 6, border: `0.5px solid ${C.border}` }}>
          <TableRow label="تاريخ النموذج" value={row.documentDate} />
          <TableRow label="آخر يوم عمل" value={row.effectiveResignationDate} />
          {row.referenceNo ? <TableRow label="المرجع" value={row.referenceNo} /> : null}
          <TableRow label="سبب الاستقالة" value={row.reasonAr || '—'} />
          <TableRow label="ملاحظات" value={row.notesAr || '—'} last />
        </div>

        <p style={{ marginTop: 14, fontSize: 9.5, lineHeight: 1.55, textAlign: 'right', color: '#1e293b' }}>{legal}</p>

        <SignatureRow endLabel="توقيع الموظف" startLabel={`المعتمد — ${row.approvedByAr || '………'}`} />
        <FooterPage />
      </div>
    );
  },
);

export type RoseSettlementRecordPrintHtmlProps = {
  companyNameAr?: string;
  companyNameEn?: string;
  emp: RoseFormPdfEmployee;
  row: RoseSettlementRecord;
};

export const RoseSettlementRecordPrintHtml = React.forwardRef<HTMLDivElement, RoseSettlementRecordPrintHtmlProps>(
  function RoseSettlementRecordPrintHtml(
    { companyNameAr = ROSE_TRADING_COMPANY_AR_DEFAULT, companyNameEn = 'Rose Trading Est.', emp, row },
    ref,
  ) {
    const defaultDecl = sanitizePdfText(
      `أقر بأنني استلمت كامل مستحقاتي المالية والإدارية المتفق عليها، وأخلو سبيل ${companyNameAr} من أي مطالبة لاحقة تتعلق بهذه الفترة.`,
    );
    const declaration = row.declarationAr?.trim() ? row.declarationAr : defaultDecl;

    return (
      <div
        ref={ref}
        dir="rtl"
        lang="ar"
        style={{
          width: '210mm',
          maxWidth: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          backgroundColor: C.bg,
          padding: '28px 24px 44px',
          fontSize: 10,
          color: '#1e293b',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '297mm',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <RecordsDocumentLetterhead companyNameAr={companyNameAr} companyNameEn={companyNameEn} titleAr="مخالصة نهائية" />
        <EmployeeStrip emp={emp} />

        <div style={{ marginTop: 10, border: `0.5px solid ${C.border}` }}>
          <TableRow label="تاريخ النموذج" value={row.documentDate} />
          <TableRow label="نطاق المخالصة" value={row.settlementPeriodAr || '—'} />
          <TableRow label="الراتب والحقوق" value={row.salaryAndRightsAr || '—'} />
          <TableRow label="الاستقطاعات" value={row.deductionsAr || '—'} />
          <TableRow label="الصافي / البيان" value={row.netAmountAr || '—'} last />
        </div>

        <div style={{ marginTop: 10, fontSize: 9, fontWeight: 700, color: C.primary, textAlign: 'right', borderInlineStart: `3px solid ${C.gold}`, paddingInlineStart: 6 }}>
          إقرار الموظف
        </div>
        <p style={{ marginTop: 8, fontSize: 9.5, lineHeight: 1.55, textAlign: 'right', color: '#1e293b' }}>
          {sanitizePdfText(declaration)}
        </p>

        <SignatureRow endLabel="توقيع الموظف" startLabel="توقيع مسؤول الموارد البشرية" />
        <FooterPage />
      </div>
    );
  },
);

export type RoseExperienceRecordPrintHtmlProps = {
  companyNameAr?: string;
  companyNameEn?: string;
  emp: RoseFormPdfEmployee;
  row: RoseExperienceRecord;
};

export const RoseExperienceRecordPrintHtml = React.forwardRef<HTMLDivElement, RoseExperienceRecordPrintHtmlProps>(
  function RoseExperienceRecordPrintHtml(
    { companyNameAr = ROSE_TRADING_COMPANY_AR_DEFAULT, companyNameEn = 'Rose Trading Est.', emp, row },
    ref,
  ) {
    const recipient = row.issuedToAr?.trim() ? `إلى ${row.issuedToAr} المحترمين،` : 'إلى من يهمه الأمر،';
    const jobTitle = row.jobTitleAr?.trim() ? row.jobTitleAr : emp.positionAr;
    const opening = sanitizePdfText(recipient);
    const para1 = sanitizePdfText('تحيّة طيبة وبعد،');
    const para2 = sanitizePdfText(
      `يُشهد ${companyNameAr} بأن السيد/ة ${emp.nameAr} (${emp.nameEn}) قد عمل لدينا خلال الفترة من ${row.serviceFrom} إلى ${row.serviceTo} بوظيفة: ${jobTitle}، في ${emp.departmentAr} — فرع ${emp.branchAr}.`,
    );

    return (
      <div
        ref={ref}
        dir="rtl"
        lang="ar"
        style={{
          width: '210mm',
          maxWidth: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          backgroundColor: C.bg,
          padding: '28px 24px 44px',
          fontSize: 10,
          color: '#1e293b',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '297mm',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <RecordsDocumentLetterhead companyNameAr={companyNameAr} companyNameEn={companyNameEn} titleAr="شهادة خبرة" />

        <div style={{ marginTop: 6, marginBottom: 8, fontSize: 9.5, lineHeight: 1.55, textAlign: 'right' }}>{opening}</div>
        <div style={{ fontSize: 9.5, lineHeight: 1.55, textAlign: 'right' }}>{para1}</div>
        <div style={{ marginTop: 8, fontSize: 9.5, lineHeight: 1.55, textAlign: 'right' }}>{para2}</div>

        <div style={{ marginTop: 10, fontSize: 9, fontWeight: 700, color: C.primary, textAlign: 'right', borderInlineStart: `3px solid ${C.gold}`, paddingInlineStart: 6 }}>
          طبيعة العمل والمهام
        </div>
        <div style={{ marginTop: 6, fontSize: 9.5, lineHeight: 1.55, textAlign: 'right', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {sanitizePdfText(row.dutiesSummaryAr || '—')}
        </div>

        {row.certificatePurposeAr?.trim() ? (
          <>
            <div style={{ marginTop: 10, fontSize: 9, fontWeight: 700, color: C.primary, textAlign: 'right', borderInlineStart: `3px solid ${C.gold}`, paddingInlineStart: 6 }}>
              الغرض من الشهادة
            </div>
            <div style={{ marginTop: 6, fontSize: 9.5, lineHeight: 1.55, textAlign: 'right', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {sanitizePdfText(row.certificatePurposeAr)}
            </div>
          </>
        ) : null}

        <p style={{ marginTop: 14, fontSize: 9.5, lineHeight: 1.55, textAlign: 'right' }}>
          وقد أُعطيت هذه الشهادة بناءً على طلبه دون تحمّل أدنى مسؤولية تجاه الغير، ولمن يهمه الأمر اتخاذ ما يلزم.
        </p>

        <div dir="rtl" style={{ marginTop: 36, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ width: '42%', borderTop: `0.5px solid ${C.muted}`, paddingTop: 6 }}>
            <div style={{ fontSize: 8, color: C.muted, textAlign: 'center' }}>{sanitizePdfText(`ختم ${companyNameAr}`)}</div>
          </div>
          <div style={{ width: '42%', borderTop: `0.5px solid ${C.muted}`, paddingTop: 6 }}>
            <div style={{ fontSize: 8, color: C.muted, textAlign: 'center' }}>
              تاريخ الإصدار: <span dir="ltr">{sanitizePdfText(row.documentDate)}</span>
            </div>
          </div>
        </div>

        <FooterPage />
      </div>
    );
  },
);

