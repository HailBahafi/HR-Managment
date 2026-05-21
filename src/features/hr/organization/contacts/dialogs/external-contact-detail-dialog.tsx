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
import { USER_TYPE_LABELS } from '@/features/hr/organization/contacts/hooks/useContactsDirectoryModel';
import type { UserRecord } from '@/features/hr/organization/contacts/hooks/useContactsDirectoryModel';

type Props = {
  row: UserRecord | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (row: UserRecord) => void;
};

export function ExternalContactDetailDialog({ row, onOpenChange, onEdit }: Props) {
  return (
    <Dialog open={!!row} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            {row?.fullNameAr ?? row?.email}
          </DialogTitle>
        </DialogHeader>
        {row && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">نوع المستخدم</span>
              <span className="font-medium">{USER_TYPE_LABELS[row.userType ?? ''] ?? row.userType ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-2 border-t border-border pt-3" dir="ltr">
              <span className="text-muted-foreground">البريد الإلكتروني</span>
              <span className="truncate font-medium">{row.email}</span>
            </div>
            {row.phone && (
              <div className="flex justify-between gap-2 border-t border-border pt-3" dir="ltr">
                <span className="text-muted-foreground">الجوال</span>
                <span>{row.phone}</span>
              </div>
            )}
            {row.fullNameEn && (
              <div className="flex justify-between gap-2 border-t border-border pt-3" dir="ltr">
                <span className="text-muted-foreground">Name (EN)</span>
                <span>{row.fullNameEn}</span>
              </div>
            )}
            <div className="flex justify-between gap-2 border-t border-border pt-3">
              <span className="text-muted-foreground">الحالة</span>
              <span className={row.isActive ? 'text-green-700 dark:text-green-400 font-medium' : 'text-destructive font-medium'}>
                {row.isActive ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            {row.notes && (
              <div className="border-t border-border pt-3">
                <p className="text-muted-foreground">ملاحظات</p>
                <p className="mt-1 leading-relaxed">{row.notes}</p>
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
                onOpenChange(false);
                onEdit(row);
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
