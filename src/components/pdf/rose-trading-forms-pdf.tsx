'use client';

import * as React from 'react';
import { Document, Page, Text, View, StyleSheet, type DocumentProps } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { HR_PDF_FOOTER_BOTTOM, HR_PDF_FOOTER_INSET_X } from '@/lib/pdf/hr-pdf-base-styles';
import { PdfPageFooter } from '@/components/pdf/pdf-page-footer';
import { ROSE_TRADING_COMPANY_AR_DEFAULT } from '@/lib/employee-rose-forms/types';
import type {
  RoseClearanceRecord,
  RoseExperienceRecord,
  RoseResignationRecord,
  RoseSettlementRecord,
} from '@/lib/employee-rose-forms/types';

export type RoseFormPdfEmployee = {
  nameAr: string;
  nameEn: string;
  employeeCode: string;
  nationalId: string;
  positionAr: string;
  departmentAr: string;
  branchAr: string;
  hireDate: string;
};

const C = {
  primary: '#1a3d3a',
  gold: '#b8933e',
  muted: '#64748b',
  border: '#e2e8f0',
  bg: '#fafaf9',
};

const ss = StyleSheet.create({
  page: {
    fontFamily: 'Ar',
    fontSize: 10,
    paddingTop: 28,
    paddingBottom: 44,
    paddingHorizontal: 24,
    direction: 'rtl',
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: C.gold,
  },
  companyAr: { fontFamily: 'Ar', fontSize: 13, fontWeight: 700, color: C.primary, textAlign: 'center' },
  companyEn: { fontFamily: 'Lat', fontSize: 8, color: C.muted, marginTop: 2, textAlign: 'center' },
  docTitle: { fontFamily: 'Ar', fontSize: 12, fontWeight: 700, marginTop: 10, textAlign: 'center', color: C.primary },
  metaRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap' },
  metaItem: { fontFamily: 'Ar', fontSize: 8, color: '#334155', marginBottom: 4 },
  metaLat: { fontFamily: 'Lat', fontSize: 8 },
  blockTitle: {
    fontFamily: 'Ar',
    fontSize: 9,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 4,
    color: C.primary,
    borderRightWidth: 3,
    borderRightColor: C.gold,
    paddingRight: 6,
  },
  p: { fontFamily: 'Ar', fontSize: 9.5, lineHeight: 1.55, textAlign: 'right', color: '#1e293b' },
  table: { marginTop: 6, borderWidth: 0.5, borderColor: C.border },
  tr: { flexDirection: 'row-reverse', borderBottomWidth: 0.5, borderBottomColor: C.border, paddingVertical: 5, paddingHorizontal: 6 },
  tdLabel: { width: '28%', fontFamily: 'Ar', fontSize: 8.5, fontWeight: 700, color: C.primary },
  tdVal: { width: '72%', fontFamily: 'Ar', fontSize: 8.5, color: '#334155', lineHeight: 1.4 },
  signRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 28, paddingTop: 12 },
  signBox: { width: '42%', borderTopWidth: 0.5, borderTopColor: C.muted, paddingTop: 6 },
  signLabel: { fontFamily: 'Ar', fontSize: 8, color: C.muted, textAlign: 'center' },
});

function DocHeader({
  companyNameAr,
  companyNameEn,
  titleAr,
}: {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
}) {
  return (
    <View style={ss.header}>
      <Text style={ss.companyAr}>{companyNameAr}</Text>
      <Text style={ss.companyEn}>{companyNameEn}</Text>
      <Text style={ss.docTitle}>{titleAr}</Text>
    </View>
  );
}

