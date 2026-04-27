import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
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
      <Text style={{ fontWeight: 'bold', textAlign: 'center', fontSize: 9 }}>{label}</Text>
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
  const cell = (w: number, content: string, align: 'center' | 'right' | 'left' = 'center') => (
    <View style={{ width: w, borderRight: `1pt solid ${C.border}`, padding: '5pt 3pt', minHeight: 24 }}>
      <Text style={{ textAlign: align, fontSize: 9 }}>{content}</Text>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row-reverse', borderLeft: `1pt solid ${C.border}`, borderBottom: `1pt solid ${C.border}` }}>
      {cell(COL.order, String(row.order))}
      {cell(COL.name,  row.nameAr, 'right')}
      {cell(COL.dept,  row.department, 'right')}
      {cell(COL.base,  fmt(row.baseSalary))}
      {cell(COL.bonus, row.bonus > 0 ? fmt(row.bonus) : '—')}
      {cell(COL.total, fmt(row.totalSalary))}
      {cell(COL.sign,  '')}
    </View>
  );
}

function TotalsRow({ rows }: { rows: PayrollRow[] }) {
  const totalBase  = rows.reduce((s, r) => s + r.baseSalary, 0);
  const totalBonus = rows.reduce((s, r) => s + r.bonus, 0);
  const totalAll   = rows.reduce((s, r) => s + r.totalSalary, 0);
  const cell = (w: number, content: string) => (
    <View style={{ width: w, borderRight: `1pt solid ${C.border}`, padding: '5pt 3pt', backgroundColor: C.tableHead }}>
      <Text style={{ textAlign: 'center', fontSize: 9, fontWeight: 'bold' }}>{content}</Text>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row-reverse', borderLeft: `1pt solid ${C.border}`, borderBottom: `1pt solid ${C.border}` }}>
      {cell(COL.order, '')}
      {cell(COL.name + COL.dept, 'الإجمالي')}
      {cell(COL.base,  fmt(totalBase))}
      {cell(COL.bonus, fmt(totalBonus))}
      {cell(COL.total, fmt(totalAll))}
      {cell(COL.sign,  '')}
    </View>
  );
}

export function PayrollRegisterDoc({ company, periodNameAr, branchNameAr, rows }: PayrollRegisterProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={{ ...S.page, paddingHorizontal: 28 }}>
        <PdfHeader company={company} />

        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 16 }}>
          <View>
            <SectionTitle>مسير رواتب العاملين</SectionTitle>
          </View>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>لشهر:</Text>
            <Text>{periodNameAr}</Text>
            <Text style={{ fontWeight: 'bold', marginLeft: 16 }}>فرع:</Text>
            <Text>{branchNameAr}</Text>
          </View>
        </View>

        <TableHeader />
        {rows.map((row) => (
          <TableRow key={row.order} row={row} />
        ))}
        <TotalsRow rows={rows} />

        <View style={[S.mt24, { flexDirection: 'row-reverse', gap: 8 }]}>
          <Text style={S.bold}>إجمالي عدد الموظفين:</Text>
          <Text>{rows.length} موظف</Text>
        </View>

        <SignaturesRow labels={['مسؤول الفرع', 'إدارة شؤون الموظفين', 'المشرف العام', 'المدير المالي']} />
      </Page>
    </Document>
  );
}
