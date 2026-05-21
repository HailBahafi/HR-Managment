'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
import type { HRDisciplinePayrollDeductionRecord } from '@/features/hr/discipline/lib/types';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { violationRecordsApi } from '@/features/hr/discipline/lib/api/violation-records';
import {
  disciplinePayrollDeductionsApi,
  type CreateDisciplinePayrollDeductionDto,
  type UpdateDisciplinePayrollDeductionDto,
} from '@/features/hr/discipline/lib/api/discipline-payroll-deductions';
import {
  mapDisciplinePayrollDeductionResponse,
} from '@/features/hr/discipline/deductions/services/discipline-payroll-deductions.service';

const PAGE_LIMIT = 200;

export type DeductionEmployeeOption = {
  id: string;
  nameAr: string;
};

export type DeductionCaseOption = {
  id: string;
  caseNumber: string;
  employeeId: string;
  employeeNameAr: string;
};

export function useDisciplinePayrollDeductionsDirectoryModel() {
  const [deductions, setDeductions] = React.useState<HRDisciplinePayrollDeductionRecord[]>([]);
  const [employees, setEmployees] = React.useState<DeductionEmployeeOption[]>([]);
  const [cases, setCases] = React.useState<DeductionCaseOption[]>([]);
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

      const [employeesRes, casesRes, deductionsRes] = await Promise.all([
        employeesApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
        ),
        violationRecordsApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
        ),
        disciplinePayrollDeductionsApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
        ),
      ]);

      const employeesItems = ensurePaginatedResult(employeesRes).items;
      const employeeNameById = Object.fromEntries(
        employeesItems.map((emp) => [emp.id, emp.nameAr]),
      );
      setEmployees(employeesItems.map((emp) => ({ id: emp.id, nameAr: emp.nameAr })));

      const caseItems = ensurePaginatedResult(casesRes).items;
      setCases(caseItems.map((c) => ({
        id: c.id,
        caseNumber: c.recordNumber,
        employeeId: c.employeeId,
        employeeNameAr: employeeNameById[c.employeeId] ?? c.employeeId,
      })));

      const deductionItems = ensurePaginatedResult(deductionsRes).items;
      setDeductions(
        deductionItems.map((d) =>
          mapDisciplinePayrollDeductionResponse(d, employeeNameById),
        ),
      );
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-payroll-deductions.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const add = React.useCallback(
    async (payload: CreateDisciplinePayrollDeductionDto) => {
      await disciplinePayrollDeductionsApi.create(payload);
      await reload();
    },
    [reload],
  );

  const update = React.useCallback(
    async (id: string, payload: UpdateDisciplinePayrollDeductionDto) => {
      await disciplinePayrollDeductionsApi.update(id, payload);
      await reload();
    },
    [reload],
  );

  const sendToPayroll = React.useCallback(
    async (id: string) => {
      await disciplinePayrollDeductionsApi.sendToPayroll(id);
      await reload();
    },
    [reload],
  );

  const remove = React.useCallback(
    async (id: string) => {
      await disciplinePayrollDeductionsApi.remove(id);
      await reload();
    },
    [reload],
  );

  return {
    deductions,
    employees,
    cases,
    companyId,
    loading,
    listError,
    add,
    update,
    sendToPayroll,
    remove,
  };
}