function EmployeeStrip({ emp }: { emp: RoseFormPdfEmployee }) {
  return (
    <View>
      <View style={ss.metaRow}>
        <Text style={ss.metaItem}>
          الاسم: <Text style={ss.metaLat}> </Text>
          {emp.nameAr}
        </Text>
        <Text style={ss.metaItem}>
          الرقم الوظيفي: <Text style={ss.metaLat}>{emp.employeeCode}</Text>
        </Text>
      </View>
      <View style={ss.metaRow}>
        <Text style={ss.metaItem}>الوظيفة: {emp.positionAr}</Text>
        <Text style={ss.metaItem}>
          الهوية: <Text style={ss.metaLat}>{emp.nationalId}</Text>
        </Text>
      </View>
      <View style={ss.metaRow}>
        <Text style={ss.metaItem}>القسم: {emp.departmentAr}</Text>
        <Text style={ss.metaItem}>الفرع: {emp.branchAr}</Text>
      </View>
      <View style={ss.metaRow}>
        <Text style={ss.metaItem}>
          تاريخ الالتحاق: <Text style={ss.metaLat}>{emp.hireDate}</Text>
        </Text>
        <Text style={ss.metaItem}>
          الاسم (إنجليزي): <Text style={ss.metaLat}>{emp.nameEn}</Text>
        </Text>
      </View>
    </View>
  );
}

export type RoseResignationPdfProps = {
  companyNameAr?: string;
  companyNameEn?: string;
  emp: RoseFormPdfEmployee;
  row: RoseResignationRecord;
};

export function RoseResignationPdfDoc({
  companyNameAr = ROSE_TRADING_COMPANY_AR_DEFAULT,
  companyNameEn = 'Rose Trading Est.',
  emp,
  row,
}: RoseResignationPdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  return (
    <Document>
      <Page size="A4" style={ss.page}>
        <DocHeader companyNameAr={companyNameAr} companyNameEn={companyNameEn} titleAr="نموذج استقالة" />
        <EmployeeStrip emp={emp} />

        <Text style={ss.blockTitle}>بيانات طلب الاستقالة</Text>
        <View style={ss.table}>
          <View style={ss.tr}>
            <Text style={ss.tdLabel}>تاريخ النموذج</Text>
            <Text style={ss.tdVal}>{row.documentDate}</Text>
          </View>
          <View style={ss.tr}>
            <Text style={ss.tdLabel}>آخر يوم عمل</Text>
            <Text style={ss.tdVal}>{row.effectiveResignationDate}</Text>
          </View>
          {row.referenceNo ? (
            <View style={ss.tr}>
              <Text style={ss.tdLabel}>المرجع</Text>
              <Text style={ss.tdVal}>{row.referenceNo}</Text>
            </View>
          ) : null}
          <View style={ss.tr}>
            <Text style={ss.tdLabel}>سبب الاستقالة</Text>
            <Text style={ss.tdVal}>{row.reasonAr || '—'}</Text>
          </View>
          <View style={[ss.tr, { borderBottomWidth: 0 }]}>
            <Text style={ss.tdLabel}>ملاحظات</Text>
            <Text style={ss.tdVal}>{row.notesAr || '—'}</Text>
          </View>
        </View>

        <Text style={[ss.p, { marginTop: 14 }]}>
          أنا الموقّع أدناه {emp.nameAr} أقرّ بتقديم طلب استقالتي على {companyNameAr}، على أن يسري الطلب اعتباراً من
          تاريخ {row.effectiveResignationDate}، وأتعهد بإتمام تسليم العهد والمستندات وفق الإجراءات المعتمدة.
        </Text>

        <View style={ss.signRow}>
          <View style={ss.signBox}>
            <Text style={ss.signLabel}>توقيع الموظف</Text>
          </View>
          <View style={ss.signBox}>
            <Text style={ss.signLabel}>المعتمد — {row.approvedByAr || '………'}</Text>
          </View>
        </View>
        <PdfPageFooter pageNum={1} totalPages={1} insetX={HR_PDF_FOOTER_INSET_X} bottom={HR_PDF_FOOTER_BOTTOM} />
      </Page>
    </Document>
  );
}

export type RoseClearancePdfProps = {
  companyNameAr?: string;
  companyNameEn?: string;
  emp: RoseFormPdfEmployee;
  row: RoseClearanceRecord;
};

