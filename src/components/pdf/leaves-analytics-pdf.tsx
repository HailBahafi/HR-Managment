'use client';

import * as React from 'react';
import { Document, Page, Text, View, type DocumentProps } from '@react-pdf/renderer';
import { ensureLeavesReportPdfFonts, leavesReportPdfStyles as S } from '@/lib/pdf/leave-report-pdf-styles';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { CompanyLetterheadHeader } from '@/components/pdf/company-letterhead-header';
import { PdfArLatInline } from '@/components/pdf/pdf-bidi-helpers';
import { getPdfLogoSrc } from '@/lib/pdf/pdf-logo-url';

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
  /** Full URL to `logo.png` in the browser (e.g. `origin + '/logo.png'`). */
  logoSrc?: string;
  generatedAt?: string;
};

const PER_PAGE_LEAVES = 16;
const PER_PAGE_EMP = 18;

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function PageFooter({
  pageNum,
  totalPages,
  generatedDateLabel,
}: {
  pageNum: number;
  totalPages: number;
  /** Date portion only (e.g. Gregorian); Arabic prefix added here with Cairo. */
  generatedDateLabel: string;
}) {
  return (
    <View style={S.footer}>
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'baseline' }}>
        <Text style={[S.footerText, { fontFamily: 'Lat', direction: 'ltr' }]}>{generatedDateLabel}</Text>
        <Text style={S.footerText}>تم الإنشاء: </Text>
      </View>
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'baseline', marginTop: 2 }}>
        <Text style={[S.footerText, { fontFamily: 'Lat', direction: 'ltr' }]}>{totalPages}</Text>
        <Text style={S.footerText}> / </Text>
        <Text style={[S.footerText, { fontFamily: 'Lat', direction: 'ltr' }]}>{pageNum}</Text>
        <Text style={S.footerText}>صفحة </Text>
      </View>
    </View>
  );
}

function LeaveTableHeader() {
  return (
    <View style={S.tableHeader}>
      <Text style={[S.tableHeaderCell, S.colEmployee]}>الموظف</Text>
      <Text style={[S.tableHeaderCell, S.colDate]}>من</Text>
      <Text style={[S.tableHeaderCell, S.colDate]}>إلى</Text>
      <Text style={[S.tableHeaderCell, S.colType]}>النوع</Text>
      <Text style={[S.tableHeaderCell, S.colStatus]}>الحالة</Text>
      <Text style={[S.tableHeaderCell, S.colDays, { textAlign: 'center' }]}>أيام</Text>
    </View>
  );
}

function EmployeeTableHeader() {
  return (
    <View style={S.tableHeader}>
      <Text style={[S.tableHeaderCell, S.colEmpWide]}>الموظف</Text>
      <Text style={[S.tableHeaderCell, S.colBranch]}>الفرع</Text>
      <Text style={[S.tableHeaderCell, S.colBal, { textAlign: 'center' }]}>سنوية</Text>
      <Text style={[S.tableHeaderCell, S.colBal, { textAlign: 'center' }]}>مرضية</Text>
    </View>
  );
}

