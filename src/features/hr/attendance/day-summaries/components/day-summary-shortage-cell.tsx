'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { DaySummaryMetricCell } from '@/features/hr/attendance/day-summaries/components/day-summary-metric-cell';
import {
  canSettleDaySummary,
} from '@/features/hr/attendance/day-summaries/utils/day-summary-settle';
import { formatDaySummaryMetric } from '@/features/hr/attendance/day-summaries/utils/day-summary-display';

type DaySummaryShortageCellProps = {
  row: DaySummaryResponseDto;
  onRequestSettle: (row: DaySummaryResponseDto) => void;
};

export function DaySummaryShortageCell({ row, onRequestSettle }: DaySummaryShortageCellProps) {
  const settleable = canSettleDaySummary(row);
  const shortageLabel = formatDaySummaryMetric(row, 'shortage');

  if (!settleable) {
    return <DaySummaryMetricCell row={row} metric="shortage" emptyWhenZero tone="danger" />;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 min-w-[3.25rem] border-destructive/40 bg-destructive/5 px-2 font-mono text-xs tabular-nums text-destructive hover:bg-destructive/10 hover:text-destructive"
      aria-label={`تسوية نقص ${shortageLabel ?? ''} من الإضافي`}
      onClick={(e) => {
        e.stopPropagation();
        onRequestSettle(row);
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {shortageLabel}
    </Button>
  );
}
