'use client';

import * as React from 'react';
import { Document, Page, Text, View, type DocumentProps } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { HR_PDF_FOOTER_BOTTOM, HR_PDF_FOOTER_INSET_X, hrPdfRegisterStyles as S } from '@/lib/pdf/hr-pdf-base-styles';
import { PdfPageFooter } from '@/components/pdf/pdf-page-footer';

export type EmployeeRegisterPdfRow = {
  name: string;
  employeeCode: string;
  position: string;
  department: string;
  branchCity: string;
  contractType: string;
  startDate: string;
  baseSalary: string;
  statusAr: string;
};

export type EmployeesRegisterPdfProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  filterSummary: string;
  rows: EmployeeRegisterPdfRow[];
};

const ROWS_PER_PAGE = 18;

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function EmployeesRegisterPdf({
  companyNameAr,
  companyNameEn,
  titleAr,
  filterSummary,
  rows,
}: EmployeesRegisterPdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  const pages = chunk(rows, ROWS_PER_PAGE);

  return (
    <Document>
      {pages.map((pageRows, pi) => (
        <Page key={pi} size="A4" style={S.page} orientation="landscape">
          <View style={S.brand}>
            <Text style={S.brandAr}>{companyNameAr}</Text>
            <Text style={S.brandEn}>{companyNameEn}</Text>
          </View>
          <View style={S.line} />
          <Text style={S.title}>{titleAr}</Text>
          <Text style={S.meta}>{filterSummary}</Text>

          <View style={S.th}>
            <Text style={[S.ar, { width: '16%', fontWeight: 700, textAlign: 'right', paddingHorizontal: 2 }]}>الموظف</Text>
            <Text style={[S.ar, { width: '9%', fontWeight: 700, textAlign: 'center' }]}>الرقم</Text>
            <Text style={[S.ar, { width: '14%', fontWeight: 700, textAlign: 'right' }]}>المسمى</Text>
            <Text style={[S.ar, { width: '12%', fontWeight: 700, textAlign: 'right' }]}>القسم</Text>
            <Text style={[S.ar, { width: '10%', fontWeight: 700, textAlign: 'right' }]}>الفرع</Text>
            <Text style={[S.ar, { width: '10%', fontWeight: 700, textAlign: 'center' }]}>العقد</Text>
            <Text style={[S.ar, { width: '9%', fontWeight: 700, textAlign: 'center' }]}>الالتحاق</Text>
            <Text style={[S.ar, { width: '10%', fontWeight: 700, textAlign: 'center' }]}>الراتب</Text>
            <Text style={[S.ar, { width: '10%', fontWeight: 700, textAlign: 'center' }]}>الحالة</Text>
          </View>

          {pageRows.length === 0 && pi === 0 ? (
            <Text style={[S.ar, { marginTop: 14, textAlign: 'center', color: '#64748b' }]}>لا يوجد موظفون ضمن الفلترة.</Text>
          ) : (
            pageRows.map((r, i) => (
              <View key={`${r.employeeCode}-${i}`} style={S.tr} wrap={false}>
                <Text style={[S.ar, { width: '16%', textAlign: 'right', paddingHorizontal: 2, fontSize: 7 }]}>{r.name}</Text>
                <Text style={[S.lat, { width: '9%', textAlign: 'center', fontSize: 7 }]}>{r.employeeCode}</Text>
                <Text style={[S.ar, { width: '14%', textAlign: 'right', fontSize: 6 }]}>{r.position}</Text>
                <Text style={[S.ar, { width: '12%', textAlign: 'right', fontSize: 6 }]}>{r.department}</Text>
                <Text style={[S.ar, { width: '10%', textAlign: 'right', fontSize: 6 }]}>{r.branchCity}</Text>
                <Text style={[S.ar, { width: '10%', textAlign: 'center', fontSize: 6 }]}>{r.contractType}</Text>
                <Text style={[S.lat, { width: '9%', textAlign: 'center', fontSize: 6 }]}>{r.startDate}</Text>
                <Text style={[S.lat, { width: '10%', textAlign: 'center', fontSize: 7 }]}>{r.baseSalary}</Text>
                <Text style={[S.ar, { width: '10%', textAlign: 'center', fontSize: 6 }]}>{r.statusAr}</Text>
              </View>
            ))
          )}

          <PdfPageFooter
            pageNum={pi + 1}
            totalPages={pages.length}
            insetX={HR_PDF_FOOTER_INSET_X}
            bottom={HR_PDF_FOOTER_BOTTOM}
            totalLabelAr="إجمالي الموظفين"
            totalValue={rows.length}
          />
        </Page>
      ))}
    </Document>
  );
}
