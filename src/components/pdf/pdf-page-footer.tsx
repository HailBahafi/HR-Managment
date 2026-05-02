'use client';

import * as React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

type PdfPageFooterProps = {
  pageNum: number;
  totalPages: number;
  /** Horizontal inset (match page `paddingHorizontal`). */
  insetX: number;
  /** Distance from page bottom. */
  bottom: number;
  /** Optional Arabic label before total, e.g. "إجمالي السجلات". */
  totalLabelAr?: string;
  totalValue?: number;
};

/**
 * Footer with Arabic in `Ar` and digits/slashes in `Lat` so PDF.js does not
 * mis-shape mixed runs. Avoid `fixed` on footers that are already per-page.
 */
export function PdfPageFooter({
  pageNum,
  totalPages,
  insetX,
  bottom,
  totalLabelAr,
  totalValue,
}: PdfPageFooterProps) {
  return (
    <View style={[S.wrap, { left: insetX, right: insetX, bottom }]}>
      <View style={S.row}>
        <Text style={S.ar}>صفحة </Text>
        <Text style={S.lat}>{pageNum}</Text>
        <Text style={S.ar}> / </Text>
        <Text style={S.lat}>{totalPages}</Text>
        {totalLabelAr != null && totalValue != null ? (
          <>
            <Text style={S.ar}> · {totalLabelAr}: </Text>
            <Text style={S.lat}>{totalValue}</Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  wrap: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  ar: { fontFamily: 'Ar', fontSize: 7, color: '#64748b' },
  lat: { fontFamily: 'Lat', fontSize: 7, color: '#64748b' },
});
