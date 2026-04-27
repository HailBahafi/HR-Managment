import React from 'react';
import { Font, StyleSheet, View, Text } from '@react-pdf/renderer';

Font.register({
  family: 'Cairo',
  fonts: [
    { src: '/fonts/Cairo-Regular.woff', fontWeight: 'normal' },
    { src: '/fonts/Cairo-Bold.woff',    fontWeight: 'bold'   },
  ],
});

export const C = {
  primary:   '#1a3a5c',
  gold:      '#b5910a',
  tableHead: '#c8dfc4',
  border:    '#aaaaaa',
  muted:     '#555555',
  light:     '#f5f5f5',
};

export const S = StyleSheet.create({
  page: {
    fontFamily: 'Cairo',
    fontSize: 10,
    backgroundColor: '#ffffff',
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
  },
  row: { flexDirection: 'row' },
  rowReverse: { flexDirection: 'row-reverse' },
  bold: { fontWeight: 'bold' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  left: { textAlign: 'left' },
  muted: { color: C.muted },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  mt24: { marginTop: 24 },
  mt32: { marginTop: 32 },
  mt40: { marginTop: 40 },
});

export type CompanyInfo = { nameAr: string; nameEn: string; crNumber?: string };

export function PdfHeader({ company }: { company: CompanyInfo }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <View style={[S.rowReverse, { justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={{ fontSize: 15, fontWeight: 'bold', color: C.primary }}>{company.nameAr}</Text>
        <Text style={{ fontSize: 11, fontWeight: 'bold', color: C.primary, letterSpacing: 1 }}>
          {company.nameEn.toUpperCase()}
        </Text>
      </View>
      {company.crNumber ? (
        <View style={[S.rowReverse, { justifyContent: 'space-between', marginTop: 2 }]}>
          <Text style={{ fontSize: 8, color: C.muted }}>س.ت: {company.crNumber}</Text>
          <Text style={{ fontSize: 8, color: C.muted }}>C.R: {company.crNumber}</Text>
        </View>
      ) : null}
      <View style={{ height: 2.5, backgroundColor: C.gold, marginTop: 6 }} />
      <View style={{ height: 1, backgroundColor: C.gold, marginTop: 2 }} />
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', textDecoration: 'underline' }}>
        {children as string}
      </Text>
    </View>
  );
}

export function LabeledField({ label, value, width }: { label: string; value: string; width?: number | string }) {
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-end', width: width ?? 'auto', marginBottom: 10 }}>
      <Text style={{ fontWeight: 'bold', marginLeft: 4 }}>{label}</Text>
      <View style={{ flex: 1, borderBottom: '1pt solid #000', marginLeft: 6, paddingBottom: 1 }}>
        <Text style={{ textAlign: 'right' }}>{value}</Text>
      </View>
    </View>
  );
}

export function SignaturesRow({ labels }: { labels: string[] }) {
  return (
    <View style={[S.rowReverse, { justifyContent: 'space-around', marginTop: 40 }]}>
      {labels.map((label) => (
        <View key={label} style={{ alignItems: 'center', minWidth: 80 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 24 }}>{`توقيع\n${label}`}</Text>
          <View style={{ width: 80, height: 1, backgroundColor: '#000' }} />
          <Text style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>.......................</Text>
        </View>
      ))}
    </View>
  );
}

export function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(Math.round(n));
}

export function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ar-SA-u-ca-gregory', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}
