import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { hrPdfRegisterStyles as HR } from '@/lib/pdf/hr-pdf-base-styles';
import { PdfHeader, SectionTitle, SignaturesRow, S, C, fmt, type CompanyInfo } from './pdf-shared';

export type PayrollRow = {
  order: number;
  nameAr: string;
  department: string;
  baseSalary: number;
  bonus: number;
  totalSalary: number;
};

export type PayrollRegisterProps = {
  company: CompanyInfo;
  periodNameAr: string;
  branchNameAr: string;
  rows: PayrollRow[];
};

const COL = {
  order:   28,
  name:    160,
  dept:    100,
  base:    72,
  bonus:   72,
  total:   80,
  sign:    80,
};

function TableHeader() {
  const cell = (w: number, label: string) => (
    <View style={{ width: w, borderRight: `1pt solid ${C.border}`, padding: '4pt 3pt', backgroundColor: C.tableHead }}>
      <Text style={[HR.ar, { fontWeight: 700, textAlign: 'center', fontSize: 7 }]}>{label}</Text>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row-reverse', borderTop: `1pt solid ${C.border}`, borderLeft: `1pt solid ${C.border}`, borderBottom: `1pt solid ${C.border}` }}>
      {cell(COL.order, 'م')}
      {cell(COL.name,  'اسم الموظف')}
      {cell(COL.dept,  'الإدارة')}
      {cell(COL.base,  'الراتب الأساسي')}
      {cell(COL.bonus, 'المكافأة / البدلات')}
      {cell(COL.total, 'إجمالي الراتب')}
      {cell(COL.sign,  'التوقيع')}
    </View>
  );
}

function TableRow({ row }: { row: PayrollRow }) {
  const cell = (w: number, content: string, align: 'center' | 'right' | 'left' = 'center', family: 'Ar' | 'Lat' = 'Ar') => (
    <View style={{ width: w, borderRight: `1pt solid ${C.border}`, padding: '5pt 3pt', minHeight: 24 }}>
      <Text style={[{ textAlign: align, fontSize: 7 }, family === 'Lat' ? HR.lat : HR.ar]}>{content}</Text>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row-reverse', borderLeft: `1pt solid ${C.border}`, borderBottom: `1pt solid ${C.border}` }}>
      {cell(COL.order, String(row.order), 'center', 'Lat')}
      {cell(COL.name,  row.nameAr, 'right', 'Ar')}
      {cell(COL.dept,  row.department, 'right', 'Ar')}
      {cell(COL.base,  fmt(row.baseSalary), 'center', 'Lat')}
      {cell(COL.bonus, row.bonus > 0 ? fmt(row.bonus) : '—', 'center', 'Ar')}
      {cell(COL.total, fmt(row.totalSalary), 'center', 'Lat')}
      {cell(COL.sign,  '', 'center', 'Ar')}
    </View>
  );
}

function TotalsRow({ rows }: { rows: PayrollRow[] }) {
  const totalBase  = rows.reduce((s, r) => s + r.baseSalary, 0);
  const totalBonus = rows.reduce((s, r) => s + r.bonus, 0);
  const totalAll   = rows.reduce((s, r) => s + r.totalSalary, 0);
  const cell = (w: number, content: string, family: 'Ar' | 'Lat' = 'Ar') => (
    <View style={{ width: w, borderRight: `1pt solid ${C.border}`, padding: '5pt 3pt', backgroundColor: C.tableHead }}>
      <Text style={[{ textAlign: 'center', fontSize: 7, fontWeight: 700 }, family === 'Lat' ? HR.lat : HR.ar]}>{content}</Text>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row-reverse', borderLeft: `1pt solid ${C.border}`, borderBottom: `1pt solid ${C.border}` }}>
      {cell(COL.order, '', 'Lat')}
      {cell(COL.name + COL.dept, 'الإجمالي', 'Ar')}
      {cell(COL.base,  fmt(totalBase), 'Lat')}
      {cell(COL.bonus, fmt(totalBonus), 'Lat')}
      {cell(COL.total, fmt(totalAll), 'Lat')}
      {cell(COL.sign,  '', 'Ar')}
    </View>
  );
}

export function PayrollRegisterDoc({ company, periodNameAr, branchNameAr, rows }: PayrollRegisterProps) {
  ensureHrPdfFonts();
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={S.page}>
        <PdfHeader company={company} />

        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 16 }}>
          <View>
            <SectionTitle>مسير رواتب العاملين</SectionTitle>
          </View>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
            <Text style={[HR.ar, { fontWeight: 700 }]}>لشهر:</Text>
            <Text style={HR.ar}>{periodNameAr}</Text>
            <Text style={[HR.ar, { fontWeight: 700, marginLeft: 16 }]}>فرع:</Text>
            <Text style={HR.ar}>{branchNameAr}</Text>
          </View>
        </View>

        <TableHeader />
        {rows.map((row) => (
          <TableRow key={row.order} row={row} />
        ))}
        <TotalsRow rows={rows} />

        <View style={[S.mt24, { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }]}>
          <Text style={[HR.ar, { fontWeight: 700 }]}>إجمالي عدد الموظفين:</Text>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
            <Text style={HR.ar}>موظف</Text>
            <Text style={HR.lat}>{String(rows.length)}</Text>
          </View>
        </View>

        <SignaturesRow labels={['مسؤول الفرع', 'إدارة شؤون الموظفين', 'المشرف العام', 'المدير المالي']} />
      </Page>
    </Document>
  );
}
