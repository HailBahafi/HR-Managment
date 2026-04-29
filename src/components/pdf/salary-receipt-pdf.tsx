'use client';

import * as React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font, Image, pdf,
} from '@react-pdf/renderer';
import { CAIRO_AR_400, CAIRO_AR_700, CAIRO_LA_400, CAIRO_LA_700 } from '@/lib/cairo-fonts';

/* ─── Font registration ─────────────────────────────────────────────
   Two families: 'Ar' for Arabic text, 'Lat' for numbers/codes/English
   ──────────────────────────────────────────────────────────────────── */
Font.register({
  family: 'Ar',
  fonts: [
    { src: CAIRO_AR_400, fontWeight: 400 },
    { src: CAIRO_AR_700, fontWeight: 700 },
  ],
});
Font.register({
  family: 'Lat',
  fonts: [
    { src: CAIRO_LA_400, fontWeight: 400 },
    { src: CAIRO_LA_700, fontWeight: 700 },
  ],
});

Font.registerHyphenationCallback(word => [word]);

/* ─── Types ─────────────────────────────────────────────────────────── */
export interface ReceiptEmployee {
  name: string;
  nameEn: string;
  employeeCode: string;
  position: string;
  department: string;
  branch: string;
  nationalId: string;
  iban: string;
  startDate: string;
}

export interface ReceiptPayslip {
  month: string;
  year: number;
  baseSalary: number;
  housing: number;
  transport: number;
  otherAllowances: number;
  overtime: number;
  gosi: number;
  absenceDeduction: number;
  latenessDeduction: number;
  loanDeduction: number;
  otherDeductions: number;
  gross: number;
  net: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
}

/* ─── Colors ────────────────────────────────────────────────────────── */
const C = {
  primary:   '#1a3d3a',
  gold:      '#b8933e',
  goldLight: '#fdf6e8',
  white:     '#ffffff',
  bg:        '#f9f8f6',
  border:    '#e5e0d8',
  text:      '#1a2624',
  muted:     '#6b7a78',
  green:     '#15803d',
  greenBg:   '#f0fdf4',
  red:       '#b91c1c',
  redBg:     '#fef2f2',
};

/* ─── Helpers ───────────────────────────────────────────────────────── */
function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' SAR';
}

/* ─── Shared sub-components ─────────────────────────────────────────── */
function Num({ children }: { children: string }) {
  return <Text style={{ fontFamily: 'Lat', fontWeight: 400 }}>{children}</Text>;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <View style={ss.sectionLabelRow}>
      <View style={ss.sectionAccent} />
      <Text style={ss.sectionLabelText}>{children}</Text>
    </View>
  );
}

