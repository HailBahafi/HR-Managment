'use client';

import * as React from 'react';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';

export type RoseResignationPrintHtmlProps = {
  logoSrc?: string;
  companyNameAr: string;
  companyNameEn?: string | null;
};

const BORDER = '#111111';
const font: React.CSSProperties = { fontFamily: 'Arial, Helvetica, sans-serif' };

function InfoCell({ label, showTop, showStart }: { label: string; showTop?: boolean; showStart?: boolean }) {
  const edge = `1px solid ${BORDER}`;
  return (
    <>
      <div
        style={{
          borderBottom: edge,
          borderInlineEnd: edge,
          borderTop: showTop ? edge : 'none',
          borderInlineStart: showStart ? edge : 'none',
          padding: '8px 10px',
          fontWeight: 700,
          fontSize: 14,
          textAlign: 'right',
          backgroundColor: '#fff',
          ...font,
        }}
      >
        {label}
      </div>
      <div
        style={{
          borderBottom: edge,
          borderInlineEnd: edge,
          borderTop: showTop ? edge : 'none',
          borderInlineStart: 'none',
          padding: '8px 10px',
          minHeight: 34,
          backgroundColor: '#fff',
        }}
      />
    </>
  );
}

function FooterRow({ label, isFirst }: { label: string; isFirst?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div
        style={{
          width: '32%',
          border: `1px solid ${BORDER}`,
          borderTop: isFirst ? `1px solid ${BORDER}` : 'none',
          padding: '10px 12px',
          fontWeight: 700,
          fontSize: 14,
          textAlign: 'right',
          ...font,
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          border: `1px solid ${BORDER}`,
          borderTop: isFirst ? `1px solid ${BORDER}` : 'none',
          borderInlineStart: 'none',
          minHeight: 36,
        }}
      />
    </div>
  );
}

/**
 * Blank resignation form — matches paper layout.
 * Letterhead kept; no employee auto-fill (handwritten fields).
 */
export const RoseResignationPrintHtml = React.forwardRef<HTMLDivElement, RoseResignationPrintHtmlProps>(
  function RoseResignationPrintHtml(
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
          padding: '26px 32px 40px',
          fontSize: 15,
          color: '#111111',
          overflow: 'hidden',
          ...font,
        }}
      >
        <RosePdfWatermark logoSrc={logoSrc} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <RoseTradingLetterheadPrint
            logoSrc={logoSrc}
            companyNameAr={companyNameAr}
            companyNameEn={companyNameEn ?? undefined}
          />

          {/* الموضوع / استقالة */}
          <div
            style={{
              width: 'fit-content',
              marginInline: 'auto',
              border: `1.5px solid ${BORDER}`,
              padding: '8px 28px',
              marginTop: 28,
              marginBottom: 48,
              fontSize: 17,
              fontWeight: 700,
              textAlign: 'center',
              ...font,
            }}
          >
            الموضوع / استقالة
          </div>

          {/* Info grid: الاسم | blank | الفرع | blank / الوظيفة | blank | الجنسية | blank */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '18% 32% 18% 32%',
              marginBottom: 48,
            }}
          >
            <InfoCell label="الاسم" showTop showStart />
            <InfoCell label="الفرع" showTop />
            <InfoCell label="الوظيفة" showStart />
            <InfoCell label="الجنسية" />
          </div>

          <div style={{ fontSize: 15, lineHeight: 1.9, textAlign: 'right', marginBottom: 12, ...font }}>
            إلى السيد مدير/{' '}
            <span style={{ fontWeight: 700 }}>{company}</span>
          </div>
          <div style={{ fontSize: 15, textAlign: 'center', marginBottom: 48, ...font }}>
            بعد التحية ،،،
          </div>

          {/* Reasons box */}
          <div
            style={{
              border: `1.5px solid ${BORDER}`,
              padding: '12px 14px 16px',
              marginBottom: 48,
              minHeight: 120,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, textAlign: 'right', marginBottom: 10, ...font }}>
              نظراً للأسباب التالية :
            </div>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  fontSize: 15,
                  lineHeight: 2.2,
                  textAlign: 'right',
                  minHeight: 26,
                  ...font,
                }}
              >
                {n}-
              </div>
            ))}
          </div>

          <p style={{ fontSize: 15, lineHeight: 2, textAlign: 'right', margin: '0 0 16px', ...font }}>
            أتقدم لسيادتكم بطلب استقالتي عن العمل اعتباراً من تاريخ :&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;هـ
          </p>
          <p style={{ fontSize: 15, lineHeight: 2, textAlign: 'right', margin: '0 0 72px', ...font }}>
            الموافق :&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;م راجياً من سيادتكم قبول طلبي هذا متمنية لكم التوفيق .
          </p>

          {/* Footer signature table */}
          <div>
            <FooterRow label="اسم مقدمة الطلب" isFirst />
            <FooterRow label="التوقيع" />
            <FooterRow label="التاريخ" />
          </div>
        </div>
      </div>
    );
  },
);
