'use client';

import * as React from 'react';
import { appendEmployeeAudit } from '@/lib/employee-audit-log/append';
import { diffEmployeeShallowAudit } from '@/lib/employee-audit-log/diff-employee';
import type { Employee } from '@/types';
import type { EmployeeProfileSectionId } from '@/features/hr/organization/employees/constants/EmployeeProfileSections';
import type { EmployeeProfileDraft } from '@/features/hr/organization/employees/components/employee-profile-field';

export function useEmployeeProfilePersonal(employee: Employee, activeSection: EmployeeProfileSectionId) {
  type Draft = EmployeeProfileDraft;
  const [editingPersonal, setEditingPersonal] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>(() => ({ ...employee }));

  React.useEffect(() => {
    setDraft({ ...employee });
    setEditingPersonal(false);
  }, [employee.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = React.useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSavePersonal = React.useCallback(() => {
    const before = { ...employee };
    const rows = diffEmployeeShallowAudit(before, draft, 'personal');
    Object.assign(employee, draft);
    if (rows.length) appendEmployeeAudit(employee.id, rows);
    setEditingPersonal(false);
  }, [employee, draft]);

  const handleCancelPersonal = React.useCallback(() => {
    setDraft({ ...employee });
    setEditingPersonal(false);
  }, [employee]);

  const totalSalary =
    draft.baseSalary + draft.housingAllowance + draft.transportAllowance + draft.otherAllowances;
  const netSalary = totalSalary - draft.gosi;

  const yearsOfService = (() => {
    const start = new Date(draft.startDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return (diff / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
  })();

  React.useEffect(() => {
    if (activeSection !== 'personal' && editingPersonal) {
      setDraft({ ...employee });
      setEditingPersonal(false);
    }
  }, [activeSection, editingPersonal, employee]);

  return {
    draft,
    setDraft,
    editingPersonal,
    setEditingPersonal,
    updateField,
    handleSavePersonal,
    handleCancelPersonal,
    totalSalary,
    netSalary,
    yearsOfService,
  };
}
