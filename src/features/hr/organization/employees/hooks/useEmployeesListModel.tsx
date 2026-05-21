'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { Button } from '@/components/ui/button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { formatCurrency } from '@/shared/utils';
import { matchesDateRange, hasDateRangeFilter } from '@/features/hr/discipline/lib/discipline-date-filter';
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
import { companiesApi } from '@/features/hr/organization/lib/api/companies';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

function empStartYmd(e: EmployeeResponseDto): string {
  const s = e.startDate;
  if (!s) return '';
  if (s.length >= 10) return s.slice(0, 10);
  try { return new Date(s).toISOString().slice(0, 10); } catch { return ''; }
}

export function useEmployeesListModel() {
  useSetPageTitle({ titleAr: 'الموظفين', descriptionAr: 'سجل وإدارة بيانات الموظفين', iconName: 'Users' });
  const router = useRouter();

  const [employees, setEmployees] = React.useState<EmployeeResponseDto[]>([]);
  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentResponseDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  const [branchFilter, setBranchFilter] = React.useState('all');
  const [deptFilter, setDeptFilter] = React.useState('all');
  const [view, setView] = React.useState<'table' | 'grid'>('table');
  const [newEmpOpen, setNewEmpOpen] = React.useState(false);
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [toolbarStatus, setToolbarStatus] = React.useState<string>('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [pdfOpen, setPdfOpen] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const companies = await companiesApi.getAll({ limit: 1 });
      const companyId = companies.items[0]?.id;
      const [empsRes, branchesRes, deptsRes] = await Promise.all([
        employeesApi.getAll({ limit: 500, ...(companyId ? { companyId } : {}) }),
        branchesApi.getAll({ limit: 200, ...(companyId ? { companyId } : {}) }),
        departmentsApi.getAll({ limit: 200, ...(companyId ? { companyId } : {}) }),
      ]);
      setEmployees(empsRes.items);
      setBranches(branchesRes.items);
      setDepartments(deptsRes.items);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employees.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void loadData(); }, [loadData]);

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

  const narrowedForToolbar = React.useMemo(
    () =>
      employees.filter((e) => {
        if (branchFilter !== 'all') {
          const assignment = null; // TODO: filter by branch via assignments
          void assignment;
        }
        if (deptFilter !== 'all') {
          // filter by dept not easily available without assignments
        }
        if (selectedEmpIds.size > 0 && !selectedEmpIds.has(e.id)) return false;
        if (!matchesDateRange(empStartYmd(e), dateBounds.from, dateBounds.to)) return false;
        return true;
      }),
    [employees, branchFilter, deptFilter, selectedEmpIds, dateBounds.from, dateBounds.to],
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
      filtered.map((emp) => ({
        name: emp.nameAr,
        employeeCode: emp.employeeCode,
        position: emp.position ?? '—',
        department: '—',
        branchCity: '—',
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
    parts.push(selectedEmpIds.size === 0 ? 'الموظفون: الكل (ضمن الفلاتر)' : `الموظفون: ${selectedEmpIds.size} محدد من القائمة`);
    if (hasDateRangeFilter(dateBounds.from, dateBounds.to)) {
      parts.push(`تاريخ الالتحاق: ${dateBounds.from} — ${dateBounds.to}`);
    }
    parts.push(`حالة العقد: ${toolbarStatus === 'all' ? 'الكل' : (EMP_CONTRACT_STATUS_LABELS[toolbarStatus] ?? toolbarStatus)}`);
    return parts.join(' · ');
  }, [branchFilter, deptFilter, selectedEmpIds.size, dateBounds.from, dateBounds.to, toolbarStatus, branches, departments]);

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
        '—',
        '—',
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
          companyNameAr="الشركة"
          companyNameEn=""
          titleAr="سجل الموظفين"
          filterSummary={employeesFilterSummary}
          rows={employeesPdfRows}
        />
      ),
    [employeesPdfRows, employeesFilterSummary],
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
            <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={() => setNewEmpOpen(true)}>
              <Plus className="h-4 w-4" />
              موظف جديد
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
    reloadEmployees: loadData,
  };
}

export type EmployeesListModel = ReturnType<typeof useEmployeesListModel>;
