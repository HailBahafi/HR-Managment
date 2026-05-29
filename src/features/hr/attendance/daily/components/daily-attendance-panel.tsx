'use client';

import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { useDailyAttendanceModel } from '@/features/hr/attendance/daily/hooks/useDailyAttendanceModel';
import { DailySmartTimeline } from '@/features/hr/attendance/daily/components/daily-smart-timeline';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Table2 } from 'lucide-react';
import { cn } from '@/shared/utils';

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

      {/* View mode toggle */}
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', model.viewMode === 'card' && 'bg-muted')}
          onClick={() => model.setViewMode('card')}
          title="عرض البطاقات"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', model.viewMode === 'table' && 'bg-muted')}
          onClick={() => model.setViewMode('table')}
          title="عرض الجدول"
        >
          <Table2 className="h-4 w-4" />
        </Button>
      </div>

      <DailySmartTimeline
        summaries={model.denseForView}
        events={model.eventsForView}
        dates={model.dates}
        viewMode={model.viewMode}
      />
    </div>
  );
}