export function LeavesAnalyticsPdf({
  companyNameAr: _companyNameAr,
  companyNameEn: _companyNameEn,
  filterSummary,
  kpi,
  leaveRows,
  employeeRows,
  logoSrc,
  generatedAt,
}: LeavesAnalyticsPdfProps): React.ReactElement<DocumentProps> {
  ensureLeavesReportPdfFonts();
  ensureHrPdfFonts();

  const resolvedLogo = logoSrc ?? getPdfLogoSrc();

  const dateStr =
    generatedAt ??
    (typeof Intl !== 'undefined'
      ? new Date().toLocaleDateString('ar-SA', { dateStyle: 'medium' })
      : '');

  const generatedDateLabel = dateStr;

  const leavePages = chunk(leaveRows, PER_PAGE_LEAVES);
  const empPages = chunk(employeeRows, PER_PAGE_EMP).filter((p) => p.length > 0);
  const leaveExtraPages = Math.max(0, leavePages.length - 1);
  const totalPages = 1 + leaveExtraPages + empPages.length;

  const kpiItems = [
    { value: kpi.total, label: 'إجمالي الطلبات' },
    { value: kpi.approved, label: 'موافق عليها' },
    { value: kpi.pending, label: 'قيد الانتظار' },
    { value: kpi.workDays, label: 'أيام عمل' },
  ];

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <CompanyLetterheadHeader logoSrc={resolvedLogo} />

        <Text style={S.reportTitle}>تحليلات الإجازات — تقرير PDF</Text>
        <View style={{ marginBottom: 16 }}>
          <PdfArLatInline
            text={filterSummary}
            arFontFamily="Cairo"
            arStyle={{ fontSize: 8, textAlign: 'right', color: '#666', lineHeight: 1.35 }}
            latStyle={{ fontSize: 8, textAlign: 'right', color: '#666', lineHeight: 1.35 }}
          />
        </View>

        <View style={S.statsRow}>
          {kpiItems.map((item) => (
            <View key={item.label} style={S.statCard}>
              <Text style={[S.statValue, { fontFamily: 'Lat', direction: 'ltr' }]}>{item.value}</Text>
              <Text style={S.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Text style={S.sectionTitle}>طلبات الإجازات المصفّاة</Text>
        <View style={S.table}>
          <LeaveTableHeader />
          {(leavePages[0] ?? []).map((l, i) => (
            <View
              key={`${l.employeeNameAr}-${l.start}-${i}`}
              style={[S.tableRow, i % 2 === 1 ? S.tableRowAlt : {}]}
              wrap={false}
            >
              <Text style={[S.tableCell, S.colEmployee]}>{l.employeeNameAr}</Text>
              <Text style={[S.tableCell, S.colDate, { fontFamily: 'Lat', direction: 'ltr' }]}>{l.start}</Text>
              <Text style={[S.tableCell, S.colDate, { fontFamily: 'Lat', direction: 'ltr' }]}>{l.end}</Text>
              <Text style={[S.tableCell, S.colType]}>{l.typeAr}</Text>
              <Text style={[S.tableCell, S.colStatus]}>{l.statusAr}</Text>
              <Text style={[S.tableCell, S.colDays, { textAlign: 'center', fontFamily: 'Lat', direction: 'ltr' }]}>{l.workingDays}</Text>
            </View>
          ))}
        </View>
        {leaveRows.length === 0 ? <Text style={S.emptyHint}>لا توجد طلبات إجازة ضمن الفلترة.</Text> : null}

        <PageFooter pageNum={1} totalPages={totalPages} generatedDateLabel={generatedDateLabel} />
      </Page>

      {leavePages.slice(1).map((pageLeaves, pi) => (
        <Page key={`lp-${pi}`} size="A4" style={S.page}>
          <CompanyLetterheadHeader logoSrc={resolvedLogo} />
          <Text style={[S.sectionTitle, { marginTop: 0 }]}>طلبات الإجازات (تابع)</Text>
          <View style={S.table}>
            <LeaveTableHeader />
            {pageLeaves.map((l, i) => (
              <View
                key={`${l.employeeNameAr}-${l.start}-${i}`}
                style={[S.tableRow, i % 2 === 1 ? S.tableRowAlt : {}]}
                wrap={false}
              >
                <Text style={[S.tableCell, S.colEmployee]}>{l.employeeNameAr}</Text>
              <Text style={[S.tableCell, S.colDate, { fontFamily: 'Lat', direction: 'ltr' }]}>{l.start}</Text>
              <Text style={[S.tableCell, S.colDate, { fontFamily: 'Lat', direction: 'ltr' }]}>{l.end}</Text>
              <Text style={[S.tableCell, S.colType]}>{l.typeAr}</Text>
              <Text style={[S.tableCell, S.colStatus]}>{l.statusAr}</Text>
              <Text style={[S.tableCell, S.colDays, { textAlign: 'center', fontFamily: 'Lat', direction: 'ltr' }]}>{l.workingDays}</Text>
              </View>
            ))}
          </View>
          <PageFooter pageNum={2 + pi} totalPages={totalPages} generatedDateLabel={generatedDateLabel} />
        </Page>
      ))}

      {empPages.map((emps, ei) => (
        <Page key={`ep-${ei}`} size="A4" style={S.page}>
          <CompanyLetterheadHeader logoSrc={resolvedLogo} />
          <Text style={[S.sectionTitle, { marginTop: 0 }]}>أرصدة الموظفين</Text>
          <View style={S.table}>
            <EmployeeTableHeader />
            {emps.map((e, i) => (
              <View
                key={`${e.nameAr}-${i}`}
                style={[S.tableRow, i % 2 === 1 ? S.tableRowAlt : {}]}
                wrap={false}
              >
                <Text style={[S.tableCell, S.colEmpWide]}>{e.nameAr}</Text>
                <Text style={[S.tableCell, S.colBranch]}>{e.branch}</Text>
                <Text style={[S.tableCell, S.colBal, { textAlign: 'center', fontFamily: 'Lat', direction: 'ltr' }]}>{e.annual}</Text>
                <Text style={[S.tableCell, S.colBal, { textAlign: 'center', fontFamily: 'Lat', direction: 'ltr' }]}>{e.sick}</Text>
              </View>
            ))}
          </View>
          <PageFooter
            pageNum={1 + leaveExtraPages + ei + 1}
            totalPages={totalPages}
            generatedDateLabel={generatedDateLabel}
          />
        </Page>
      ))}
    </Document>
  );
}
