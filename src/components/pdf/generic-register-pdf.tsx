'use client';

import * as React from 'react';
import { Document, Page, Text, View, type DocumentProps } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import {
  HR_PDF_FOOTER_BOTTOM,
  HR_PDF_FOOTER_INSET_X,
  hrPdfRegisterStyles as S,
} from '@/lib/pdf/hr-pdf-base-styles';
import { PdfHrBrandHeader } from '@/components/pdf/pdf-hr-brand-header';
import { PdfPageFooter } from '@/components/pdf/pdf-page-footer';
import { PdfArLatInline } from '@/components/pdf/pdf-bidi-helpers';

export type GenericRegisterPdfProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  filterSummary: string;
  headers: string[];
  /** Each row must align with `headers` length (pad with empty strings if needed). */
  rows: string[][];
  /** Use landscape when there are many columns. */
  landscape?: boolean;
  rowsPerPage?: number;
};

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function clip(s: string, max: number): string {
  const t = (s ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function GenericRegisterPdf({
  companyNameAr,
  companyNameEn,
  titleAr,
  filterSummary,
  headers,
  rows,
  landscape = false,
  rowsPerPage,
}: GenericRegisterPdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  const n = Math.max(1, headers.length);
  const colPct = `${(100 / n).toFixed(3)}%`;
  const rpp = rowsPerPage ?? (landscape ? 14 : 20);
  const pages = chunk(rows, rpp);

  return (
    <Document>
      {pages.map((pageRows, pi) => (
        <Page key={pi} size="A4" style={S.page} orientation={landscape ? 'landscape' : 'portrait'}>
          <PdfHrBrandHeader companyNameAr={companyNameAr} companyNameEn={companyNameEn} />
          <Text style={S.title}>{titleAr}</Text>
          <View style={{ marginBottom: 8 }}>
            <PdfArLatInline
              text={filterSummary}
              arStyle={{ fontFamily: 'Ar', fontSize: 8, color: '#444', textAlign: 'right' }}
              latStyle={{ fontSize: 8, color: '#444', textAlign: 'right' }}
            />
          </View>

          <View style={S.th}>
            {headers.map((h, i) => (
              <Text
                key={`h-${i}`}
                style={[S.ar, { width: colPct, fontWeight: 700, textAlign: 'center', fontSize: 7, paddingHorizontal: 2 }]}
              >
                {h}
              </Text>
            ))}
          </View>

          {pageRows.length === 0 && pi === 0 ? (
            <Text style={[S.ar, { marginTop: 14, textAlign: 'center', color: '#64748b' }]}>لا توجد بيانات ضمن الفلترة.</Text>
          ) : (
            pageRows.map((row, ri) => (
              <View key={`r-${pi}-${ri}`} style={S.tr} wrap={false}>
                {headers.map((_, ci) => (
                  <View
                    key={`c-${ci}`}
                    style={{ width: colPct, paddingHorizontal: 2, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <PdfArLatInline
                      text={clip(row[ci] ?? '', landscape ? 90 : 70)}
                      arStyle={{ fontFamily: 'Ar', fontSize: 6, textAlign: 'center' }}
                      latStyle={{ fontSize: 6, textAlign: 'center' }}
                      rowStyle={{ justifyContent: 'center' }}
                    />
                  </View>
                ))}
              </View>
            ))
          )}

          <PdfPageFooter
            pageNum={pi + 1}
            totalPages={pages.length}
            insetX={HR_PDF_FOOTER_INSET_X}
            bottom={HR_PDF_FOOTER_BOTTOM}
            totalLabelAr="إجمالي السجلات"
            totalValue={rows.length}
          />
        </Page>
      ))}
    </Document>
  );
}
