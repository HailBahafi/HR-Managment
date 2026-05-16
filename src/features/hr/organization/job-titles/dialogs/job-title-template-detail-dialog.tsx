'use client';

import { Briefcase, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { JobTitleTemplateRecord } from '@/features/hr/organization/lib/directory/job-title-templates-store';

type Props = {
  row: JobTitleTemplateRecord | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (row: JobTitleTemplateRecord) => void;
  getDepartmentName: (id?: string | null) => string | undefined;
};

export function JobTitleTemplateDetailDialog({ row, onOpenChange, onEdit, getDepartmentName }: Props) {
  return (
    <Dialog open={!!row} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {row?.titleAr}
          </DialogTitle>
        </DialogHeader>
        {row && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">القسم المقترج</span>
              <span className="font-medium">
                {row.defaultDepartmentId ? getDepartmentName(row.defaultDepartmentId) ?? '—' : '—'}
              </span>
            </div>
            {row.descriptionAr && (
              <div className="border-t border-border pt-3">
                <p className="text-muted-foreground">الوصف</p>
                <p className="mt-1 leading-relaxed">{row.descriptionAr}</p>
              </div>
            )}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button
            onClick={() => {
              if (row) {
                const r = row;
                onOpenChange(false);
                onEdit(r);
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
