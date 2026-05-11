'use client';

import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { fmtFull } from '@/features/hr/attendance/daily/utils/daily-attendance-format';
import { useDailyAttendanceModel } from '@/features/hr/attendance/daily/hooks/useDailyAttendanceModel';
import { DailyAttendanceStatsStrip } from '@/features/hr/attendance/daily/components/daily-attendance-stats-strip';
import { DailySmartTimeline } from '@/features/hr/attendance/daily/components/daily-smart-timeline';

export function DailyAttendancePanel() {
  const model = useDailyAttendanceModel();

  return (
    <div className="space-y-4">
      <PdfPreviewExportDialog
        open={model.pdfOpen}
        onOpenChange={model.setPdfOpen}
        title="معاينة تصدير الحضور"
        fileName={model.attendancePdfFileName}
        printable={model.attendancePrintable}
      />
      <p className="text-xs text-muted-foreground">
        {fmtFull(model.from)}
        {model.dates.length > 1 ? (
          <>
            {' '}
            —
            {' '}
            {fmtFull(model.to)}
            {' '}
            ·
            {' '}
            <span className="tabular-nums">{model.dates.length}</span> يوم
          </>
        ) : null}
      </p>

      <DailyAttendanceStatsStrip stats={model.stats} />

      <DailySmartTimeline
        summaries={model.denseForView}
        events={model.eventsForView}
        dates={model.dates}
      />
    </div>
  );
}
