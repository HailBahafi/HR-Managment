'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/lib/pdf/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/lib/pdf/pdf-logo-url';

const RESIGNATION_REASONS_DEFAULT = [
  'ظروف صحية أو عائلية تستدعي ترك العمل.',
  'قبول فرصة عمل أخرى بما يتوافق مع تطلعاتي المهنية.',
  'استكمال دراسة أو تدريب يتطلب انتقالاً جغرافياً أو زمنياً كاملاً.',
  'ظروف شخصية أخرى (أذكرها): ........................................................',
];

const SETTLEMENT_LEGAL =
  'أقر أنا المذكور/ة أدناه بأنني استلمت من مؤسسة روز للتجارة كافة المستحقات المالية والمنافع والمكافآت والبدلات والمستحقات الأخرى الناشئة عن عقد العمل وعلاقة العمل، بما في ذلك راتبي وأي مبالغ أخرى مستحقة لي حتى تاريخ إبراء الذمة هذا، وبأنني لا أملك أي مطالبة أو دعوى أو حقٍّ آخر ضد المؤسسة أو مسؤوليها، وأُبرئ ذمة المؤسسة إبراءً نهائياً وشاملاً لا رجعة فيه.';

const TRAITS_FIXED =
  'أنيق المظهر، حسن المعاملة، مبادر، سريع البديهة، تحمل الضغوط، فرد ممتاز في الفريق.';

const PAGE_STYLE: React.CSSProperties = {
  width: '210mm',
  maxWidth: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
  padding: '28px 24px 44px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  color: '#111',
  minHeight: '297mm',
  display: 'flex',
  flexDirection: 'column',
};

function LabelRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 8,
        borderBottom: '0.5px solid #d1d5db',
        padding: '6px 0',
        alignItems: 'baseline',
      }}
    >
      <div style={{ width: 120, fontSize: 9, fontWeight: 700, textAlign: 'right' }}>{sanitizePdfText(label)}</div>
      <div style={{ flex: 1, fontSize: 9.5, textAlign: 'right', wordBreak: 'break-word' }}>{children}</div>
    </div>
  );
}

function SigBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: 8, color: '#64748b', marginBottom: 28, textAlign: 'center' }}>{sanitizePdfText(label)}</div>
      {value ? (
        <div style={{ marginBottom: 8, fontSize: 9, textAlign: 'center' }}>{sanitizePdfText(value)}</div>
      ) : (
        <div style={{ marginBottom: 8, minHeight: 9 }} />
      )}
      <div style={{ width: '100%', maxWidth: 160, height: 1, backgroundColor: '#000' }} />
    </div>
  );
}

export type RoseResignationFormPrintHtmlProps = {
  logoSrc?: string;
  employeeNameAr: string;
  branchAr: string;
  positionAr: string;
  nationalityAr: string;
  absenceStartHijri: string;
  absenceStartGregorian: string;
  footerApplicantName: string;
  footerDateGregorian: string;
  addressedToAr?: string;
  reasonLinesAr?: string[];
};

export const RoseResignationFormPrintHtml = React.forwardRef<HTMLDivElement, RoseResignationFormPrintHtmlProps>(
  function RoseResignationFormPrintHtml(
    {
      logoSrc: logoSrcProp,
      employeeNameAr,
      branchAr,
      positionAr,
      nationalityAr,
      absenceStartHijri,
      absenceStartGregorian,
      footerApplicantName,
      footerDateGregorian,
      addressedToAr = '',
      reasonLinesAr,
    },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const reasons =
      Array.isArray(reasonLinesAr) && reasonLinesAr.some((x) => x.trim())
        ? reasonLinesAr.map((x) => x.trim()).filter(Boolean)
        : RESIGNATION_REASONS_DEFAULT;

    return (
      <div ref={ref} dir="rtl" lang="ar" style={PAGE_STYLE}>
        <RoseTradingLetterheadPrint logoSrc={logoSrc} />
        <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 10, textDecoration: 'underline' }}>
          نموذج استقالة
        </div>

        {addressedToAr.trim() ? (
          <LabelRow label="إلى / إخوانك الموقّرين:">{sanitizePdfText(addressedToAr)}</LabelRow>
        ) : null}

        <LabelRow label="الاسم:">{sanitizePdfText(employeeNameAr)}</LabelRow>
        <LabelRow label="الفرع:">{sanitizePdfText(branchAr)}</LabelRow>
        <LabelRow label="الوظيفة:">{sanitizePdfText(positionAr)}</LabelRow>
        <LabelRow label="الجنسية:">{sanitizePdfText(nationalityAr)}</LabelRow>

        <div style={{ marginTop: 12, fontSize: 10, fontWeight: 700, textAlign: 'right' }}>
          أسباب تقديم الاستقالة (يُحدد ما ينطبق):
        </div>
        <ul style={{ marginTop: 6, marginBottom: 10, padding: 0, listStyle: 'none' }}>
          {reasons.map((line, i) => (
            <li key={i} style={{ fontSize: 9.5, lineHeight: 1.55, textAlign: 'right', marginTop: 3 }}>
              {`${'\u2022'} ${sanitizePdfText(line)}`}
            </li>
          ))}
        </ul>

        <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'right', marginTop: 6 }}>
          بداية غيابي عن العمل اعتباراً من:
        </div>
        <LabelRow label="التاريخ الهجري:">
          <span dir="ltr">{sanitizePdfText(absenceStartHijri)}</span>
        </LabelRow>
        <LabelRow label="التاريخ الميلادي:">
          <span dir="ltr">{sanitizePdfText(absenceStartGregorian)}</span>
        </LabelRow>

        <p style={{ marginTop: 12, fontSize: 9.5, lineHeight: 1.6, textAlign: 'right' }}>
          أقر بصحة البيانات أعلاه، وأتحمل المسؤولية عن أي خلاف يترتب على عدم دقتها.
        </p>

        <div style={{ flex: 1, minHeight: 10 }} aria-hidden />

        <div dir="rtl" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 24 }}>
          <SigBlock label="اسم مقدم الطلب" value={footerApplicantName} />
          <SigBlock label="التوقيع" />
          <SigBlock label="التاريخ" value={footerDateGregorian} />
        </div>
      </div>
    );
  },
);

