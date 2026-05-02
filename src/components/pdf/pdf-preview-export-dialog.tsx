'use client';

import * as React from 'react';
import { PDFDownloadLink, PDFViewer, type DocumentProps } from '@react-pdf/renderer';
import { Download, FileText } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type PdfPreviewExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fileName: string;
  /** Pre-built @react-pdf Document element, or null to show empty state */
  document: React.ReactElement<DocumentProps> | null;
  emptyMessage?: string;
};

export function PdfPreviewExportDialog({
  open,
  onOpenChange,
  title,
  fileName,
  document: doc,
  emptyMessage = 'لا توجد بيانات للتصدير ضمن الفلاتر الحالية.',
}: PdfPreviewExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden border-border p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-6 py-4 text-right">
          <DialogTitle className="font-display text-lg">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            معاينة مستند PDF ثم تنزيله. استخدم شريط أدوات المعاينة أو زر التحميل.
          </DialogDescription>
          <p className="text-xs text-muted-foreground" aria-hidden>
            معاينة المستند ثم التحميل بصيغة PDF
          </p>
        </DialogHeader>

        <div className="min-h-[420px] flex-1 overflow-hidden bg-muted/20">
          {open && doc ? (
            <PDFViewer
              key={fileName}
              width="100%"
              height="100%"
              style={{ minHeight: 480, border: 'none' }}
              showToolbar
            >
              {doc}
            </PDFViewer>
          ) : open ? (
            <div className="flex h-[480px] flex-col items-center justify-center gap-3 px-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex flex-row flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/30 px-6 py-4">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          {open && doc ? (
            <PDFDownloadLink document={doc} fileName={fileName}>
              {({ loading }) => (
                <Button type="button" variant="luxe" size="sm" className="gap-2" disabled={loading}>
                  <Download className="h-4 w-4" />
                  {loading ? 'جارٍ التحضير…' : 'تحميل PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
