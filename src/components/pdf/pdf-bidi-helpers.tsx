'use client';

import * as React from 'react';
import { Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';

/** Registered Cairo (leaves analytics, etc.). */
export const PDF_FONT_AR = 'Ar';
export const PDF_FONT_LAT = 'Lat';

const latBase = { fontFamily: PDF_FONT_LAT, direction: 'ltr' as const };

/**
 * Marks that must not appear as separate “Latin” runs (they break shaping) and
 * marks PDF stacks often paint as junk glyphs if left in the string.
 */
/** Soft hyphen (\u00AD) can render as stray glyphs in some PDF viewers. */
const PDF_STRIP_INVISIBLE_BIDI = /[\u00AD\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/** Remove invisible direction/isolate marks; callers may also normalize DB data. */
export function sanitizePdfText(input: string): string {
  return (input ?? '').replace(PDF_STRIP_INVISIBLE_BIDI, '');
}

/**
 * Inline `Text` runs must not inherit `flex: 1` from field styles — multiple flex
 * children in one row can overlap glyphs in @react-pdf/yoga.
 */
/** Must override inherited `flex: 1` from field labels — sibling flex runs corrupt yoga + text reorder (react-pdf). */
const INLINE_RUN_LAYOUT: Style = { flex: 0, flexGrow: 0, flexShrink: 0, flexBasis: 'auto' };

function combineArTextStyle(fontFamily: string, arStyle: Style | Style[]): Style | Style[] {
  const base: Style = { fontFamily };
  const mid = Array.isArray(arStyle) ? [base, ...arStyle] : [base, arStyle];
  return [...mid, INLINE_RUN_LAYOUT];
}

function combineLatTextStyle(latStyle: Style | Style[] | undefined): Style | Style[] {
  if (latStyle == null) return [latBase, INLINE_RUN_LAYOUT];
  const mid = Array.isArray(latStyle) ? [latBase, ...latStyle] : [latBase, latStyle];
  return [...mid, INLINE_RUN_LAYOUT];
}

type RowStyle = { flexDirection: 'row-reverse'; flexWrap: 'wrap'; alignItems: 'baseline' };

const defaultRow: RowStyle = {
  flexDirection: 'row-reverse',
  flexWrap: 'wrap',
  alignItems: 'baseline',
};

/**
 * Split a string into Arabic vs Latin/digit runs for react-pdf (mixed runs corrupt shaping).
 * Arabic = codepoint in Arabic / Arabic Supplement / Presentation Forms-B blocks,
 * plus ZWNJ/ZWJ/tatweel so they are not split into tiny “Latin” runs (that corrupts shaping).
 */
export function splitArLatRuns(raw: string): { kind: 'ar' | 'lat'; text: string }[] {
  const s = sanitizePdfText(raw);
  const out: { kind: 'ar' | 'lat'; text: string }[] = [];
  let mode: 'ar' | 'lat' | null = null;
  let buf = '';
  const flush = () => {
    if (buf.length === 0) return;
    if (mode != null) out.push({ kind: mode, text: buf });
    buf = '';
    mode = null;
  };
  const isArabicClusterChar = (ch: string) => {
    const c = ch.codePointAt(0) ?? 0;
    if (c === 0x200c || c === 0x200d) return true; // ZWNJ, ZWJ
    if (c === 0x0640) return true; // tatweel
    return (
      (c >= 0x0600 && c <= 0x06ff) ||
      (c >= 0x0750 && c <= 0x077f) ||
      (c >= 0x08a0 && c <= 0x08ff) ||
      (c >= 0xfb50 && c <= 0xfdff) ||
      (c >= 0xfe70 && c <= 0xfeff)
    );
  };
  for (const ch of s) {
    const ar = isArabicClusterChar(ch);
    const next: 'ar' | 'lat' = ar ? 'ar' : 'lat';
    if (mode === null) {
      mode = next;
      buf = ch;
    } else if (mode === next) {
      buf += ch;
    } else {
      flush();
      mode = next;
      buf = ch;
    }
  }
  flush();
  return out;
}

type PdfArLatInlineProps = {
  text: string;
  arStyle: Style | Style[];
  latStyle?: Style | Style[];
  rowStyle?: Style | Style[];
  /** Default `Ar`; use `Cairo` for leaves-analytics etc. */
  arFontFamily?: string;
};

/** One logical line: Arabic and Latin/digit segments use separate fonts. */
export function PdfArLatInline({
  text,
  arStyle,
  latStyle,
  rowStyle,
  arFontFamily = PDF_FONT_AR,
}: PdfArLatInlineProps) {
  const runs = splitArLatRuns(text).filter((r) => r.text.length > 0);
  if (runs.length === 0) return null;
  return (
    <View style={{ ...defaultRow, ...rowStyle }}>
      {runs.map((r, i) =>
        r.kind === 'ar' ? (
          <Text key={i} style={combineArTextStyle(arFontFamily, arStyle) as Style | Style[]}>
            {r.text}
          </Text>
        ) : (
          <Text key={i} style={combineLatTextStyle(latStyle) as Style | Style[]}>
            {r.text}
          </Text>
        ),
      )}
    </View>
  );
}

type PdfArLatBlockProps = {
  text: string;
  arStyle: Style | Style[];
  latStyle?: Style | Style[];
  arFontFamily?: string;
};

/** Paragraph: each segment on its own line-ish flow (wrap as one block). */
export function PdfArLatBlock({ text, arStyle, latStyle, arFontFamily }: PdfArLatBlockProps) {
  return (
    <View style={{ width: '100%' }}>
      <PdfArLatInline text={text} arStyle={arStyle} latStyle={latStyle} arFontFamily={arFontFamily} />
    </View>
  );
}
