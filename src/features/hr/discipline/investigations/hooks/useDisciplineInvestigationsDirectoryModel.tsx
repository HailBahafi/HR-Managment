'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
import type { HRDisciplineInvestigationRecord } from '@/features/hr/discipline/lib/types';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { companiesApi } from '@/features/hr/organization/lib/api/companies';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { violationRecordsApi } from '@/features/hr/discipline/lib/api/violation-records';
import {
  disciplineInvestigationsApi,
  type CreateDisciplineInvestigationDto,
  type InvestigationResultDto,
} from '@/features/hr/discipline/lib/api/discipline-investigations';
import {
  mapDisciplineInvestigationResponse,
} from '@/features/hr/discipline/investigations/services/discipline-investigations.service';

const PAGE_LIMIT = 200;

export type InvestigationEmployeeOption = {
  id: string;
  nameAr: string;
};

export type InvestigationCaseOption = {
  id: string;
  caseNumber: string;
  employeeId: string;
  employeeNameAr: string;
};

export function useDisciplineInvestigationsDirectoryModel() {
  const [investigations, setInvestigations] = React.useState<HRDisciplineInvestigationRecord[]>([]);
  const [employees, setEmployees] = React.useState<InvestigationEmployeeOption[]>([]);
  const [cases, setCases] = React.useState<InvestigationCaseOption[]>([]);
  const [company, setCompany] = React.useState<{ id: string; nameAr: string; nameEn: string | null } | null>(null);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  const companyIdRef = React.useRef<string | null>(null);
  const employeeNameByIdRef = React.useRef<Record<string, string>>({});

  const reloadInvestigations = React.useCallback(
    async (params?: { employeeId?: string; result?: InvestigationResultDto }) => {
      const cid = companyIdRef.current;
      if (!cid) return;
      setLoading(true);
      setListError(null);
      try {
        const investigationsRes = await disciplineInvestigationsApi.getAll({
          companyId: cid,
          limit: PAGE_LIMIT,
          ...(params?.employeeId ? { subjectEmployeeId: params.employeeId } : {}),
          ...(params?.result ? { result: params.result } : {}),
        });
        const items = ensurePaginatedResult(investigationsRes).items;
        setInvestigations(items.map((inv) => mapDisciplineInvestigationResponse(inv, employeeNameByIdRef.current)));
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'discipline-investigations.load');
        setListError(displayMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reload = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const scope = await resolveOrganizationScope();
      const resolvedCompanyId = scope.companyId ?? null;
      setCompanyId(resolvedCompanyId);
      companyIdRef.current = resolvedCompanyId;

      const [companiesRes, employeesRes, casesRes, investigationsRes] = await Promise.all([
        companiesApi.getAll({ limit: 50 }),
        employeesApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
        ),
        violationRecordsApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
        ),
        disciplineInvestigationsApi.getAll(
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

      const employeesItems = ensurePaginatedResult(employeesRes).items;
      const employeeNameById = Object.fromEntries(
        employeesItems.map((emp) => [emp.id, emp.nameAr]),
      );
      employeeNameByIdRef.current = employeeNameById;
      setEmployees(employeesItems.map((emp) => ({ id: emp.id, nameAr: emp.nameAr })));

      const caseItems = ensurePaginatedResult(casesRes).items;
      const mappedCases = caseItems.map((c) => ({
        id: c.id,
        caseNumber: c.recordNumber,
        employeeId: c.employeeId,
        employeeNameAr: employeeNameById[c.employeeId] ?? c.employeeId,
      }));
      setCases(mappedCases);

      const investigationItems = ensurePaginatedResult(investigationsRes).items;
      setInvestigations(
        investigationItems.map((inv) =>
          mapDisciplineInvestigationResponse(inv, employeeNameById),
        ),
      );
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-investigations.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const add = React.useCallback(
    async (payload: CreateDisciplineInvestigationDto) => {
      await disciplineInvestigationsApi.create(payload);
      await reload();
    },
    [reload],
  );

  const remove = React.useCallback(
    async (id: string) => {
      await disciplineInvestigationsApi.remove(id);
      await reload();
    },
    [reload],
  );

  return {
    investigations,
    employees,
    cases,
    company,
    companyId,
    loading,
    listError,
    add,
    remove,
    reloadInvestigations,
  };
}