/* ─── Styles ────────────────────────────────────────────────────────── */
const ss = StyleSheet.create({
  page: {
    fontFamily: 'Ar',
    backgroundColor: C.bg,
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 24,
    direction: 'rtl',
  },

  /* header */
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 14,
  },
  headerRight: { flexDirection: 'column', alignItems: 'flex-end' },
  headerTitle: { fontFamily: 'Ar', fontWeight: 700, fontSize: 20, color: C.gold },
  headerSub: { fontFamily: 'Lat', fontWeight: 400, fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  headerBranch: { fontFamily: 'Ar', fontWeight: 400, fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  logo: { width: 48, height: 48, objectFit: 'contain' },

  /* gold line */
  goldLine: { height: 1.5, backgroundColor: C.gold, borderRadius: 1, marginBottom: 12, opacity: 0.6 },

  /* meta row */
  metaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  periodPill: {
    backgroundColor: C.goldLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: C.gold,
  },
  periodText: { fontFamily: 'Ar', fontWeight: 700, fontSize: 11, color: C.gold },
  receiptNum: { fontFamily: 'Lat', fontWeight: 400, fontSize: 8, color: C.muted },

  /* section label */
  sectionLabelRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 8, marginTop: 10 },
  sectionAccent: { width: 3, height: 14, backgroundColor: C.gold, borderRadius: 2, marginLeft: 6 },
  sectionLabelText: { fontFamily: 'Ar', fontWeight: 700, fontSize: 10, color: C.primary },

  /* employee grid */
  infoGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  infoCell: {
    width: '31.5%',
    backgroundColor: C.white,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: C.border,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  infoCellLabel: { fontFamily: 'Ar', fontWeight: 400, fontSize: 7.5, color: C.muted, marginBottom: 2 },
  infoCellValue: { fontFamily: 'Ar', fontWeight: 700, fontSize: 9, color: C.text },
  infoCellValueLat: { fontFamily: 'Lat', fontWeight: 700, fontSize: 9, color: C.text },

  /* table */
  table: {
    backgroundColor: C.white,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 4,
  },
  tableHead: {
    flexDirection: 'row-reverse',
    backgroundColor: C.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tableHeadCell: { fontFamily: 'Ar', fontWeight: 700, fontSize: 8.5, color: C.white },
  tableRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    alignItems: 'center',
  },
  tableRowTotal: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: 'center',
  },
  col1: { flex: 3, textAlign: 'right' },
  col2: { flex: 2, textAlign: 'left' },
  cellAr: { fontFamily: 'Ar', fontWeight: 400, fontSize: 9, color: C.text },
  cellLat: { fontFamily: 'Lat', fontWeight: 400, fontSize: 9, color: C.text },
  cellArBold: { fontFamily: 'Ar', fontWeight: 700, fontSize: 9 },
  cellLatBold: { fontFamily: 'Lat', fontWeight: 700, fontSize: 9 },

  /* summary bar */
  summaryBar: { flexDirection: 'row-reverse', gap: 6, marginTop: 10, marginBottom: 4 },
  summaryCard: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  summaryLabel: { fontFamily: 'Ar', fontWeight: 400, fontSize: 7.5, color: C.muted, marginBottom: 3 },
  summaryValue: { fontFamily: 'Lat', fontWeight: 700, fontSize: 12 },

  /* attendance */
  attendRow: { flexDirection: 'row-reverse', gap: 6, marginBottom: 4 },
  attendCell: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: C.border,
    paddingVertical: 8,
    alignItems: 'center',
  },
  attendLabel: { fontFamily: 'Ar', fontWeight: 400, fontSize: 7.5, color: C.muted, marginBottom: 2 },
  attendValue: { fontFamily: 'Lat', fontWeight: 700, fontSize: 13, color: C.text },

  /* ack box */
  ackBox: {
    backgroundColor: C.goldLight,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: C.gold,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  ackText: { fontFamily: 'Ar', fontWeight: 400, fontSize: 8.5, color: C.text, lineHeight: 1.8, textAlign: 'right' },

  /* signatures */
  sigRow: { flexDirection: 'row-reverse', gap: 12, marginBottom: 10 },
  sigBox: { flex: 1, alignItems: 'center', borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 7 },
  sigLabel: { fontFamily: 'Ar', fontWeight: 400, fontSize: 8, color: C.muted, textAlign: 'center' },
  sigName: { fontFamily: 'Ar', fontWeight: 700, fontSize: 8.5, color: C.text, marginTop: 3 },

  /* footer */
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 8,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerBrand: { fontFamily: 'Lat', fontWeight: 700, fontSize: 7.5, color: C.gold },
  footerDate: { fontFamily: 'Lat', fontWeight: 400, fontSize: 7, color: C.muted },
  footerConf: { fontFamily: 'Ar', fontWeight: 700, fontSize: 7, color: C.red },
});

