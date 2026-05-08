'use client';

import { Building2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { EmptyState } from '@/components/hr-requests/shared-ui';
import type { BranchesDirectoryModel } from '@/features/hr/organization/branches/hooks/useBranchesDirectoryModel';

export function BranchesListViews({ model }: { model: BranchesDirectoryModel }) {
  const { filtered, layoutView, setViewBranch, openEdit, setConfirmId } = model;

  return (
    <>
      <DirectoryResultCount>{model.branches.length} فرع</DirectoryResultCount>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="لا توجد فروع" description="لا توجد فروع في القائمة." />
      ) : layoutView === 'grid' ? (
        <DirectoryGrid>
          {filtered.map((b) => (
            <DirectoryGridCard key={b.id} interactive onClick={() => setViewBranch(b)}>
              <DirectoryGridCardHeader>
                <DirectoryGridCardTitle>{b.name}</DirectoryGridCardTitle>
              </DirectoryGridCardHeader>
              <DirectoryGridCardMeta>
                <DirectoryGridCardMetaRow>
                  <span className="text-muted-foreground">المدينة</span>
                  <span className="truncate font-medium">{b.city}</span>
                </DirectoryGridCardMetaRow>
              </DirectoryGridCardMeta>
              <DirectoryGridCardFooter>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)} aria-label="تعديل">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setConfirmId(b.id)}
                  aria-label="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </DirectoryGridCardFooter>
            </DirectoryGridCard>
          ))}
        </DirectoryGrid>
      ) : (
        <DirectoryTableContainer>
          <DirectoryTable>
            <DirectoryTableHeaderRow>
              <DirectoryTableHead>الفرع</DirectoryTableHead>
              <DirectoryTableHead>المدينة</DirectoryTableHead>
              <DirectoryTableHead className="text-start w-28">إجراءات</DirectoryTableHead>
            </DirectoryTableHeaderRow>
            <DirectoryTableBody>
              {filtered.map((b) => (
                <DirectoryTableRow key={b.id} interactive onClick={() => setViewBranch(b)}>
                  <DirectoryTableCell className="font-medium">{b.name}</DirectoryTableCell>
                  <DirectoryTableCell className="text-muted-foreground">{b.city}</DirectoryTableCell>
                  <DirectoryTableActionsCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)} aria-label="تعديل">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setConfirmId(b.id)} aria-label="حذف">
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
