'use client';

import { Building2 } from 'lucide-react';
import { RowActions } from '@/components/ui/row-actions';
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
                <RowActions
                  menuItems={[
                    { label: 'عرض', onClick: (e) => { e.stopPropagation(); setViewBranch(b); } },
                    { label: 'تعديل', onClick: (e) => { e.stopPropagation(); openEdit(b); } },
                    { label: 'حذف', onClick: (e) => { e.stopPropagation(); setConfirmId(b.id); }, destructive: true, separator: true },
                  ]}
                />
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
              <DirectoryTableHead className="text-start w-16">إجراءات</DirectoryTableHead>
            </DirectoryTableHeaderRow>
            <DirectoryTableBody>
              {filtered.map((b) => (
                <DirectoryTableRow key={b.id} interactive onClick={() => setViewBranch(b)}>
                  <DirectoryTableCell className="font-medium">{b.name}</DirectoryTableCell>
                  <DirectoryTableCell className="text-muted-foreground">{b.city}</DirectoryTableCell>
                  <DirectoryTableActionsCell>
                    <RowActions
                      menuItems={[
                        { label: 'عرض', onClick: (e) => { e.stopPropagation(); setViewBranch(b); } },
                        { label: 'تعديل', onClick: (e) => { e.stopPropagation(); openEdit(b); } },
                        { label: 'حذف', onClick: (e) => { e.stopPropagation(); setConfirmId(b.id); }, destructive: true, separator: true },
                      ]}
                    />
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
