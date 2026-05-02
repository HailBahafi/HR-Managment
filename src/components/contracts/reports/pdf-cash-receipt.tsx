import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { hrPdfRegisterStyles as HR } from '@/lib/pdf/hr-pdf-base-styles';
import { PdfHeader, SectionTitle, SignaturesRow, LabeledField, S, C, fmt, fmtDate, type CompanyInfo } from './pdf-shared';

export type CashReceiptReason =
  | 'salary'
  | 'advance'
  | 'allowance'
  | 'overtime'
  | 'storage_deficit'
  | 'other';

export const REASON_LABELS: Record<CashReceiptReason, string> = {
  salary:          'استلام راتب شهر',
  advance:         'سلفة',
  allowance:       'بدل',
  overtime:        'بدل إضافي لمدة',
  storage_deficit: 'بدل تحمل عجز مخزون شهر',
  other:           'أخرى',
};

export type CashReceiptProps = {
  company: CompanyInfo;
  employeeNameAr: string;
  branchNameAr: string;
  amountNumeric: number;
  amountWritten: string;
  reason: CashReceiptReason;
  reasonDetail: string;
  date: string;
};

function CheckRow({ checked, label, detail }: { checked: boolean; label: string; detail?: string }) {
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 6 }}>
      <View style={{
        width: 10, height: 10, border: `1pt solid #000`, marginLeft: 6, marginRight: 2,
        backgroundColor: checked ? C.primary : 'transparent',
      }} />
      <Text style={[HR.ar, { fontSize: 7 }]}>
        {label}{detail ? ` ${detail}` : ''}
      </Text>
    </View>
  );
}

export function CashReceiptDoc({ company, employeeNameAr, branchNameAr, amountNumeric, amountWritten, reason, reasonDetail, date }: CashReceiptProps) {
  ensureHrPdfFonts();
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <PdfHeader company={company} />
        <SectionTitle>سند استلام نقدي</SectionTitle>

        <View style={S.mt16}>
          <View style={{ flexDirection: 'row-reverse', gap: 12, flexWrap: 'wrap' }}>
            <LabeledField label="استلمت انا /" value={employeeNameAr} width={240} />
            <LabeledField label="الموقعة أدناه" value="" width={160} />
          </View>

          <LabeledField label="من مؤسسة" value={company.nameAr} width={220} />
          <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
            <LabeledField label="فرع" value={branchNameAr} width={140} />
          </View>
        </View>

        <View style={[S.mt16, { backgroundColor: '#f9f9f9', border: `1pt solid ${C.border}`, padding: 10, borderRadius: 3 }]}>
          <View style={{ flexDirection: 'row-reverse', gap: 12, flexWrap: 'wrap' }}>
            <LabeledField label="مبلغ وقدره (" value={fmt(amountNumeric)} width={140} />
            <Text style={[HR.ar, { fontSize: 7, alignSelf: 'flex-end', marginBottom: 12, marginLeft: 4 }]}>)</Text>
            <LabeledField label="ريال سعودي ( كتابةً )" value={amountWritten || `${fmt(amountNumeric)} ريال سعودي`} width={180} />
          </View>
          <View style={{ flexDirection: 'row-reverse', marginTop: 4 }}>
            <Text style={[HR.ar, { fontWeight: 700, fontSize: 7, marginLeft: 8 }]}>وذلك مقابل:</Text>
          </View>
        </View>

        <View style={[S.mt16, { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }]}>
          <View style={{ width: '48%' }}>
            <CheckRow checked={reason === 'salary'}  label="استلام راتب شهر" detail={reason === 'salary' ? reasonDetail : '........'} />
            <CheckRow checked={reason === 'advance'} label="بدل إضافي لمدة" detail={reason === 'advance' ? reasonDetail : '........'} />
            <CheckRow checked={reason === 'storage_deficit'} label={`بدل تحمل عجز مخزون شهر ${reason === 'storage_deficit' ? reasonDetail : '.....'}`} />
          </View>
          <View style={{ width: '48%' }}>
            <CheckRow checked={reason === 'allowance'} label="استلام بدل شهر" detail={reason === 'allowance' ? reasonDetail : '.......'} />
            <CheckRow checked={reason === 'overtime'}  label="سلفة / قرض" detail="" />
            <CheckRow checked={reason === 'other'}     label="أخرى — حدد البيان:" detail={reason === 'other' ? reasonDetail : ''} />
          </View>
        </View>

        <View style={[S.mt32, { backgroundColor: '#f5f5f5', border: `1pt solid ${C.border}`, padding: 12, borderRadius: 3 }]}>
          <Text style={[HR.ar, { fontWeight: 700, textAlign: 'right', marginBottom: 12, fontSize: 9 }]}>و على ذلك جرى التوقيع ،،،</Text>
          <LabeledField label="الاسم :" value={employeeNameAr} width={300} />
          <LabeledField label="التوقيع :" value="" width={300} />
          <LabeledField label="التاريخ :" value={fmtDate(date)} width={300} />
        </View>

        <SignaturesRow labels={['مسؤول الفرع', 'إدارة شؤون الموظفين', 'المشرف العام', 'المدير المالي']} />
      </Page>
    </Document>
  );
}
