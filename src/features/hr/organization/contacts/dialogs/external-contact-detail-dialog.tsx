'use client';

import { UserCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EXTERNAL_PARTY_KIND_LABELS } from '@/features/hr/organization/lib/directory/external-contacts-store';
import type { ExternalPartyRecord } from '@/features/hr/organization/lib/directory/external-contacts-store';

type Props = {
  row: ExternalPartyRecord | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (row: ExternalPartyRecord) => void;
};

export function ExternalContactDetailDialog({ row, onOpenChange, onEdit }: Props) {
  return (
    <Dialog open={!!row} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            {row?.nameAr}
          </DialogTitle>
        </DialogHeader>
        {row && (
          <div className="space-y-3">
            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">النوع</span>
                <span className="font-medium">{EXTERNAL_PARTY_KIND_LABELS[row.kind]}</span>
              </div>
              {row.organizationAr && (
                <div className="flex justify-between gap-2 border-t border-border pt-3">
                  <span className="text-muted-foreground">الجهة</span>
                  <span className="font-medium">{row.organizationAr}</span>
                </div>
              )}
              {row.phone && (
                <div className="flex justify-between gap-2 border-t border-border pt-3" dir="ltr">
                  <span className="text-muted-foreground">الجوال</span>
                  <span>{row.phone}</span>
                </div>
              )}
              {row.email && (
                <div className="flex justify-between gap-2 border-t border-border pt-3" dir="ltr">
                  <span className="text-muted-foreground">البريد</span>
                  <span className="truncate">{row.email}</span>
                </div>
              )}
              {row.notes && (
                <div className="border-t border-border pt-3">
                  <p className="text-muted-foreground">ملاحظات</p>
                  <p className="mt-1 leading-relaxed">{row.notes}</p>
                </div>
              )}
            </div>
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
