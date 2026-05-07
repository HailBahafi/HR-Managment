import { StyleSheet } from '@react-pdf/renderer';

/** Match footer inset to `employees-register-pdf` (portrait A4). */
export const HR_PDF_FOOTER_INSET_X = 20;
export const HR_PDF_FOOTER_BOTTOM = 16;

/**
 * Page shell shared with `employees-register-pdf` (Arabic shaping in PDF.js).
 * Spread into local StyleSheet.create when you need extra keys (e.g. backgroundColor).
 */
export const HR_PDF_PAGE_STYLE = {
  fontFamily: 'Ar',
  paddingTop: 26,
  paddingBottom: 48,
  paddingHorizontal: 20,
  fontSize: 7,
  direction: 'rtl',
} as const;

/**
 * Register-style PDFs: explicit Ar/Lat on every Text, RTL row tables, compact type.
 */
export const hrPdfRegisterStyles = StyleSheet.create({
  ar: { fontFamily: 'Ar' },
  lat: { fontFamily: 'Lat' },
  page: { ...HR_PDF_PAGE_STYLE },
  brand: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandTexts: { alignItems: 'flex-end' },
  brandAr: { fontFamily: 'Ar', fontSize: 11, fontWeight: 700 },
  brandEn: { fontSize: 8, fontFamily: 'Lat', textTransform: 'uppercase' },
  logo: { width: 52, height: 52, objectFit: 'contain' },
  line: { height: 2, backgroundColor: '#b8933e', marginBottom: 8 },
  title: { fontFamily: 'Ar', fontSize: 12, fontWeight: 700, textAlign: 'center', marginBottom: 4 },
  meta: { fontFamily: 'Ar', fontSize: 8, color: '#444', textAlign: 'right', marginBottom: 8 },
  th: {
    flexDirection: 'row-reverse',
    backgroundColor: '#e8f2ef',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#94a3b8',
  },
  tr: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 0.5,
    borderColor: '#e2e8f0',
    paddingVertical: 3,
  },
});