export function RoseClearancePdfDoc({
  companyNameAr = ROSE_TRADING_COMPANY_AR_DEFAULT,
  companyNameEn = 'Rose Trading Est.',
  emp,
  row,
}: RoseClearancePdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  return (
    <Document>
      <Page size="A4" style={ss.page}>
        <DocHeader companyNameAr={companyNameAr} companyNameEn={companyNameEn} titleAr="نموذج إخلاء طرف" />
        <EmployeeStrip emp={emp} />
        <View style={ss.table}>
          <View style={ss.tr}>
            <Text style={ss.tdLabel}>تاريخ النموذج</Text>
            <Text style={ss.tdVal}>{row.documentDate}</Text>
          </View>
          <View style={ss.tr}>
            <Text style={ss.tdLabel}>آخر يوم عمل</Text>
            <Text style={ss.tdVal}>{row.lastWorkingDay}</Text>
          </View>
          <View style={ss.tr}>
            <Text style={ss.tdLabel}>المالية</Text>
            <Text style={ss.tdVal}>{row.financeClearAr || '—'}</Text>
          </View>
          <View style={ss.tr}>
            <Text style={ss.tdLabel}>الموارد البشرية</Text>
            <Text style={ss.tdVal}>{row.hrClearAr || '—'}</Text>
          </View>
          <View style={ss.tr}>
            <Text style={ss.tdLabel}>تقنية المعلومات</Text>
            <Text style={ss.tdVal}>{row.itClearAr || '—'}</Text>
          </View>
          <View style={ss.tr}>
            <Text style={ss.tdLabel}>الإدارة / العمليات</Text>
            <Text style={ss.tdVal}>{row.adminClearAr || '—'}</Text>
          </View>
          <View style={[ss.tr, { borderBottomWidth: 0 }]}>
            <Text style={ss.tdLabel}>ملاحظات عامة</Text>
            <Text style={ss.tdVal}>{row.notesAr || '—'}</Text>
          </View>
        </View>
        <Text style={[ss.p, { marginTop: 12 }]}>
          يقرّ {companyNameAr} بأن الموظف أعلاه قد أخلّى طرفه من الجهات المذكورة حسب ما هو موضّح، دون الإخلال بأي
          التزامات نظامية قائمة وقت التوقيع ما لم يُذكر خلاف ذلك.
        </Text>
        <View style={ss.signRow}>
          <View style={ss.signBox}>
            <Text style={ss.signLabel}>ختم وتوقيع الجهة</Text>
          </View>
          <View style={ss.signBox}>
            <Text style={ss.signLabel}>توقيع الموظف</Text>
          </View>
        </View>
        <PdfPageFooter pageNum={1} totalPages={1} insetX={HR_PDF_FOOTER_INSET_X} bottom={HR_PDF_FOOTER_BOTTOM} />
      </Page>
    </Document>
  );
}

export type RoseSettlementPdfProps = {
  companyNameAr?: string;
  companyNameEn?: string;
  emp: RoseFormPdfEmployee;
  row: RoseSettlementRecord;
};

