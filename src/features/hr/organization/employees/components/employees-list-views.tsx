'use client';

import { Building2, Mail, Eye, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ContractTypeLabel } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
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
  DirectoryTable,
  DirectoryTableActionsCell,
  DirectoryTableBody,
  DirectoryTableCell,
  DirectoryTableContainer,
  DirectoryTableHead,
  DirectoryTableHeaderRow,
  DirectoryTableRow,
} from '@/components/ui/directory-table';
import { NewEmployeeDrawer } from '@/features/hr/organization/employees/components/new-employee-drawer';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { ConfirmationModal } from '@/features/hr/requests/components/shared-ui';
import { EmptyState } from '@/features/hr/requests/components/shared-ui';
import { formatCurrency, formatDateShort, getInitials } from '@/shared/utils';
import type { EmployeesListModel } from '@/features/hr/organization/employees/hooks/useEmployeesListModel';
import { hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';

type Props = { model: EmployeesListModel };
type FilteredRow = EmployeesListModel['filtered'][number];

export function EmployeesListViews({ model }: Props) {
  const {
    router, employees, filtered, loading, listError,
    view, newEmpOpen, setNewEmpOpen, pdfOpen, setPdfOpen,
    employeesPrintable, reloadEmployees,
    deleteId, setDeleteId, handleDelete,
  } = model;

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-muted/30" />
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
    <div className="space-y-6 animate-fade-in">
      <PdfPreviewExportDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        title="معاينة تصدير سجل الموظفين"
        fileName="employees-register.pdf"
        printable={employeesPrintable}
      />
      <NewEmployeeDrawer open={newEmpOpen} onOpenChange={setNewEmpOpen} onCreated={reloadEmployees} />

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="حذف الموظف"
        description="هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={handleDelete}
      />

      <DirectoryResultCount>
        {filtered.length} من {employees.length} موظف
      </DirectoryResultCount>

      {filtered.length === 0 ? (
        <EmptyState title="لا توجد نتائج — جرّب تعديل الفلاتر" />
      ) : view === 'table' ? (
        <DirectoryTableContainer>
          <DirectoryTable>
            <DirectoryTableHeaderRow>
              <DirectoryTableHead>الموظف</DirectoryTableHead>
              <DirectoryTableHead>القسم / الفرع</DirectoryTableHead>
              <DirectoryTableHead>نوع العقد</DirectoryTableHead>
              <DirectoryTableHead>تاريخ الالتحاق</DirectoryTableHead>
              <DirectoryTableHead>الراتب الأساسي</DirectoryTableHead>
              <DirectoryTableHead>الجنسية</DirectoryTableHead>
              <DirectoryTableHead className="text-start w-16">إجراءات</DirectoryTableHead>
            </DirectoryTableHeaderRow>
            <DirectoryTableBody>
              {filtered.map((emp) => (
                <DirectoryTableRow
                  key={emp.id}
                  interactive
                  onClick={() => router.push(hrOrganizationRoutes.employee(emp.id))}
                >
                  <DirectoryTableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 ring-1 ring-border shrink-0">
                        <AvatarImage src={emp.avatar ?? undefined} />
                        <AvatarFallback className="text-xs">{getInitials(emp.nameAr)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{emp.nameAr}</p>
                        <p className="text-xs text-muted-foreground truncate">{emp.employeeCode} · {emp.position ?? '—'}</p>
                      </div>
                    </div>
                  </DirectoryTableCell>
                  <DirectoryTableCell className="text-muted-foreground">
                    {emp.departmentNameAr ?? emp.branchNameAr ?? '—'}
                  </DirectoryTableCell>
                  <DirectoryTableCell>
                    <ContractTypeLabel type={emp.contractType ?? ''} />
                  </DirectoryTableCell>
                  <DirectoryTableCell className="text-muted-foreground">
                    {emp.startDate ? formatDateShort(emp.startDate) : '—'}
                  </DirectoryTableCell>
                  <DirectoryTableCell className="font-semibold number-ar">
                    {emp.baseSalary ? formatCurrency(parseFloat(emp.baseSalary)) : '—'}
                  </DirectoryTableCell>
                  <DirectoryTableCell className="text-muted-foreground">
                    {emp.nationality ?? '—'}
                  </DirectoryTableCell>
                  <DirectoryTableActionsCell>
                    <RowActions
                      menuItems={[
                        { label: 'عرض', href: hrOrganizationRoutes.employee(emp.id) },
                        { label: 'حذف', onClick: (e) => { e.stopPropagation(); setDeleteId(emp.id); }, destructive: true, separator: true },
                      ]}
                    />
                  </DirectoryTableActionsCell>
                </DirectoryTableRow>
              ))}
            </DirectoryTableBody>
          </DirectoryTable>
        </DirectoryTableContainer>
      ) : (
        <DirectoryGrid>
          {filtered.map((emp) => (
            <EmployeeGridCard
              key={emp.id}
              emp={emp}
              onOpen={() => router.push(hrOrganizationRoutes.employee(emp.id))}
              onDelete={() => setDeleteId(emp.id)}
            />
          ))}
        </DirectoryGrid>
      )}
    </div>
  );
}

function EmployeeGridCard({
  emp,
  onOpen,
  onDelete,
}: {
  emp: FilteredRow;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <DirectoryGridCard interactive onClick={onOpen}>
      <DirectoryGridCardHeader>
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 ring-1 ring-border shrink-0">
            <AvatarImage src={emp.avatar ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(emp.nameAr)}</AvatarFallback>
          </Avatar>
          <DirectoryGridCardTitle className="truncate">{emp.nameAr}</DirectoryGridCardTitle>
        </div>
        {emp.nationality && (
          <span className="shrink-0 text-[10px] text-muted-foreground">{emp.nationality}</span>
        )}
      </DirectoryGridCardHeader>
      <DirectoryGridCardMeta>
        <DirectoryGridCardMetaRow>
          <span className="text-muted-foreground">الكود</span>
          <span className="font-mono text-xs">{emp.employeeCode}</span>
        </DirectoryGridCardMetaRow>
        {emp.position && (
          <DirectoryGridCardMetaRow>
            <span className="text-muted-foreground">المسمى</span>
            <span className="truncate">{emp.position}</span>
          </DirectoryGridCardMetaRow>
        )}
        {(emp.departmentNameAr ?? emp.branchNameAr) && (
          <DirectoryGridCardMetaRow>
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate text-muted-foreground">{emp.departmentNameAr ?? emp.branchNameAr}</span>
          </DirectoryGridCardMetaRow>
        )}
        {emp.email && (
          <DirectoryGridCardMetaRow dir="ltr">
            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{emp.email}</span>
          </DirectoryGridCardMetaRow>
        )}
      </DirectoryGridCardMeta>
      <DirectoryGridCardFooter>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="عرض" onClick={onOpen}><Eye className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="حذف" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </DirectoryGridCardFooter>
    </DirectoryGridCard>
  );
}
