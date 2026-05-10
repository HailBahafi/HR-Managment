'use client';

import * as React from 'react';
import { Document, Page, Text, View, type DocumentProps } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { hrPdfRegisterStyles as HR } from '@/lib/pdf/hr-pdf-base-styles';
import { PdfArLatInline, sanitizePdfText } from '@/components/pdf/pdf-bidi-helpers';
import { PdfHeader, SectionTitle, S, C, LabeledField, fmtDate } from '@/features/hr/contracts/reports/components/pdf-shared';

export type EmploymentContractPdfArticleLine = {
  code: string;
  titleAr: string;
  bodySnippet: string;
};

export type EmploymentContractPdfAllowanceRow = {
  labelAr: string;
  amount: string;
};

export type EmploymentContractPdfProps = {
  logoSrc?: string;
  company: { nameAr: string; nameEn: string };
  employeeNameAr: string;
  contractNumber: string;
  natureLabelAr: string;
  arrangementLabelAr: string;
  startDate: string;
  endDate: string;
  probationDaysLabel: string;
  annualLeaveDaysLabel: string;
  baseSalary: string;
  currency: string;
  allowancesNote: string;
  deductionsNote: string;
  allowanceRows: EmploymentContractPdfAllowanceRow[];
  articles: EmploymentContractPdfArticleLine[];
};

function RowKV({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row-reverse', borderBottomWidth: 0.5, borderBottomColor: C.border, paddingVertical: 5 }}>
      <Text style={[HR.ar, { width: '32%', fontSize: 7, fontWeight: 700, textAlign: 'right' }]}>{label}</Text>
      <View style={{ flex: 1 }}>
        <PdfArLatInline
          text={value || '—'}
          arStyle={[HR.ar, { fontSize: 7, textAlign: 'right', lineHeight: 1.45 }]}
          latStyle={{ fontSize: 7, textAlign: 'right', lineHeight: 1.45 }}
        />
      </View>
    </View>
  );
}

export function EmploymentContractPdfDoc({
  logoSrc,
  company,
  employeeNameAr,
  contractNumber,
  natureLabelAr,
  arrangementLabelAr,
  startDate,
  endDate,
  probationDaysLabel,
  annualLeaveDaysLabel,
  baseSalary,
  currency,
  allowancesNote,
  deductionsNote,
  allowanceRows,
  articles,
}: EmploymentContractPdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  const title = `عقد عمل رقم ${contractNumber}`;
  return (
    <Document title={title}>
      <Page size="A4" style={S.page}>
        <PdfHeader company={company} logoSrc={logoSrc} />
        <SectionTitle>{title}</SectionTitle>

        <View style={S.mt16}>
          <RowKV label="المستفيد من العقد" value={sanitizePdfText(employeeNameAr)} />
          <RowKV label="رقم العقد" value={sanitizePdfText(contractNumber)} />
          <RowKV label="نوع العقد" value={sanitizePdfText(natureLabelAr)} />
          <RowKV label="نمط الدوام" value={sanitizePdfText(arrangementLabelAr)} />
          <RowKV label="تاريخ البداية" value={sanitizePdfText(fmtDate(startDate))} />
          <RowKV label="تاريخ الانتهاء" value={sanitizePdfText(fmtDate(endDate))} />
          <RowKV label="أيام التجربة" value={sanitizePdfText(probationDaysLabel)} />
          <RowKV label="إجمالي أيام الإجازة السنوية (سنوياً)" value={sanitizePdfText(annualLeaveDaysLabel)} />
          <RowKV label="الراتب الأساسي المتفق عليه" value={sanitizePdfText(`${baseSalary} ${currency}`)} />
        </View>

        {allowanceRows.length > 0 ? (
          <View style={[S.mt16]}>
            <Text style={[HR.ar, { fontSize: 8, fontWeight: 700, textAlign: 'right', marginBottom: 6 }]}>البدلات المتفق عليها</Text>
            {allowanceRows.map((row, idx) => (
              <RowKV key={`${row.labelAr}-${idx}`} label={row.labelAr} value={sanitizePdfText(`${row.amount} ${currency}`)} />
            ))}
          </View>
        ) : null}

        {(allowancesNote.trim() || deductionsNote.trim()) ? (
          <View style={S.mt16}>
            {allowancesNote.trim() ? <LabeledField label="ملاحظات البدلات" value={sanitizePdfText(allowancesNote)} /> : null}
            {deductionsNote.trim() ? <LabeledField label="ملاحظات الخصومات" value={sanitizePdfText(deductionsNote)} /> : null}
          </View>
        ) : null}

        {articles.length > 0 ? (
          <View style={S.mt16}>
            <Text style={[HR.ar, { fontSize: 8, fontWeight: 700, textAlign: 'right', marginBottom: 6 }]}>مواد وبنود العقد</Text>
            {articles.map((a, i) => (
              <View key={`${a.code}-${i}`} wrap={false} style={{ marginBottom: 8 }}>
                <Text style={[HR.ar, { fontSize: 7, fontWeight: 700, textAlign: 'right' }]}>
                  {sanitizePdfText(`${i + 1}. ${a.code} — ${a.titleAr}`)}
                </Text>
                <Text style={[HR.ar, { fontSize: 6.5, textAlign: 'right', marginTop: 2, color: C.muted, lineHeight: 1.5 }]}>
                  {sanitizePdfText(a.bodySnippet)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[S.mt24, { borderTopWidth: 0.75, borderTopColor: C.border, paddingTop: 10 }]}>
          <PdfArLatInline
            text="هذا المستند صادر من نظام إدارة العقود — يُعتمَد بتوقيع الطرفين عند الإبرام وفق سياسات المنظمة."
            arStyle={[HR.ar, { fontSize: 6.5, textAlign: 'center', color: C.muted }]}
            latStyle={{ fontSize: 6.5, textAlign: 'center', color: C.muted }}
          />
        </View>
      </Page>
    </Document>
  );
}
