'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { useSetPageTitle } from '@/components/page-title-context';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';
import { Button } from '@/components/ui/button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { data, getBranch, getDepartment } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import { matchesDateRange, hasDateRangeFilter } from '@/lib/hr-discipline/discipline-date-filter';
import { EmployeesRegisterPdf } from '@/components/pdf/employees-register-pdf';
import { downloadXlsxFromAoA, type XlsxCell } from '@/lib/export/download-xlsx';
import {
  CONTRACT_TYPE_AR,
  EMP_CONTRACT_STATUS_LABELS,
  EMP_CONTRACT_STATUS_ORDER,
  employeeStartYmd,
} from '@/features/hr/organization/employees/constants/employees-list';

export function useEmployeesListModel() {
  useSetPageTitle({ titleAr: 'الموظفين', descriptionAr: 'سجل وإدارة بيانات الموظفين', iconName: 'Users' });
  const router = useRouter();

  const [branchFilter, setBranchFilter] = React.useState('all');
  const [deptFilter, setDeptFilter] = React.useState('all');
  const [view, setView] = React.useState<'table' | 'grid'>('table');
  const [newEmpOpen, setNewEmpOpen] = React.useState(false);
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [toolbarStatus, setToolbarStatus] = React.useState<string>('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [pdfOpen, setPdfOpen] = React.useState(false);

  const empPickerList = React.useMemo(
    () => data.employees.map((e) => ({ id: e.id, name: e.name })),
    [],
  );

  const narrowedForToolbar = React.useMemo(
    () =>
      data.employees.filter((e) => {
        if (branchFilter !== 'all' && e.branchId !== branchFilter) return false;
        if (deptFilter !== 'all' && e.departmentId !== deptFilter) return false;
        if (selectedEmpIds.size > 0 && !selectedEmpIds.has(e.id)) return false;
        if (!matchesDateRange(employeeStartYmd(e), dateBounds.from, dateBounds.to)) return false;
        return true;
      }),
    [branchFilter, deptFilter, selectedEmpIds, dateBounds.from, dateBounds.to],
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
    if (branchFilter !== 'all') parts.push(`فرع: ${data.branches.find((b) => b.id === branchFilter)?.name ?? branchFilter}`);
    if (deptFilter !== 'all') parts.push(`قسم: ${data.departments.find((d) => d.id === deptFilter)?.name ?? deptFilter}`);
    parts.push(selectedEmpIds.size === 0 ? 'الموظفون: الكل (ضمن الفلاتر)' : `الموظفون: ${selectedEmpIds.size} محدد من القائمة`);
    if (hasDateRangeFilter(dateBounds.from, dateBounds.to)) {
      parts.push(`تاريخ الالتحاق: ${dateBounds.from} — ${dateBounds.to}`);
    }
    parts.push(`حالة العقد: ${toolbarStatus === 'all' ? 'الكل' : (EMP_CONTRACT_STATUS_LABELS[toolbarStatus] ?? toolbarStatus)}`);
    return parts.join(' · ');
  }, [branchFilter, deptFilter, selectedEmpIds.size, dateBounds.from, dateBounds.to, toolbarStatus]);

  const handleExportExcel = React.useCallback(async () => {
    if (filtered.length === 0) {
      toast.error('لا يوجد موظفون للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    const rows: XlsxCell[][] = [[
      'الموظف',
      'رقم الموظف',
      'المسمى',
      'القسم',
      'الفرع',
      'نوع العقد',
      'تاريخ الالتحاق',
      'الراتب الأساسي',
      'حالة العقد',
    ]];
    for (const emp of filtered) {
      const dept = getDepartment(emp.departmentId);
      const branch = getBranch(emp.branchId);
      rows.push([
        emp.name,
        emp.employeeCode,
        emp.position,
        dept?.name ?? '—',
        branch?.city ?? '—',
        CONTRACT_TYPE_AR[emp.contractType] ?? emp.contractType,
        employeeStartYmd(emp),
        formatCurrency(emp.baseSalary),
        EMP_CONTRACT_STATUS_LABELS[emp.contractStatus] ?? emp.contractStatus,
      ]);
    }
    await downloadXlsxFromAoA('employees-register.xlsx', 'الموظفون', rows);
    toast.success('تم تنزيل ملف Excel.');
  }, [filtered]);

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

  const branchSelectOptions = React.useMemo(
    () => [{ value: 'all', label: 'كل الفروع' }, ...data.branches.map((b) => ({ value: b.id, label: b.name }))],
    [],
  );
  const deptSelectOptions = React.useMemo(
    () => [{ value: 'all', label: 'كل الأقسام' }, ...data.departments.map((d) => ({ value: d.id, label: d.name }))],
    [],
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
            <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={() => setNewEmpOpen(true)}><Plus className="h-4 w-4" />موظف جديد</Button>
          </>
        )}
      />
    ),
    [
      branchFilter,
      deptFilter,
      view,
      toolbarStatus,
      selectedEmpKey,
      dateBounds.from,
      dateBounds.to,
      contractStatusCounts.all,
      contractStatusCounts.active,
      contractStatusCounts.suspended,
      contractStatusCounts.ended,
      employeesPdfRows.length,
      employeesFilterSummary,
      handleExportExcel,
      empPickerList,
      branchSelectOptions,
      deptSelectOptions,
    ],
  );

  return {
    router,
    filtered,
    view,
    newEmpOpen,
    setNewEmpOpen,
    pdfOpen,
    setPdfOpen,
    employeesPdfDoc,
  };
}

export type EmployeesListModel = ReturnType<typeof useEmployeesListModel>;
