'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
import type { HRDisciplineCircularRecord } from '@/features/hr/discipline/lib/types';
import {
  disciplineCircularsApi,
  type CreateDisciplineCircularDto,
} from '@/features/hr/discipline/lib/api/discipline-circulars';
import {
  mapDisciplineCircularResponse,
} from '@/features/hr/discipline/circulars/services/discipline-circulars.service';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { companiesApi } from '@/features/hr/organization/lib/api/companies';
import { departmentsApi } from '@/features/hr/organization/lib/api/departments';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { employeeAssignmentsApi } from '@/features/hr/organization/employees/lib/api/employee-assignments';

const PAGE_LIMIT = 200;

export type DisciplineEmployeeDirectoryEntry = {
  id: string;
  nameAr: string;
  branchId: string | null;
  departmentId: string | null;
};

export function useDisciplineCircularsDirectoryModel() {
  const [circulars, setCirculars] = React.useState<HRDisciplineCircularRecord[]>([]);
  const [employees, setEmployees] = React.useState<DisciplineEmployeeDirectoryEntry[]>([]);
  const [branchOptions, setBranchOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [departmentOptions, setDepartmentOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [company, setCompany] = React.useState<{ id: string; nameAr: string; nameEn: string | null } | null>(null);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const scope = await resolveOrganizationScope();
      const resolvedCompanyId = scope.companyId ?? null;
      setCompanyId(resolvedCompanyId);

      const [companiesRes, branchesRes, departmentsRes, employeesRes] = await Promise.all([
        companiesApi.getAll({ limit: 50 }),
        branchesApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
        ),
        departmentsApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
        ),
        employeesApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
        ),
      ]);

      const companies = ensurePaginatedResult(companiesRes).items;
      const selectedCompany =
        (resolvedCompanyId ? companies.find((c) => c.id === resolvedCompanyId) : companies[0]) ?? null;
      setCompany(
        selectedCompany
          ? { id: selectedCompany.id, nameAr: selectedCompany.nameAr, nameEn: selectedCompany.nameEn }
          : null,
      );

      const branches = ensurePaginatedResult(branchesRes).items;
      const departments = ensurePaginatedResult(departmentsRes).items;
      setBranchOptions(branches.map((b) => ({ value: b.id, label: b.nameAr })));
      setDepartmentOptions(departments.map((d) => ({ value: d.id, label: d.nameAr })));

      const branchNameById = Object.fromEntries(branches.map((b) => [b.id, b.nameAr]));
      const departmentNameById = Object.fromEntries(departments.map((d) => [d.id, d.nameAr]));

      const employees = ensurePaginatedResult(employeesRes).items;
      const activeEmployees = employees.filter((e) => !e.contractStatus || e.contractStatus === 'active');
      const assignmentResults = await Promise.all(
        activeEmployees.map((emp) => employeeAssignmentsApi.getAll(emp.id).catch(() => [])),
      );
      const employeesWithAssignments = activeEmployees.map((emp, idx) => {
        const assignments = assignmentResults[idx];
        const scopedAssignments = resolvedCompanyId
          ? assignments.filter((a) => a.companyId === resolvedCompanyId)
          : assignments;
        const primary = scopedAssignments.find((a) => a.isPrimary) ?? scopedAssignments[0];
        return {
          id: emp.id,
          nameAr: emp.nameAr,
          branchId: primary?.branchId ?? null,
          departmentId: primary?.departmentId ?? null,
        };
      });
      setEmployees(employeesWithAssignments);

      const circularsRes = await disciplineCircularsApi.getAll(
        resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
      );
      const circularItems = ensurePaginatedResult(circularsRes).items;
      setCirculars(
        circularItems.map((c) => mapDisciplineCircularResponse(c, { branchNameById, departmentNameById })),
      );
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-circulars.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const add = React.useCallback(
    async (payload: CreateDisciplineCircularDto) => {
      await disciplineCircularsApi.create(payload);
      await reload();
    },
    [reload],
  );

  const remove = React.useCallback(
    async (id: string) => {
      await disciplineCircularsApi.remove(id);
      await reload();
    },
    [reload],
  );

  const markSent = React.useCallback(
    async (id: string) => {
      await disciplineCircularsApi.send(id);
      await reload();
    },
    [reload],
  );

  return {
    circulars,
    employees,
    branchOptions,
    departmentOptions,
    company,
    companyId,
    loading,
    listError,
    add,
    remove,
    markSent,
  };
}
