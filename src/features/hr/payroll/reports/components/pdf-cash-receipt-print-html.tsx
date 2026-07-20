'use client';

import * as React from 'react';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';

/** Kept for legacy dialog imports — blank form no longer uses reasons. */
export type CashReceiptReason =
  | 'salary'
  | 'advance'
  | 'allowance'
  | 'overtime'
  | 'storage_deficit'
  | 'other';

export const CASH_RECEIPT_REASON_LABELS: Record<CashReceiptReason, string> = {
  salary: 'استلام راتب شهر',
  advance: 'سلفة',
  allowance: 'بدل',
  overtime: 'بدل إضافي لمدة',
  storage_deficit: 'بدل تحمل عجز مخزون شهر',
  other: 'أخرى',
};

/** @deprecated Use `CASH_RECEIPT_REASON_LABELS` */
export const REASON_LABELS = CASH_RECEIPT_REASON_LABELS;

export type CashReceiptPrintHtmlProps = {
  logoSrc?: string;
  companyNameAr: string;
  companyNameEn?: string | null;
};

const font: React.CSSProperties = { fontFamily: 'Arial, Helvetica, sans-serif' };
const DOTS = '........................................................................';
const DOTS_SHORT = '....................................';
const DOTS_MED = '....................';

function Checkbox() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 12,
        height: 12,
        border: '1.5px solid #111',
        marginInlineStart: 8,
        marginInlineEnd: 2,
        flexShrink: 0,
        verticalAlign: 'middle',
        boxSizing: 'border-box',
      }}
    />
  );
}

function ReasonRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        fontSize: 14,
        lineHeight: 1.85,
        marginBottom: 6,
        textAlign: 'right',
        ...font,
      }}
    >
      <Checkbox />
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}

function DottedField({ label, dots = DOTS }: { label: string; dots?: string }) {
  return (
    <div style={{ fontSize: 15, lineHeight: 2.1, textAlign: 'right', marginBottom: 4, ...font }}>
      {label} {dots}
    </div>
  );
}

/**
 * Blank cash receipt form — matches paper layout.
 * Letterhead kept; fields left blank for handwritten fill-in.
 */
export const CashReceiptPrintHtml = React.forwardRef<HTMLDivElement, CashReceiptPrintHtmlProps>(
  function CashReceiptPrintHtml({ logoSrc: logoSrcProp, companyNameAr, companyNameEn }, ref) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    return (
      <div
        ref={ref}
        dir="rtl"
        lang="ar"
        style={{
          position: 'relative',
          width: '210mm',
          maxWidth: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          padding: '26px 36px 40px',
          fontSize: 15,
          color: '#111111',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '297mm',
          overflow: 'hidden',
          ...font,
        }}
      >
        <RosePdfWatermark logoSrc={logoSrc} />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
        <RoseTradingLetterheadPrint
          logoSrc={logoSrc}
          companyNameAr={companyNameAr}
          companyNameEn={companyNameEn ?? undefined}
        />

        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            textAlign: 'center',
            marginTop: 12,
            marginBottom: 28,
            ...font,
          }}
        >
          سند استلام نقدي
        </div>

        {/* Opening lines */}
        <div style={{ fontSize: 15, lineHeight: 2.15, textAlign: 'right', marginBottom: 6, ...font }}>
          استلمت انا / {DOTS} الموقعة أدناه
        </div>
        <div style={{ fontSize: 15, lineHeight: 2.15, textAlign: 'right', marginBottom: 6, ...font }}>
          من مؤسسة {DOTS} ، فرع {DOTS_SHORT}
        </div>
        <div style={{ fontSize: 15, lineHeight: 2.15, textAlign: 'right', marginBottom: 18, ...font }}>
          مبلغ وقدره ( {DOTS_SHORT} ريال ) كتابة ( {DOTS} ريال سعودي فقط لا غير )
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, textAlign: 'right', marginBottom: 12, ...font }}>
          وذلك مقابل :
        </div>

        {/* Two-column reasons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px 28px',
            marginBottom: 8,
          }}
        >
          {/* Right column (first in RTL) */}
          <div>
            <ReasonRow>
              استلام راتب شهر {DOTS_MED}/{DOTS_MED} 20م
            </ReasonRow>
            <ReasonRow>
              بدل إضافي لمدة {DOTS_MED} يوم
            </ReasonRow>
            <ReasonRow>
              سحب نقدي يخصم من راتب شهر {DOTS_MED}/{DOTS_MED} 20م
            </ReasonRow> 
          </div>
          {/* Left column */}
          <div>
            <ReasonRow>
              بدل مواصلات شهر {DOTS_MED}/{DOTS_MED} 20 م
            </ReasonRow>
            <ReasonRow>
              بدل تحمل عجز مخزون شهر {DOTS_MED}/{DOTS_MED} 20 م
            </ReasonRow>
          </div>
        </div>

        {/* Other — full width */}
        <div style={{ marginBottom: 8 }}>
          <ReasonRow>
           اخرى      حدد البيان : {DOTS}
          </ReasonRow>
          <div style={{ fontSize: 15, lineHeight: 2.2, textAlign: 'right', paddingInlineStart: 22, ...font }}>
            {DOTS}
            {DOTS}
          </div>
          <div style={{ fontSize: 15, lineHeight: 2.2, textAlign: 'right', paddingInlineStart: 22, ...font }}>
            {DOTS}
            {DOTS}
          </div>
        </div>

        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            textAlign: 'right',
            marginTop: 28,
            marginBottom: 16,
            ...font,
          }}
        >
          وعلى ذلك جرى التوقيع ،،،،
        </div>

        <div style={{ marginBottom: 28 }}>
          <DottedField label="الاسم :" />
          <DottedField label="التوقيع :" />
          <DottedField label="التاريخ :" />
        </div>

        {/* Approval footer — RTL: right to left = branch → HR → supervisor → finance */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginTop: 40,
          }}
        >
          {[
            'توقيع مسئول الفرع',
            'توقيع ادارة شؤون الموظفين',
            'توقيع المشرف العام',
            'توقيع المدير المالي',
          ].map((label) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 28, ...font }}>{label}</div>
              <div
                style={{
                  borderBottom: '1px dotted #333',
                  width: '85%',
                  margin: '0 auto',
                  minHeight: 1,
                }}
              />
            </div>
          ))}
        </div>
        </div>
      </div>
    );
  },
);
