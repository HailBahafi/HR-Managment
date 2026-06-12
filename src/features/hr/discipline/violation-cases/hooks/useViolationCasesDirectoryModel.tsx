'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { violationTypesApi } from '@/features/hr/discipline/lib/api/violation-types';
import {
  violationRecordsApi,
  type ViolationInvestigationDto,
  type ViolationRecordResponseDto,
  type ViolationRecordStatus,
  type CreateViolationRecordDto,
  type UpdateViolationRecordDto,
  type DecideViolationRecordDto,
} from '@/features/hr/discipline/lib/api/violation-records';

export type ViolationCaseRecord = {
  id: string;
  caseNumber: string;
  employeeId: string;
  employeeNameAr: string;
  violationTypeId: string;
  typeNameAr: string;
  typeNeedsWarning: boolean;
  typeNeedsInvestigation: boolean;
  typeNeedsApproval: boolean;
  typeHasDeduction: boolean;
  typeDeductionKind: string | null;
  typeDeductionValue: string | null;
  status: ViolationRecordStatus;
  date: string;
  description: string;
  notes: string | null;
  attachmentsNote: string | null;
  hasInvestigations: boolean;
  decisionNotes: string | null;
  decidedAt: string | null;
  investigations: ViolationInvestigationDto[];
  investigationCount: number;
  latestInvestigationResult: ViolationInvestigationDto['result'] | null;
  latestInvestigationRecommendation: ViolationInvestigationDto['recommendation'];
  createdAt: string;
  updatedAt: string;
};

export type ViolationCaseEmployee = { id: string; nameAr: string };
export type ViolationCaseType = {
  id: string; nameAr: string; code: string; isActive: boolean;
  needsWarning: boolean; needsInvestigation: boolean;
};

function pickLatestInvestigation(investigations: ViolationInvestigationDto[]): ViolationInvestigationDto | null {
  if (investigations.length === 0) return null;
  return investigations.reduce((latest, current) => {
    const latestTs = Date.parse(latest.updatedAt ?? latest.createdAt ?? '');
    const currentTs = Date.parse(current.updatedAt ?? current.createdAt ?? '');
    if (Number.isNaN(latestTs)) return current;
    if (Number.isNaN(currentTs)) return latest;
    return currentTs >= latestTs ? current : latest;
  });
}

function mapRecord(
  dto: ViolationRecordResponseDto,
  employeesById: Map<string, string>,
  typesById: Map<string, string>,
): ViolationCaseRecord {
  const vt = dto.violationType;
  const investigations = dto.investigations ?? [];
  const latestInvestigation = pickLatestInvestigation(investigations);
  return {
    id: dto.id,
    caseNumber: dto.recordNumber,
    employeeId: dto.employeeId,
    employeeNameAr: employeesById.get(dto.employeeId) ?? dto.employeeId,
    violationTypeId: dto.violationTypeId,
    typeNameAr: vt?.nameAr ?? typesById.get(dto.violationTypeId) ?? dto.violationTypeId,
    typeNeedsWarning: vt?.needsWarning ?? false,
    typeNeedsInvestigation: vt?.needsInvestigation ?? dto.violationTypeNeedsInvestigation ?? false,
    typeNeedsApproval: vt?.needsApproval ?? false,
    typeHasDeduction: vt?.hasDeduction ?? false,
    typeDeductionKind: vt?.deductionKind ?? null,
    typeDeductionValue: vt?.deductionValue ?? null,
    status: dto.status ?? 'pending',
    date: dto.violationDate,
    description: dto.description,
    notes: dto.notes,
    attachmentsNote: dto.attachmentsNote,
    hasInvestigations: dto.hasInvestigations ?? investigations.length > 0,
    decisionNotes: dto.decisionNotes ?? null,
    decidedAt: dto.decidedAt ?? null,
    investigations,
    investigationCount: investigations.length,
    latestInvestigationResult: latestInvestigation?.result ?? null,
    latestInvestigationRecommendation: latestInvestigation?.recommendation ?? null,
    createdAt: typeof dto.createdAt === 'string' ? dto.createdAt : new Date(dto.createdAt).toISOString(),
    updatedAt: typeof dto.updatedAt === 'string' ? dto.updatedAt : new Date(dto.updatedAt).toISOString(),
  };
}

