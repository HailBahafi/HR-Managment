import { Font } from '@react-pdf/renderer';

let registeredHr = false;

/**
 * Absolute font URL so @react-pdf can fetch real binary (fontkit) in the browser.
 * The `.ttf` files under `public/fonts/` may be GitHub error stubs (not real fonts);
 * the shipped `.woff` files are valid Cairo binaries.
 */
function publicFontUrl(path: string): string {
  if (typeof window === 'undefined') {
    return path;
  }
  return new URL(path, window.location.origin).href;
}

function ensurePdfHyphenation(): void {
  Font.registerHyphenationCallback((word) => [word]);
}

/** Idempotent registration for HR table/list PDFs (Arabic + Latin). */
export function ensureHrPdfFonts(): void {
  if (typeof window === 'undefined') return;
  if (registeredHr) return;
  registeredHr = true;

  const regular = publicFontUrl('/fonts/Cairo-Regular.woff');
  const bold = publicFontUrl('/fonts/Cairo-Bold.woff');

  Font.register({
    family: 'Ar',
    fonts: [
      { src: regular, fontWeight: 400 },
      { src: bold, fontWeight: 700 },
    ],
  });
  Font.register({
    family: 'Lat',
    fonts: [
      { src: regular, fontWeight: 400 },
      { src: bold, fontWeight: 700 },
    ],
  });
  ensurePdfHyphenation();
}
