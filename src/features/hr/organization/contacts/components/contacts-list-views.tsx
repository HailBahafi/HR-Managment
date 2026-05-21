'use client';

import { UserCircle, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DirectoryGrid,
  DirectoryGridCard,
  DirectoryGridCardFooter,
  DirectoryGridCardHeader,
  DirectoryGridCardMeta,
  DirectoryGridCardMetaRow,
  DirectoryGridCardTitle,
  DirectoryResultCount,
} from '@/components/ui/directory-grid-card';
import {
  DirectoryTableActionsCell,
  DirectoryTableBody,
  DirectoryTableCell,
  DirectoryTableContainer,
  DirectoryTableHead,
  DirectoryTableHeaderRow,
  DirectoryTableRow,
  DirectoryTable,
} from '@/components/ui/directory-table';
import { EmptyState } from '@/features/hr/requests/components/shared-ui';
import { USER_TYPE_LABELS } from '@/features/hr/organization/contacts/hooks/useContactsDirectoryModel';
import type { UserRecord, ContactsDirectoryModel } from '@/features/hr/organization/contacts/hooks/useContactsDirectoryModel';

type Props = {
  model: ContactsDirectoryModel;
};

function statusBadge(user: UserRecord) {
  if (!user.isActive) return <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">غير نشط</Badge>;
  return <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-700 dark:text-green-400">نشط</Badge>;
}

export function ContactsListViews({ model }: Props) {
  const { users, loading, listError, layoutView, setViewRow, openEdit, setConfirmId } = model;

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-muted/30" />
        ))}
      </div>
    );
  }

  if (listError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {listError}
      </div>
    );
  }

  return (
    <>
      <DirectoryResultCount>{users.length} مستخدم</DirectoryResultCount>

      {users.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="لا توجد مستخدمون"
          description="أضف حسابات مستخدمي النظام."
        />
      ) : layoutView === 'grid' ? (
        <DirectoryGrid>
          {users.map((row) => (
            <UserGridCard
              key={row.id}
              row={row}
              onOpen={() => setViewRow(row)}
              onEdit={() => openEdit(row)}
              onDelete={() => setConfirmId(row.id)}
            />
          ))}
        </DirectoryGrid>
      ) : (
        <DirectoryTableContainer>
          <DirectoryTable>
            <DirectoryTableHeaderRow>
              <DirectoryTableHead>الاسم</DirectoryTableHead>
              <DirectoryTableHead>البريد الإلكتروني</DirectoryTableHead>
              <DirectoryTableHead>نوع المستخدم</DirectoryTableHead>
              <DirectoryTableHead>الحالة</DirectoryTableHead>
              <DirectoryTableHead>الجوال</DirectoryTableHead>
              <DirectoryTableHead className="text-start w-28">إجراءات</DirectoryTableHead>
            </DirectoryTableHeaderRow>
            <DirectoryTableBody>
              {users.map((row) => (
                <DirectoryTableRow key={row.id} interactive onClick={() => setViewRow(row)}>
                  <DirectoryTableCell className="font-medium">{row.fullNameAr ?? row.email}</DirectoryTableCell>
                  <DirectoryTableCell className="text-muted-foreground" dir="ltr">{row.email}</DirectoryTableCell>
                  <DirectoryTableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {USER_TYPE_LABELS[row.userType ?? ''] ?? row.userType ?? '—'}
                    </Badge>
                  </DirectoryTableCell>
                  <DirectoryTableCell>{statusBadge(row)}</DirectoryTableCell>
                  <DirectoryTableCell className="text-muted-foreground" dir="ltr">{row.phone ?? '—'}</DirectoryTableCell>
                  <DirectoryTableActionsCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)} aria-label="تعديل">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setConfirmId(row.id)}
                      aria-label="حذف"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </DirectoryTableActionsCell>
                </DirectoryTableRow>
              ))}
            </DirectoryTableBody>
          </DirectoryTable>
        </DirectoryTableContainer>
      )}
    </>
  );
}

function UserGridCard({
  row,
  onOpen,
  onEdit,
  onDelete,
}: {
  row: UserRecord;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DirectoryGridCard interactive onClick={onOpen}>
      <DirectoryGridCardHeader>
        <DirectoryGridCardTitle>{row.fullNameAr ?? row.email}</DirectoryGridCardTitle>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {USER_TYPE_LABELS[row.userType ?? ''] ?? row.userType ?? '—'}
        </Badge>
      </DirectoryGridCardHeader>
      <DirectoryGridCardMeta>
        <DirectoryGridCardMetaRow dir="ltr">
          <span className="text-muted-foreground">البريد</span>
          <span className="truncate">{row.email}</span>
        </DirectoryGridCardMetaRow>
        {row.phone && (
          <DirectoryGridCardMetaRow dir="ltr">
            <span className="text-muted-foreground">الجوال</span>
            <span>{row.phone}</span>
          </DirectoryGridCardMetaRow>
        )}
      </DirectoryGridCardMeta>
      <DirectoryGridCardFooter>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} aria-label="تعديل">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete} aria-label="حذف">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DirectoryGridCardFooter>
    </DirectoryGridCard>
  );
}
