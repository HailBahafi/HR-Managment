'use client';

import { useEmployeesListModel } from '@/features/hr/organization/employees/hooks/useEmployeesListModel';
import { EmployeesListViews } from '@/features/hr/organization/employees/components/employees-list-views';

export default function EmployeesListPage() {
  const model = useEmployeesListModel();
  return <EmployeesListViews model={model} />;
}
