'use client';

import * as React from 'react';
import { Document, Page, Text, View, type DocumentProps } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { HR_PDF_FOOTER_BOTTOM, HR_PDF_FOOTER_INSET_X, hrPdfRegisterStyles as HR } from '@/lib/pdf/hr-pdf-base-styles';
import { PdfPageFooter } from '@/components/pdf/pdf-page-footer';

export type NotificationPdfRow = {
  dateYmd: string;
  titleAr: string;
  recipientNameAr: string;
  readAr: string;
  inboxAr: string;
};

export type NotificationsRegisterPdfProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  filterSummary: string;
  rows: NotificationPdfRow[];
  includeRecipientColumn: boolean;
};

const ROWS_PER_PAGE = 22;

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function NotificationsRegisterPdf({
  companyNameAr,
  companyNameEn,
  titleAr,
  filterSummary,
  rows,
  includeRecipientColumn,
}: NotificationsRegisterPdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  const pages = chunk(rows, ROWS_PER_PAGE);

  const colDate = includeRecipientColumn ? '11%' : '12%';
  const colTitle = includeRecipientColumn ? '38%' : '48%';
  const colRecip = includeRecipientColumn ? '22%' : '0%';
  const colRead = includeRecipientColumn ? '14%' : '18%';
  const colInbox = includeRecipientColumn ? '15%' : '22%';

  return (
    <Document>
      {pages.map((pageRows, pi) => (
        <Page key={pi} size="A4" style={HR.page}>
          <View style={HR.brand}>
            <Text style={HR.brandAr}>{companyNameAr}</Text>
            <Text style={HR.brandEn}>{companyNameEn}</Text>
          </View>
          <View style={HR.line} />
          <Text style={HR.title}>{titleAr}</Text>
          <Text style={HR.meta}>{filterSummary}</Text>

          <View style={HR.th}>
            <Text style={[HR.lat, { width: colDate, fontWeight: 700, textAlign: 'center', fontSize: 8 }]}>التاريخ</Text>
            <Text style={[HR.ar, { width: colTitle, fontWeight: 700, textAlign: 'right', paddingHorizontal: 4 }]}>التنبيه</Text>
            {includeRecipientColumn ? (
              <Text style={[HR.ar, { width: colRecip, fontWeight: 700, textAlign: 'right' }]}>المستلم</Text>
            ) : null}
            <Text style={[HR.ar, { width: colRead, fontWeight: 700, textAlign: 'center', fontSize: 8 }]}>القراءة</Text>
            <Text style={[HR.ar, { width: colInbox, fontWeight: 700, textAlign: 'center', fontSize: 8 }]}>الصندوق</Text>
          </View>

          {pageRows.length === 0 && pi === 0 ? (
            <Text style={[HR.ar, { marginTop: 14, textAlign: 'center', color: '#64748b' }]}>لا توجد تنبيهات ضمن الفلترة.</Text>
          ) : (
            pageRows.map((r, i) => (
              <View key={`${r.dateYmd}-${i}`} style={HR.tr} wrap={false}>
                <View style={{ flexDirection: 'row-reverse', width: '100%' }}>
                  <Text style={[HR.lat, { width: colDate, textAlign: 'center', fontSize: 7 }]}>{r.dateYmd}</Text>
                  <Text style={[HR.ar, { width: colTitle, textAlign: 'right', paddingHorizontal: 4, fontSize: 7 }]}>
                    {r.titleAr.length > 90 ? `${r.titleAr.slice(0, 90)}…` : r.titleAr}
                  </Text>
                  {includeRecipientColumn ? (
                    <Text style={[HR.ar, { width: colRecip, textAlign: 'right', fontSize: 7 }]}>{r.recipientNameAr}</Text>
                  ) : null}
                  <Text style={[HR.ar, { width: colRead, textAlign: 'center', fontSize: 7 }]}>{r.readAr}</Text>
                  <Text style={[HR.ar, { width: colInbox, textAlign: 'center', fontSize: 7 }]}>{r.inboxAr}</Text>
                </View>
              </View>
            ))
          )}

          <PdfPageFooter
            pageNum={pi + 1}
            totalPages={Math.max(1, pages.length)}
            insetX={HR_PDF_FOOTER_INSET_X}
            bottom={HR_PDF_FOOTER_BOTTOM}
            totalLabelAr="عدد السجلات"
            totalValue={rows.length}
          />
        </Page>
      ))}
    </Document>
  );
}
