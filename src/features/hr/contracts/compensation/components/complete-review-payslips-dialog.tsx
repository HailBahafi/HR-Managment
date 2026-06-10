'use client';

import { AlertTriangle, Loader2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodLabel: string;
  busy: boolean;
  onConfirm: () => void;
};

export function CompleteReviewPayslipsDialog({
  open,
  onOpenChange,
  periodLabel,
  busy,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden border-border p-0" dir="rtl">
        <div className="border-b border-border/60 bg-linear-to-b from-warning/10 via-warning/5 to-transparent px-6 pb-4 pt-6">
          <DialogHeader className="space-y-3 text-right">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <DialogTitle className="font-display text-base leading-snug">
                  إتمام المراجعة الثالثة
                </DialogTitle>
                <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                  {periodLabel}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm leading-relaxed text-foreground">
            بعد هذي المراجعة سوف يتم انشاء قسيمة براتب الموظفين ولا يمكنك التراجع.
          </p>
          <div className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/8 px-3 py-3">
            <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              سيتم توليد قسائم مسودة لجميع الموظفين في هذه الفترة بناءً على بيانات المستحقات الحالية.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/60 bg-muted/15 px-6 py-4 sm:justify-start">
          <Button disabled={busy} onClick={onConfirm}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد وإنشاء القسائم'}
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
