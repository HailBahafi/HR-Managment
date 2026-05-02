'use client';

import * as React from 'react';
import { Document, Page, Text, View, StyleSheet, type DocumentProps } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { HR_PDF_FOOTER_BOTTOM, HR_PDF_FOOTER_INSET_X, hrPdfRegisterStyles as HR } from '@/lib/pdf/hr-pdf-base-styles';
import { PdfPageFooter } from '@/components/pdf/pdf-page-footer';

export type ViolationCasePdfRow = {
  caseNumber: string;
  employeeNameAr: string;
  typeNameAr: string;
  date: string;
  statusAr: string;
  description: string;
};

export type ViolationCasesRegisterPdfProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  filterSummary: string;
  rows: ViolationCasePdfRow[];
};

const ROWS_PER_PAGE = 20;

const extra = StyleSheet.create({
  desc: { fontFamily: 'Ar', fontSize: 7, color: '#475569', marginTop: 2, textAlign: 'right' },
});

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function isPdfRow(r: unknown): r is ViolationCasePdfRow {
  if (r == null || typeof r !== 'object') return false;
  const o = r as Record<string, unknown>;
  return (
    typeof o.caseNumber === 'string' &&
    typeof o.employeeNameAr === 'string' &&
    typeof o.typeNameAr === 'string' &&
    typeof o.date === 'string' &&
    typeof o.statusAr === 'string' &&
    typeof o.description === 'string'
  );
}

export function ViolationCasesRegisterPdf({
  companyNameAr,
  companyNameEn,
  titleAr,
  filterSummary,
  rows,
}: ViolationCasesRegisterPdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  const cleanRows = React.useMemo(() => rows.filter(isPdfRow), [rows]);
  const pages = chunk(cleanRows, ROWS_PER_PAGE);

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
            <Text style={[HR.lat, { width: '14%', fontWeight: 700, textAlign: 'center', fontSize: 8 }]}>الرقم</Text>
            <Text style={[HR.ar, { width: '22%', fontWeight: 700, textAlign: 'right', paddingHorizontal: 4 }]}>الموظف</Text>
            <Text style={[HR.ar, { width: '20%', fontWeight: 700, textAlign: 'right' }]}>نوع المخالفة</Text>
            <Text style={[HR.lat, { width: '12%', fontWeight: 700, textAlign: 'center', fontSize: 8 }]}>التاريخ</Text>
            <Text style={[HR.ar, { width: '18%', fontWeight: 700, textAlign: 'center' }]}>الحالة</Text>
          </View>

          {pageRows.length === 0 && pi === 0 ? (
            <Text style={[HR.ar, { marginTop: 14, textAlign: 'center', color: '#64748b' }]}>لا توجد مخالفات ضمن الفلترة.</Text>
          ) : (
            pageRows.map((r, i) => (
              <View key={`${r.caseNumber}-${i}`} style={HR.tr} wrap={false}>
                <View style={{ width: '100%', flexDirection: 'column' }}>
                  <View style={{ flexDirection: 'row-reverse' }}>
                    <Text style={[HR.lat, { width: '14%', textAlign: 'center', fontSize: 7 }]}>{r.caseNumber}</Text>
                    <Text style={[HR.ar, { width: '22%', textAlign: 'right', paddingHorizontal: 4, fontSize: 7 }]}>{r.employeeNameAr}</Text>
                    <Text style={[HR.ar, { width: '20%', textAlign: 'right', fontSize: 7 }]}>{r.typeNameAr}</Text>
                    <Text style={[HR.lat, { width: '12%', textAlign: 'center', fontSize: 7 }]}>{r.date}</Text>
                    <Text style={[HR.ar, { width: '18%', textAlign: 'center', fontSize: 7 }]}>{r.statusAr}</Text>
                  </View>
                  {r.description ? (
                    <Text style={extra.desc}>
                      {r.description.length > 160 ? `${r.description.slice(0, 160)}…` : r.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}

          <PdfPageFooter
            pageNum={pi + 1}
            totalPages={pages.length}
            insetX={HR_PDF_FOOTER_INSET_X}
            bottom={HR_PDF_FOOTER_BOTTOM}
            totalLabelAr="إجمالي السجلات"
            totalValue={cleanRows.length}
          />
        </Page>
      ))}
    </Document>
  );
}
