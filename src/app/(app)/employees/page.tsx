'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FileDown, LayoutGrid, List, Mail, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSetPageTitle } from '@/components/page-title-context';
import { usePageFilters } from '@/components/filter-panel-context';
import { NewEmployeeDrawer } from '@/components/employees/new-employee-drawer';
import { Button } from '@/components/ui/button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge, ContractTypeLabel } from '@/components/status-badge';
import { data, getBranch, getDepartment } from '@/lib/data';
import { formatCurrency, formatDateShort, getInitials } from '@/lib/utils';
import { matchesDateRange, hasDateRangeFilter } from '@/lib/hr-discipline/discipline-date-filter';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { EmployeesRegisterPdf } from '@/components/pdf/employees-register-pdf';

const EMP_CONTRACT_STATUS_ORDER = ['active', 'suspended', 'ended'] as const;

const EMP_CONTRACT_STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  suspended: 'موقوف',
  ended: 'منتهي',
};

const CONTRACT_TYPE_AR: Record<string, string> = {
  permanent: 'دائم',
  temporary: 'مؤقت',
  'part-time': 'جزئي',
  contract: 'تعاقد',
};

function employeeStartYmd(e: { startDate: string }): string {
  const s = e.startDate;
  if (typeof s === 'string' && s.length >= 10) return s.slice(0, 10);
  try {
    return new Date(s).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export default function EmployeesPage() {
  useSetPageTitle({ titleAr: 'الموظفين', descriptionAr: 'سجل وإدارة بيانات الموظفين', iconName: 'Users' });
  const router = useRouter();

  const { values } = usePageFilters([
    { key: 'search', label: 'بحث', type: 'text', placeholder: 'الاسم، رقم الموظف، أو المنصب…' },
    { key: 'branch', label: 'الفرع', type: 'select', options: data.branches.map(b => ({ value: b.id, label: b.name })) },
    { key: 'dept', label: 'القسم', type: 'select', options: data.departments.map(d => ({ value: d.id, label: d.name })) },
  ]);

  const [view, setView] = React.useState<'table' | 'grid'>('table');
  const [newEmpOpen, setNewEmpOpen] = React.useState(false);
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [toolbarStatus, setToolbarStatus] = React.useState<string>('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [pdfOpen, setPdfOpen] = React.useState(false);

  const search = (values.search as string) ?? '';
  const branchFilter = (values.branch as string) ?? 'all';
  const deptFilter = (values.dept as string) ?? 'all';

  const empPickerList = React.useMemo(
    () => data.employees.map((e) => ({ id: e.id, name: e.name })),
    [],
  );

  const narrowedForToolbar = React.useMemo(
    () =>
      data.employees.filter((e) => {
        if (search && !e.name.includes(search) && !e.employeeCode.includes(search) && !e.position.includes(search)) return false;
        if (branchFilter !== 'all' && e.branchId !== branchFilter) return false;
        if (deptFilter !== 'all' && e.departmentId !== deptFilter) return false;
        if (selectedEmpIds.size > 0 && !selectedEmpIds.has(e.id)) return false;
        if (!matchesDateRange(employeeStartYmd(e), dateBounds.from, dateBounds.to)) return false;
        return true;
      }),
    [search, branchFilter, deptFilter, selectedEmpIds, dateBounds.from, dateBounds.to],
  );

  const contractStatusCounts = React.useMemo(
    () => ({
      all: narrowedForToolbar.length,
      active: narrowedForToolbar.filter((e) => e.contractStatus === 'active').length,
      suspended: narrowedForToolbar.filter((e) => e.contractStatus === 'suspended').length,
      ended: narrowedForToolbar.filter((e) => e.contractStatus === 'ended').length,
    }),
    [narrowedForToolbar],
  );

  const filtered = React.useMemo(() => {
    if (toolbarStatus === 'all') return narrowedForToolbar;
    return narrowedForToolbar.filter((e) => e.contractStatus === toolbarStatus);
  }, [narrowedForToolbar, toolbarStatus]);

  const employeesPdfRows = React.useMemo(
    () =>
      filtered.map((emp) => {
        const dept = getDepartment(emp.departmentId);
        const branch = getBranch(emp.branchId);
        return {
          name: emp.name,
          employeeCode: emp.employeeCode,
          position: emp.position,
          department: dept?.name ?? '—',
          branchCity: branch?.city ?? '—',
          contractType: CONTRACT_TYPE_AR[emp.contractType] ?? emp.contractType,
          startDate: employeeStartYmd(emp),
          baseSalary: formatCurrency(emp.baseSalary),
          statusAr: EMP_CONTRACT_STATUS_LABELS[emp.contractStatus] ?? emp.contractStatus,
        };
      }),
    [filtered],
  );

  const employeesFilterSummary = React.useMemo(() => {
    const parts: string[] = [];
    if (search.trim()) parts.push(`بحث: ${search}`);
    if (branchFilter !== 'all') parts.push(`فرع: ${data.branches.find((b) => b.id === branchFilter)?.name ?? branchFilter}`);
    if (deptFilter !== 'all') parts.push(`قسم: ${data.departments.find((d) => d.id === deptFilter)?.name ?? deptFilter}`);
    parts.push(selectedEmpIds.size === 0 ? 'الموظفون: الكل (ضمن الفلاتر)' : `الموظفون: ${selectedEmpIds.size} محدد من القائمة`);
    if (hasDateRangeFilter(dateBounds.from, dateBounds.to)) {
      parts.push(`تاريخ الالتحاق: ${dateBounds.from} — ${dateBounds.to}`);
    }
    parts.push(`حالة العقد: ${toolbarStatus === 'all' ? 'الكل' : (EMP_CONTRACT_STATUS_LABELS[toolbarStatus] ?? toolbarStatus)}`);
    return parts.join(' · ');
  }, [search, branchFilter, deptFilter, selectedEmpIds.size, dateBounds.from, dateBounds.to, toolbarStatus]);

  const employeesPdfDoc = React.useMemo(
    () =>
      employeesPdfRows.length === 0 ? null : (
        <EmployeesRegisterPdf
          companyNameAr={data.company.name}
          companyNameEn={data.company.nameEn}
          titleAr="سجل الموظفين"
          filterSummary={employeesFilterSummary}
          rows={employeesPdfRows}
        />
      ),
    [employeesPdfRows, employeesFilterSummary],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PdfPreviewExportDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        title="معاينة تصدير سجل الموظفين"
        fileName="employees-register.pdf"
        document={employeesPdfDoc}
      />
      <NewEmployeeDrawer open={newEmpOpen} onOpenChange={setNewEmpOpen} />

      <EntityFilterToolbar
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={toolbarStatus}
        onStatusFilterChange={setToolbarStatus}
        statusOrder={EMP_CONTRACT_STATUS_ORDER}
        statusLabels={EMP_CONTRACT_STATUS_LABELS}
        statusCounts={contractStatusCounts}
        onDateBoundsChange={setDateBounds}
        trailingActions={(
          <>
            <div className="flex items-center gap-0.5 rounded-xl border border-border bg-muted/30 p-0.5">
              <button
                type="button"
                onClick={() => setView('table')}
                className={`rounded-lg p-1.5 transition ${view === 'table' ? 'bg-background shadow-soft' : 'text-muted-foreground'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`rounded-lg p-1.5 transition ${view === 'grid' ? 'bg-background shadow-soft' : 'text-muted-foreground'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              onClick={() => {
                if (employeesPdfRows.length === 0) {
                  toast.error('لا يوجد موظفون للتصدير ضمن الفلاتر الحالية.');
                  return;
                }
                setPdfOpen(true);
              }}
            >
              <FileDown className="h-4 w-4" />
              تصدير PDF
            </Button>
            <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={() => setNewEmpOpen(true)}><Plus className="h-4 w-4" />موظف جديد</Button>
          </>
        )}
      />

      {view === 'table' ? (
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
                {filtered.map((emp) => {
                  const dept = getDepartment(emp.departmentId);
                  const branch = getBranch(emp.branchId);
                  return (
                    <tr key={emp.id} className="group border-b border-border/60 transition-colors hover:bg-muted/20 last:border-b-0 cursor-pointer" onClick={() => router.push(`/employees/${emp.id}`)}>
                      <td className="px-6 py-4">
                        <Link href={`/employees/${emp.id}`} className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-border">
                            <AvatarImage src={emp.avatar} />
                            <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold group-hover:text-primary transition-colors">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.employeeCode} · {emp.position}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {dept && <div className="h-6 w-1 rounded-full" style={{ background: dept.color }} />}
                          <div>
                            <p className="text-sm font-medium">{dept?.name}</p>
                            <p className="text-xs text-muted-foreground">{branch?.city}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm"><ContractTypeLabel type={emp.contractType} /></td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDateShort(emp.startDate)}
                      </td>
                      <td className="px-6 py-4 font-semibold number-ar">{formatCurrency(emp.baseSalary)}</td>
                      <td className="px-6 py-4"><StatusBadge status={emp.contractStatus} /></td>
                      <td className="px-6 py-4">
                        <Link href={`/employees/${emp.id}`} className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">عرض →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">لا توجد نتائج — جرّب تعديل الفلاتر أعلاه أو من اللوحة الجانبية</p>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-3 text-sm text-muted-foreground">
              <span>عرض <span className="font-semibold text-foreground number-ar">{filtered.length}</span> من أصل <span className="font-semibold text-foreground number-ar">{data.employees.length}</span> موظف</span>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((emp) => {
            const dept = getDepartment(emp.departmentId);
            const branch = getBranch(emp.branchId);
            return (
              <Link key={emp.id} href={`/employees/${emp.id}`}
                className="group relative overflow-hidden rounded-lg border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-30" style={{ background: dept?.color ?? '#0f766e' }} />
                <div className="relative flex items-start justify-between">
                  <Avatar className="h-14 w-14 ring-2 ring-border">
                    <AvatarImage src={emp.avatar} />
                    <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                  </Avatar>
                  <StatusBadge status={emp.contractStatus} />
                </div>
                <div className="relative mt-4">
                  <h3 className="font-display text-lg font-bold group-hover:text-primary transition-colors">{emp.name}</h3>
                  <p className="text-sm text-muted-foreground">{emp.position}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{emp.employeeCode}</p>
                </div>
                <div className="relative mt-4 space-y-1.5 border-t border-border pt-4 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{dept?.name} · {branch?.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground" dir="ltr">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
