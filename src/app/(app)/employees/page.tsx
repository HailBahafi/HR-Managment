'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, Download, LayoutGrid, List, Mail, Phone, Building2, Users } from 'lucide-react';
import { useSetPageTitle } from '@/components/page-title-context';
import { NewEmployeeDrawer } from '@/components/employees/new-employee-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, ContractTypeLabel } from '@/components/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { data, getBranch, getDepartment } from '@/lib/data';
import { formatCurrency, getInitials } from '@/lib/utils';

export default function EmployeesPage() {
  useSetPageTitle({ titleAr: 'الموظفين', descriptionAr: 'سجل وإدارة بيانات الموظفين', iconName: 'Users' });
  const [view, setView] = React.useState<'table' | 'grid'>('table');
  const [search, setSearch] = React.useState('');
  const [branchFilter, setBranchFilter] = React.useState('all');
  const [deptFilter, setDeptFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [newEmpOpen, setNewEmpOpen] = React.useState(false);

  const filtered = data.employees.filter((e) => {
    if (search && !e.name.includes(search) && !e.employeeCode.includes(search) && !e.position.includes(search)) return false;
    if (branchFilter !== 'all' && e.branchId !== branchFilter) return false;
    if (deptFilter !== 'all' && e.departmentId !== deptFilter) return false;
    if (statusFilter !== 'all' && e.contractStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <NewEmployeeDrawer open={newEmpOpen} onOpenChange={setNewEmpOpen} />
      <div className="flex items-center justify-end gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Button variant="luxe" className="gap-2" onClick={() => setNewEmpOpen(true)}>
            <Plus className="h-4 w-4" />
            موظف جديد
          </Button>
      </div>

      {/* Toolbar */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ابحث بالاسم، رقم الموظف، أو المنصب..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="الفرع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفروع</SelectItem>
                {data.branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {data.departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="suspended">موقوف</SelectItem>
                <SelectItem value="ended">منتهي</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5">
              <button
                onClick={() => setView('table')}
                className={`rounded-sm p-1.5 transition ${view === 'table' ? 'bg-background shadow-soft' : 'text-muted-foreground'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`rounded-sm p-1.5 transition ${view === 'grid' ? 'bg-background shadow-soft' : 'text-muted-foreground'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
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
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => {
                  const dept = getDepartment(emp.departmentId);
                  const branch = getBranch(emp.branchId);
                  return (
                    <tr key={emp.id} className="group border-b border-border/60 transition-colors hover:bg-muted/20 last:border-b-0">
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
                          {dept && (
                            <div className="h-6 w-1 rounded-full" style={{ background: dept.color }} />
                          )}
                          <div>
                            <p className="text-sm font-medium">{dept?.name}</p>
                            <p className="text-xs text-muted-foreground">{branch?.city}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <ContractTypeLabel type={emp.contractType} />
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(emp.startDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 font-semibold number-ar">{formatCurrency(emp.baseSalary)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={emp.contractStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/employees/${emp.id}`}
                          className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          عرض →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold">لا توجد نتائج</h3>
              <p className="mt-1 text-sm text-muted-foreground">جرّب تعديل معايير البحث أو الفلاتر</p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-3 text-sm text-muted-foreground">
              <span>
                عرض <span className="font-semibold text-foreground number-ar">{filtered.length}</span> من أصل{' '}
                <span className="font-semibold text-foreground number-ar">{data.employees.length}</span> موظف
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>السابق</Button>
                <Button variant="outline" size="sm">التالي</Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((emp) => {
            const dept = getDepartment(emp.departmentId);
            const branch = getBranch(emp.branchId);
            return (
              <Link
                key={emp.id}
                href={`/employees/${emp.id}`}
                className="group relative overflow-hidden rounded-lg border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-30"
                  style={{ background: dept?.color ?? '#0f766e' }}
                />
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
