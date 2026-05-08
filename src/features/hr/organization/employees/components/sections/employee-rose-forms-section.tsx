'use client';

import { EmployeeRoseFormsPanel } from '@/components/employees/employee-rose-forms-panel';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

export function EmployeeRoseFormsSection({ model }: { model: EmployeeProfileModel }) {
  const { employee, department, branch } = model;
  return (
    <section className="space-y-5">
      <EmployeeRoseFormsPanel
        employee={employee}
        departmentName={department?.name ?? '—'}
        branchName={branch?.name ?? '—'}
      />
    </section>
  );
}
