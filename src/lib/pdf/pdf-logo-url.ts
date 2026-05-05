/** Default logo under `public/`. */
export const PDF_LOGO_PUBLIC_PATH = '/logo.png';

/**
 * Absolute URL for `@react-pdf/renderer` `<Image src={…}>` in the browser.
 * Returns `undefined` during SSR or if `URL` fails.
 */
export function getPdfLogoSrc(path: string = PDF_LOGO_PUBLIC_PATH): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return new URL(path, window.location.origin).href;
  } catch {
    return undefined;
  }
}
