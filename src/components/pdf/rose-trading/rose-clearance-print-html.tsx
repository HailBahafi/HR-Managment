'use client';

import * as React from 'react';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';

export type RoseClearancePrintHtmlProps = {
  logoSrc?: string;
  companyNameAr: string;
  companyNameEn?: string | null;
};

/**
 * Blank clearance form for print/download — user fills fields by hand.
 * No underlines; blank space after labels (paper style).
 */
export const RoseClearancePrintHtml = React.forwardRef<HTMLDivElement, RoseClearancePrintHtmlProps>(
  function RoseClearancePrintHtml(
    {
      logoSrc: logoSrcProp,
      companyNameAr,
      companyNameEn,
    },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const company = sanitizePdfText(companyNameAr.trim() || '—');
    const font: React.CSSProperties = { fontFamily: 'Arial, Helvetica, sans-serif' };

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
          padding: '28px 36px 48px',
          fontSize: 16,
          color: '#111111',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '297mm',
          overflow: 'hidden',
          ...font,
        }}
      >
        <RosePdfWatermark logoSrc={logoSrc} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
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
              textDecoration: 'underline',
              marginTop: 8,
              marginBottom: 36,
              ...font,
            }}
          >
            إخلاء طرف موظفة
          </div>

          <div style={{ fontSize: 16, lineHeight: 2.4, textAlign: 'right', marginBottom: 8, ...font }}>
            <div>
              <span style={{ fontWeight: 700 }}>الموظفة</span>
              <span> : </span>
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>هوية رقم</span>
              <span> : </span>
            </div>
          </div>

          <p style={{ fontSize: 16, lineHeight: 2, textAlign: 'right', margin: '24px 0 12px', ...font }}>
            أطلب من {company} إخلاء طرف نظراً للأسباب التالية :
          </p>

          <div style={{ marginBottom: 24, paddingInlineStart: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  fontSize: 16,
                  lineHeight: 2.4,
                  textAlign: 'right',
                  minHeight: 28,
                  ...font,
                }}
              >
                .
              </div>
            ))}
          </div>

          <p style={{ fontSize: 16, lineHeight: 2, textAlign: 'justify', margin: '8px 0 0', ...font }}>
            وبهذا أكون قد أبرأت ذمة المؤسسة وسقط حق المطالبة حالياً أو مستقبلاً فيما يتعلق بعقد العمل أو غيره ..
          </p>

          <div
            style={{
              marginTop: 72,
              alignSelf: 'flex-start',
              textAlign: 'right',
              fontSize: 16,
              lineHeight: 2.6,
              ...font,
            }}
          >
            <div>
              <span style={{ fontWeight: 700 }}>الاسم</span>
              <span> : </span>
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>التاريخ</span>
              <span> : </span>
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>التوقيع</span>
              <span> : </span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
