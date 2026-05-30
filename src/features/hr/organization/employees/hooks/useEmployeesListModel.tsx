'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { Button } from '@/components/ui/button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { formatCurrency } from '@/shared/utils';
import { hasDateRangeFilter } from '@/features/hr/discipline/lib/discipline-date-filter';
import { EmployeesRegisterPrintHtml } from '@/components/pdf/print/employees-register-print-html';
import { downloadXlsxFromAoA, type XlsxCell } from '@/shared/export/download-xlsx';
import {
  CONTRACT_TYPE_AR,
  EMP_CONTRACT_STATUS_LABELS,
  EMP_CONTRACT_STATUS_ORDER,
} from '@/features/hr/organization/employees/constants/employees-list';
import { employeesApi, type EmployeeResponseDto } from '@/features/hr/organization/employees/lib/api/employees';
import { branchesApi, type BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import { departmentsApi, type DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useFilterPanel } from '@/components/layouts/filter-panel-context';

function empStartYmd(e: EmployeeResponseDto): string {
  const s = e.startDate;
  if (!s) return '';
  if (s.length >= 10) return s.slice(0, 10);
  try { return new Date(s).toISOString().slice(0, 10); } catch { return ''; }
}

export function useEmployeesListModel() {
  useSetPageTitle({ titleAr: 'الموظفين', descriptionAr: 'سجل وإدارة بيانات الموظفين', iconName: 'Users' });
  const router = useRouter();
  // companyId comes directly from the auth store — never blocks on GET /companies
  const companyId = useAuthStore((s) => s.activeCompanyId);
  // company details are optional (used only for PDF header); 403 is silently ignored
  const { data: activeCompany } = useActiveCompany();

  const [employees, setEmployees] = React.useState<EmployeeResponseDto[]>([]);
  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentResponseDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [totalCount, setTotalCount] = React.useState(0);

  const [branchFilter, setBranchFilter] = React.useState('all');
  const [deptFilter, setDeptFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [view, setView] = React.useState<'table' | 'grid'>('table');
  const [newEmpOpen, setNewEmpOpen] = React.useState(false);
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [toolbarStatus, setToolbarStatus] = React.useState<string>('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // Load branches and departments lazily — only when the filter panel is first opened
  const { open: filterOpen } = useFilterPanel();
  const filterDataFetched = React.useRef(false);
  React.useEffect(() => {
    if (!filterOpen || filterDataFetched.current || !companyId) return;
    filterDataFetched.current = true;
    void Promise.allSettled([
      branchesApi.getAll({ limit: 200, companyId }),
      departmentsApi.getAll({ limit: 200, companyId }),
    ]).then(([branchesRes, deptsRes]) => {
      if (branchesRes.status === 'fulfilled') setBranches(branchesRes.value.items);
      if (deptsRes.status === 'fulfilled') setDepartments(deptsRes.value.items);
    });
  }, [filterOpen, companyId]);

  const loadEmployees = React.useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setListError(null);
    try {
      // Backend only supports page/limit/companyId — all other filters are client-side
      const res = await employeesApi.getAll({ limit: 500, companyId });
      setEmployees(res.items);
      setTotalCount(res.pagination.total);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employees.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => { void loadEmployees(); }, [loadEmployees]);

  const getBranch = React.useCallback(
    (id: string | null | undefined) => branches.find((b) => b.id === id),
    [branches],
  );
  const getDepartment = React.useCallback(
    (id: string | null | undefined) => departments.find((d) => d.id === id),
    [departments],
  );

  const empPickerList = React.useMemo(
    () => employees.map((e) => ({ id: e.id, name: e.nameAr })),
    [employees],
  );

  // All filtering is client-side (backend only accepts page/limit/companyId)
  const filtered = React.useMemo(() => {
    return employees.filter((e) => {
      if (branchFilter !== 'all' && e.branchId !== branchFilter) return false;
      if (deptFilter !== 'all' && e.departmentId !== deptFilter) return false;
      if (toolbarStatus !== 'all' && e.contractStatus !== toolbarStatus) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !e.nameAr.toLowerCase().includes(q) &&
          !(e.nameEn ?? '').toLowerCase().includes(q) &&
          !e.employeeCode.toLowerCase().includes(q)
        ) return false;
      }
      if (selectedEmpIds.size > 0 && !selectedEmpIds.has(e.id)) return false;
      if (dateBounds.from || dateBounds.to) {
        const ymd = empStartYmd(e);
        if (dateBounds.from && ymd < dateBounds.from) return false;
        if (dateBounds.to && ymd > dateBounds.to) return false;
      }
      return true;
    });
  }, [employees, branchFilter, deptFilter, toolbarStatus, search, selectedEmpIds, dateBounds.from, dateBounds.to]);

  const contractStatusCounts = React.useMemo(
    () => ({
      all: totalCount,
      active: employees.filter((e) => e.contractStatus === 'active').length,
      suspended: employees.filter((e) => e.contractStatus === 'suspended').length,
      ended: employees.filter((e) => e.contractStatus === 'ended').length,
    }),
    [employees, totalCount],
  );

  const employeesPdfRows = React.useMemo(
    () =>
      filtered.map((emp) => ({
        name: emp.nameAr,
        employeeCode: emp.employeeCode,
        position: emp.position ?? '—',
        department: emp.departmentNameAr ?? '—',
        branchCity: emp.branchNameAr ?? '—',
        contractType: CONTRACT_TYPE_AR[emp.contractType ?? ''] ?? emp.contractType ?? '—',
        startDate: empStartYmd(emp),
        baseSalary: formatCurrency(parseFloat(emp.baseSalary ?? '0') || 0),
        statusAr: EMP_CONTRACT_STATUS_LABELS[emp.contractStatus ?? ''] ?? emp.contractStatus ?? '—',
      })),
    [filtered],
  );

  const employeesFilterSummary = React.useMemo(() => {
    const parts: string[] = [];
    if (branchFilter !== 'all') parts.push(`فرع: ${branches.find((b) => b.id === branchFilter)?.nameAr ?? branchFilter}`);
    if (deptFilter !== 'all') parts.push(`قسم: ${departments.find((d) => d.id === deptFilter)?.nameAr ?? deptFilter}`);
    if (search.trim()) parts.push(`بحث: ${search.trim()}`);
    parts.push(selectedEmpIds.size === 0 ? 'الموظفون: الكل (ضمن الفلاتر)' : `الموظفون: ${selectedEmpIds.size} محدد من القائمة`);
    if (hasDateRangeFilter(dateBounds.from, dateBounds.to)) {
      parts.push(`تاريخ الالتحاق: ${dateBounds.from} — ${dateBounds.to}`);
    }
    parts.push(`حالة العقد: ${toolbarStatus === 'all' ? 'الكل' : (EMP_CONTRACT_STATUS_LABELS[toolbarStatus] ?? toolbarStatus)}`);
    return parts.join(' · ');
  }, [branchFilter, deptFilter, search, selectedEmpIds.size, dateBounds.from, dateBounds.to, toolbarStatus, branches, departments]);

  const handleDelete = React.useCallback(async () => {
    if (!deleteId) return;
    try {
      await employeesApi.remove(deleteId);
      setDeleteId(null);
      await loadEmployees();
      toast.success('تم حذف الموظف');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employees.delete');
      toast.error(displayMessage);
    }
  }, [deleteId, loadEmployees]);

  const handleExportExcel = React.useCallback(async () => {
    if (filtered.length === 0) {
      toast.error('لا يوجد موظفون للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    const rows: XlsxCell[][] = [[
      'الموظف', 'رقم الموظف', 'المسمى', 'القسم', 'الفرع',
      'نوع العقد', 'تاريخ الالتحاق', 'الراتب الأساسي', 'حالة العقد',
    ]];
    for (const emp of filtered) {
      rows.push([
        emp.nameAr,
        emp.employeeCode,
        emp.position ?? '—',
        emp.departmentNameAr ?? '—',
        emp.branchNameAr ?? '—',
        CONTRACT_TYPE_AR[emp.contractType ?? ''] ?? emp.contractType ?? '—',
        empStartYmd(emp),
        formatCurrency(parseFloat(emp.baseSalary ?? '0') || 0),
        EMP_CONTRACT_STATUS_LABELS[emp.contractStatus ?? ''] ?? emp.contractStatus ?? '—',
      ]);
    }
    await downloadXlsxFromAoA('employees-register.xlsx', 'الموظفون', rows);
    toast.success('تم تنزيل ملف Excel.');
  }, [filtered]);

  const employeesPrintable = React.useMemo(
    () =>
      employeesPdfRows.length === 0 ? null : (
        <EmployeesRegisterPrintHtml
          companyNameAr={activeCompany?.nameAr ?? 'الشركة'}
          companyNameEn={activeCompany?.nameEn ?? ''}
          titleAr="سجل الموظفين"
          filterSummary={employeesFilterSummary}
          rows={employeesPdfRows}
        />
      ),
    [employeesPdfRows, employeesFilterSummary, activeCompany],
  );

  const branchSelectOptions = React.useMemo(
    () => [{ value: 'all', label: 'كل الفروع' }, ...branches.map((b) => ({ value: b.id, label: b.nameAr }))],
    [branches],
  );
  const deptSelectOptions = React.useMemo(
    () => [{ value: 'all', label: 'كل الأقسام' }, ...departments.map((d) => ({ value: d.id, label: d.nameAr }))],
    [departments],
  );

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton />
        <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={() => setNewEmpOpen(true)}>
          <Plus className="h-4 w-4" />
          موظف جديد
        </Button>
      </div>
    ),
    [newEmpOpen],
  );

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        inlineSelects={[
          {
            id: 'branch',
            value: branchFilter,
            onChange: setBranchFilter,
            placeholder: 'الفرع',
            options: branchSelectOptions,
          },
          {
            id: 'dept',
            value: deptFilter,
            onChange: setDeptFilter,
            placeholder: 'القسم',
            options: deptSelectOptions,
          },
        ]}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={toolbarStatus}
        onStatusFilterChange={setToolbarStatus}
        statusOrder={EMP_CONTRACT_STATUS_ORDER}
        statusLabels={EMP_CONTRACT_STATUS_LABELS}
        statusCounts={contractStatusCounts}
        onDateBoundsChange={setDateBounds}
        dataView={{
          value: view,
          onChange: (v) => setView(v as 'table' | 'grid'),
          options: [
            { value: 'table', label: 'جدول', icon: 'list' },
            { value: 'grid', label: 'شبكة', icon: 'layout-grid' },
          ],
        }}
        trailingActions={(
          <>
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
              PDF
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-2" onClick={() => void handleExportExcel()}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </>
        )}
      />
    ),
    [
      branchFilter, deptFilter, view, toolbarStatus, selectedEmpKey,
      dateBounds.from, dateBounds.to,
      contractStatusCounts.all, contractStatusCounts.active,
      contractStatusCounts.suspended, contractStatusCounts.ended,
      employeesPdfRows.length, employeesFilterSummary, handleExportExcel,
      empPickerList, branchSelectOptions, deptSelectOptions,
    ],
  );

  return {
    router,
    employees,
    filtered,
    loading,
    listError,
    view,
    newEmpOpen,
    setNewEmpOpen,
    pdfOpen,
    setPdfOpen,
    employeesPrintable,
    getBranch,
    getDepartment,
    reloadEmployees: loadEmployees,
    deleteId,
    setDeleteId,
    handleDelete,
  };
}

export type EmployeesListModel = ReturnType<typeof useEmployeesListModel>;
