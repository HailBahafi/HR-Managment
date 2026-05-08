'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { getEmployee } from '@/lib/data';
import type { Employee } from '@/types';
import { EmployeeProfileBody } from '@/features/hr/organization/employees/components/employee-profile-body';

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const row = getEmployee(id);
  if (!row) notFound();
  return <EmployeeProfileBody employee={row as Employee} />;
}
