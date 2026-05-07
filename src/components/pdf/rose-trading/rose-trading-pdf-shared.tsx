'use client';

import { StyleSheet } from '@react-pdf/renderer';

/** Page + body styles for Rose HR form PDFs (letterhead: `CompanyLetterheadHeader`). */
export const RT = StyleSheet.create({
  page: {
    fontFamily: 'Ar',
    direction: 'rtl',
    flexDirection: 'column',
    paddingTop: 28,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontSize: 9,
    backgroundColor: '#ffffff',
  },
  flex1: { flex: 1 },
  docTitle: {
    fontFamily: 'Ar',
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 14,
    textDecoration: 'underline',
  },
  body: { fontFamily: 'Ar', fontSize: 9, lineHeight: 1.65, textAlign: 'right', color: '#222' },
  labelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    paddingBottom: 4,
  },
  label: { fontFamily: 'Ar', fontWeight: 700, fontSize: 9, marginLeft: 6, minWidth: 90, textAlign: 'right' },
  value: { fontFamily: 'Ar', flex: 1, fontSize: 9, textAlign: 'right' },
  valueLat: { fontFamily: 'Lat', flex: 1, fontSize: 9, textAlign: 'right' },
  sectionH: { fontFamily: 'Ar', fontWeight: 700, fontSize: 10, marginTop: 10, marginBottom: 6, textAlign: 'right' },
  bullet: { fontFamily: 'Ar', fontSize: 8.5, marginBottom: 4, textAlign: 'right', paddingRight: 4 },
  footerRow: {
    paddingTop: 20,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
  },
  sigBlock: { flex: 1, alignItems: 'center' },
  sigLabel: { fontFamily: 'Ar', fontSize: 8, marginBottom: 28, textAlign: 'center' },
  sigLine: { width: '100%', maxWidth: 140, height: 1, backgroundColor: '#000' },
  box: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 4,
    padding: 10,
    marginTop: 8,
    backgroundColor: '#fafafa',
  },
  latSmall: { fontFamily: 'Lat', fontSize: 8, color: '#444' },
});