/* ─── PDF Document ──────────────────────────────────────────────────── */
function SalaryReceiptDocument({
  employee, payslip, logoUrl, receiptNumber,
}: {
  employee: ReceiptEmployee;
  payslip: ReceiptPayslip;
  logoUrl?: string;
  receiptNumber?: string;
}) {
  const totalDeductions =
    payslip.gosi + payslip.absenceDeduction + payslip.latenessDeduction +
    payslip.loanDeduction + payslip.otherDeductions;

  const allowanceRows = [
    { label: 'الراتب الأساسي',  amount: payslip.baseSalary,      color: C.text },
    { label: 'بدل السكن',        amount: payslip.housing,         color: C.green },
    { label: 'بدل المواصلات',    amount: payslip.transport,       color: C.green },
    { label: 'بدلات أخرى',       amount: payslip.otherAllowances, color: C.green },
    { label: 'العمل الإضافي',    amount: payslip.overtime,        color: C.green },
  ].filter(r => r.amount > 0);

  const deductionRows = [
    { label: 'التأمينات الاجتماعية (GOSI)', amount: payslip.gosi },
    { label: 'خصم الغياب',                   amount: payslip.absenceDeduction },
    { label: 'خصم التأخر',                   amount: payslip.latenessDeduction },
    { label: 'قسط القرض',                    amount: payslip.loanDeduction },
    { label: 'خصومات أخرى',                  amount: payslip.otherDeductions },
  ].filter(r => r.amount > 0);

  const rNo = receiptNumber ??
    `RCP-${payslip.year}-${payslip.month.slice(0, 3).toUpperCase()}-${employee.employeeCode}`;

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <Document title={`Receipt - ${employee.name} - ${payslip.month} ${payslip.year}`}>
      <Page size="A4" style={ss.page}>

        {/* Header */}
        <View style={ss.header}>
          <View style={ss.headerRight}>
            <Text style={ss.headerTitle}>إيصال استلام الراتب</Text>
            <Text style={ss.headerSub}>Salary Receipt Acknowledgment</Text>
            <Text style={ss.headerBranch}>{employee.branch}</Text>
          </View>
          {logoUrl && <Image src={logoUrl} style={ss.logo} />}
        </View>

        {/* Gold line */}
        <View style={ss.goldLine} />

        {/* Meta */}
        <View style={ss.metaRow}>
          <View style={ss.periodPill}>
            <Text style={ss.periodText}>راتب {payslip.month} {payslip.year}</Text>
          </View>
          <Text style={ss.receiptNum}>{rNo}</Text>
        </View>

        {/* Employee */}
        <SectionLabel>بيانات الموظف</SectionLabel>
        <View style={ss.infoGrid}>
          {[
            { label: 'الاسم الكامل',        value: employee.name,          lat: false },
            { label: 'Full Name',            value: employee.nameEn,        lat: true  },
            { label: 'رقم الموظف',           value: employee.employeeCode,  lat: true  },
            { label: 'المسمى الوظيفي',       value: employee.position,      lat: false },
            { label: 'القسم',                value: employee.department,    lat: false },
            { label: 'الفرع',                value: employee.branch,        lat: false },
            { label: 'رقم الهوية / الإقامة', value: employee.nationalId,    lat: true  },
            { label: 'رقم الآيبان',          value: employee.iban,          lat: true  },
            { label: 'تاريخ الالتحاق',       value: employee.startDate,     lat: true  },
          ].map((cell, i) => (
            <View key={i} style={ss.infoCell}>
              <Text style={ss.infoCellLabel}>{cell.label}</Text>
              <Text style={cell.lat ? ss.infoCellValueLat : ss.infoCellValue}>{cell.value}</Text>
            </View>
          ))}
        </View>

        {/* Allowances */}
        <SectionLabel>الإضافات والبدلات</SectionLabel>
        <View style={ss.table}>
          <View style={ss.tableHead}>
            <Text style={[ss.tableHeadCell, ss.col1]}>البند</Text>
            <Text style={[ss.tableHeadCell, ss.col2]}>المبلغ</Text>
          </View>
          {allowanceRows.map((row, i) => (
            <View key={i} style={ss.tableRow}>
              <Text style={[ss.cellAr, ss.col1]}>{row.label}</Text>
              <Text style={[ss.cellLat, ss.col2, { color: row.color }]}>{fmt(row.amount)}</Text>
            </View>
          ))}
          <View style={ss.tableRowTotal}>
            <Text style={[ss.cellArBold, ss.col1, { color: C.green }]}>إجمالي الاستحقاقات</Text>
            <Text style={[ss.cellLatBold, ss.col2, { color: C.green }]}>{fmt(payslip.gross)}</Text>
          </View>
        </View>

        {/* Deductions */}
        {deductionRows.length > 0 && (
          <>
            <SectionLabel>الخصومات</SectionLabel>
            <View style={ss.table}>
              <View style={ss.tableHead}>
                <Text style={[ss.tableHeadCell, ss.col1]}>البند</Text>
                <Text style={[ss.tableHeadCell, ss.col2]}>المبلغ</Text>
              </View>
              {deductionRows.map((row, i) => (
                <View key={i} style={ss.tableRow}>
                  <Text style={[ss.cellAr, ss.col1]}>{row.label}</Text>
                  <Text style={[ss.cellLat, ss.col2, { color: C.red }]}>({fmt(row.amount)})</Text>
                </View>
              ))}
              <View style={ss.tableRowTotal}>
                <Text style={[ss.cellArBold, ss.col1, { color: C.red }]}>إجمالي الخصومات</Text>
                <Text style={[ss.cellLatBold, ss.col2, { color: C.red }]}>({fmt(totalDeductions)})</Text>
              </View>
            </View>
          </>
        )}

        {/* Summary */}
        <View style={ss.summaryBar}>
          <View style={[ss.summaryCard, { backgroundColor: C.greenBg, borderColor: '#86efac' }]}>
            <Text style={ss.summaryLabel}>إجمالي الاستحقاقات</Text>
            <Text style={[ss.summaryValue, { color: C.green }]}>{fmt(payslip.gross)}</Text>
          </View>
          <View style={[ss.summaryCard, { backgroundColor: C.redBg, borderColor: '#fca5a5' }]}>
            <Text style={ss.summaryLabel}>إجمالي الخصومات</Text>
            <Text style={[ss.summaryValue, { color: C.red }]}>({fmt(totalDeductions)})</Text>
          </View>
          <View style={[ss.summaryCard, { backgroundColor: C.goldLight, borderColor: C.gold, borderWidth: 1 }]}>
            <Text style={[ss.summaryLabel, { color: C.gold, fontWeight: 700 }]}>صافي الراتب</Text>
            <Text style={[ss.summaryValue, { color: C.primary, fontSize: 14 }]}>{fmt(payslip.net)}</Text>
          </View>
        </View>

        {/* Attendance */}
        <SectionLabel>سجل الحضور</SectionLabel>
        <View style={ss.attendRow}>
          {[
            { label: 'أيام العمل',   value: payslip.workingDays },
            { label: 'أيام الحضور',  value: payslip.presentDays },
            { label: 'أيام الغياب',  value: payslip.absentDays  },
            { label: 'أيام التأخر',  value: payslip.lateDays    },
          ].map((a, i) => (
            <View key={i} style={ss.attendCell}>
              <Text style={ss.attendLabel}>{a.label}</Text>
              <Text style={ss.attendValue}>{String(a.value)}</Text>
            </View>
          ))}
        </View>

        {/* Acknowledgement */}
        <View style={ss.ackBox}>
          <Text style={ss.ackText}>
            <Text style={{ fontWeight: 700 }}>إقرار باستلام الراتب:  </Text>
            أقر أنا / {employee.name}، بموجب هذا الإيصال باستلام راتب شهر {payslip.month}{' '}
            <Text style={{ fontFamily: 'Lat' }}>{payslip.year}</Text>
            {'  '}البالغ صافيه{' '}
            <Text style={{ fontFamily: 'Lat' }}>{fmt(payslip.net)}</Text>
            {'  '}وذلك عبر التحويل البنكي إلى الحساب المسجّل، وأنني لا أطالب الشركة بأي مستحقات إضافية عن هذه الفترة.
          </Text>
        </View>

        {/* Signatures */}
        <View style={ss.sigRow}>
          <View style={ss.sigBox}>
            <Text style={ss.sigLabel}>توقيع الموظف</Text>
            <Text style={ss.sigName}>{employee.name}</Text>
          </View>
          <View style={ss.sigBox}>
            <Text style={ss.sigLabel}>مدير الموارد البشرية</Text>
            <Text style={[ss.sigName, { fontFamily: 'Lat', color: C.muted }]}>___________</Text>
          </View>
          <View style={ss.sigBox}>
            <Text style={ss.sigLabel}>المدير المالي</Text>
            <Text style={[ss.sigName, { fontFamily: 'Lat', color: C.muted }]}>___________</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={ss.footer}>
          <Text style={ss.footerBrand}>Rose HR System · rose.sa</Text>
          <Text style={ss.footerConf}>سري ولا يُفصح عنه</Text>
          <Text style={ss.footerDate}>{today}</Text>
        </View>

      </Page>
    </Document>
  );
}

export async function generateReceiptBlob(props: Parameters<typeof SalaryReceiptDocument>[0]) {
  return pdf(<SalaryReceiptDocument {...props} />).toBlob();
}

export default SalaryReceiptDocument;
