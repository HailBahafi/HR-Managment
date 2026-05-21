'use client';

import Link from 'next/link';
import { Building2, Mail } from 'lucide-react';
import { NewEmployeeDrawer } from '@/features/hr/organization/employees/components/new-employee-drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge, ContractTypeLabel } from '@/components/shared/status-badge';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { formatCurrency, formatDateShort, getInitials } from '@/shared/utils';
import type { EmployeesListModel } from '@/features/hr/organization/employees/hooks/useEmployeesListModel';
import { hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';

type Props = { model: EmployeesListModel };

export function EmployeesListViews({ model }: Props) {
  const {
    router, employees, filtered, loading, listError,
    view, newEmpOpen, setNewEmpOpen, pdfOpen, setPdfOpen,
    employeesPrintable, reloadEmployees,
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

      {view === 'table' ? (
        <EmployeesListTable filtered={filtered} router={router} total={employees.length} />
      ) : (
        <EmployeesListGrid filtered={filtered} />
      )}
    </div>
  );
}

type FilteredRow = EmployeesListModel['filtered'][number];

function EmployeesListTable({
  filtered,
  router,
  total,
}: {
  filtered: FilteredRow[];
  router: { push: (href: string) => void };
  total: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-4 text-right">الموظف</th>
              <th className="px-6 py-4 text-right">القسم / الفرع</th>
              <th className="px-6 py-4 text-right">نوع العقد</th>
              <th className="px-6 py-4 text-right">تاريخ الالتحاق</th>
              <th className="px-6 py-4 text-right">الراتب الأساسي</th>
              <th className="px-6 py-4 text-right">الحالة</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr
                key={emp.id}
                className="group border-b border-border/60 transition-colors hover:bg-muted/20 last:border-b-0 cursor-pointer"
                onClick={() => router.push(hrOrganizationRoutes.employee(emp.id))}
              >
                <td className="px-6 py-4">
                  <Link href={hrOrganizationRoutes.employee(emp.id)} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <Avatar className="h-10 w-10 ring-2 ring-border">
                      <AvatarImage src={emp.avatar ?? undefined} />
                      <AvatarFallback>{getInitials(emp.nameAr)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold group-hover:text-primary transition-colors">{emp.nameAr}</p>
                      <p className="text-xs text-muted-foreground">{emp.employeeCode} · {emp.position ?? '—'}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">—</td>
                <td className="px-6 py-4 text-sm"><ContractTypeLabel type={emp.contractType ?? ''} /></td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {emp.startDate ? formatDateShort(emp.startDate) : '—'}
                </td>
                <td className="px-6 py-4 font-semibold number-ar">
                  {emp.baseSalary ? formatCurrency(parseFloat(emp.baseSalary)) : '—'}
                </td>
                <td className="px-6 py-4"><StatusBadge status={emp.contractStatus ?? ''} /></td>
                <td className="px-6 py-4">
                  <Link href={hrOrganizationRoutes.employee(emp.id)} className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                    عرض →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">لا توجد نتائج — جرّب تعديل الفلاتر أعلاه</p>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-3 text-sm text-muted-foreground">
          <span>
            عرض <span className="font-semibold text-foreground number-ar">{filtered.length}</span> من أصل{' '}
            <span className="font-semibold text-foreground number-ar">{total}</span> موظف
          </span>
        </div>
      )}
    </div>
  );
}

function EmployeesListGrid({ filtered }: { filtered: FilteredRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((emp) => (
        <Link
          key={emp.id}
          href={hrOrganizationRoutes.employee(emp.id)}
          className="group relative overflow-hidden rounded-lg border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
        >
          <div className="relative flex items-start justify-between">
            <Avatar className="h-14 w-14 ring-2 ring-border">
              <AvatarImage src={emp.avatar ?? undefined} />
              <AvatarFallback>{getInitials(emp.nameAr)}</AvatarFallback>
            </Avatar>
            <StatusBadge status={emp.contractStatus ?? ''} />
          </div>
          <div className="relative mt-4">
            <h3 className="font-display text-lg font-bold group-hover:text-primary transition-colors">{emp.nameAr}</h3>
            <p className="text-sm text-muted-foreground">{emp.position ?? '—'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{emp.employeeCode}</p>
          </div>
          <div className="relative mt-4 space-y-1.5 border-t border-border pt-4 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>—</span>
            </div>
            {emp.email && (
              <div className="flex items-center gap-2 text-muted-foreground" dir="ltr">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{emp.email}</span>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
