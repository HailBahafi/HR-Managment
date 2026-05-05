'use client';

import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { getPdfLogoSrc } from '@/lib/pdf/pdf-logo-url';
import { ROSE_TRADING_EST } from '@/lib/pdf/rose-trading-est';

/** Letterhead gold — matches Rose trading templates. */
const GOLD = '#C9A84C';

const LH = StyleSheet.create({
  wrap: { marginBottom: 14 },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  colAr: { flex: 1, alignItems: 'flex-end' },
  colLogo: { width: 88, alignItems: 'center', justifyContent: 'center' },
  colEn: { flex: 1, alignItems: 'flex-start' },
  nameAr: { fontFamily: 'Ar', fontSize: 12, fontWeight: 700, color: '#1a1a1a', textAlign: 'right' },
  /** Arabic only — digits must use `crDigits` in a sibling `Text` (mixed runs break shaping in react-pdf). */
  crArPrefix: { fontFamily: 'Ar', fontSize: 8, color: '#555' },
  crDigits: { fontFamily: 'Lat', fontSize: 8, color: '#555', direction: 'ltr', marginRight: 3 },
  crRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    alignSelf: 'flex-end',
    marginTop: 3,
  },
  nameEn: { fontFamily: 'Lat', fontSize: 9, fontWeight: 700, color: '#333', letterSpacing: 0.5 },
  crEn: { fontFamily: 'Lat', fontSize: 8, color: '#555', marginTop: 3 },
  logo: { width: 64, height: 64, objectFit: 'contain' },
  goldThin: { height: 1, backgroundColor: GOLD, marginTop: 2 },
  goldThick: { height: 2.5, backgroundColor: GOLD, marginTop: 2 },
});

/**
 * Unified PDF topper: Arabic + س.ت (right) · logo center · English + C.R (left), then twin gold rule.
 * Uses registered `Ar` / `Lat` fonts — call `ensureHrPdfFonts()` on the document.
 */
export function CompanyLetterheadHeader({ logoSrc }: { logoSrc?: string }) {
  const src = logoSrc ?? getPdfLogoSrc();
  return (
    <View style={LH.wrap}>
      <View style={LH.row}>
        <View style={LH.colAr}>
          <Text style={LH.nameAr}>{ROSE_TRADING_EST.nameAr}</Text>
          <View style={LH.crRow}>
            <Text style={LH.crArPrefix}>س.ت</Text>
            <Text style={LH.crDigits}>{ROSE_TRADING_EST.crNumber}</Text>
          </View>
        </View>
        <View style={LH.colLogo}>{src ? <Image style={LH.logo} src={src} /> : null}</View>
        <View style={LH.colEn}>
          <Text style={LH.nameEn}>{ROSE_TRADING_EST.nameEn}</Text>
          <Text style={LH.crEn}>{`C.R: ${ROSE_TRADING_EST.crNumber}`}</Text>
        </View>
      </View>
      <View style={LH.goldThin} />
      <View style={LH.goldThick} />
    </View>
  );
}
