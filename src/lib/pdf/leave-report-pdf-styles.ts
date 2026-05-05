import { Font, StyleSheet } from '@react-pdf/renderer';

let registered = false;

/** Absolute font URL so @react-pdf can fetch binary (fontkit) in the browser. */
function publicAssetUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).href;
}

/**
 * Idempotent: Cairo via **WOFF** (fontkit in react-pdf often rejects local TTF here → "Unknown font format").
 * Same binaries as `ensure-hr-pdf-fonts.ts` under `/public/fonts/`.
 */
export function ensureLeavesReportPdfFonts(): void {
  if (typeof window === 'undefined') return;
  if (registered) return;
  registered = true;

  Font.register({
    family: 'Cairo',
    fonts: [
      { src: publicAssetUrl('/fonts/Cairo-Regular.woff'), fontWeight: 400 },
      { src: publicAssetUrl('/fonts/Cairo-Bold.woff'), fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
}

export const LEAVES_REPORT_FOOTER_BOTTOM = 30;
export const LEAVES_REPORT_FOOTER_INSET_X = 40;

export const leavesReportPdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Cairo',
    direction: 'rtl',
    backgroundColor: '#ffffff',
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
  },

  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 70,
    height: 70,
    objectFit: 'contain',
  },
  companyInfo: {
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  companySubtitle: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    height: 2,
    backgroundColor: '#C9A84C',
    marginBottom: 16,
  },

  reportTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: 8,
    textAlign: 'right',
    color: '#666',
    marginBottom: 16,
    lineHeight: 1.35,
  },

  statsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 7,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
    textAlign: 'right',
  },

  table: { width: '100%' },
  tableHeader: {
    flexDirection: 'row-reverse',
    backgroundColor: '#2d6a6a',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row-reverse',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafa',
  },
  tableCell: {
    fontSize: 8,
    textAlign: 'right',
    color: '#333',
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#ffffff',
  },

  colEmployee: { flex: 2.5 },
  colDate: { flex: 1.35 },
  colType: { flex: 1.15 },
  colStatus: { flex: 1.1 },
  colDays: { flex: 0.75 },

  colEmpWide: { flex: 2.2 },
  colBranch: { flex: 1.6 },
  colBal: { flex: 1.1 },

  emptyHint: {
    fontSize: 9,
    textAlign: 'center',
    color: '#64748b',
    marginTop: 10,
  },

  footer: {
    position: 'absolute',
    bottom: LEAVES_REPORT_FOOTER_BOTTOM,
    left: LEAVES_REPORT_FOOTER_INSET_X,
    right: LEAVES_REPORT_FOOTER_INSET_X,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
});
