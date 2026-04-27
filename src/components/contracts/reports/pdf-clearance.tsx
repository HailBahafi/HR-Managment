import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
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
            <Text style={{ fontWeight: 'bold', fontSize: 9, textAlign: 'right' }}>{label}</Text>
          </View>
          <View style={{ flex: 1, padding: '5pt 8pt' }}>
            <Text style={{ fontSize: 9, textAlign: 'right' }}>{value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function ClearanceDoc({ company, employeeNameAr, nationalId, nationality, startDate, endDate, date }: ClearanceProps) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <PdfHeader company={company} />
        <SectionTitle>مخالصة موظف — إبراء ذمة</SectionTitle>

        <View style={[S.mt16, { border: `1pt solid ${C.border}`, padding: 14, borderRadius: 3 }]}>
          <Text style={{ fontSize: 10, textAlign: 'right', lineHeight: 1.8, fontWeight: 'bold', marginBottom: 6 }}>
            أقر أنا / ...........................................................................، الجنسية ..........................
          </Text>
          <Text style={{ fontSize: 10, textAlign: 'right', lineHeight: 1.8, marginBottom: 4 }}>
            بموجب بطاقة أحوال رقم ({nationalId}) الموقعة أدناه، اعتباراً من
          </Text>
          <Text style={{ fontSize: 10, textAlign: 'right', lineHeight: 1.8, marginBottom: 4 }}>
            تاريخ {fmtDate(endDate)} الموافق {fmtDate(endDate)}م قد وصلني جميع الأموال
          </Text>
          <Text style={{ fontSize: 10, textAlign: 'right', lineHeight: 1.8 }}>
            والمبالغ المستحقة لي وكافة حقوقي على مختلف أنواعها وحتى إنهاء فترة خدمتي.
          </Text>
        </View>

        <View style={[S.mt16, { border: `1pt solid ${C.border}`, padding: 14, borderRadius: 3, backgroundColor: '#fafafa' }]}>
          <Text style={{ fontSize: 10, textAlign: 'right', lineHeight: 2 }}>
            وتبعاً لذلك فإنني أبرئ ذمة مؤسسة {company.nameAr} للتجارة إبراءً شاملاً لا رجوع منه مطلقاً لأي
          </Text>
          <Text style={{ fontSize: 10, textAlign: 'right', lineHeight: 2 }}>
            حق أو مطالبة حالية أو مستقبلية ومن أي نوع أو شكل كان.
          </Text>
          <Text style={{ fontSize: 10, textAlign: 'right', lineHeight: 2, marginTop: 6 }}>
            وبذلك فإننا نبرئ ذمة الموظفة / الموظف المذكورة أعلاه إبراءً شاملاً لا رجوع منه مطلقاً لأي حق
          </Text>
          <Text style={{ fontSize: 10, textAlign: 'right', lineHeight: 2 }}>
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
            <Text style={{ fontWeight: 'bold', fontSize: 9 }}>الاسم :</Text>
            <View style={{ flex: 1, borderBottom: `1pt solid ${C.border}`, marginLeft: 60, marginRight: 8 }} />
          </View>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 9 }}>التوقيع :</Text>
            <View style={{ flex: 1, borderBottom: `1pt solid ${C.border}`, marginLeft: 60, marginRight: 8 }} />
          </View>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 9 }}>التاريخ :</Text>
            <View style={{ flex: 1, marginLeft: 60, marginRight: 8 }}>
              <Text style={{ fontSize: 9, textAlign: 'right', borderBottom: `1pt solid ${C.border}`, paddingBottom: 2 }}>{fmtDate(date)}</Text>
            </View>
          </View>
        </View>

        <View style={[S.mt16, { flexDirection: 'row-reverse', justifyContent: 'center', gap: 6 }]}>
          <Text style={{ fontSize: 8, color: C.muted, textAlign: 'center' }}>
            هذه الوثيقة صادرة من نظام {company.nameAr} لإدارة الموارد البشرية — {fmtDate(date)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
