'use client';

import * as React from 'react';
import { Document, Page, Text, View, type DocumentProps } from '@react-pdf/renderer';
import { ensureHrPdfFonts } from '@/lib/pdf/ensure-hr-pdf-fonts';
import { CompanyLetterheadHeader } from '@/components/pdf/company-letterhead-header';
import { PdfArLatBlock, PdfArLatInline, sanitizePdfText } from '@/components/pdf/pdf-bidi-helpers';
import { RT } from '@/components/pdf/rose-trading/rose-trading-pdf-shared';

const RESIGNATION_REASONS = [
  'ظروف صحية أو عائلية تستدعي ترك العمل.',
  'قبول فرصة عمل أخرى بما يتوافق مع تطلعاتي المهنية.',
  'استكمال دراسة أو تدريب يتطلب انتقالاً جغرافياً أو زمنياً كاملاً.',
  'ظروف شخصية أخرى (أذكرها): ........................................................',
];

const CLEARANCE_LEGAL = `أقر أنا الموقعة أدناه بأنني تسلمت جميع مستحقاتي المالية والعينية الناشئة عن علاقة العمل مع مؤسسة روز للتجارة حتى تاريخ إخلاء الطرف، وبأن المؤسسة قد أدت ما عليها تجاهي بالكامل، وأبرئها إبراءً ذمة من أي التزامات أو مطالبات مستقبلية تخص فترة عملي لديها.`;

const SETTLEMENT_LEGAL = `أقر أنا المذكور/ة أدناه بأنني استلمت من مؤسسة روز للتجارة كافة المستحقات المالية والمنافع والمكافآت والبدلات والمستحقات الأخرى الناشئة عن عقد العمل وعلاقة العمل، بما في ذلك راتبي وأي مبالغ أخرى مستحقة لي حتى تاريخ إبراء الذمة هذا، وبأنني لا أملك أي مطالبة أو دعوى أو حقٍّ آخر ضد المؤسسة أو مسؤوليها، وأُبرئ ذمة المؤسسة إبراءً نهائياً وشاملاً لا رجعة فيه.`;

const TRAITS_FIXED =
  'أنيق المظهر، حسن المعاملة، مبادر، سريع البديهة، تحمل الضغوط، فرد ممتاز في الفريق.';

export type RoseResignationFormPdfProps = {
  logoSrc?: string;
  employeeNameAr: string;
  branchAr: string;
  positionAr: string;
  nationalityAr: string;
  absenceStartHijri: string;
  absenceStartGregorian: string;
  footerApplicantName: string;
  footerDateGregorian: string;
  /** عنوان / «إلى سعادة …» */
  addressedToAr?: string;
  /** نقاط أسباع الاستقالة؛ إذا فاضية يُستخدم النص المعياري */
  reasonLinesAr?: string[];
};

export function RoseResignationFormPdf({
  logoSrc,
  employeeNameAr,
  branchAr,
  positionAr,
  nationalityAr,
  absenceStartHijri,
  absenceStartGregorian,
  footerApplicantName,
  footerDateGregorian,
  addressedToAr = '',
  reasonLinesAr,
}: RoseResignationFormPdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  const reasonLines =
    Array.isArray(reasonLinesAr) && reasonLinesAr.some((x) => x.trim())
      ? reasonLinesAr.map((x) => x.trim()).filter(Boolean)
      : RESIGNATION_REASONS;

  return (
    <Document title="نموذج استقالة — روز للتجارة">
      <Page size="A4" style={RT.page}>
        <CompanyLetterheadHeader logoSrc={logoSrc} />
        <Text style={RT.docTitle}>نموذج استقالة</Text>

        {addressedToAr.trim() ? (
          <View style={RT.labelRow}>
            <Text style={RT.label}>إلى / إخوانك الموقّرين:</Text>
            <Text style={RT.value}>{sanitizePdfText(addressedToAr)}</Text>
          </View>
        ) : null}

        <View style={RT.labelRow}>
          <Text style={RT.label}>الاسم:</Text>
          <Text style={RT.value}>{sanitizePdfText(employeeNameAr)}</Text>
        </View>
        <View style={RT.labelRow}>
          <Text style={RT.label}>الفرع:</Text>
          <Text style={RT.value}>{sanitizePdfText(branchAr)}</Text>
        </View>
        <View style={RT.labelRow}>
          <Text style={RT.label}>الوظيفة:</Text>
          <Text style={RT.value}>{sanitizePdfText(positionAr)}</Text>
        </View>
        <View style={RT.labelRow}>
          <Text style={RT.label}>الجنسية:</Text>
          <Text style={RT.value}>{sanitizePdfText(nationalityAr)}</Text>
        </View>

        <Text style={RT.sectionH}>أسباب تقديم الاستقالة (يُحدد ما ينطبق):</Text>
        {reasonLines.map((line, i) => (
          <Text key={`reason-${i}`} style={RT.bullet}>
            {`${'\u2022'} ${sanitizePdfText(line)}`}
          </Text>
        ))}

        <Text style={RT.sectionH}>بداية غيابي عن العمل اعتباراً من:</Text>
        <View style={RT.labelRow}>
          <Text style={RT.label}>التاريخ الهجري:</Text>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <PdfArLatInline text={absenceStartHijri} arStyle={RT.inlineValueAr} latStyle={RT.inlineValueLat} />
          </View>
        </View>
        <View style={RT.labelRow}>
          <Text style={RT.label}>التاريخ الميلادي:</Text>
          <Text style={RT.valueLat}>{absenceStartGregorian}</Text>
        </View>

        <Text style={[RT.body, { marginTop: 12 }]}>
          أقر بصحة البيانات أعلاه، وأتحمل المسؤولية عن أي خلاف يترتب على عدم دقتها.
        </Text>

        <View style={RT.flex1} />
        <View style={RT.footerRow}>
          <View style={RT.sigBlock}>
            <Text style={RT.sigLabel}>اسم مقدم الطلب</Text>
            <Text style={[RT.body, { marginBottom: 8 }]}>{sanitizePdfText(footerApplicantName)}</Text>
            <View style={RT.sigLine} />
          </View>
          <View style={RT.sigBlock}>
            <Text style={RT.sigLabel}>التوقيع</Text>
            <View style={RT.sigLine} />
          </View>
          <View style={RT.sigBlock}>
            <Text style={RT.sigLabel}>التاريخ</Text>
            <Text style={[RT.latSmall, { marginBottom: 8 }]}>{sanitizePdfText(footerDateGregorian)}</Text>
            <View style={RT.sigLine} />
          </View>
        </View>
      </Page>
    </Document>
  );
}

