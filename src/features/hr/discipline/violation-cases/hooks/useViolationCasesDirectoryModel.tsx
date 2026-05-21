'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { violationTypesApi } from '@/features/hr/discipline/lib/api/violation-types';
import {
  violationRecordsApi,
  type ViolationRecordResponseDto,
  type ViolationRecordStatus,
  type CreateViolationRecordDto,
  type UpdateViolationRecordDto,
} from '@/features/hr/discipline/lib/api/violation-records';

export type ViolationCaseRecord = {
  id: string;
  caseNumber: string;
  employeeId: string;
  employeeNameAr: string;
  violationTypeId: string;
  typeNameAr: string;
  status: ViolationRecordStatus;
  date: string;
  description: string;
  notes: string | null;
  attachmentsNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ViolationCaseEmployee = { id: string; nameAr: string };
export type ViolationCaseType = { id: string; nameAr: string; code: string; isActive: boolean };

function mapRecord(
  dto: ViolationRecordResponseDto,
  employeesById: Map<string, string>,
  typesById: Map<string, string>,
): ViolationCaseRecord {
  return {
    id: dto.id,
    caseNumber: dto.recordNumber,
    employeeId: dto.employeeId,
    employeeNameAr: employeesById.get(dto.employeeId) ?? dto.employeeId,
    violationTypeId: dto.violationTypeId,
    typeNameAr: typesById.get(dto.violationTypeId) ?? dto.violationTypeId,
    status: dto.status ?? 'pending',
    date: dto.violationDate,
    description: dto.description,
    notes: dto.notes,
    attachmentsNote: dto.attachmentsNote,
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

  const reload = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const scope = await resolveOrganizationScope();
      const cid = scope.companyId ?? null;
      setCompanyId(cid);

      const [employeesRes, typesRes, recordsRes] = await Promise.all([
        employeesApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
        violationTypesApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
        violationRecordsApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
      ]);

      const employeeMap = new Map(employeesRes.items.map((e) => [e.id, e.nameAr]));
      const typeMap = new Map(typesRes.items.map((t) => [t.id, t.nameAr]));

      setEmployees(employeesRes.items.map((e) => ({ id: e.id, nameAr: e.nameAr })));
      setViolationTypes(
        typesRes.items.map((t) => ({ id: t.id, nameAr: t.nameAr, code: t.code, isActive: t.isActive })),
      );
      setCases(recordsRes.items.map((r) => mapRecord(r, employeeMap, typeMap)));
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

  const deleteCase = React.useCallback(
    async (id: string) => {
      await violationRecordsApi.remove(id);
      await reload();
    },
    [reload],
  );

  return { cases, employees, violationTypes, companyId, loading, listError, createCase, updateCase, deleteCase };
}
