import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { hrPdfRegisterStyles as HR } from '@/lib/pdf/hr-pdf-base-styles';
import { PdfArLatInline } from '@/components/pdf/pdf-bidi-helpers';
import { PdfHeader, SectionTitle, S, C, fmtDate, type CompanyInfo } from './pdf-shared';

export type ClearanceProps = {
  company: CompanyInfo;
  employeeNameAr: string;
  nationalId: string;
  nationality: string;
  startDate: string;
  endDate: string;
  date: string;
};

function InfoTable({ rows }: { rows: [string, string][] }) {
  return (
    <View style={{ border: `1pt solid ${C.border}`, marginTop: 8 }}>
      {rows.map(([label, value], i) => (
        <View
          key={label}
          style={{
            flexDirection: 'row-reverse',
            borderBottom: i < rows.length - 1 ? `1pt solid ${C.border}` : undefined,
          }}
        >
          <View style={{ width: 100, backgroundColor: C.tableHead, padding: '5pt 8pt', borderLeft: `1pt solid ${C.border}` }}>
            <Text style={[HR.ar, { fontWeight: 700, fontSize: 7, textAlign: 'right' }]}>{label}</Text>
          </View>
          <View style={{ flex: 1, padding: '5pt 8pt' }}>
            <PdfArLatInline
              text={value}
              arStyle={[HR.ar, { fontSize: 7, textAlign: 'right' }]}
              latStyle={{ fontSize: 7, textAlign: 'right' }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ClearanceDoc({ company, employeeNameAr, nationalId, nationality, startDate, endDate, date }: ClearanceProps) {
  ensureHrPdfFonts();
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <PdfHeader company={company} />
        <SectionTitle>مخالصة موظف — إبراء ذمة</SectionTitle>

        <View style={[S.mt16, { border: `1pt solid ${C.border}`, padding: 14, borderRadius: 3 }]}>
          <Text style={[HR.ar, { fontSize: 9, textAlign: 'right', lineHeight: 1.8, fontWeight: 700, marginBottom: 6 }]}>
            أقر أنا / ...........................................................................، الجنسية ..........................
          </Text>
          <View style={{ marginBottom: 4 }}>
            <PdfArLatInline
              text={`بموجب بطاقة أحوال رقم (${nationalId}) الموقعة أدناه، اعتباراً من`}
              arStyle={[HR.ar, { fontSize: 9, textAlign: 'right', lineHeight: 1.8 }]}
              latStyle={{ fontSize: 9, textAlign: 'right', lineHeight: 1.8 }}
            />
          </View>
          <View style={{ marginBottom: 4 }}>
            <PdfArLatInline
              text={`تاريخ ${fmtDate(endDate)} الموافق ${fmtDate(endDate)}م قد وصلني جميع الأموال`}
              arStyle={[HR.ar, { fontSize: 9, textAlign: 'right', lineHeight: 1.8 }]}
              latStyle={{ fontSize: 9, textAlign: 'right', lineHeight: 1.8 }}
            />
          </View>
          <Text style={[HR.ar, { fontSize: 9, textAlign: 'right', lineHeight: 1.8 }]}>
            والمبالغ المستحقة لي وكافة حقوقي على مختلف أنواعها وحتى إنهاء فترة خدمتي.
          </Text>
        </View>

        <View style={[S.mt16, { border: `1pt solid ${C.border}`, padding: 14, borderRadius: 3, backgroundColor: '#fafafa' }]}>
          <Text style={[HR.ar, { fontSize: 9, textAlign: 'right', lineHeight: 2 }]}>
            وتبعاً لذلك فإنني أبرئ ذمة مؤسسة {company.nameAr} للتجارة إبراءً شاملاً لا رجوع منه مطلقاً لأي
          </Text>
          <Text style={[HR.ar, { fontSize: 9, textAlign: 'right', lineHeight: 2 }]}>
            حق أو مطالبة حالية أو مستقبلية ومن أي نوع أو شكل كان.
          </Text>
          <Text style={[HR.ar, { fontSize: 9, textAlign: 'right', lineHeight: 2, marginTop: 6 }]}>
            وبذلك فإننا نبرئ ذمة الموظفة / الموظف المذكورة أعلاه إبراءً شاملاً لا رجوع منه مطلقاً لأي حق
          </Text>
          <Text style={[HR.ar, { fontSize: 9, textAlign: 'right', lineHeight: 2 }]}>
            أو مطالبة حالية أو مستقبلية ومن أي نوع أو شكل كان.
          </Text>
        </View>

        <InfoTable
          rows={[
            ['الاسم',        employeeNameAr],
            ['الجنسية',      nationality],
            ['رقم الهوية',   nationalId],
            ['تاريخ التعيين', fmtDate(startDate)],
            ['تاريخ الإنهاء', fmtDate(endDate)],
          ]}
        />

        <View style={[S.mt32, { border: `1pt solid ${C.border}`, padding: 12, borderRadius: 3 }]}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={[HR.ar, { fontWeight: 700, fontSize: 7 }]}>الاسم :</Text>
            <View style={{ flex: 1, borderBottom: `1pt solid ${C.border}`, marginLeft: 60, marginRight: 8 }} />
          </View>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={[HR.ar, { fontWeight: 700, fontSize: 7 }]}>التوقيع :</Text>
            <View style={{ flex: 1, borderBottom: `1pt solid ${C.border}`, marginLeft: 60, marginRight: 8 }} />
          </View>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
            <Text style={[HR.ar, { fontWeight: 700, fontSize: 7 }]}>التاريخ :</Text>
            <View style={{ flex: 1, marginLeft: 60, marginRight: 8 }}>
              <Text style={[HR.lat, { fontSize: 7, textAlign: 'right', borderBottom: `1pt solid ${C.border}`, paddingBottom: 2 }]}>{fmtDate(date)}</Text>
            </View>
          </View>
        </View>

        <View style={[S.mt16, { flexDirection: 'row-reverse', justifyContent: 'center', gap: 6 }]}>
          <PdfArLatInline
            text={`هذه الوثيقة صادرة من نظام ${company.nameAr} لإدارة الموارد البشرية — ${fmtDate(date)}`}
            arStyle={[HR.ar, { fontSize: 7, color: C.muted, textAlign: 'center' }]}
            latStyle={{ fontSize: 7, color: C.muted, textAlign: 'center' }}
            rowStyle={{ justifyContent: 'center' }}
          />
        </View>
      </Page>
    </Document>
  );
}