export type RoseFinalSettlementFormPrintHtmlProps = {
  logoSrc?: string;
  employeeNameAr: string;
  nationalityAr: string;
  nationalId: string;
  serviceStartGregorian: string;
  serviceStartHijri: string;
  footerName: string;
  footerDateGregorian: string;
};

export const RoseFinalSettlementFormPrintHtml = React.forwardRef<HTMLDivElement, RoseFinalSettlementFormPrintHtmlProps>(
  function RoseFinalSettlementFormPrintHtml(
    {
      logoSrc: logoSrcProp,
      employeeNameAr,
      nationalityAr,
      nationalId,
      serviceStartGregorian,
      serviceStartHijri,
      footerName,
      footerDateGregorian,
    },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const intro = `أقر أنا / ${sanitizePdfText(employeeNameAr)}، الجنسية ${sanitizePdfText(nationalityAr)}، بموجب بطاقة أحوال / إقامة رقم ${sanitizePdfText(nationalId)}، بأنني باشرت العمل لدى مؤسسة روز للتجارة اعتباراً من التاريخ الميلادي: ${sanitizePdfText(serviceStartGregorian)} (الهجري: ${sanitizePdfText(serviceStartHijri)})، وأقر بما يلي:`;

    return (
      <div ref={ref} dir="rtl" lang="ar" style={PAGE_STYLE}>
        <RoseTradingLetterheadPrint logoSrc={logoSrc} />
        <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 10, textDecoration: 'underline' }}>
          نموذج مخالصة نهائية
        </div>

        <p style={{ fontSize: 9.5, lineHeight: 1.7, textAlign: 'right', marginTop: 4 }}>{intro}</p>
        <p style={{ fontSize: 9.5, lineHeight: 1.7, textAlign: 'right', marginTop: 12 }}>{SETTLEMENT_LEGAL}</p>

        <div style={{ flex: 1, minHeight: 10 }} aria-hidden />

        <div dir="rtl" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 24 }}>
          <SigBlock label="الاسم" value={footerName} />
          <SigBlock label="التوقيع" />
          <SigBlock label="التاريخ" value={footerDateGregorian} />
        </div>
      </div>
    );
  },
);

export type RoseExperienceCertificatePrintHtmlProps = {
  logoSrc?: string;
  certificateDateGregorian: string;
  recipientLineAr: string;
  departmentAr: string;
  jobTitleAr: string;
  startDateGregorian: string;
  endDateGregorian: string;
  workedVerbAr: 'عمل' | 'عملت';
  performanceClosingAr: string;
};

export const RoseExperienceCertificatePrintHtml = React.forwardRef<HTMLDivElement, RoseExperienceCertificatePrintHtmlProps>(
  function RoseExperienceCertificatePrintHtml(
    {
      logoSrc: logoSrcProp,
      certificateDateGregorian,
      recipientLineAr,
      departmentAr,
      jobTitleAr,
      startDateGregorian,
      endDateGregorian,
      workedVerbAr,
      performanceClosingAr,
    },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const para = `تشهد مؤسسة روز للتجارة بأن ${sanitizePdfText(recipientLineAr)} قد ${workedVerbAr} لديها في قسم ${sanitizePdfText(departmentAr)} بمنصب ${sanitizePdfText(jobTitleAr)} خلال الفترة من ${sanitizePdfText(startDateGregorian)} إلى ${sanitizePdfText(endDateGregorian)}، ${sanitizePdfText(performanceClosingAr)}`;

    return (
      <div ref={ref} dir="rtl" lang="ar" style={PAGE_STYLE}>
        <RoseTradingLetterheadPrint logoSrc={logoSrc} />
        <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 10, textDecoration: 'underline' }}>
          شهادة خبرة
        </div>

        <LabelRow label="التاريخ:">
          <span dir="ltr">{sanitizePdfText(certificateDateGregorian)}</span>
        </LabelRow>

        <p style={{ marginTop: 12, fontSize: 9.5, lineHeight: 1.7, textAlign: 'right' }}>{para}</p>

        <div style={{ marginTop: 14, fontSize: 10, fontWeight: 700, textAlign: 'right' }}>
          صفات أداء لاحظناها خلال فترة الخدمة:
        </div>
        <p style={{ marginTop: 6, fontSize: 9.5, lineHeight: 1.7, textAlign: 'right' }}>{TRAITS_FIXED}</p>

        <p style={{ marginTop: 16, fontSize: 9.5, lineHeight: 1.7, textAlign: 'right' }}>
          لمن يهمه الأمر — تُمنح هذه الشهادة بناءً على طلب صاحبها دون أن يترتب على المؤسسة أي التزامات إضافية.
        </p>

        <div style={{ flex: 1, minHeight: 10 }} aria-hidden />

        <div style={{ alignItems: 'center', marginTop: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 9, color: '#64748b', marginBottom: 10 }}>توقيع المدير العام</div>
          <div style={{ width: '100%', maxWidth: 220, height: 1, backgroundColor: '#000' }} />
          <div style={{ marginTop: 10, fontSize: 8.5, color: '#64748b', textAlign: 'center' }}>
            <span dir="ltr">{sanitizePdfText(certificateDateGregorian)}</span>
          </div>
        </div>
      </div>
    );
  },
);

