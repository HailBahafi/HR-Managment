'use client';

import * as React from 'react';
import { Database, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { databaseBackupApi } from '@/features/system/lib/api/database-backup';

export function DatabaseBackupSection() {
  const [exporting, setExporting] = React.useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const fileName = await databaseBackupApi.exportBackup('plain');
      toast.success(`تم تنزيل النسخة الاحتياطية: ${fileName}`);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'system.database-backup.export');
      toast.error(displayMessage);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div className="border-b border-border/80 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold sm:text-base">النسخ الاحتياطي لقاعدة البيانات</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              تصدير نسخة SQL كاملة من قاعدة البيانات وتنزيلها إلى جهازك.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <p className="text-xs leading-relaxed text-muted-foreground">
          يُنشئ ملف SQL يحتوي على بيانات النظام الحالية. احتفظ به في مكان آمن ولا تشاركه مع غير المخوّلين.
        </p>
        <Button
          type="button"
          variant="luxe"
          className="gap-2"
          onClick={() => void handleExport()}
          disabled={exporting}
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري التصدير…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              تنزيل نسخة احتياطية
            </>
          )}
        </Button>
      </div>
    </section>
  );
}
