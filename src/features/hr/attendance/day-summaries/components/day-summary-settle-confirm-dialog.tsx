'use client';

import * as React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { formatDaySummaryMetric } from '@/features/hr/attendance/day-summaries/utils/day-summary-display';
import { TableDateCell } from '@/components/ui/table-cells';

type DaySummarySettleConfirmDialogProps = {
  row: DaySummaryResponseDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  submitting?: boolean;
};

export function DaySummarySettleConfirmDialog({
  row,
  open,
  onOpenChange,
  onConfirm,
  submitting = false,
}: DaySummarySettleConfirmDialogProps) {
  if (!row) return null;

  const shortage = formatDaySummaryMetric(row, 'shortage') ?? '00:00';
  const overtime = formatDaySummaryMetric(row, 'overtime') ?? '00:00';
  const notes = row.notes?.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden border-border p-0" dir="rtl">
        <div className="border-b border-border/60 bg-linear-to-b from-primary/8 to-transparent px-6 pb-4 pt-6">
          <DialogHeader className="space-y-2 text-right">
            <DialogTitle className="font-display text-base">تسوية الحضور</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              هل تريد تسوية الحضور من الإضافي؟
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
            <p className="font-medium">{row.employeeNameAr ?? '—'}</p>
            <p className="mt-1 text-muted-foreground">
              <TableDateCell value={row.workDate} />
            </p>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-destructive">نقص</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-destructive">{shortage}</p>
            </div>
            <ArrowLeftRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-success">إضافي</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-success">{overtime}</p>
            </div>
          </div>

          {notes ? (
            <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2 text-xs">
              <p className="font-medium text-muted-foreground">ملاحظات (ستُرسل مع الطلب)</p>
              <p className="mt-1 whitespace-pre-wrap text-foreground">{notes}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button type="button" disabled={submitting} onClick={() => void onConfirm()}>
            {submitting ? 'جاري التسوية…' : 'تسوية من الإضافي'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
