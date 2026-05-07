'use client';

import * as React from 'react';
import { Document, Page, Text, View, type DocumentProps } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { HR_PDF_FOOTER_BOTTOM, HR_PDF_FOOTER_INSET_X, hrPdfRegisterStyles as S } from '@/lib/pdf/hr-pdf-base-styles';
import { PdfHrBrandHeader } from '@/components/pdf/pdf-hr-brand-header';
import { PdfPageFooter } from '@/components/pdf/pdf-page-footer';
import { PdfArLatInline } from '@/components/pdf/pdf-bidi-helpers';

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
          <PdfHrBrandHeader companyNameAr={companyNameAr} companyNameEn={companyNameEn} />
          <Text style={S.title}>{titleAr}</Text>
          <View style={{ marginBottom: 8 }}>
            <PdfArLatInline
              text={filterSummary}
              arStyle={{ fontFamily: 'Ar', fontSize: 8, color: '#444', textAlign: 'right' }}
              latStyle={{ fontSize: 8, color: '#444', textAlign: 'right' }}
            />
          </View>

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
                <View style={{ width: '16%', paddingHorizontal: 2, alignItems: 'flex-end' }}>
                  <PdfArLatInline
                    text={r.name}
                    arStyle={{ fontFamily: 'Ar', fontSize: 7, textAlign: 'right' }}
                    latStyle={{ fontSize: 7, textAlign: 'right' }}
                  />
                </View>
                <Text style={[S.lat, { width: '9%', textAlign: 'center', fontSize: 7 }]}>{r.employeeCode}</Text>
                <View style={{ width: '14%', alignItems: 'flex-end' }}>
                  <PdfArLatInline
                    text={r.position}
                    arStyle={{ fontFamily: 'Ar', fontSize: 6, textAlign: 'right' }}
                    latStyle={{ fontSize: 6, textAlign: 'right' }}
                  />
                </View>
                <View style={{ width: '12%', alignItems: 'flex-end' }}>
                  <PdfArLatInline
                    text={r.department}
                    arStyle={{ fontFamily: 'Ar', fontSize: 6, textAlign: 'right' }}
                    latStyle={{ fontSize: 6, textAlign: 'right' }}
                  />
                </View>
                <View style={{ width: '10%', alignItems: 'flex-end' }}>
                  <PdfArLatInline
                    text={r.branchCity}
                    arStyle={{ fontFamily: 'Ar', fontSize: 6, textAlign: 'right' }}
                    latStyle={{ fontSize: 6, textAlign: 'right' }}
                  />
                </View>
                <View style={{ width: '10%', alignItems: 'center' }}>
                  <PdfArLatInline
                    text={r.contractType}
                    arStyle={{ fontFamily: 'Ar', fontSize: 6, textAlign: 'center' }}
                    latStyle={{ fontSize: 6, textAlign: 'center' }}
                    rowStyle={{ justifyContent: 'center' }}
                  />
                </View>
                <Text style={[S.lat, { width: '9%', textAlign: 'center', fontSize: 6 }]}>{r.startDate}</Text>
                <Text style={[S.lat, { width: '10%', textAlign: 'center', fontSize: 7 }]}>{r.baseSalary}</Text>
                <View style={{ width: '10%', alignItems: 'center' }}>
                  <PdfArLatInline
                    text={r.statusAr}
                    arStyle={{ fontFamily: 'Ar', fontSize: 6, textAlign: 'center' }}
                    latStyle={{ fontSize: 6, textAlign: 'center' }}
                    rowStyle={{ justifyContent: 'center' }}
                  />
                </View>
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