export type RoseClearanceFormPdfProps = {
  logoSrc?: string;
  employeeNameAr: string;
  nationalId: string;
  reasonForClearanceAr: string;
  footerName: string;
  footerDateGregorian: string;
};

export function RoseClearanceFormPdf({
  logoSrc,
  employeeNameAr,
  nationalId,
  reasonForClearanceAr,
  footerName,
  footerDateGregorian,
}: RoseClearanceFormPdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  return (
    <Document title="نموذج إخلاء طرف — روز للتجارة">
      <Page size="A4" style={RT.page}>
        <CompanyLetterheadHeader logoSrc={logoSrc} />
        <Text style={RT.docTitle}>نموذج إخلاء طرف</Text>

        <View style={RT.labelRow}>
          <Text style={RT.label}>اسم الموظف/ة:</Text>
          <Text style={RT.value}>{sanitizePdfText(employeeNameAr)}</Text>
        </View>
        <View style={RT.labelRow}>
          <Text style={RT.label}>رقم الهوية:</Text>
          <Text style={RT.valueLat}>{sanitizePdfText(nationalId)}</Text>
        </View>

        <Text style={[RT.body, { marginTop: 14 }]}>{CLEARANCE_LEGAL}</Text>

        <Text style={RT.sectionH}>سبب إخلاء الطرف:</Text>
        <View style={RT.box}>
          <Text style={RT.body}>{sanitizePdfText(reasonForClearanceAr)}</Text>
        </View>

        <View style={RT.flex1} />
        <View style={RT.footerRow}>
          <View style={RT.sigBlock}>
            <Text style={RT.sigLabel}>الاسم</Text>
            <Text style={[RT.body, { marginBottom: 8 }]}>{sanitizePdfText(footerName)}</Text>
            <View style={RT.sigLine} />
          </View>
          <View style={RT.sigBlock}>
            <Text style={RT.sigLabel}>التاريخ</Text>
            <Text style={[RT.latSmall, { marginBottom: 8 }]}>{sanitizePdfText(footerDateGregorian)}</Text>
            <View style={RT.sigLine} />
          </View>
          <View style={RT.sigBlock}>
            <Text style={RT.sigLabel}>التوقيع</Text>
            <View style={RT.sigLine} />
          </View>
        </View>
      </Page>
    </Document>
  );
}

export type RoseFinalSettlementFormPdfProps = {
  logoSrc?: string;
  employeeNameAr: string;
  nationalityAr: string;
  nationalId: string;
  serviceStartGregorian: string;
  serviceStartHijri: string;
  footerName: string;
  footerDateGregorian: string;
};

