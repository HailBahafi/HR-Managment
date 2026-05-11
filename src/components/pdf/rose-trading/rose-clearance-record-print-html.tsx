'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/lib/pdf/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/lib/pdf/pdf-logo-url';
import type { RoseFormPdfEmployee } from '@/components/pdf/rose-trading/rose-forms-records-print-html';
import { ROSE_TRADING_COMPANY_AR_DEFAULT } from '@/lib/employee-rose-forms/types';
import type { RoseClearanceRecord } from '@/lib/employee-rose-forms/types';

const C = {
  primary: '#1a3d3a',
  gold: '#b8933e',
  muted: '#64748b',
  border: '#e2e8f0',
  bg: '#fafaf9',
} as const;

function CellValue({ value }: { value: string }) {
  const t = sanitizePdfText(value);
  return (
    <div
      dir="rtl"
      style={{
        width: '72%',
        boxSizing: 'border-box',
        fontSize: 8.5,
        color: '#334155',
        lineHeight: 1.4,
        textAlign: 'right',
        fontFamily: 'Arial, Helvetica, sans-serif',
        wordBreak: 'break-word',
      }}
    >
      {t}
    </div>
  );
}

function TableRow({ label, value }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row-reverse',
        alignItems: 'stretch',
        borderBottom: `0.5px solid ${C.border}`,
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
        {label}
      </div>
      <CellValue value={value} />
    </div>
  );
}

/** `end` = يمين الصف (أول عنصر في RTL row-reverse)، `start` = يسار الصف */
function MetaPair({ end, start }: { end: string; start: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginTop: 10,
        gap: 4,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div style={{ flex: '1 1 48%', minWidth: 140, fontSize: 8, color: '#334155', textAlign: 'right' }}>
        {sanitizePdfText(end)}
      </div>
      <div style={{ flex: '1 1 48%', minWidth: 140, fontSize: 8, color: '#334155', textAlign: 'right' }}>
        {sanitizePdfText(start)}
      </div>
    </div>
  );
}

/** نموذج إخلاء طرف — سجل نماذج روز (جدول الأقسام). تصدير html2pdf؛ لا يعتمد على react-pdf. */
export const RoseClearanceRecordPrintHtml = React.forwardRef<
  HTMLDivElement,
  {
    companyNameAr?: string;
    companyNameEn?: string;
    emp: RoseFormPdfEmployee;
    row: RoseClearanceRecord;
  }
>(
  function RoseClearanceRecordPrintHtml(
    {
      companyNameAr = ROSE_TRADING_COMPANY_AR_DEFAULT,
      companyNameEn = 'Rose Trading Est.',
      emp,
      row,
    },
    ref,
  ) {
    const ar = companyNameAr;
    const en = companyNameEn;

    const [logoSrc, setLogoSrc] = React.useState<string | undefined>();
    React.useEffect(() => {
      setLogoSrc(getPdfLogoSrc());
    }, []);

    const closing = sanitizePdfText(
      `يقرّ ${ar} بأن الموظف أعلاه قد أخلّى طرفه من الجهات المذكورة حسب ما هو موضّح، دون الإخلال بأي التزامات نظامية قائمة وقت التوقيع ما لم يُذكر خلاف ذلك.`,
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
        <RoseTradingLetterheadPrint logoSrc={logoSrc} companyNameAr={ar} companyNameEn={en} />
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            marginTop: 4,
            marginBottom: 14,
            textAlign: 'center',
            color: C.primary,
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          نموذج إخلاء طرف
        </div>

        <section>
          <MetaPair end={`الاسم: ${emp.nameAr}`} start={`الرقم الوظيفي: ${emp.employeeCode}`} />
          <MetaPair end={`الوظيفة: ${emp.positionAr}`} start={`الهوية: ${emp.nationalId}`} />
          <MetaPair end={`القسم: ${emp.departmentAr}`} start={`الفرع: ${emp.branchAr}`} />
          <MetaPair end={`تاريخ الالتحاق: ${emp.hireDate}`} start={`الاسم (إنجليزي): ${emp.nameEn}`} />
        </section>

        <div
          style={{
            marginTop: 6,
            border: `0.5px solid ${C.border}`,
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          <TableRow label="تاريخ النموذج" value={row.documentDate} />
          <TableRow label="آخر يوم عمل" value={row.lastWorkingDay} />
          <TableRow label="المالية" value={row.financeClearAr || '—'} />
          <TableRow label="الموارد البشرية" value={row.hrClearAr || '—'} />
          <TableRow label="تقنية المعلومات" value={row.itClearAr || '—'} />
          <TableRow label="الإدارة / العمليات" value={row.adminClearAr || '—'} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'row-reverse',
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
              ملاحظات عامة
            </div>
            <CellValue value={row.notesAr || '—'} />
          </div>
        </div>

        <p
          style={{
            marginTop: 12,
            fontSize: 9.5,
            lineHeight: 1.55,
            textAlign: 'right',
            color: '#1e293b',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          {closing}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row-reverse',
            justifyContent: 'space-between',
            marginTop: 28,
            paddingTop: 12,
            gap: 12,
          }}
        >
          <div style={{ width: '42%', borderTop: `0.5px solid ${C.muted}`, paddingTop: 6 }}>
            <div style={{ fontSize: 8, color: C.muted, textAlign: 'center' }}>ختم وتوقيع الجهة</div>
          </div>
          <div style={{ width: '42%', borderTop: `0.5px solid ${C.muted}`, paddingTop: 6 }}>
            <div style={{ fontSize: 8, color: C.muted, textAlign: 'center' }}>توقيع الموظف</div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 8 }} aria-hidden />

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
      </div>
    );
  },
);
