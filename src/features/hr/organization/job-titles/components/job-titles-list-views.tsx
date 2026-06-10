'use client';

import * as React from 'react';
import { Briefcase, Eye, Pencil, Trash2 } from 'lucide-react';
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
  const { templates, layoutView, setViewRow, openEdit, setConfirmId, getDepartmentName } = model;

  const columns = React.useMemo((): ColumnDef<JobTitleTemplateRecord>[] => [
    {
      key: 'titleAr',
      title: 'المسمى الوظيفي',
      render: (row) => <span className="font-medium">{row.titleAr}</span>,
    },
    {
      key: 'department',
      title: 'القسم المقترح',
      className: 'text-muted-foreground',
      render: (row) => {
        const deptName = row.defaultDepartmentId ? getDepartmentName(row.defaultDepartmentId) : undefined;
        return deptName ?? '—';
      },
    },
    {
      key: 'description',
      title: 'وصف',
      className: 'max-w-[240px] truncate text-muted-foreground',
      render: (row) => row.descriptionAr ?? '—',
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
  ], [getDepartmentName, openEdit, setConfirmId, setViewRow]);

  return (
    <>
      {templates.length === 0 ? (
        <EmptyState icon={Briefcase} title="لا توجد قوالب" description="أضف مسميات وظيفية شائعة في شركتك لاستخدامها عند إضافة موظف." />
      ) : layoutView === 'grid' ? (
        <DirectoryGrid>
          {templates.map((row) => {
            const deptName = row.defaultDepartmentId ? getDepartmentName(row.defaultDepartmentId) : undefined;
            return (
              <DirectoryGridCard key={row.id} interactive onClick={() => setViewRow(row)}>
                <DirectoryGridCardHeader>
                  <DirectoryGridCardTitle className="leading-snug">{row.titleAr}</DirectoryGridCardTitle>
                  <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </DirectoryGridCardHeader>
                {deptName && <p className="text-xs text-muted-foreground">قسم مقترح: {deptName}</p>}
                <DirectoryGridCardFooter>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="عرض" onClick={() => setViewRow(row)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="تعديل" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="حذف" onClick={() => setConfirmId(row.id)}><Trash2 className="h-4 w-4" /></Button>
                </DirectoryGridCardFooter>
              </DirectoryGridCard>
            );
          })}
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
