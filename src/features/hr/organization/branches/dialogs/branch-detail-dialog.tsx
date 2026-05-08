'use client';

import { Building2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { BranchRow } from '@/features/hr/organization/branches/constants/branches-directory';

type Props = {
  branch: BranchRow | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (b: BranchRow) => void;
};

export function BranchDetailDialog({ branch, onOpenChange, onEdit }: Props) {
  return (
    <Dialog open={!!branch} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-md border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {branch?.name}
          </DialogTitle>
        </DialogHeader>
        {branch && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">اسم الفرع</span>
                <span className="font-semibold">{branch.name}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm border-t border-border pt-3">
                <span className="text-muted-foreground">المدينة</span>
                <span className="font-medium">{branch.city}</span>
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
          <Button
            onClick={() => {
              if (branch) {
                const b = branch;
                onOpenChange(false);
                onEdit(b);
              }
            }}
            className="gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            تعديل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