export function RoseSettlementPdfDoc({
  companyNameAr = ROSE_TRADING_COMPANY_AR_DEFAULT,
  companyNameEn = 'Rose Trading Est.',
  emp,
  row,
}: RoseSettlementPdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  return (
    <Document>
      <Page size="A4" style={ss.page}>
        <DocHeader companyNameAr={companyNameAr} companyNameEn={companyNameEn} titleAr="مخالصة نهائية" />
        <EmployeeStrip emp={emp} />
        <View style={ss.table}>
          <View style={ss.tr}>
            <Text style={ss.tdLabel}>تاريخ النموذج</Text>
            <Text style={ss.tdVal}>{row.documentDate}</Text>
          </View>
          <View style={ss.tr}>
            <Text style={ss.tdLabel}>نطاق المخالصة</Text>
            <Text style={ss.tdVal}>{row.settlementPeriodAr || '—'}</Text>
          </View>
          <View style={ss.tr}>
            <Text style={ss.tdLabel}>الراتب والحقوق</Text>
            <Text style={ss.tdVal}>{row.salaryAndRightsAr || '—'}</Text>
          </View>
          <View style={ss.tr}>
            <Text style={ss.tdLabel}>الاستقطاعات</Text>
            <Text style={ss.tdVal}>{row.deductionsAr || '—'}</Text>
          </View>
          <View style={[ss.tr, { borderBottomWidth: 0 }]}>
            <Text style={ss.tdLabel}>الصافي / البيان</Text>
            <Text style={ss.tdVal}>{row.netAmountAr || '—'}</Text>
          </View>
        </View>
        <Text style={ss.blockTitle}>إقرار الموظف</Text>
        <Text style={ss.p}>{row.declarationAr || 'أقر بأنني استلمت كامل مستحقاتي المالية والإدارية المتفق عليها، وأخلو سبيل ' + companyNameAr + ' من أي مطالبة لاحقة تتعلق بهذه الفترة.'}</Text>
        <View style={ss.signRow}>
          <View style={ss.signBox}>
            <Text style={ss.signLabel}>توقيع الموظف</Text>
          </View>
          <View style={ss.signBox}>
            <Text style={ss.signLabel}>توقيع مسؤول الموارد البشرية</Text>
          </View>
        </View>
        <PdfPageFooter pageNum={1} totalPages={1} insetX={HR_PDF_FOOTER_INSET_X} bottom={HR_PDF_FOOTER_BOTTOM} />
      </Page>
    </Document>
  );
}

export type RoseExperiencePdfProps = {
  companyNameAr?: string;
  companyNameEn?: string;
  emp: RoseFormPdfEmployee;
  row: RoseExperienceRecord;
};

export function RoseExperiencePdfDoc({
  companyNameAr = ROSE_TRADING_COMPANY_AR_DEFAULT,
  companyNameEn = 'Rose Trading Est.',
  emp,
  row,
}: RoseExperiencePdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  return (
    <Document>
      <Page size="A4" style={ss.page}>
        <DocHeader companyNameAr={companyNameAr} companyNameEn={companyNameEn} titleAr="شهادة خبرة" />
        <Text style={[ss.p, { marginTop: 6, marginBottom: 8 }]}>
          {row.issuedToAr ? `إلى ${row.issuedToAr} المحترمين،` : 'إلى من يهمه الأمر،'}
        </Text>
        <Text style={ss.p}>تحيّة طيبة وبعد،</Text>
        <Text style={[ss.p, { marginTop: 8 }]}>
          يُشهد {companyNameAr} بأن السيد/ة {emp.nameAr} ({emp.nameEn}) قد عمل لدينا خلال الفترة من{' '}
          <Text style={ss.metaLat}> {row.serviceFrom} </Text>
          إلى
          <Text style={ss.metaLat}> {row.serviceTo} </Text>
          بوظيفة: {row.jobTitleAr || emp.positionAr}، في {emp.departmentAr} — فرع {emp.branchAr}.
        </Text>
        <Text style={ss.blockTitle}>طبيعة العمل والمهام</Text>
        <Text style={ss.p}>{row.dutiesSummaryAr || '—'}</Text>
        {row.certificatePurposeAr ? (
          <>
            <Text style={ss.blockTitle}>الغرض من الشهادة</Text>
            <Text style={ss.p}>{row.certificatePurposeAr}</Text>
          </>
        ) : null}
        <Text style={[ss.p, { marginTop: 14 }]}>
          وقد أُعطيت هذه الشهادة بناءً على طلبه دون تحمّل أدنى مسؤولية تجاه الغير، ولمن يهمه الأمر اتخاذ ما يلزم.
        </Text>
        <View style={[ss.signRow, { marginTop: 36 }]}>
          <View style={ss.signBox}>
            <Text style={ss.signLabel}>ختم {companyNameAr}</Text>
          </View>
          <View style={ss.signBox}>
            <Text style={ss.signLabel}>تاريخ الإصدار: {row.documentDate}</Text>
          </View>
        </View>
        <PdfPageFooter pageNum={1} totalPages={1} insetX={HR_PDF_FOOTER_INSET_X} bottom={HR_PDF_FOOTER_BOTTOM} />
      </Page>
    </Document>
  );
}
