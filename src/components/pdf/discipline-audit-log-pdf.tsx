'use client';

import * as React from 'react';
import { Document, Page, Text, View, type DocumentProps } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { HR_PDF_FOOTER_BOTTOM, HR_PDF_FOOTER_INSET_X, hrPdfRegisterStyles as HR } from '@/lib/pdf/hr-pdf-base-styles';
import { PdfPageFooter } from '@/components/pdf/pdf-page-footer';

export type DisciplineAuditLogPdfRow = {
  occurredAtDisplay: string;
  actorNameAr: string;
  categoryAr: string;
  actionAr: string;
  recordRefAr: string;
  statusAfterAr: string;
};

export type DisciplineAuditLogPdfProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  filterSummary: string;
  rows: DisciplineAuditLogPdfRow[];
};

const ROWS_PER_PAGE = 22;

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function DisciplineAuditLogPdf({
  companyNameAr,
  companyNameEn,
  titleAr,
  filterSummary,
  rows,
}: DisciplineAuditLogPdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  const pages = chunk(rows, ROWS_PER_PAGE);

  return (
    <Document>
      {pages.map((pageRows, pi) => (
        <Page key={pi} size="A4" style={HR.page}>
          <View style={HR.brand}>
            <Text style={HR.brandAr}>{companyNameAr}</Text>
            <Text style={HR.brandEn}>{companyNameEn}</Text>
          </View>
          <View style={HR.line} />
          <Text style={HR.title}>{titleAr}</Text>
          <Text style={HR.meta}>{filterSummary}</Text>

          <View style={HR.th}>
            <Text style={[HR.lat, { width: '16%', fontWeight: 700, textAlign: 'center', fontSize: 7 }]}>الوقت</Text>
            <Text style={[HR.ar, { width: '18%', fontWeight: 700, textAlign: 'right', paddingHorizontal: 3 }]}>المُعدّل</Text>
            <Text style={[HR.ar, { width: '14%', fontWeight: 700, textAlign: 'center', fontSize: 7 }]}>الفئة</Text>
            <Text style={[HR.ar, { width: '12%', fontWeight: 700, textAlign: 'center', fontSize: 7 }]}>العملية</Text>
            <Text style={[HR.lat, { width: '14%', fontWeight: 700, textAlign: 'center', fontSize: 7 }]}>المرجع</Text>
            <Text style={[HR.ar, { width: '26%', fontWeight: 700, textAlign: 'right', paddingHorizontal: 3 }]}>الحالة بعد العملية</Text>
          </View>

          {pageRows.length === 0 && pi === 0 ? (
            <Text style={[HR.ar, { marginTop: 14, textAlign: 'center', color: '#64748b' }]}>لا توجد عمليات ضمن الفلترة.</Text>
          ) : (
            pageRows.map((r, i) => (
              <View key={`${r.recordRefAr}-${i}`} style={HR.tr} wrap={false}>
                <Text style={[HR.lat, { width: '16%', textAlign: 'center', fontSize: 6 }]}>{r.occurredAtDisplay}</Text>
                <Text style={[HR.ar, { width: '18%', textAlign: 'right', paddingHorizontal: 3, fontSize: 6 }]}>{r.actorNameAr}</Text>
                <Text style={[HR.ar, { width: '14%', textAlign: 'center', fontSize: 6 }]}>{r.categoryAr}</Text>
                <Text style={[HR.ar, { width: '12%', textAlign: 'center', fontSize: 6 }]}>{r.actionAr}</Text>
                <Text style={[HR.lat, { width: '14%', textAlign: 'center', fontSize: 6 }]}>{r.recordRefAr}</Text>
                <Text style={[HR.ar, { width: '26%', textAlign: 'right', paddingHorizontal: 3, fontSize: 6 }]}>
                  {r.statusAfterAr.length > 90 ? `${r.statusAfterAr.slice(0, 90)}…` : r.statusAfterAr}
                </Text>
              </View>
            ))
          )}

          <PdfPageFooter
            pageNum={pi + 1}
            totalPages={pages.length}
            insetX={HR_PDF_FOOTER_INSET_X}
            bottom={HR_PDF_FOOTER_BOTTOM}
            totalLabelAr="إجمالي العمليات"
            totalValue={rows.length}
          />
        </Page>
      ))}
    </Document>
  );
}