export function useViolationCasesDirectoryModel() {
  const [cases, setCases] = React.useState<ViolationCaseRecord[]>([]);
  const [employees, setEmployees] = React.useState<ViolationCaseEmployee[]>([]);
  const [violationTypes, setViolationTypes] = React.useState<ViolationCaseType[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  const reload = React.useCallback(async (filterParams?: {
    employeeId?: string;
    violationDateFrom?: string;
    violationDateTo?: string;
  }) => {
    setLoading(true);
    setListError(null);
    try {
      const scope = await resolveOrganizationScope();
      const cid = scope.companyId ?? null;
      setCompanyId(cid);

      const recordsQuery = {
        ...(cid ? { companyId: cid } : {}),
        limit: 200,
        ...(filterParams?.employeeId ? { employeeId: filterParams.employeeId } : {}),
        ...(filterParams?.violationDateFrom ? { violationDateFrom: filterParams.violationDateFrom } : {}),
        ...(filterParams?.violationDateTo ? { violationDateTo: filterParams.violationDateTo } : {}),
      };

      const [employeesRes, typesRes, recordsRes] = await Promise.all([
        employeesApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
        violationTypesApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
        violationRecordsApi.getAll(recordsQuery),
      ]);

      const employeeItems = ensurePaginatedResult(employeesRes).items;
      const typeItems = ensurePaginatedResult(typesRes).items;
      const recordItems = ensurePaginatedResult(recordsRes).items;

      const employeeMap = new Map(employeeItems.map((e) => [e.id, e.nameAr]));
      const typeMap = new Map(typeItems.map((t) => [t.id, t.nameAr]));

      setEmployees(employeeItems.map((e) => ({ id: e.id, nameAr: e.nameAr })));
      setViolationTypes(
        typeItems.map((t) => ({ id: t.id, nameAr: t.nameAr, code: t.code, isActive: t.isActive, needsWarning: t.needsWarning ?? false, needsInvestigation: t.needsInvestigation ?? false })),
      );
      setCases(recordItems.map((r) => mapRecord(r, employeeMap, typeMap)));
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'violation-records.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const createCase = React.useCallback(
    async (payload: {
      employeeId: string;
      violationTypeId: string;
      date: string;
      description: string;
      notes?: string | null;
      attachmentsNote?: string | null;
    }) => {
      if (!companyId) throw new Error('تعذر تحديد الشركة');
      const dto: CreateViolationRecordDto = {
        companyId,
        employeeId: payload.employeeId,
        violationTypeId: payload.violationTypeId,
        violationDate: payload.date,
        description: payload.description,
        notes: payload.notes ?? null,
        attachmentsNote: payload.attachmentsNote ?? null,
      };
      await violationRecordsApi.create(dto);
      await reload();
    },
    [companyId, reload],
  );

  const updateCase = React.useCallback(
    async (id: string, patch: UpdateViolationRecordDto) => {
      await violationRecordsApi.update(id, patch);
      await reload();
    },
    [reload],
  );

  const decideCase = React.useCallback(
    async (id: string, payload: DecideViolationRecordDto) => {
      await violationRecordsApi.decide(id, payload);
      await reload();
    },
    [reload],
  );

  const deleteCase = React.useCallback(
    async (id: string) => {
      await violationRecordsApi.remove(id);
      await reload();
    },
    [reload],
  );

  return { cases, employees, violationTypes, companyId, loading, listError, createCase, updateCase, decideCase, deleteCase, reload };
}
