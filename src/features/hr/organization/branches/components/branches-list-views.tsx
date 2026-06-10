'use client';

import * as React from 'react';
import { Building2, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableRowActions } from '@/components/ui/table-cells';
import {
  DirectoryGrid,
  DirectoryGridCard,
  DirectoryGridCardFooter,
  DirectoryGridCardHeader,
  DirectoryGridCardMeta,
  DirectoryGridCardMetaRow,
  DirectoryGridCardTitle,
} from '@/components/ui/directory-grid-card';
import { EmptyState } from '@/features/hr/requests/components/shared-ui';
import type { BranchesDirectoryModel } from '@/features/hr/organization/branches/hooks/useBranchesDirectoryModel';
import type { BranchRow } from '@/features/hr/organization/branches/constants/branches-directory';

export function BranchesListViews({ model }: { model: BranchesDirectoryModel }) {
  const { filtered, layoutView, setViewBranch, openEdit, setConfirmId } = model;

  const columns = React.useMemo((): ColumnDef<BranchRow>[] => [
    {
      key: 'name',
      title: 'الفرع',
      render: (b) => <span className="font-medium">{b.name}</span>,
    },
    {
      key: 'city',
      title: 'المدينة',
      className: 'text-muted-foreground',
      render: (b) => b.city,
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      headerClassName: 'text-start w-16',
      render: (b) => (
        <TableRowActions
          menuItems={[
            { label: 'تعديل', onClick: (e) => { e.stopPropagation(); openEdit(b); } },
            { label: 'حذف', onClick: (e) => { e.stopPropagation(); setConfirmId(b.id); }, destructive: true, separator: true },
          ]}
        />
      ),
    },
  ], [openEdit, setConfirmId, setViewBranch]);

  return (
    <>
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
                <Button variant="ghost" size="icon" className="h-7 w-7" title="عرض" onClick={() => setViewBranch(b)}><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="تعديل" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="حذف" onClick={() => setConfirmId(b.id)}><Trash2 className="h-4 w-4" /></Button>
              </DirectoryGridCardFooter>
            </DirectoryGridCard>
          ))}
        </DirectoryGrid>
      ) : (
        <DataTable
          variant="directory"
          alwaysShowTable
          columns={columns}
          data={filtered}
          keyExtractor={(b) => b.id}
          onRowClick={(b) => setViewBranch(b)}
        />
      )}
    </>
  );
}