export function RoseFinalSettlementFormPdf({
  logoSrc,
  employeeNameAr,
  nationalityAr,
  nationalId,
  serviceStartGregorian,
  serviceStartHijri,
  footerName,
  footerDateGregorian,
}: RoseFinalSettlementFormPdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  return (
    <Document title="نموذج مخالصة نهائية — روز للتجارة">
      <Page size="A4" style={RT.page}>
        <CompanyLetterheadHeader logoSrc={logoSrc} />
        <Text style={RT.docTitle}>نموذج مخالصة نهائية</Text>

        <View style={{ marginTop: 4 }}>
          <PdfArLatBlock
            text={`أقر أنا / ${sanitizePdfText(employeeNameAr)}، الجنسية ${sanitizePdfText(nationalityAr)}، بموجب بطاقة أحوال / إقامة رقم ${sanitizePdfText(nationalId)}، بأنني باشرت العمل لدى مؤسسة روز للتجارة اعتباراً من التاريخ الميلادي: ${sanitizePdfText(serviceStartGregorian)} (الهجري: ${sanitizePdfText(serviceStartHijri)})، وأقر بما يلي:`}
            arStyle={RT.body}
            latStyle={{ fontFamily: 'Lat', fontSize: 9, lineHeight: 1.65, textAlign: 'right', color: '#222' }}
          />
        </View>

        <Text style={[RT.body, { marginTop: 12 }]}>{SETTLEMENT_LEGAL}</Text>

        <View style={RT.flex1} />
        <View style={RT.footerRow}>
          <View style={RT.sigBlock}>
            <Text style={RT.sigLabel}>الاسم</Text>
            <Text style={[RT.body, { marginBottom: 8 }]}>{sanitizePdfText(footerName)}</Text>
            <View style={RT.sigLine} />
          </View>
          <View style={RT.sigBlock}>
            <Text style={RT.sigLabel}>التوقيع</Text>
            <View style={RT.sigLine} />
          </View>
          <View style={RT.sigBlock}>
            <Text style={RT.sigLabel}>التاريخ</Text>
            <Text style={[RT.latSmall, { marginBottom: 8 }]}>{sanitizePdfText(footerDateGregorian)}</Text>
            <View style={RT.sigLine} />
          </View>
        </View>
      </Page>
    </Document>
  );
}

export type RoseExperienceCertificatePdfProps = {
  logoSrc?: string;
  certificateDateGregorian: string;
  recipientLineAr: string;
  departmentAr: string;
  jobTitleAr: string;
  startDateGregorian: string;
  endDateGregorian: string;
  workedVerbAr: 'عمل' | 'عملت';
  performanceClosingAr: string;
};

export function RoseExperienceCertificatePdf({
  logoSrc,
  certificateDateGregorian,
  recipientLineAr,
  departmentAr,
  jobTitleAr,
  startDateGregorian,
  endDateGregorian,
  workedVerbAr,
  performanceClosingAr,
}: RoseExperienceCertificatePdfProps): React.ReactElement<DocumentProps> {
  ensureHrPdfFonts();
  return (
    <Document title="شهادة خبرة — روز للتجارة">
      <Page size="A4" style={RT.page}>
        <CompanyLetterheadHeader logoSrc={logoSrc} />
        <Text style={RT.docTitle}>شهادة خبرة</Text>

        <View style={[RT.labelRow, { borderBottomWidth: 0, marginBottom: 12 }]}>
          <Text style={RT.label}>التاريخ:</Text>
          <Text style={RT.valueLat}>{sanitizePdfText(certificateDateGregorian)}</Text>
        </View>

        <View style={{ marginBottom: 10 }}>
          <PdfArLatBlock
            text={`تشهد مؤسسة روز للتجارة بأن ${sanitizePdfText(recipientLineAr)} قد ${workedVerbAr} لديها في قسم ${sanitizePdfText(departmentAr)} بمنصب ${sanitizePdfText(jobTitleAr)} خلال الفترة من ${sanitizePdfText(startDateGregorian)} إلى ${sanitizePdfText(endDateGregorian)}، ${sanitizePdfText(performanceClosingAr)}`}
            arStyle={RT.body}
            latStyle={{ fontFamily: 'Lat', fontSize: 9, lineHeight: 1.65, textAlign: 'right', color: '#222' }}
          />
        </View>

        <Text style={RT.sectionH}>صفات أداء لاحظناها خلال فترة الخدمة:</Text>
        <Text style={RT.body}>{TRAITS_FIXED}</Text>

        <Text style={[RT.body, { marginTop: 16 }]}>
          لمن يهمه الأمر — تُمنح هذه الشهادة بناءً على طلب صاحبها دون أن يترتب على المؤسسة أي التزامات إضافية.
        </Text>

        <View style={RT.flex1} />
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={RT.sigLabel}>توقيع المدير العام</Text>
          <View style={[RT.sigLine, { maxWidth: 200 }]} />
        </View>
        <Text style={[RT.latSmall, { textAlign: 'center', marginTop: 8 }]}>{sanitizePdfText(certificateDateGregorian)}</Text>
      </Page>
    </Document>
  );
}
