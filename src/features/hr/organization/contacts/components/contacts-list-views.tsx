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
import { EXTERNAL_PARTY_KIND_LABELS } from '@/features/hr/organization/lib/directory/external-contacts-store';
import type { ExternalPartyRecord } from '@/features/hr/organization/lib/directory/external-contacts-store';
import type { ContactsDirectoryModel } from '@/features/hr/organization/contacts/hooks/useContactsDirectoryModel';

type Props = {
  model: ContactsDirectoryModel;
};

export function ContactsListViews({ model }: Props) {
  const { filtered, layoutView, kindFilter, setViewRow, openEdit, setConfirmId } = model;

  return (
    <>
      <DirectoryResultCount>
        {filtered.length} جهة
        {kindFilter !== 'all' && ` · ${EXTERNAL_PARTY_KIND_LABELS[kindFilter]}`}
      </DirectoryResultCount>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="لا توجد جهات"
          description="أضف عملاء، زواراً، أو مورّدين — منفصلون عن سجل الموظفين."
        />
      ) : layoutView === 'grid' ? (
        <DirectoryGrid>
          {filtered.map((row) => (
            <ContactGridCard
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
              <DirectoryTableHead>النوع</DirectoryTableHead>
              <DirectoryTableHead>الجهة / الشركة</DirectoryTableHead>
              <DirectoryTableHead>التواصل</DirectoryTableHead>
              <DirectoryTableHead className="text-start w-28">إجراءات</DirectoryTableHead>
            </DirectoryTableHeaderRow>
            <DirectoryTableBody>
              {filtered.map((row) => (
                <DirectoryTableRow key={row.id} interactive onClick={() => setViewRow(row)}>
                  <DirectoryTableCell className="font-medium">{row.nameAr}</DirectoryTableCell>
                  <DirectoryTableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {EXTERNAL_PARTY_KIND_LABELS[row.kind]}
                    </Badge>
                  </DirectoryTableCell>
                  <DirectoryTableCell className="text-muted-foreground">{row.organizationAr ?? '—'}</DirectoryTableCell>
                  <DirectoryTableCell className="max-w-[200px] truncate text-muted-foreground" dir="ltr">
                    {[row.phone, row.email].filter(Boolean).join(' · ') || '—'}
                  </DirectoryTableCell>
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

function ContactGridCard({
  row,
  onOpen,
  onEdit,
  onDelete,
}: {
  row: ExternalPartyRecord;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DirectoryGridCard interactive onClick={onOpen}>
      <DirectoryGridCardHeader>
        <DirectoryGridCardTitle>{row.nameAr}</DirectoryGridCardTitle>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {EXTERNAL_PARTY_KIND_LABELS[row.kind]}
        </Badge>
      </DirectoryGridCardHeader>
      <DirectoryGridCardMeta>
        {row.organizationAr && (
          <DirectoryGridCardMetaRow>
            <span className="text-muted-foreground">الجهة</span>
            <span className="truncate font-medium">{row.organizationAr}</span>
          </DirectoryGridCardMetaRow>
        )}
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
