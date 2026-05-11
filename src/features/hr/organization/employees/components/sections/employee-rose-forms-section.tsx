'use client';

import * as React from 'react';
import { EmployeeRoseFormsPanel } from '@/components/employees/employee-rose-forms-panel';
import { useEmployeeRoseFormsStore } from '@/lib/employee-rose-forms/store';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

export function EmployeeRoseFormsSection({ model }: { model: EmployeeProfileModel }) {
  const { employee, department, branch } = model;
  const hasHydrated = useEmployeeRoseFormsStore((s) => s.hasHydrated());
  const finishHydration = useEmployeeRoseFormsStore((s) => s.finishHydration);

  // Trigger store hydration after mount to repair any mojibake in stored data
  React.useEffect(() => {
    if (!hasHydrated) {
      finishHydration();
    }
  }, [hasHydrated, finishHydration]);

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
