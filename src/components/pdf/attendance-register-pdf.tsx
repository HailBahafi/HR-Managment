'use client';

import * as React from 'react';
import { Document, Page, Text, View, StyleSheet, type DocumentProps } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { HR_PDF_FOOTER_BOTTOM, HR_PDF_FOOTER_INSET_X, hrPdfRegisterStyles as HR } from '@/lib/pdf/hr-pdf-base-styles';
import { PdfPageFooter } from '@/components/pdf/pdf-page-footer';

export type AttendanceRegisterPdfRow = {
  employeeName: string;
  date: string;
  statusLabel: string;
  worked: string;
  late: string;
};

export type AttendanceRegisterPdfProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  periodDateFrom: string;
  periodDateTo: string;
  employeesFilterAll: boolean;
  employeesSelectedCount: number;
  statusFilterLabelAr: string;
  rows: AttendanceRegisterPdfRow[];
};

/** Leave room for header + footer so rows never overlap the footer layer in PDF.js. */
const ROWS_PER_PAGE = 24;

/** Column cell styles (register baseline uses fontSize 7). */
const col = StyleSheet.create({
  c1: { fontFamily: 'Ar', width: '22%', textAlign: 'right', paddingHorizontal: 4, fontSize: 7 },
  c2: { width: '14%', textAlign: 'center', fontFamily: 'Lat', direction: 'ltr', fontSize: 7 },
  c3: { fontFamily: 'Ar', width: '18%', textAlign: 'right', paddingHorizontal: 4, fontSize: 7 },
  c4: { width: '14%', textAlign: 'center', fontFamily: 'Lat', fontSize: 7 },
  c5: { width: '14%', textAlign: 'center', fontFamily: 'Lat', fontSize: 7 },
});

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function AttendanceRegisterPdf({
  companyNameAr,
  companyNameEn,
  titleAr,
  periodDateFrom,
  periodDateTo,
  employeesFilterAll,
  employeesSelectedCount,
  statusFilterLabelAr,
  rows,
}: AttendanceRegisterPdfProps): React.ReactElement<DocumentProps> {
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
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', marginBottom: 8, justifyContent: 'flex-end' }}>
            <Text style={HR.ar}>الفترة: </Text>
            <Text style={HR.lat}>{periodDateFrom}</Text>
            <Text style={HR.ar}> — </Text>
            <Text style={HR.lat}>{periodDateTo}</Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', marginBottom: 8, justifyContent: 'flex-end' }}>
            <Text style={HR.ar}>الموظفون: </Text>
            {employeesFilterAll ? (
              <Text style={HR.ar}>جميع الموظفين ضمن البحث</Text>
            ) : (
              <>
                <Text style={HR.lat}>{String(employeesSelectedCount)}</Text>
                <Text style={HR.ar}> موظف محدد</Text>
              </>
            )}
            <Text style={HR.ar}> · الحالة: </Text>
            <Text style={HR.ar}>{statusFilterLabelAr}</Text>
          </View>

          <View style={HR.th}>
            <Text style={[col.c1, { fontWeight: 700 }]}>الموظف</Text>
            <Text style={[HR.lat, { width: '14%', textAlign: 'center', fontWeight: 700, fontSize: 8 }]}>التاريخ</Text>
            <Text style={[col.c3, { fontWeight: 700 }]}>الحالة</Text>
            <Text style={[HR.ar, { width: '14%', textAlign: 'center', fontWeight: 700, fontSize: 8 }]}>دقائق العمل</Text>
            <Text style={[HR.ar, { width: '14%', textAlign: 'center', fontWeight: 700, fontSize: 8 }]}>التأخير</Text>
          </View>

          {pageRows.length === 0 && pi === 0 ? (
            <Text style={[HR.ar, { marginTop: 14, textAlign: 'center', color: '#64748b' }]}>لا توجد سجلات ضمن الفلترة.</Text>
          ) : (
            pageRows.map((r, i) => (
              <View key={`${r.date}-${r.employeeName}-${i}`} style={HR.tr} wrap={false}>
                <Text style={col.c1}>{r.employeeName}</Text>
                <Text style={col.c2}>{r.date}</Text>
                <Text style={col.c3}>{r.statusLabel}</Text>
                <Text style={col.c4}>{r.worked}</Text>
                <Text style={col.c5}>{r.late}</Text>
              </View>
            ))
          )}

          <PdfPageFooter
            pageNum={pi + 1}
            totalPages={pages.length}
            insetX={HR_PDF_FOOTER_INSET_X}
            bottom={HR_PDF_FOOTER_BOTTOM}
            totalLabelAr="إجمالي السجلات"
            totalValue={rows.length}
          />
        </Page>
      ))}
    </Document>
  );
}
