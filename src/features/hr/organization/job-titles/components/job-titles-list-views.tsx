'use client';

import { Briefcase, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DirectoryGrid,
  DirectoryGridCard,
  DirectoryGridCardFooter,
  DirectoryGridCardHeader,
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
import { getDepartment } from '@/lib/data';
import type { JobTitleTemplateRecord } from '@/lib/directory/job-title-templates-store';
import type { JobTitlesDirectoryModel } from '@/features/hr/organization/job-titles/hooks/useJobTitlesDirectoryModel';

export function JobTitlesListViews({ model }: { model: JobTitlesDirectoryModel }) {
  const { templates, layoutView, setViewRow, openEdit, setConfirmId } = model;

  return (
    <>
      <DirectoryResultCount>{templates.length} قالب مسمى</DirectoryResultCount>

      {templates.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="لا توجد قوالب"
          description="أضف مسميات وظيفية شائعة في شركتك لاستخدامها عند إضافة موظف."
        />
      ) : layoutView === 'grid' ? (
        <DirectoryGrid>
          {templates.map((row) => {
            const dept = row.defaultDepartmentId ? getDepartment(row.defaultDepartmentId) : undefined;
            return (
              <DirectoryGridCard key={row.id} interactive onClick={() => setViewRow(row)}>
                <DirectoryGridCardHeader>
                  <DirectoryGridCardTitle className="leading-snug">{row.titleAr}</DirectoryGridCardTitle>
                  <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </DirectoryGridCardHeader>
                {dept && <p className="text-xs text-muted-foreground">قسم مقترح: {dept.name}</p>}
                <DirectoryGridCardFooter>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)} aria-label="تعديل">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setConfirmId(row.id)}
                    aria-label="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </DirectoryGridCardFooter>
              </DirectoryGridCard>
            );
          })}
        </DirectoryGrid>
      ) : (
        <DirectoryTableContainer>
          <DirectoryTable>
            <DirectoryTableHeaderRow>
              <DirectoryTableHead>المسمى الوظيفي</DirectoryTableHead>
              <DirectoryTableHead>القسم المقترح</DirectoryTableHead>
              <DirectoryTableHead>وصف</DirectoryTableHead>
              <DirectoryTableHead className="text-start w-28">إجراءات</DirectoryTableHead>
            </DirectoryTableHeaderRow>
            <DirectoryTableBody>
              {templates.map((row) => {
                const dept = row.defaultDepartmentId ? getDepartment(row.defaultDepartmentId) : undefined;
                return (
                  <DirectoryTableRow key={row.id} interactive onClick={() => setViewRow(row)}>
                    <DirectoryTableCell className="font-medium">{row.titleAr}</DirectoryTableCell>
                    <DirectoryTableCell className="text-muted-foreground">{dept?.name ?? '—'}</DirectoryTableCell>
                    <DirectoryTableCell className="max-w-[240px] truncate text-muted-foreground">{row.descriptionAr ?? '—'}</DirectoryTableCell>
                    <DirectoryTableActionsCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)} aria-label="تعديل">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setConfirmId(row.id)} aria-label="حذف">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </DirectoryTableActionsCell>
                  </DirectoryTableRow>
                );
              })}
            </DirectoryTableBody>
          </DirectoryTable>
        </DirectoryTableContainer>
      )}
    </>
  );
}
