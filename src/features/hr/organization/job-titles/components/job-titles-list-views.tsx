'use client';

import * as React from 'react';
import { Briefcase, Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableRowActions } from '@/components/ui/table-cells';
import {
  DirectoryGrid,
  DirectoryGridCard,
  DirectoryGridCardFooter,
  DirectoryGridCardHeader,
  DirectoryGridCardTitle,
} from '@/components/ui/directory-grid-card';
import { EmptyState } from '@/features/hr/requests/components/shared-ui';
import type { JobTitlesDirectoryModel } from '@/features/hr/organization/job-titles/hooks/useJobTitlesDirectoryModel';
import type { JobTitleTemplateRecord } from '@/features/hr/organization/job-titles/services/job-titles.service';

export function JobTitlesListViews({ model }: { model: JobTitlesDirectoryModel }) {
  const { templates, layoutView, setViewRow, openEdit, setConfirmId } = model;

  const columns = React.useMemo((): ColumnDef<JobTitleTemplateRecord>[] => [
    {
      key: 'titleAr',
      title: 'المسمى الوظيفي',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{row.titleAr}</span>
          {row.code ? <span className="text-[10px] text-muted-foreground" dir="ltr">{row.code}</span> : null}
        </div>
      ),
    },
    {
      key: 'titleEn',
      title: 'الاسم (EN)',
      className: 'text-muted-foreground',
      render: (row) => <span dir="ltr">{row.titleEn ?? '—'}</span>,
    },
    {
      key: 'description',
      title: 'وصف',
      className: 'max-w-[200px] truncate text-muted-foreground',
      render: (row) => row.descriptionAr ?? '—',
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (row) => (
        row.isActive ? (
          <Badge variant="outline" className="text-[10px] border-success/40 text-success">نشط</Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">غير نشط</Badge>
        )
      ),
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      headerClassName: 'text-start w-16',
      render: (row) => (
        <TableRowActions
          menuItems={[
            { label: 'تعديل', onClick: (e) => { e.stopPropagation(); openEdit(row); } },
            { label: 'حذف', onClick: (e) => { e.stopPropagation(); setConfirmId(row.id); }, destructive: true, separator: true },
          ]}
        />
      ),
    },
  ], [openEdit, setConfirmId]);

  return (
    <>
      {templates.length === 0 ? (
        <EmptyState icon={Briefcase} title="لا توجد قوالب" description="أضف مسميات وظيفية شائعة في شركتك." />
      ) : layoutView === 'grid' ? (
        <DirectoryGrid>
          {templates.map((row) => (
            <DirectoryGridCard key={row.id} interactive onClick={() => setViewRow(row)}>
              <DirectoryGridCardHeader>
                <DirectoryGridCardTitle className="leading-snug">{row.titleAr}</DirectoryGridCardTitle>
                <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </DirectoryGridCardHeader>
              {row.titleEn ? <p className="text-xs text-muted-foreground" dir="ltr">{row.titleEn}</p> : null}
              {row.descriptionAr ? <p className="line-clamp-2 text-xs text-muted-foreground">{row.descriptionAr}</p> : null}
              <DirectoryGridCardFooter>
                {row.isActive ? (
                  <Badge variant="outline" className="text-[10px]">نشط</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-destructive">غير نشط</Badge>
                )}
                <div className="ms-auto flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="عرض" onClick={() => setViewRow(row)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="تعديل" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="حذف" onClick={() => setConfirmId(row.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </DirectoryGridCardFooter>
            </DirectoryGridCard>
          ))}
        </DirectoryGrid>
      ) : (
        <DataTable
          variant="directory"
          alwaysShowTable
          columns={columns}
          data={templates}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => setViewRow(row)}
        />
      )}
    </>
  );
}
