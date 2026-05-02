'use client';

import * as React from 'react';
import { Document, Page, Text, View, StyleSheet, type DocumentProps } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { HR_PDF_FOOTER_BOTTOM, HR_PDF_FOOTER_INSET_X, hrPdfRegisterStyles as HR } from '@/lib/pdf/hr-pdf-base-styles';
import { PdfPageFooter } from '@/components/pdf/pdf-page-footer';

export type LeavesAnalyticsLeaveRowPdf = {
  employeeNameAr: string;
  start: string;
  end: string;
  typeAr: string;
  statusAr: string;
  workingDays: number;
};

export type LeavesAnalyticsPdfProps = {
  companyNameAr: string;
  companyNameEn: string;
  filterSummary: string;
  kpi: { total: number; approved: number; pending: number; workDays: number };
  leaveRows: LeavesAnalyticsLeaveRowPdf[];
  employeeRows: { nameAr: string; annual: string; sick: string; branch: string }[];
};

const PER_PAGE = 22;

const S = StyleSheet.create({
  kpiRow: { flexDirection: 'row-reverse', gap: 6, marginBottom: 10 },
  kpi: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 6,
    alignItems: 'center',
  },
  kpiV: { fontSize: 11, fontFamily: 'Lat', fontWeight: 700 },
  kpiL: { fontFamily: 'Ar', fontSize: 7, color: '#64748b', marginTop: 2 },
  sec: { fontFamily: 'Ar', fontSize: 9, fontWeight: 700, marginTop: 6, marginBottom: 4 },
  tdAr: { fontFamily: 'Ar', fontSize: 7 },
});

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function LeavesAnalyticsPdf({
  companyNameAr,
  companyNameEn,
  filterSummary,
  kpi,
  leaveRows,
  employeeRows,
}: LeavesAnalyticsPdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  const leavePages = chunk(leaveRows, PER_PAGE);
  const empPages = chunk(employeeRows, PER_PAGE).filter((p) => p.length > 0);
  const leaveExtraPages = Math.max(0, leavePages.length - 1);
  const totalPages = 1 + leaveExtraPages + empPages.length;

  return (
    <Document>
      <Page size="A4" style={HR.page}>
        <View style={HR.brand}>
          <Text style={HR.brandAr}>{companyNameAr}</Text>
          <Text style={HR.brandEn}>{companyNameEn}</Text>
        </View>
        <View style={HR.line} />
        <Text style={HR.title}>تحليلات الإجازات — تقرير PDF</Text>
        <Text style={HR.meta}>{filterSummary}</Text>
        <View style={S.kpiRow}>
          <View style={S.kpi}><Text style={S.kpiV}>{kpi.total}</Text><Text style={S.kpiL}>إجمالي الطلبات</Text></View>
          <View style={S.kpi}><Text style={S.kpiV}>{kpi.approved}</Text><Text style={S.kpiL}>موافق عليها</Text></View>
          <View style={S.kpi}><Text style={S.kpiV}>{kpi.pending}</Text><Text style={S.kpiL}>قيد الانتظار</Text></View>
          <View style={S.kpi}><Text style={S.kpiV}>{kpi.workDays}</Text><Text style={S.kpiL}>أيام عمل</Text></View>
        </View>
        <Text style={S.sec}>طلبات الإجازات المصفّاة</Text>
        <View style={HR.th}>
          <Text style={[HR.ar, { width: '26%', fontWeight: 700, textAlign: 'right', paddingHorizontal: 4 }]}>الموظف</Text>
          <Text style={[HR.lat, { width: '12%', fontWeight: 700, textAlign: 'center', fontSize: 8 }]}>من</Text>
          <Text style={[HR.lat, { width: '12%', fontWeight: 700, textAlign: 'center', fontSize: 8 }]}>إلى</Text>
          <Text style={[HR.ar, { width: '16%', fontWeight: 700, textAlign: 'right' }]}>النوع</Text>
          <Text style={[HR.ar, { width: '14%', fontWeight: 700, textAlign: 'center' }]}>الحالة</Text>
          <Text style={[HR.lat, { width: '10%', fontWeight: 700, textAlign: 'center', fontSize: 8 }]}>أيام</Text>
        </View>
        {(leavePages[0] ?? []).map((l, i) => (
          <View key={`${l.employeeNameAr}-${l.start}-${i}`} style={HR.tr} wrap={false}>
            <Text style={[S.tdAr, { width: '26%', textAlign: 'right', paddingHorizontal: 4 }]}>{l.employeeNameAr}</Text>
            <Text style={[HR.lat, { width: '12%', fontSize: 7, textAlign: 'center' }]}>{l.start}</Text>
            <Text style={[HR.lat, { width: '12%', fontSize: 7, textAlign: 'center' }]}>{l.end}</Text>
            <Text style={[S.tdAr, { width: '16%', textAlign: 'right' }]}>{l.typeAr}</Text>
            <Text style={[S.tdAr, { width: '14%', textAlign: 'center' }]}>{l.statusAr}</Text>
            <Text style={[HR.lat, { width: '10%', fontSize: 7, textAlign: 'center' }]}>{l.workingDays}</Text>
          </View>
        ))}
        {leaveRows.length === 0 ? (
          <Text style={[HR.ar, { marginTop: 8, textAlign: 'center', color: '#64748b' }]}>لا توجد طلبات إجازة ضمن الفلترة.</Text>
        ) : null}
        <PdfPageFooter pageNum={1} totalPages={totalPages} insetX={HR_PDF_FOOTER_INSET_X} bottom={HR_PDF_FOOTER_BOTTOM} />
      </Page>

      {leavePages.slice(1).map((pageLeaves, pi) => (
        <Page key={`lp-${pi}`} size="A4" style={HR.page}>
          <Text style={[HR.ar, { fontSize: 10, fontWeight: 700, marginBottom: 8 }]}>طلبات الإجازات (تابع)</Text>
          <View style={HR.th}>
            <Text style={[HR.ar, { width: '26%', fontWeight: 700, textAlign: 'right', paddingHorizontal: 4 }]}>الموظف</Text>
            <Text style={[HR.lat, { width: '12%', fontWeight: 700, textAlign: 'center', fontSize: 8 }]}>من</Text>
            <Text style={[HR.lat, { width: '12%', fontWeight: 700, textAlign: 'center', fontSize: 8 }]}>إلى</Text>
            <Text style={[HR.ar, { width: '16%', fontWeight: 700, textAlign: 'right' }]}>النوع</Text>
            <Text style={[HR.ar, { width: '14%', fontWeight: 700, textAlign: 'center' }]}>الحالة</Text>
            <Text style={[HR.lat, { width: '10%', fontWeight: 700, textAlign: 'center', fontSize: 8 }]}>أيام</Text>
          </View>
          {pageLeaves.map((l, i) => (
            <View key={`${l.employeeNameAr}-${l.start}-${i}`} style={HR.tr} wrap={false}>
              <Text style={[S.tdAr, { width: '26%', textAlign: 'right', paddingHorizontal: 4 }]}>{l.employeeNameAr}</Text>
              <Text style={[HR.lat, { width: '12%', fontSize: 7, textAlign: 'center' }]}>{l.start}</Text>
              <Text style={[HR.lat, { width: '12%', fontSize: 7, textAlign: 'center' }]}>{l.end}</Text>
              <Text style={[S.tdAr, { width: '16%', textAlign: 'right' }]}>{l.typeAr}</Text>
              <Text style={[S.tdAr, { width: '14%', textAlign: 'center' }]}>{l.statusAr}</Text>
              <Text style={[HR.lat, { width: '10%', fontSize: 7, textAlign: 'center' }]}>{l.workingDays}</Text>
            </View>
          ))}
          <PdfPageFooter pageNum={2 + pi} totalPages={totalPages} insetX={HR_PDF_FOOTER_INSET_X} bottom={HR_PDF_FOOTER_BOTTOM} />
        </Page>
      ))}

      {empPages.map((emps, ei) => (
        <Page key={`ep-${ei}`} size="A4" style={HR.page}>
          <Text style={[HR.ar, { fontSize: 10, fontWeight: 700, marginBottom: 8 }]}>أرصدة الموظفين</Text>
          <View style={HR.th}>
            <Text style={[HR.ar, { width: '34%', fontWeight: 700, textAlign: 'right', paddingHorizontal: 4 }]}>الموظف</Text>
            <Text style={[HR.ar, { width: '24%', fontWeight: 700, textAlign: 'right' }]}>الفرع</Text>
            <Text style={[HR.lat, { width: '19%', fontWeight: 700, textAlign: 'center', fontSize: 8 }]}>سنوية</Text>
            <Text style={[HR.lat, { width: '19%', fontWeight: 700, textAlign: 'center', fontSize: 8 }]}>مرضية</Text>
          </View>
          {emps.map((e, i) => (
            <View key={`${e.nameAr}-${i}`} style={HR.tr} wrap={false}>
              <Text style={[S.tdAr, { width: '34%', textAlign: 'right', paddingHorizontal: 4 }]}>{e.nameAr}</Text>
              <Text style={[S.tdAr, { width: '24%', textAlign: 'right', fontSize: 7 }]}>{e.branch}</Text>
              <Text style={[HR.lat, { width: '19%', fontSize: 7, textAlign: 'center' }]}>{e.annual}</Text>
              <Text style={[HR.lat, { width: '19%', fontSize: 7, textAlign: 'center' }]}>{e.sick}</Text>
            </View>
          ))}
          {emps.length === 0 && ei === 0 ? (
            <Text style={[HR.ar, { marginTop: 8, textAlign: 'center', color: '#64748b' }]}>لا يوجد موظفون ضمن الفلترة.</Text>
          ) : null}
          <PdfPageFooter
            pageNum={1 + leaveExtraPages + ei + 1}
            totalPages={totalPages}
            insetX={HR_PDF_FOOTER_INSET_X}
            bottom={HR_PDF_FOOTER_BOTTOM}
          />
        </Page>
      ))}
    </Document>
  );
}
