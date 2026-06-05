'use client';

import * as React from 'react';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { useDailyAttendanceModel } from '@/features/hr/attendance/daily/hooks/useDailyAttendanceModel';
import { DailySmartTimeline } from '@/features/hr/attendance/daily/components/daily-smart-timeline';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Table2, Plus } from 'lucide-react';
import { cn } from '@/shared/utils';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { RegisterEventComboDialog } from '@/features/hr/attendance/daily/components/daily-one-day-view';

export function DailyAttendancePanel() {
  const model = useDailyAttendanceModel();
  const companyId = useAuthStore((s) => s.activeCompanyId) ?? '';
  const [registerOpen, setRegisterOpen] = React.useState(false);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setRegisterOpen(true)}
          className="h-8 gap-1.5 border-dashed border-primary/40 text-primary hover:border-primary hover:bg-primary/5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs">تسجيل حضور</span>
        </Button>
        <div className="flex items-center gap-1">
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
      </div>
    ),
    [model.viewMode, model.setViewMode, setRegisterOpen],
  );

  return (
    <div className="space-y-4">
      <PdfPreviewExportDialog
        open={model.pdfOpen}
        onOpenChange={model.setPdfOpen}
        title="معاينة تصدير الحضور"
        fileName={model.attendancePdfFileName}
        printable={model.attendancePrintable}
      />

      {companyId && model.dates.length > 0 && (
        <RegisterEventComboDialog
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          allEmployees={model.allEmployees}
          workDate={model.dates[0]!}
          companyId={companyId}
          availableDates={model.dates.length > 1 ? model.dates : undefined}
          onCreated={() => { /* data will refresh on next filter change */ }}
        />
      )}

      <DailySmartTimeline
        summaries={model.denseForView}
        events={model.eventsForView}
        dates={model.dates}
        viewMode={model.viewMode}
        allEmployees={model.allEmployees}
      />
    </div>
  );
}
