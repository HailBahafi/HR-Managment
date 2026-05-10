'use client';

import * as React from 'react';
import { Document, Page, Text, View, type DocumentProps } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { hrPdfRegisterStyles as HR } from '@/lib/pdf/hr-pdf-base-styles';
import { PdfHeader, SectionTitle, S, C } from '@/features/hr/contracts/reports/components/pdf-shared';
import { PdfArLatBlock, sanitizePdfText } from '@/components/pdf/pdf-bidi-helpers';

export type DisciplineCircularPdfProps = {
  logoSrc?: string;
  company: { nameAr: string; nameEn: string };
  titleAr: string;
  issuedDate: string;
  audienceSummaryAr: string;
  bodyAr: string;
  /** «لم يُرسل» أو تاريخ الإرسال */
  sendFooterAr?: string;
};

export function DisciplineCircularPdfDoc({
  logoSrc,
  company,
  titleAr,
  issuedDate,
  audienceSummaryAr,
  bodyAr,
  sendFooterAr,
}: DisciplineCircularPdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  const head = titleAr.trim() ? sanitizePdfText(titleAr) : 'تعميم إداري';
  return (
    <Document title={head}>
      <Page size="A4" style={S.page}>
        <PdfHeader company={company} logoSrc={logoSrc} />
        <SectionTitle>تعميم</SectionTitle>

        <View style={{ marginTop: 12, gap: 6 }}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', borderBottomWidth: 0.5, borderBottomColor: C.border, paddingBottom: 6 }}>
            <Text style={[HR.ar, { fontSize: 8, fontWeight: 700 }]}>{head}</Text>
            <Text style={[HR.lat, { fontSize: 7 }]}>{issuedDate}</Text>
          </View>
          <Text style={[HR.ar, { fontSize: 7, fontWeight: 700, textAlign: 'right' }]}>الفئة المستهدفة</Text>
          <Text style={[HR.ar, { fontSize: 7.5, textAlign: 'right', lineHeight: 1.5 }]}>{sanitizePdfText(audienceSummaryAr)}</Text>

          <View style={[S.mt8, { backgroundColor: '#fafafa', borderWidth: 0.75, borderColor: C.border, borderRadius: 2, padding: 12 }]}>
            <PdfArLatBlock
              text={sanitizePdfText(bodyAr)}
              arStyle={[HR.ar, { fontSize: 8.5, lineHeight: 1.75, textAlign: 'right' }]}
              latStyle={{ fontFamily: 'Lat', fontSize: 8, lineHeight: 1.65, textAlign: 'right', color: '#222' }}
            />
          </View>
        </View>

        <View style={[S.mt24, { borderTopWidth: 0.75, borderTopColor: C.border, paddingTop: 8 }]}>
          <PdfArLatBlock
            text={sanitizePdfText(sendFooterAr ?? '— مستند نظام الانضباط الإداري —')}
            arStyle={[HR.ar, { fontSize: 6.5, textAlign: 'center', color: C.muted }]}
            latStyle={{ fontSize: 6.5, textAlign: 'center', color: C.muted }}
          />
        </View>
      </Page>
    </Document>
  );
}
