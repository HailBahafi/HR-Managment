import React from 'react';
import { StyleSheet, View, Text } from '@react-pdf/renderer';
import { HR_PDF_PAGE_STYLE, hrPdfRegisterStyles as HR } from '@/lib/pdf/hr-pdf-base-styles';
import { CompanyLetterheadHeader } from '@/components/pdf/company-letterhead-header';
import { PdfArLatInline } from '@/components/pdf/pdf-bidi-helpers';
import { toWesternDigits } from '@/lib/utils';

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
    ...HR_PDF_PAGE_STYLE,
    backgroundColor: '#ffffff',
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

/** `company` kept for API compatibility; topper is fixed Rose Trading Est letterhead. */
export function PdfHeader({ company: _company, logoSrc }: { company: CompanyInfo; logoSrc?: string }) {
  return <CompanyLetterheadHeader logoSrc={logoSrc} />;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[HR.ar, { fontSize: 14, fontWeight: 700, textAlign: 'center', textDecoration: 'underline' }]}>
        {children as string}
      </Text>
    </View>
  );
}

export function LabeledField({ label, value, width }: { label: string; value: string; width?: number | string }) {
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-end', width: width ?? 'auto', marginBottom: 10 }}>
      <Text style={[HR.ar, { fontWeight: 700, marginLeft: 4 }]}>{label}</Text>
      <View style={{ flex: 1, borderBottom: '1pt solid #000', marginLeft: 6, paddingBottom: 1 }}>
        <PdfArLatInline
          text={value}
          arStyle={{ fontSize: 7, textAlign: 'right', lineHeight: 1.35 }}
          latStyle={{ fontSize: 7, textAlign: 'right', lineHeight: 1.35 }}
        />
      </View>
    </View>
  );
}

export function SignaturesRow({ labels }: { labels: string[] }) {
  return (
    <View style={[S.rowReverse, { justifyContent: 'space-around', marginTop: 40 }]}>
      {labels.map((label) => (
        <View key={label} style={{ alignItems: 'center', minWidth: 80 }}>
          <Text style={[HR.ar, { fontSize: 9, fontWeight: 700, marginBottom: 24 }]}>{`توقيع\n${label}`}</Text>
          <View style={{ width: 80, height: 1, backgroundColor: '#000' }} />
          <Text style={[HR.ar, { fontSize: 8, color: C.muted, marginTop: 3 }]}>.......................</Text>
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
    return toWesternDigits(
      new Date(iso).toLocaleDateString('ar-SA-u-ca-gregory', {
        numberingSystem: 'latn',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    );
  } catch {
    return iso;
  }
}
